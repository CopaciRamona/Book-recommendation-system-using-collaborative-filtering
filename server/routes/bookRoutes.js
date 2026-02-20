import express from 'express';
import { getRecommendations } from '../controllers/bookController.js';
import { protect } from '../middleware/authMiddleware.js'; // Doar userii logați primesc recomandări

const router = express.Router();

// Ruta este protejată: trebuie să știm CINE e userul ca să îi știm genurile
router.get('/recommendations', protect, getRecommendations);

export default router;