import express from 'express';
import { trimiteReangajare } from '../controllers/emailController.js';
// Importă middleware-urile de securitate (asigură-te că pui calea corectă către fișierele tale)
import { protect } from '../middleware/authMiddleware.js'; // sau cum se numește la tine
import { isAdmin } from '../middleware/isAdmin.js'; 

const router = express.Router();

// Securizăm ruta: trebuie să fie logat (verifyToken) ȘI să fie admin (isAdmin)
router.post('/trigger-emails', protect, isAdmin, trimiteReangajare);

export default router;