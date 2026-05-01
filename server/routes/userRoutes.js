import express from 'express';
import { 
    getUserProfile, 
    updateUserProfile, 
    getAllUsers,    // <--- Nou
    deleteUser,      // <--- Nou
    updateUserAdmin  // <--- Nou
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/isAdmin.js'; // <--- Nou
import upload from '../middleware/uploads.js';

const router = express.Router();

// --- RUTE UTILIZATOR NORMAL ---
// Acestea folosesc doar 'protect' (utilizatorul acționează asupra propriului cont)
router.get('/profile', protect, getUserProfile);
router.put('/update-profile', protect, upload.single('profile_picture'), updateUserProfile);

// --- RUTE ADMINISTRARE (DASHBOARD) ---
// Acestea folosesc 'protect' ȘI 'isAdmin' (doar cineva cu rol de admin are acces)

// 1. Obține lista tuturor utilizatorilor pentru tabelul din Home
router.get('/admin/users', protect, isAdmin, getAllUsers);

// 2. Modifică profilul oricărui utilizator (Nume sau Rol)
router.put('/admin/users/:id', protect, isAdmin, upload.single('profile_picture'), updateUserAdmin);

// 3. Șterge un utilizator din baza de date
router.delete('/admin/users/:id', protect, isAdmin, deleteUser);

export default router;