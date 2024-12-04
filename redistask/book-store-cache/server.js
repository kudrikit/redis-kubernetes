require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const redisClient = require('./config/redis');
const bookRoutes = require('./routes/bookRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const cors = require('cors');

// Добавьте эту строку перед определением маршрутов


const app = express();

connectDB();
app.use(cors());
app.use(bodyParser.json());
app.use('/books', bookRoutes);
app.use('/sessions', sessionRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
