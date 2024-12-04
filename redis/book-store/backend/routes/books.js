const express = require('express');
const Book = require('../models/Book');

module.exports = (redisClient) => {
  const router = express.Router();

  // GET /books - Получение всех книг
  router.get('/', async (req, res) => {
    try {
      const books = await Book.find();
      res.json(books);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch books' });
    }
  });

  // GET /books/:id - Получение книги по ID
  router.get('/:id', async (req, res) => {
    const bookId = req.params.id;

    try {
      const cachedBook = await redisClient.get(`book:${bookId}`);
      if (cachedBook) {
        await redisClient.zIncrBy('popular_books', 1, bookId); // Увеличиваем популярность книги
        return res.json(JSON.parse(cachedBook));
      }

      const book = await Book.findById(bookId);
      if (book) {
        await redisClient.setEx(`book:${bookId}`, process.env.BOOK_CACHE_TTL, JSON.stringify(book));
        await redisClient.zIncrBy('popular_books', 1, bookId); // Увеличиваем популярность книги
        return res.json(book);
      }

      res.status(404).json({ error: 'Book not found' });
    } catch (error) {
      console.error('Error fetching book details:', error);
      res.status(500).json({ error: 'Error fetching book' });
    }
  });


  // POST /books - Добавление новой книги
  router.post('/', async (req, res) => {
    try {
      const newBook = new Book(req.body);
      const savedBook = await newBook.save();
      res.status(201).json(savedBook);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save book' });
    }
  });

  // PUT /books/:id - Обновление книги
  router.put('/:id', async (req, res) => {
    try {
      const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (updatedBook) {
        redisClient.setex(`book:${req.params.id}`, process.env.BOOK_CACHE_TTL, JSON.stringify(updatedBook));
        return res.json(updatedBook);
      }
      res.status(404).json({ error: 'Book not found' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update book' });
    }
  });

  // DELETE /books/:id - Удаление книги
  router.delete('/:id', async (req, res) => {
    try {
      await Book.findByIdAndDelete(req.params.id);
      redisClient.del(`book:${req.params.id}`);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete book' });
    }
  });

  // GET /books/popular - Получение популярных книг
  router.get('/popular', async (req, res) => {
    try {
      // Получаем список популярных книг из Redis
      const popularBooks = await redisClient.zRangeWithScores('popular_books', 0, -1, { REV: true });

      if (!popularBooks.length) {
        return res.json([]); // Если популярных книг нет, возвращаем пустой массив
      }

      // Ищем книги в базе данных по их ID
      const bookIds = popularBooks.map((entry) => entry.value);
      const books = await Book.find({ _id: { $in: bookIds } });

      // Формируем ответ, включая счётчики популярности
      const result = books.map((book) => ({
        ...book.toObject(),
        popularity: popularBooks.find((entry) => entry.value === book._id.toString()).score,
      }));

      res.json(result);
    } catch (error) {
      console.error('Failed to fetch popular books:', error);
      res.status(500).json({ error: 'Failed to fetch popular books' });
    }
  });

// Middleware для увеличения популярности книги при запросе по ID
  router.get('/:id', async (req, res) => {
    const bookId = req.params.id;

    try {
      const cachedBook = await redisClient.get(`book:${bookId}`);
      if (cachedBook) {
        await redisClient.zIncrBy('popular_books', 1, bookId); // Увеличиваем популярность книги
        return res.json(JSON.parse(cachedBook));
      }

      const book = await Book.findById(bookId);
      if (book) {
        await redisClient.setEx(`book:${bookId}`, process.env.BOOK_CACHE_TTL, JSON.stringify(book));
        await redisClient.zIncrBy('popular_books', 1, bookId); // Увеличиваем популярность книги
        return res.json(book);
      }

      res.status(404).json({ error: 'Book not found' });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching book' });
    }
  });


  return router;
};
