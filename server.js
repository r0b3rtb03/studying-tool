require('dotenv').config();

const express = require('express');
const session = require('express-session');
const https = require('https');
const path = require('path');
const { google } = require('googleapis');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

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

app.use(express.json({ limit: '1mb' }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'study-tool-dev-secret-change-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));

// ============================================
// GOOGLE OAUTH2 SETUP
// ============================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const GOOGLE_ENABLED = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI);

function getOAuth2Client() {
    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );
}

function requireGoogle(req, res, next) {
    if (!GOOGLE_ENABLED) {
        return res.status(503).json({ error: 'Google integration not configured' });
    }
    if (!req.session.googleTokens) {
        return res.status(401).json({ error: 'Not authenticated with Google' });
    }
    next();
}

// ============================================
// GOOGLE AUTH ROUTES
// ============================================

app.get('/auth/google', (req, res) => {
    if (!GOOGLE_ENABLED) {
        return res.status(503).json({ error: 'Google integration not configured' });
    }
    const oauth2Client = getOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/documents.readonly',
            'https://www.googleapis.com/auth/drive.readonly'
        ],
        prompt: 'consent'
    });
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    if (!GOOGLE_ENABLED) {
        return res.status(503).json({ error: 'Google integration not configured' });
    }
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('Missing authorization code');
    }
    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        req.session.googleTokens = tokens;
        res.redirect('/#importTab');
    } catch (err) {
        console.error('Google OAuth error:', err.message);
        res.status(500).send('Authentication failed');
    }
});

app.get('/auth/google/status', (req, res) => {
    res.json({
        enabled: GOOGLE_ENABLED,
        authenticated: !!req.session.googleTokens
    });
});

app.post('/auth/google/disconnect', (req, res) => {
    if (req.session.googleTokens) {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials(req.session.googleTokens);
        oauth2Client.revokeCredentials().catch(() => {});
        delete req.session.googleTokens;
    }
    res.json({ success: true });
});

// ============================================
// GOOGLE DOCS ROUTES
// ============================================

app.get('/api/gdocs/search', requireGoogle, async (req, res) => {
    try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials(req.session.googleTokens);

        if (oauth2Client.isTokenExpiring()) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            req.session.googleTokens = credentials;
            oauth2Client.setCredentials(credentials);
        }

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const query = req.query.q || '';

        let q = "mimeType='application/vnd.google-apps.document'";
        if (query.trim()) {
            q += ` and fullText contains '${query.replace(/'/g, "\\'")}'`;
        }

        const response = await drive.files.list({
            q,
            pageSize: 20,
            fields: 'files(id, name, modifiedTime)',
            orderBy: 'modifiedTime desc'
        });

        res.json({ files: response.data.files || [] });
    } catch (err) {
        console.error('Drive search error:', err.message);
        if (err.message?.includes('invalid_grant') || err.code === 401) {
            delete req.session.googleTokens;
            return res.status(401).json({ error: 'Session expired. Please reconnect.' });
        }
        res.status(500).json({ error: 'Failed to search documents' });
    }
});

app.get('/api/gdocs/:docId', requireGoogle, async (req, res) => {
    try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials(req.session.googleTokens);

        if (oauth2Client.isTokenExpiring()) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            req.session.googleTokens = credentials;
            oauth2Client.setCredentials(credentials);
        }

        const docs = google.docs({ version: 'v1', auth: oauth2Client });
        const doc = await docs.documents.get({ documentId: req.params.docId });

        const content = extractDocContent(doc.data);
        res.json({
            title: doc.data.title,
            text: content.text,
            html: content.html
        });
    } catch (err) {
        console.error('Doc fetch error:', err.message);
        if (err.message?.includes('invalid_grant') || err.code === 401) {
            delete req.session.googleTokens;
            return res.status(401).json({ error: 'Session expired. Please reconnect.' });
        }
        res.status(500).json({ error: 'Failed to fetch document' });
    }
});

function extractDocContent(docData) {
    let text = '';
    let html = '';

    if (!docData.body || !docData.body.content) {
        return { text: '', html: '' };
    }

    for (const element of docData.body.content) {
        if (element.paragraph) {
            const para = element.paragraph;
            let paraText = '';
            let paraHtml = '';

            const style = para.paragraphStyle?.namedStyleType || '';
            const headingLevel = style.match(/HEADING_(\d)/)?.[1];

            for (const elem of (para.elements || [])) {
                if (elem.textRun) {
                    const content = elem.textRun.content || '';
                    paraText += content;

                    let formatted = escapeHtml(content);
                    const ts = elem.textRun.textStyle || {};
                    if (ts.bold) formatted = `<strong>${formatted}</strong>`;
                    if (ts.italic) formatted = `<em>${formatted}</em>`;
                    if (ts.underline) formatted = `<u>${formatted}</u>`;
                    if (ts.strikethrough) formatted = `<s>${formatted}</s>`;
                    paraHtml += formatted;
                }
            }

            text += paraText;

            if (headingLevel) {
                html += `<h${headingLevel}>${paraHtml}</h${headingLevel}>`;
            } else {
                html += `<p>${paraHtml}</p>`;
            }
        } else if (element.table) {
            html += '<table style="border-collapse:collapse;width:100%;margin:0.5rem 0;">';
            for (const row of (element.table.tableRows || [])) {
                html += '<tr>';
                for (const cell of (row.tableCells || [])) {
                    html += '<td style="border:1px solid #ccc;padding:0.5rem;">';
                    for (const cellContent of (cell.content || [])) {
                        if (cellContent.paragraph) {
                            for (const elem of (cellContent.paragraph.elements || [])) {
                                if (elem.textRun) {
                                    const content = elem.textRun.content || '';
                                    text += content;
                                    html += escapeHtml(content);
                                }
                            }
                        }
                    }
                    html += '</td>';
                }
                html += '</tr>';
            }
            html += '</table>';
        }
    }

    return { text, html };
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ============================================
// CLAUDE API - PARSE QUESTIONS
// ============================================

const PARSE_SYSTEM_PROMPT = `You are a multiple choice question extractor. Your job is to parse text that contains exam/review questions and extract ONLY the multiple choice questions as structured JSON.

## ABSOLUTE RULES

1. Extract ONLY multiple choice questions (questions with lettered options like A, B, C, D).
2. IGNORE all other question types: essay questions, short answer, free response, fill-in-the-blank, true/false.
3. Preserve the EXACT question text and option text as written. Do not rephrase, summarize, or modify.
4. Preserve the original question numbering (e.g., if questions start at 24, keep that numbering).
5. If a correct answer is indicated in the text (answer key, bold text, asterisk, etc.), include it. If no correct answer is indicated, set correctAnswer to null.
6. If an explanation is provided for an answer, include it. Otherwise omit the explanation field.

## OUTPUT FORMAT

Return ONLY valid JSON, no markdown code fences, no explanation text. The format must be:

[
  {
    "id": "q24",
    "number": 24,
    "question": "The exact question text as written",
    "options": [
      { "letter": "A", "text": "First option text" },
      { "letter": "B", "text": "Second option text" },
      { "letter": "C", "text": "Third option text" },
      { "letter": "D", "text": "Fourth option text" }
    ],
    "correctAnswer": "B",
    "explanation": "Optional explanation if provided in source"
  }
]

## EDGE CASES
- If options use lowercase (a, b, c, d), normalize to uppercase (A, B, C, D).
- If a question has more or fewer than 4 options, include all of them.
- If you find zero multiple choice questions, return an empty array: []
- Do NOT invent or guess correct answers. Only include them if explicitly present in the source text.
- Some questions may span multiple lines or have complex formatting - capture the full question text.`;

app.post('/api/parse-questions', (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'No text provided to parse' });
        }

        const postData = JSON.stringify({
            model: MODEL,
            max_tokens: 8000,
            system: PARSE_SYSTEM_PROMPT,
            messages: [{
                role: 'user',
                content: `Extract all multiple choice questions from the following text:\n\n${text}`
            }]
        });

        const options = {
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const apiReq = https.request(options, apiRes => {
            let responseData = '';
            apiRes.on('data', c => responseData += c);
            apiRes.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);

                    if (parsed.content && parsed.content[0]?.text) {
                        let responseText = parsed.content[0].text.trim();

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
                            res.status(500).json({
                                error: 'Failed to parse questions into structured format',
                                raw: parsed.content[0].text
                            });
                        }
                    } else {
                        res.status(apiRes.statusCode).json(parsed);
                    }
                } catch {
                    res.status(apiRes.statusCode).send(responseData);
                }
            });
        });

        apiReq.on('error', () => {
            res.status(500).json({ error: 'Anthropic API request failed' });
        });

        apiReq.write(postData);
        apiReq.end();
    } catch {
        res.status(400).json({ error: 'Invalid request' });
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
    console.log(`Google Docs: ${GOOGLE_ENABLED ? 'Enabled' : 'Not configured'}`);
});
