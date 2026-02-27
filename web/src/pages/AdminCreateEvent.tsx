import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function AdminCreateEvent() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [dragOver, setDragOver] = useState(false);

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        setUploadProgress('Getting upload URL...');
        try {
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

            // 3. Set the CloudFront/S3 public URL
            setImageUrl(data.publicUrl);
            setUploadProgress('');
        } catch (error) {
            console.error('Upload failed', error);
            setUploadProgress('Upload failed. Try again or paste a URL manually.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            uploadFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    const clearImage = () => {
        setImageUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/events', {
                title,
                description,
                date: new Date(date).toISOString(),
                location,
                imageUrl,
            });
            navigate('/admin');
        } catch (error) {
            console.error('Failed to create event', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border">
                <div className="px-6 md:px-16 py-6 flex items-center gap-6">
                    <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Event</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Fill in the details for your new event</p>
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

                        {imageUrl ? (
                            <div className="space-y-3">
                                <div className="relative aspect-video w-full max-w-md overflow-hidden bg-muted">
                                    <img src={imageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground truncate max-w-md">{imageUrl}</p>
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
                                    ${isUploading ? 'pointer-events-none opacity-60' : ''}
                                `}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-8 h-8 text-muted-foreground mb-3 animate-spin" />
                                        <p className="text-sm text-muted-foreground">{uploadProgress}</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                                        <p className="text-sm text-foreground font-medium mb-1">
                                            Drop an image here or click to upload
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Uploads directly to S3 via presigned URL
                                        </p>
                                    </>
                                )}
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border-t border-border pt-8 flex items-center gap-4">
                        <Button type="submit" className="px-8 h-11 font-semibold" disabled={isSubmitting || isUploading}>
                            {isSubmitting ? 'Creating...' : 'Create Event'}
                        </Button>
                        <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
