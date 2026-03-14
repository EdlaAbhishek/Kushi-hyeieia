const fs = require('fs');

async function test() {
    // Read a dummy image file (we'll just use a small random file or create one)
    const buffer = Buffer.from('dummy image content');
    
    try {
        const response = await fetch('http://localhost:3000/api/analyze-prescription', {
            method: 'POST',
            headers: {
                'Content-Type': 'image/jpeg'
            },
            body: buffer
        });
        
        const data = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
