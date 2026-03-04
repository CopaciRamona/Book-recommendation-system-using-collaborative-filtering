import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize, Book } from './models/index.js'; 
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import path from 'path'; // <--- 1. Importăm 'path'
import { fileURLToPath } from 'url';
import bookRoutes from './routes/bookRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import userRoutes from './routes/userRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';

// Încărcăm variabilele din .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware (unelte standard)
app.use(cors());
app.use(express.json()); // Ne permite să citim JSON din cereri

// 4. AICI ESTE MAGIA PENTRU POZE: Facem folderul 'uploads' public!
// Orice cerere către localhost:3000/uploads/... va căuta direct în folderul tău fizic
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// O rută simplă de test ca să vezi că merge în browser
app.use('/api/auth/', authRoutes);
app.use('/api/books/', bookRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/library/', libraryRoutes);
app.use('/api/reviews/', reviewRoutes);
app.use('/api/users/', userRoutes)

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully!');

        // AICI ACTUALIZAM TABELELE, gen daca modificam ceva la structura tabelelor sa se modifice si in baza de date
        await sequelize.sync(); 
        // await sequelize.sync({ alter: true }); 
        // --- SCRIPT TEMPORAR PENTRU EXTRAGEREA GENURILOR ---
        console.log('✅ Tabelele au fost actualizate (synced)!');
        
    } catch (err) {
        console.error('❌ Database connection error:', err);
    }
});