
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const DB_PATH = path.join(__dirname, 'src', 'data', 'db.json');

// Ensure directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize DB file if not exists
if (!fs.existsSync(DB_PATH)) {
    const INITIAL_DATA = {
        user: { id: 'user_1', name: 'Athlete', weight: 70, height: 175 },
        exercises: [],
        sessions: [],
        history: [],
        muscles: {
            "Chest": ["Upper", "Middle", "Lower"],
            "Back": ["Lats", "Traps", "Lower Back"],
            "Legs": ["Quads", "Hamstrings", "Calves", "Glutes"],
            "Shoulders": ["Front", "Side", "Rear"],
            "Biceps": ["Long Head", "Short Head"],
            "Triceps": ["Long Head", "Lateral Head", "Medial Head"],
            "Core": ["Upper Abs", "Lower Abs", "Obliques"],
            "Full Body": []
        }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2));
}

// Routes
app.get('/api/db', (req, res) => {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error('Error reading DB:', err);
        res.status(500).json({ error: 'Failed to read database' });
    }
});

app.post('/api/db', (req, res) => {
    try {
        const data = req.body;
        // Basic validation: ensure it's an object
        if (typeof data !== 'object' || data === null) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (err) {
        console.error('Error writing DB:', err);
        res.status(500).json({ error: 'Failed to save database' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database file: ${DB_PATH}`);
});
