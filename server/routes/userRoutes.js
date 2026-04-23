import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import  upload from '../middleware/uploads.js';


const router = express.Router();
router.get('/profile', protect, getUserProfile);
router.put('/update-profile', protect,upload.single('profile_picture'), updateUserProfile);

export default router;