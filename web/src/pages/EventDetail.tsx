import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import type { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Calendar, MapPin, ArrowLeft, Check } from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        api.get(`/events/${id}`).then((res: { data: Event }) => setEvent(res.data));
    }, [id]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsRegistering(true);
        try {
            await api.post(`/events/${id}/register`, { name, email });
            setSuccess(true);
        } catch (error) {
            console.error('Registration failed', error);
        } finally {
            setIsRegistering(false);
        }
    };

    if (!event) {
        return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <div className="relative w-full h-[55vh] md:h-[65vh]">
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent z-10" />
                <div className="absolute inset-0 bg-linear-to-r from-background/80 to-transparent z-10" />
                <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 z-30 flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="absolute bottom-0 left-0 z-20 px-6 md:px-16 pb-12 max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-5">{event.title}</h1>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-white/60">
                        <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            {format(new Date(event.date), 'PPP · h:mm a')}
                        </span>
                        <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            {event.location}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 md:px-16 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
                    {/* Description */}
                    <div className="lg:col-span-3">
                        <h2 className="text-lg font-semibold mb-4">About This Event</h2>
                        <div className="border-t border-border pt-6 ql-snow">
                            <div
                                className="ql-editor px-0 text-muted-foreground leading-relaxed text-base"
                                dangerouslySetInnerHTML={{ __html: event.description }}
                            />
                        </div>
                    </div>

                    {/* Registration */}
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-semibold mb-4">Register</h2>
                        <div className="border-t border-border pt-6">
                            {success ? (
                                <div className="py-8 text-center">
                                    <div className="w-12 h-12 bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Check className="w-6 h-6 text-green-500" />
                                    </div>
                                    <p className="text-lg font-semibold text-green-500 mb-1">You're In!</p>
                                    <p className="text-sm text-muted-foreground">Registration confirmed. See you there.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleRegister} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm text-muted-foreground">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="Your name"
                                            className="h-11 bg-transparent border-border"
                                            value={name}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            className="h-11 bg-transparent border-border"
                                            value={email}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-11 font-semibold" disabled={isRegistering}>
                                        {isRegistering ? 'Submitting...' : 'Register Now'}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
