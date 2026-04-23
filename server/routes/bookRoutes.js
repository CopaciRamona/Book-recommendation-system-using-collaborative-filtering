import express from 'express';
import { getBookById, searchBooks, getDiscoverBooks, getBooksByGenre} from '../controllers/bookController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/discover', protect, getDiscoverBooks);
router.get('/search', protect, searchBooks);
router.get('/genre/:genreName', protect, getBooksByGenre);
router.get('/:id', protect, getBookById);

export default router;  