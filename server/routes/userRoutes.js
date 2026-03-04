import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import  upload from '../middleware/uploads.js';


const router = express.Router();

// GET /api/users/profile -> Aduce datele ca să le afișezi pe ecran
router.get('/profile', protect, getUserProfile);

// PUT /api/users/profile -> Trimite datele noi din formular pentru a le salva
router.put('/update-profile', protect,upload.single('profile_picture'), updateUserProfile);

export default router;