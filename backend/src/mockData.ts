import { v4 as uuidv4 } from 'uuid';

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    imageUrl: string;
}

export interface Registration {
    id: string;
    eventId: string;
    name: string;
    email: string;
    registeredAt: string;
}

// Empty arrays — events are created via the admin panel
export const events: Event[] = [];

export const registrations: Registration[] = [];
