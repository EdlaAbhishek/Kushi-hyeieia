require('dotenv').config();
const express = require('express');
const cors = require('cors');

const appointmentsRoutes = require('./routes/appointments');
const doctorsRoutes = require('./routes/doctors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Backend running' });
});

app.use('/api/appointments', appointmentsRoutes);
app.use('/api/doctors', doctorsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});