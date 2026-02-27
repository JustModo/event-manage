import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Event } from '@/types';
import { format } from 'date-fns';
import { Calendar, MapPin, Plus, Users, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        api.get('/events').then((res: { data: Event[] }) => setEvents(res.data));
    }, []);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border">
                <div className="px-6 md:px-16 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Manage events and registrations</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            View Site →
                        </Link>
                        <Link
                            to="/admin/create"
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                            <Plus className="w-4 h-4" /> New Event
                        </Link>
                    </div>
                </div>
            </header>

            {/* Stats bar */}
            <div className="border-b border-border px-6 md:px-16 py-4">
                <span className="text-sm text-muted-foreground">{events.length} total events</span>
            </div>

            {/* Event List */}
            <div className="px-6 md:px-16">
                {events.length === 0 ? (
                    <div className="py-24 text-center">
                        <p className="text-muted-foreground mb-2">No events yet</p>
                        <Link to="/admin/create" className="text-sm text-primary hover:underline">
                            Create your first event →
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {events.map((event) => (
                            <div key={event.id} className="py-6 flex items-start gap-6 group">
                                {/* Thumbnail */}
                                <div className="hidden sm:block w-40 h-24 flex-shrink-0 overflow-hidden bg-muted">
                                    <img
                                        src={event.imageUrl}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold mb-1 truncate">{event.title}</h3>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(event.date), 'MMM d, yyyy · h:mm a')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {event.location}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{event.description}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <Link
                                        to={`/admin/events/${event.id}/registrations`}
                                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5"
                                    >
                                        <Users className="w-3 h-3" /> Registrations
                                    </Link>
                                    <Link
                                        to={`/events/${event.id}`}
                                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
