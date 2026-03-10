import fs from 'fs';
import handler from './api/analyze-prescription.js';
import dotenv from 'dotenv';
dotenv.config();

// Create a dummy file
fs.writeFileSync('foo.jpg', 'dummy image data');
const imageBuffer = fs.readFileSync('foo.jpg');

const req = {
    method: 'POST',
    // Mock the async iterator for req
    [Symbol.asyncIterator]: async function* () {
        yield imageBuffer;
    }
}

const res = {
    status: function (code) {
        console.log('Status set to:', code);
        return this;
    },
    json: function (data) {
        console.log('JSON returned:', data);
        return this;
    }
}

handler(req, res).then(() => {
    console.log('Handler finished');
}).catch(err => {
    console.error('Handler crashed:', err);
});
