import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Event } from '@/types';
import { format } from 'date-fns';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

export default function EventList() {
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        api.get('/events').then((res: { data: Event[] }) => setEvents(res.data));
    }, []);

    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <div className="relative w-full h-[65vh] min-h-[420px] overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-transparent z-10" />
                <img
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80"
                    alt="Featured"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />
                <div className="relative z-20 h-full flex flex-col justify-end px-6 md:px-16 pb-16 max-w-5xl">
                    <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">Campus Events Platform</p>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-4">EventSphere</h1>
                    <p className="text-lg text-white/70 max-w-xl mb-8">
                        Discover, register, and attend the most exciting events on campus. Your next unforgettable experience starts here.
                    </p>
                    <div className="flex gap-6 items-center">
                        <Link to="/admin" className="text-sm text-white/50 hover:text-white transition-colors">
                            Admin Panel →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            <div className="px-6 md:px-16 py-16">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-bold tracking-tight">All Events</h2>
                    <span className="text-sm text-muted-foreground">{events.length} events</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                    {events.map((event) => (
                        <Link to={`/events/${event.id}`} key={event.id} className="group">
                            <div className="relative aspect-video w-full overflow-hidden mb-4">
                                <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(event.date), 'MMM d, yyyy')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate max-w-[140px]">{event.location}</span>
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{event.title}</h3>
                            <div
                                className="text-sm text-muted-foreground line-clamp-2 mb-3 [&>p]:mb-0"
                                dangerouslySetInnerHTML={{ __html: event.description || '' }}
                            />
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                View Details <ArrowRight className="w-3 h-3" />
                            </span>
                        </Link>
                    ))}
                </div>

                {events.length === 0 && (
                    <div className="text-center py-24 text-muted-foreground">
                        <p className="text-lg">No events yet.</p>
                        <p className="text-sm mt-1">Check back soon or create one from the admin panel.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
