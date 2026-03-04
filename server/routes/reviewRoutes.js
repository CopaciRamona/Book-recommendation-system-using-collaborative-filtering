import express from 'express';
import { addReview, deleteReview, getMyReviews, updateReview, checkUserReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta pentru a posta sau actualiza o recenzie (POST /api/reviews)
router.post('/', protect, addReview);
router.get('/my-reviews', protect, getMyReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
// Endpoint: GET /api/reviews/check/:bookId
router.get('/check/:bookId', protect, checkUserReview);

export default router;