const fs = require('fs');
require('dotenv').config({ path: '../.env' });
const db = require('./db');
db.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position")
    .then(res => {
        fs.writeFileSync('schema.json', JSON.stringify(res.rows, null, 2), 'utf8');
        console.log('Schema written to schema.json');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
