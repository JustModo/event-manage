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
