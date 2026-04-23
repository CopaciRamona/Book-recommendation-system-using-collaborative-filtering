import express from 'express';
import { addReview, deleteReview, getMyReviews, updateReview, checkUserReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addReview);
router.get('/my-reviews', protect, getMyReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.get('/check/:bookId', protect, checkUserReview);

export default router;