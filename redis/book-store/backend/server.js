const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const redis = require('redis');
const dotenv = require('dotenv');
const bookRoutes = require('./routes/books');
const sessionRoutes = require('./routes/sessions');

dotenv.config();
const app = express();
const port = process.env.PORT;


// Создайте новый Redis клиент
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`, // Используем URL подключения
});

// Обработчик событий для клиента
redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', (err) => console.error('Redis error:', err));

// Подключите клиента к Redis серверу
(async () => {
  try {
    await redisClient.connect(); // Явно подключаем клиента
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
})();

module.exports = redisClient;

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/books', bookRoutes(redisClient));
app.use('/sessions', sessionRoutes(redisClient));

app.listen(port, () => console.log(`Server running on port ${port}`));
