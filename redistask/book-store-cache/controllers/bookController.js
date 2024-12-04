const Book = require('../models/Book');
const redisClient = require('../config/redis');

const BOOK_CACHE_TTL = process.env.BOOK_CACHE_TTL || 600;

const getBookById = async (req, res) => {
  const { id } = req.params;

  try {
    const cacheData = await redisClient.get(`book:${id}`);
    if (cacheData) {
      return res.status(200).json(JSON.parse(cacheData));
    }

    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    await redisClient.setex(`book:${id}`, BOOK_CACHE_TTL, JSON.stringify(book));
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addBook = async (req, res) => {
  const { title, author, price, genre, description } = req.body;

  try {
    const newBook = await Book.create({ title, author, price, genre, description });
    await redisClient.del('books:popular');
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBook = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedBook = await Book.findByIdAndUpdate(id, req.body, { new: true });
    await redisClient.del('books:popular');
    if (!updatedBook) return res.status(404).json({ message: 'Book not found' });
    await redisClient.setex(`book:${id}`, BOOK_CACHE_TTL, JSON.stringify(updatedBook));
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBook = async (req, res) => {
  const { id } = req.params;

  try {
    const book = await Book.findByIdAndDelete(id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    await redisClient.del(`book:${id}`);
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPopularBooks = async (req, res) => {
  try {
    const cacheData = await redisClient.get('books:popular');
    if (cacheData) return res.status(200).json(JSON.parse(cacheData));

    const books = await Book.find().limit(10);
    await redisClient.setex('books:popular', BOOK_CACHE_TTL, JSON.stringify(books));
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBookById, addBook, updateBook, deleteBook, getPopularBooks };
