import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { events, registrations, Event, Registration } from './mockData';

// =======================
// Environment Validation
// =======================
const REQUIRED_ENV = ['PORT', 'S3_BUCKET', 'S3_REGION', 'CLOUDFRONT_DOMAIN'] as const;
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

const PORT = process.env.PORT!;
const S3_BUCKET = process.env.S3_BUCKET!;
const S3_REGION = process.env.S3_REGION!;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN!;

const s3Client = new S3Client({ region: S3_REGION });

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// User Routes
// =======================

app.get('/api/events', (req: Request, res: Response) => {
    res.json(events);
});

app.get('/api/events/:id', (req: Request, res: Response) => {
    const event = events.find(e => e.id === req.params.id);
    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
});

app.post('/api/events/:id/register', (req: Request, res: Response) => {
    const event = events.find(e => e.id === req.params.id);
    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    const newRegistration: Registration = {
        id: uuidv4(),
        eventId: event.id,
        name,
        email,
        registeredAt: new Date().toISOString()
    };

    registrations.push(newRegistration);
    res.status(201).json(newRegistration);
});

// =======================
// Admin Routes
// =======================

app.post('/api/events', (req: Request, res: Response) => {
    const { title, description, date, location, imageUrl } = req.body;
    if (!title || !date || !location || !imageUrl) {
        return res.status(400).json({ error: 'Title, date, location, and imageUrl are required' });
    }

    const newEvent: Event = {
        id: uuidv4(),
        title,
        description: description || '',
        date,
        location,
        imageUrl,
    };

    events.push(newEvent);
    res.status(201).json(newEvent);
});

app.put('/api/events/:id', (req: Request, res: Response) => {
    const eventIndex = events.findIndex(e => e.id === req.params.id);
    if (eventIndex === -1) {
        return res.status(404).json({ error: 'Event not found' });
    }

    const updatedEvent = { ...events[eventIndex], ...req.body, id: events[eventIndex].id };
    events[eventIndex] = updatedEvent;

    res.json(updatedEvent);
});

app.get('/api/events/:id/registrations', (req: Request, res: Response) => {
    const event = events.find(e => e.id === req.params.id);
    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    const eventRegistrations = registrations.filter(r => r.eventId === event.id);
    res.json(eventRegistrations);
});

// =======================
// Upload Routes
// =======================

app.get('/api/uploads/presigned-url', async (req: Request, res: Response) => {
    try {
        const fileName = req.query.fileName as string;
        const fileType = req.query.fileType as string;

        if (!fileName || !fileType) {
            return res.status(400).json({ error: 'fileName and fileType query params are required' });
        }

        const ext = fileName.split('.').pop();
        const key = `uploads/${uuidv4()}.${ext}`;

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        const publicUrl = `https://${CLOUDFRONT_DOMAIN}/${key}`;

        res.json({ uploadUrl, publicUrl, key });
    } catch (error) {
        console.error('Failed to generate presigned URL', error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
