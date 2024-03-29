const express = require('express');
const connectDB = require('./config/db');
const path = require('path');

const app = express();

// Connect MongoDB
connectDB();

// Initialize middleware (BodyParser included in Express)
app.use(express.json({ extended: false }));

app.get('/', (request, response) => response.send('API running...'));

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const port = process.env.PORT || 5055;

app.listen(port, () => console.log(`Server running on port ${port}`));
