require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const appointmentsRoutes = require('./routes/appointments');
const doctorsRoutes = require('./routes/doctors');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
    res.json({ message: 'Backend running' });
});

// Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

// Mount Routes
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/doctors', doctorsRoutes);

// Server setup
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});