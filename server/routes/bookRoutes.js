import express from 'express';
import { getBookById, searchBooks } from '../controllers/bookController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Când cineva face GET pe /api/books/recommendations, va rula logica ta de Cold Start
// Folosim middleware-ul 'protect' pentru că trebuie să extragem ID-ul userului din token
router.get('/search', protect, searchBooks);
router.get('/:id', protect, getBookById);

export default router;  