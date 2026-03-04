import express from 'express';
import { updateBookStatus, getLibraryByStatus, 
         updateReadingProgress, checkBookInLibrary,
         removeBookFromLibrary } from '../controllers/libraryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();


// ---> RUTA NOUĂ PENTRU SALVAREA PROGRESULUI:
router.post('/update-progress', protect, updateReadingProgress);

// Ruta pentru adăugare / modificare status (metoda POST)
// Endpoint: POST /api/library/update-status
router.post('/update-status', protect, updateBookStatus); 

// --- RUTE CU ID-UL CĂRȚII ---
// Endpoint: GET /api/library/check/5
router.get('/check/:bookId', protect, checkBookInLibrary); 
// Endpoint: DELETE /api/library/remove/5
router.delete('/remove/:bookId', protect, removeBookFromLibrary);

router.get('/:status', protect, getLibraryByStatus);

export default router;