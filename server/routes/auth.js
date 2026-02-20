import express from 'express';
import { registerUser, loginUser, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import  upload from '../middleware/uploads.js';

const router = express.Router();

router.post('/register',registerUser);
router.post('/login', loginUser);
router.post('/update-profile', protect,upload.single('profile_picture'), updateProfile);

export default router;