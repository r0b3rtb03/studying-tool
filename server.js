require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const SYNC_KEY = process.env.SYNC_KEY || null;

if (!API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY in .env');
}

// Multer config - store PDFs in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json({ limit: '5mb' }));

// ============================================
// CLAUDE API - PARSE QUESTIONS
// ============================================

const PARSE_SYSTEM_PROMPT = `You are a question extractor. Your job is to parse text that contains exam/review questions and extract multiple choice AND short answer/fill-in-the-blank questions as structured JSON.

## ABSOLUTE RULES

1. Extract multiple choice questions (questions with lettered options like A, B, C, D) AND short answer/fill-in-the-blank questions.
2. IGNORE essay questions, free response, and true/false.
3. Preserve the EXACT question text and option text as written. Do not rephrase, summarize, or modify.
4. Preserve the original question numbering (e.g., if questions start at 24, keep that numbering).
5. If a correct answer is indicated in the text (answer key, bold text, asterisk, **bold markers**, etc.), include it. If no correct answer is indicated, set correctAnswer to null.
6. If an explanation is provided for an answer, include it. Otherwise omit the explanation field.

## QUESTION TYPES

### Multiple choice: type "mc"
Questions with lettered options (A, B, C, D). Include options array.

### Short answer / fill-in-the-blank: type "short_answer"
Questions with blanks (_____ or similar) or that expect a typed answer. Also includes definition/explanation questions where only one answer sub-item (e.g. "a. **answer**") is listed rather than multiple choices.
- Do NOT include an options array for these.
- correctAnswer must be an ARRAY of all acceptable answers (strings).
- If the answer has alternatives separated by "or" (e.g. "**mitosis** or **cell division**"), each alternative is a separate entry in the array.
- Strip any ** markers from answers.

## OUTPUT FORMAT

Return ONLY valid JSON, no markdown code fences, no explanation text. The format must be:

[
  {
    "id": "q1",
    "number": 1,
    "type": "mc",
    "question": "The exact question text as written",
    "options": [
      { "letter": "A", "text": "First option text" },
      { "letter": "B", "text": "Second option text" }
    ],
    "correctAnswer": "B",
    "explanation": "Optional explanation if provided in source"
  },
  {
    "id": "q2",
    "number": 2,
    "type": "short_answer",
    "question": "The _____ is the powerhouse of the cell.",
    "correctAnswer": ["mitochondria", "mitochondrion"],
    "explanation": "Optional explanation if provided in source"
  }
]

## EDGE CASES
- If options use lowercase (a, b, c, d), normalize to uppercase (A, B, C, D).
- If a question has more or fewer than 4 options, include all of them.
- If you find zero questions, return an empty array: []
- Do NOT invent or guess correct answers. Only include them if explicitly present in the source text.
- Some questions may span multiple lines or have complex formatting - capture the full question text.
- Text wrapped in **double asterisks** indicates the correct answer - extract the letter of that option as correctAnswer for MC, or the text for short answer.
- Remove any ** markers from the option/answer text in the output.
- For short answer questions with no indicated answer, set correctAnswer to null (not an empty array).
- If a question has blanks (___) but ALSO has multiple lettered options (A, B, C, D), treat it as type "mc".
- IMPORTANT: A common academic format lists the answer on a single sub-item like "a. **Answer**" under each question. If a question only has ONE lettered sub-item (just "a.") containing the answer, this is NOT multiple choice - it is a short answer question. The "a." line is the answer, not a choice. Extract these as type "short_answer" with the answer text in the correctAnswer array.`;

app.post('/api/parse-questions', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'No text provided to parse' });
        }

        const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 16000,
                system: PARSE_SYSTEM_PROMPT,
                messages: [{
                    role: 'user',
                    content: `Extract all multiple choice and short answer/fill-in-the-blank questions from the following text:\n\n${text}`
                }]
            })
        });

        const data = await apiRes.json();

        // Handle API-level errors
        if (data.error) {
            console.error('Anthropic API error:', JSON.stringify(data.error));
            return res.status(500).json({
                error: `API error: ${data.error.message || 'Unknown error'}`
            });
        }

        if (data.content && data.content[0]?.text) {
            let responseText = data.content[0].text.trim();

            // Strip markdown code fences if present
            if (responseText.startsWith('```')) {
                responseText = responseText
                    .replace(/^```(?:json)?\n?/, '')
                    .replace(/\n?```$/, '');
            }

            try {
                const questions = JSON.parse(responseText);
                res.json({ questions });
            } catch {
                console.error('Failed to parse Claude response as JSON:', responseText.substring(0, 200));
                res.status(500).json({
                    error: 'Failed to parse questions into structured format',
                    raw: data.content[0].text
                });
            }
        } else {
            console.error('Unexpected API response:', JSON.stringify(data).substring(0, 500));
            res.status(500).json({ error: 'Unexpected API response format' });
        }
    } catch (err) {
        console.error('Parse request error:', err.message);
        res.status(500).json({ error: `Request failed: ${err.message}` });
    }
});

// ============================================
// PDF UPLOAD
// ============================================

app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const data = await pdfParse(req.file.buffer);
        res.json({ text: data.text, pages: data.numpages });
    } catch (err) {
        console.error('PDF parse error:', err.message);
        res.status(500).json({ error: 'Failed to parse PDF file' });
    }
});

// ============================================
// DATA SYNC (optional - requires SYNC_KEY in .env)
// ============================================

const SYNC_DIR = path.join(__dirname, '.data');
const SYNC_FILE = path.join(SYNC_DIR, 'sync.json');

// Expose whether sync is available so the client can check
app.get('/api/sync/status', (req, res) => {
    res.json({ enabled: !!SYNC_KEY });
});

app.get('/api/sync', (req, res) => {
    if (!SYNC_KEY) return res.status(404).json({ error: 'Sync not configured' });

    const key = req.headers['x-sync-key'];
    if (key !== SYNC_KEY) return res.status(401).json({ error: 'Invalid sync key' });

    try {
        if (fs.existsSync(SYNC_FILE)) {
            const data = JSON.parse(fs.readFileSync(SYNC_FILE, 'utf8'));
            res.json(data);
        } else {
            res.json(null);
        }
    } catch (err) {
        console.error('Sync read error:', err.message);
        res.status(500).json({ error: 'Failed to read sync data' });
    }
});

app.post('/api/sync', (req, res) => {
    if (!SYNC_KEY) return res.status(404).json({ error: 'Sync not configured' });

    const key = req.headers['x-sync-key'];
    if (key !== SYNC_KEY) return res.status(401).json({ error: 'Invalid sync key' });

    try {
        if (!fs.existsSync(SYNC_DIR)) fs.mkdirSync(SYNC_DIR, { recursive: true });
        fs.writeFileSync(SYNC_FILE, JSON.stringify(req.body, null, 2));
        res.json({ ok: true });
    } catch (err) {
        console.error('Sync write error:', err.message);
        res.status(500).json({ error: 'Failed to write sync data' });
    }
});

// ============================================
// STATIC FILES & START
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname, {
    extensions: ['html'],
    dotfiles: 'deny'
}));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Model: ${MODEL}`);
    console.log(`API key loaded: ${!!API_KEY}`);
});
