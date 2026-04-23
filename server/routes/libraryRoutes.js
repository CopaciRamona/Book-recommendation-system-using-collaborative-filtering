import express from 'express';
import { updateBookStatus, getLibraryByStatus, 
         updateReadingProgress, checkBookInLibrary,
         removeBookFromLibrary } from '../controllers/libraryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/update-progress', protect, updateReadingProgress);
router.post('/update-status', protect, updateBookStatus); 
router.get('/check/:bookId', protect, checkBookInLibrary); 
router.delete('/remove/:bookId', protect, removeBookFromLibrary);

router.get('/:status', protect, getLibraryByStatus);

export default router;