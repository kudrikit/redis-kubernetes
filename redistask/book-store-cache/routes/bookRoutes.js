const express = require('express');
const { getBookById, addBook, updateBook, deleteBook, getPopularBooks } = require('../controllers/bookController');

const router = express.Router();

// Маршруты с фиксированными путями должны быть первыми
router.get('/popular', getPopularBooks);

// Динамический маршрут для получения книги по ID
router.get('/:id', getBookById);

// Маршрут для добавления новой книги
router.post('/', addBook);

// Маршрут для обновления книги
router.put('/:id', updateBook);

// Маршрут для удаления книги
router.delete('/:id', deleteBook);

module.exports = router;

