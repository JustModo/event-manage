import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const eventSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
    description: z.string().optional(),
    date: z.string()
        .min(1, "Date is required")
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" })
        .refine((val) => new Date(val) > new Date(), { message: "Event date cannot be in the past" }),
    location: z.string().min(3, "Location must be at least 3 characters").max(200, "Location is too long"),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function AdminCreateEvent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit: hookFormSubmit,
        control,
        setValue,
        formState: { errors }
    } = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        mode: 'onChange',
        defaultValues: {
            title: '',
            description: '',
            date: '',
            location: '',
        }
    });

    // Custom image state (since it involves S3 uploading before form submission)
    const [imageUrl, setImageUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [imageError, setImageError] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const { data } = await api.get(`/events/${id}`);
                setValue('title', data.title);
                setValue('description', data.description || '');
                setValue('location', data.location);

                // Format datetime-local string (YYYY-MM-DDThh:mm)
                if (data.date) {
                    const dateObj = new Date(data.date);
                    const tzOffset = dateObj.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);
                    setValue('date', localISOTime);
                }

                setImageUrl(data.imageUrl);
            } catch (error) {
                console.error('Failed to fetch event details', error);
                alert('Failed to load event for editing');
                navigate('/admin');
            }
        };

        if (isEditMode) {
            fetchEvent();
        }
    }, [id, isEditMode, navigate, setValue]);

    const processFileSelection = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        setImageError('');
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setImageUrl(''); // Clear manual URL if they select a file
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFileSelection(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) processFileSelection(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    const clearImage = () => {
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
        setImageUrl('');
        setImageError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadFileToS3 = async (file: File): Promise<string> => {
        setUploadProgress('Getting upload URL...');
        const { data } = await api.get('/uploads/presigned-url', {
            params: { fileName: file.name, fileType: file.type },
        });

        setUploadProgress('Uploading to S3...');
        await fetch(data.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
        });

        return data.publicUrl;
    };

    const onSubmit = async (data: EventFormValues) => {
        setImageError('');
        setIsSubmitting(true);
        setUploadProgress('Saving event...');

        try {
            let finalImageUrl = imageUrl;

            if (selectedFile) {
                finalImageUrl = await uploadFileToS3(selectedFile);
            }

            if (!finalImageUrl) {
                setImageError("An image is required. Please upload an image or provide a URL.");
                throw new Error("Missing Image");
            }

            const payload = {
                title: data.title,
                description: data.description,
                date: new Date(data.date).toISOString(),
                location: data.location,
                imageUrl: finalImageUrl,
            };

            if (isEditMode) {
                await api.put(`/events/${id}`, payload);
            } else {
                await api.post('/events', payload);
            }
            navigate('/admin');
        } catch (error) {
            const err = error as { message?: string };
            console.error('Failed to save event', error);
            if (err.message !== "Missing Image") {
                alert(err.message || 'Failed to save the event. Please ensure all inputs are correct.');
            }
            setUploadProgress('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayImage = previewUrl || imageUrl;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="border-b border-border">
                <div className="px-6 md:px-16 py-6 flex items-center gap-6">
                    <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEditMode ? 'Edit Event' : 'Create Event'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {isEditMode ? 'Modify the details of your event' : 'Fill in the details for your new event'}
                        </p>
                    </div>
                </div>
            </header>

            {/* Form */}
            <div className="px-6 md:px-16 py-12 max-w-2xl mx-auto">
                <form onSubmit={hookFormSubmit(onSubmit)} className="space-y-8">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm text-muted-foreground">Event Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Annual Tech Conference"
                            className={`h-11 bg-transparent ${errors.title ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`}
                            {...register('title')}
                        />
                        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2 relative">
                        <Label htmlFor="description" className="text-sm text-muted-foreground">Description (Rich Text)</Label>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <ReactQuill
                                    theme="snow"
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    className="bg-transparent rounded-md [&_.ql-container]:min-h-[150px] [&_.ql-container]:text-base [&_.ql-editor]:min-h-[150px]"
                                />
                            )}
                        />
                        {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-sm text-muted-foreground">Date & Time *</Label>
                            <Input
                                id="date"
                                type="datetime-local"
                                className={`h-11 bg-transparent ${errors.date ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`}
                                {...register('date')}
                            />
                            {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-sm text-muted-foreground">Location *</Label>
                            <Input
                                id="location"
                                placeholder="e.g. Main Auditorium"
                                className={`h-11 bg-transparent ${errors.location ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`}
                                {...register('location')}
                            />
                            {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
                        </div>
                    </div>

                    {/* Cover Image Section */}
                    <div className="space-y-4">
                        <Label className="text-sm text-muted-foreground">Cover Image *</Label>

                        {displayImage ? (
                            <div className="space-y-3">
                                <div className="relative aspect-video w-full max-w-md overflow-hidden bg-muted rounded-md border border-border">
                                    <img src={displayImage} alt="Cover preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors border-0 rounded-full"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground truncate max-w-md">
                                    {selectedFile ? `Ready to upload: ${selectedFile.name}` : imageUrl}
                                </p>
                            </div>
                        ) : (
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                                    border-2 border-dashed transition-colors cursor-pointer rounded-lg
                                    flex flex-col items-center justify-center py-12 px-6
                                    ${imageError ? 'border-red-500 hover:border-red-600' : dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}
                                `}
                            >
                                <Upload className={`w-8 h-8 mb-3 ${imageError ? 'text-red-500' : 'text-muted-foreground'}`} />
                                <p className={`text-sm font-medium mb-1 ${imageError ? 'text-red-500' : 'text-foreground'}`}>
                                    Drop an image here or click to select
                                </p>
                                <p className={`text-xs ${imageError ? 'text-red-500' : 'text-muted-foreground'}`}>
                                    Image will be uploaded when you submit the form
                                </p>
                            </div>
                        )}
                        {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                        {/* Manual URL fallback */}
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs text-muted-foreground">or paste a URL</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="flex items-center gap-2">
                            <ImageIcon className={`w-4 h-4 shrink-0 ${selectedFile ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
                            <Input
                                placeholder="https://d1234.cloudfront.net/uploads/image.jpg"
                                className={`h-9 bg-transparent text-sm ${imageError && !imageUrl ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`}
                                value={imageUrl}
                                disabled={!!selectedFile}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setImageError('');
                                    setImageUrl(e.target.value);
                                }}
                            />
                        </div>
                    </div>

                    <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button type="submit" className="px-8 h-11 font-semibold" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    isEditMode ? 'Update Event' : 'Create Event'
                                )}
                            </Button>
                            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Cancel
                            </Link>
                        </div>

                        {isSubmitting && uploadProgress && (
                            <span className="text-xs text-muted-foreground animate-pulse">
                                {uploadProgress}
                            </span>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
