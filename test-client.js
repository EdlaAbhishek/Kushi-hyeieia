import fs from 'fs';

async function test() {
    try {
        const fileData = fs.readFileSync('package.json');

        const res = await fetch('http://localhost:5173/api/analyze-prescription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
            body: fileData
        });

        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Body:', text);
    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

test();
