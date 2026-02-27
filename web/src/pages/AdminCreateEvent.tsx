import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function AdminCreateEvent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');

    // For manual URL fallback or existing image from backend
    const [imageUrl, setImageUrl] = useState('');

    // For newly selected file that hasn't been uploaded yet
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            fetchEvent();
        }
    }, [id]);

    const fetchEvent = async () => {
        try {
            const { data } = await api.get(`/events/${id}`);
            setTitle(data.title);
            setDescription(data.description || '');

            // Format datetime-local string (YYYY-MM-DDThh:mm)
            if (data.date) {
                const dateObj = new Date(data.date);
                // Adjust for local timezone offset to display correctly in input field
                const tzOffset = dateObj.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);
                setDate(localISOTime);
            }

            setLocation(data.location);
            setImageUrl(data.imageUrl);
        } catch (error) {
            console.error('Failed to fetch event details', error);
            alert('Failed to load event for editing');
            navigate('/admin');
        }
    };

    const processFileSelection = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
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
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadFileToS3 = async (file: File): Promise<string> => {
        setUploadProgress('Getting upload URL...');
        // 1. Get presigned URL from backend
        const { data } = await api.get('/uploads/presigned-url', {
            params: { fileName: file.name, fileType: file.type },
        });

        setUploadProgress('Uploading to S3...');
        // 2. Upload directly to S3 using presigned URL
        await fetch(data.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
        });

        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setUploadProgress('Saving event...');

        try {
            let finalImageUrl = imageUrl;

            // If the user selected a new file, upload it to S3 first
            if (selectedFile) {
                finalImageUrl = await uploadFileToS3(selectedFile);
            }

            if (!finalImageUrl) {
                throw new Error("An image is required. Please upload an image or provide a URL.");
            }

            const payload = {
                title,
                description,
                date: new Date(date).toISOString(),
                location,
                imageUrl: finalImageUrl,
            };

            if (isEditMode) {
                await api.put(`/events/${id}`, payload);
            } else {
                await api.post('/events', payload);
            }
            navigate('/admin');
        } catch (error: any) {
            console.error('Failed to save event', error);
            alert(error.message || 'Failed to save the event. Please ensure all inputs are correct.');
            setUploadProgress('');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Determine what image to show in the preview area
    const displayImage = previewUrl || imageUrl;

    return (
        <div className="min-h-screen bg-background">
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
            <div className="px-6 md:px-16 py-12 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm text-muted-foreground">Event Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Annual Tech Conference"
                            className="h-11 bg-transparent border-border"
                            value={title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm text-muted-foreground">Description</Label>
                        <textarea
                            id="description"
                            placeholder="Describe the event..."
                            className="flex w-full border border-border bg-transparent px-3 py-2 text-sm min-h-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-sm text-muted-foreground">Date & Time *</Label>
                            <Input
                                id="date"
                                type="datetime-local"
                                className="h-11 bg-transparent border-border"
                                value={date}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-sm text-muted-foreground">Location *</Label>
                            <Input
                                id="location"
                                placeholder="e.g. Main Auditorium"
                                className="h-11 bg-transparent border-border"
                                value={location}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Cover Image Section */}
                    <div className="space-y-4">
                        <Label className="text-sm text-muted-foreground">Cover Image</Label>

                        {displayImage ? (
                            <div className="space-y-3">
                                <div className="relative aspect-video w-full max-w-md overflow-hidden bg-muted">
                                    <img src={displayImage} alt="Cover preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors border-0"
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
                                    border-2 border-dashed transition-colors cursor-pointer
                                    flex flex-col items-center justify-center py-12 px-6
                                    ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}
                                `}
                            >
                                <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                                <p className="text-sm text-foreground font-medium mb-1">
                                    Drop an image here or click to select
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Image will be uploaded when you submit the form
                                </p>
                            </div>
                        )}

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
                            <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <Input
                                placeholder="https://d1234.cloudfront.net/uploads/image.jpg"
                                className="h-9 bg-transparent border-border text-sm"
                                value={imageUrl}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    clearImage(); // prioritize manual URL over file selection
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
