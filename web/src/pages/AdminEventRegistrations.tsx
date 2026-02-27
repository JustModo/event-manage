import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Event, Registration } from '@/types';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';

export default function AdminEventRegistrations() {
    const { id } = useParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [registrations, setRegistrations] = useState<Registration[]>([]);

    useEffect(() => {
        api.get(`/events/${id}`).then((res: { data: Event }) => setEvent(res.data)).catch(console.error);
        api.get(`/events/${id}/registrations`).then((res: { data: Registration[] }) => setRegistrations(res.data)).catch(console.error);
    }, [id]);

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
                            {event ? event.title : 'Loading...'}
                        </h1>
                        {event && (
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(event.date), 'MMM d, yyyy')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.location}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Stats */}
            <div className="border-b border-border px-6 md:px-16 py-4">
                <span className="text-sm text-muted-foreground">{registrations.length} registrations</span>
            </div>

            {/* Registrations List */}
            <div className="px-6 md:px-16">
                {registrations.length === 0 ? (
                    <div className="py-24 text-center text-muted-foreground">
                        <p>No registrations yet.</p>
                        <p className="text-sm mt-1">Share the event link to start getting signups.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {/* Table header */}
                        <div className="py-3 grid grid-cols-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            <span>Name</span>
                            <span>Email</span>
                            <span>Registered</span>
                        </div>
                        {registrations.map(reg => (
                            <div key={reg.id} className="py-4 grid grid-cols-3 text-sm items-center">
                                <span className="font-medium">{reg.name}</span>
                                <span className="text-muted-foreground">{reg.email}</span>
                                <span className="text-muted-foreground">{format(new Date(reg.registeredAt), 'MMM d, yyyy · h:mm a')}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
