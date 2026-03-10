import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './api/analyze-prescription.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
    const imagePath = path.join(__dirname, 'public', 'assets', 'logo.png');
    const imageBuffer = fs.readFileSync(imagePath);

    const req = {
        method: 'POST',
        headers: {
            'content-type': 'application/octet-stream',
            'content-length': imageBuffer.length
        },
        [Symbol.asyncIterator]: async function* () {
            yield imageBuffer;
        }
    };

    const res = {
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        json: function (data) {
            console.log(`\n=== API RESPONSE (Status: ${this.statusCode}) ===`);
            console.log(JSON.stringify(data, null, 2));
            return this;
        }
    };

    console.log('Sending mock image to handler...');
    try {
        await handler(req, res);
    } catch (err) {
        console.error('Test script caught error:', err);
    }
}

runTest();
