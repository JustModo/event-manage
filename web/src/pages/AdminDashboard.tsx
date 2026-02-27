import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Event } from '@/types';
import { isPast, format } from 'date-fns';
import { Calendar, MapPin, Plus, Users, Edit, Trash2, LogOut, CheckCircle2, Clock } from 'lucide-react';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = () => {
        api.get('/events').then((res: { data: Event[] }) => setEvents(res.data));
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        setIsDeleting(id);
        try {
            await api.delete(`/events/${id}`);
            setEvents(events.filter(e => e.id !== id));
        } catch (error) {
            console.error('Failed to delete event:', error);
            alert('Failed to delete event');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    const upcomingEventsCount = events.filter(e => !isPast(new Date(e.date))).length;
    const pastEventsCount = events.length - upcomingEventsCount;

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
                        <button
                            onClick={handleLogout}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
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
            <div className="bg-muted/30 border-b border-border">
                <div className="px-6 md:px-16 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="border border-border bg-background p-6 shadow-sm">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Events</h3>
                        <p className="text-3xl font-bold">{events.length}</p>
                    </div>
                    <div className="border border-border bg-background p-6 shadow-sm">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Upcoming</h3>
                        <p className="text-3xl font-bold text-green-600">{upcomingEventsCount}</p>
                    </div>
                    <div className="border border-border bg-background p-6 shadow-sm">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Past Events</h3>
                        <p className="text-3xl font-bold text-muted-foreground">{pastEventsCount}</p>
                    </div>
                </div>
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
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-base font-semibold truncate">{event.title}</h3>
                                        {isPast(new Date(event.date)) ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground">
                                                <Clock className="w-3 h-3" /> Past
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 border border-green-200">
                                                <CheckCircle2 className="w-3 h-3" /> Upcoming
                                            </span>
                                        )}
                                    </div>
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
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                        {event.description?.replace(/<[^>]*>?/gm, '') || ''}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <Link
                                        to={`/admin/events/${event.id}/registrations`}
                                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5"
                                        title="View Registrations"
                                    >
                                        <Users className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        to={`/admin/events/${event.id}/edit`}
                                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors border border-blue-200 px-3 py-1.5 bg-blue-50"
                                        title="Edit Event"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        disabled={isDeleting === event.id}
                                        className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 transition-colors border border-red-200 px-3 py-1.5 bg-red-50 disabled:opacity-50"
                                        title="Delete Event"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
