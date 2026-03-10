import http from 'http';
import { URL } from 'url';
import handler from './api/analyze-prescription.js';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Mock Vercel response object
    const vercelRes = {
        status: (code) => {
            res.statusCode = code;
            return vercelRes;
        },
        json: (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return vercelRes;
        },
        send: (data) => {
            res.end(data);
            return vercelRes;
        },
        setHeader: (name, value) => {
            res.setHeader(name, value);
            return vercelRes;
        }
    };

    if (url.pathname === '/api/analyze-prescription') {
        try {
            await handler(req, vercelRes);
        } catch (err) {
            console.error('API Error:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
        }
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Backend dev server running on http://localhost:${PORT}`);
});
