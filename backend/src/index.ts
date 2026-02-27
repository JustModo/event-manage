import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { query } from './db';

// =======================
// Environment Validation
// =======================
const REQUIRED_ENV = ['PORT', 'S3_BUCKET', 'S3_REGION', 'CLOUDFRONT_DOMAIN', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;
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
// Database Initialization
// =======================
async function initDb() {
    try {
        const schemaPath = path.join(__dirname, '../schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await query(schema);
            console.log('✅ Database initialized successfully');
        }
    } catch (error) {
        console.error('❌ Failed to initialize database', error);
    }
}

// =======================
// User Routes
// =======================

app.get('/api/events', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT id, title, description, date, location, image_url as "imageUrl" FROM events ORDER BY date ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch events', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT id, title, description, date, location, image_url as "imageUrl" FROM events WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to fetch event', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

app.post('/api/events/:id/register', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check if event exists
        const eventCheck = await query('SELECT id FROM events WHERE id = $1', [id]);
        if (eventCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const registrationId = uuidv4();
        await query(
            'INSERT INTO registrations (id, event_id, name, email) VALUES ($1, $2, $3, $4)',
            [registrationId, id, name, email]
        );

        res.status(201).json({ id: registrationId, eventId: id, name, email });
    } catch (error) {
        console.error('Failed to register for event', error);
        res.status(500).json({ error: 'Failed to register for event' });
    }
});

// =======================
// Admin Routes
// =======================

app.post('/api/events', async (req: Request, res: Response) => {
    try {
        const { title, description, date, location, imageUrl } = req.body;
        if (!title || !date || !location || !imageUrl) {
            return res.status(400).json({ error: 'Title, date, location, and imageUrl are required' });
        }

        const id = uuidv4();
        await query(
            'INSERT INTO events (id, title, description, date, location, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, title, description || '', date, location, imageUrl]
        );

        res.status(201).json({ id, title, description: description || '', date, location, imageUrl });
    } catch (error) {
        console.error('Failed to create event', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

app.put('/api/events/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, date, location, imageUrl } = req.body;

        const result = await query(
            'UPDATE events SET title = COALESCE($1, title), description = COALESCE($2, description), date = COALESCE($3, date), location = COALESCE($4, location), image_url = COALESCE($5, image_url) WHERE id = $6 RETURNING id, title, description, date, location, image_url as "imageUrl"',
            [title, description, date, location, imageUrl, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to update event', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

app.get('/api/events/:id/registrations', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if event exists
        const eventCheck = await query('SELECT id FROM events WHERE id = $1', [id]);
        if (eventCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const result = await query('SELECT id, event_id as "eventId", name, email, registered_at as "registeredAt" FROM registrations WHERE event_id = $1 ORDER BY registered_at DESC', [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch registrations', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
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

app.listen(PORT, async () => {
    await initDb();
    console.log(`Backend server running on port ${PORT}`);
});
