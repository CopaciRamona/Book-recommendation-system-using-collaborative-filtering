import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize, Book } from './models/index.js'; 
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import path from 'path'; // <--- 1. Importăm 'path'
import { fileURLToPath } from 'url';
import bookRoutes from './routes/bookRoutes.js';

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
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully!');

        // AICI ACTUALIZAM TABELELE, gen daca modificam ceva la structura tabelelor sa se modifice si in baza de date
        await sequelize.sync({ alter: true }); 
        // --- SCRIPT TEMPORAR PENTRU EXTRAGEREA GENURILOR ---
        console.log('✅ Tabelele au fost actualizate (synced)!');
        // --- SCRIPT PENTRU CONTORIZARE GENURI ---
        const allBooks = await Book.findAll({ attributes: ['genuri'], raw: true });
const genreCounts = {};
allBooks.forEach(book => {
    if (book.genuri) {
        const cleanString = book.genuri.replace(/[\[\]']/g, '');
        const splitGenres = cleanString.split(',');
        splitGenres.forEach(g => {
            const trimmed = g.trim();
            if(trimmed) {
                genreCounts[trimmed] = (genreCounts[trimmed] || 0) + 1;
            }
        });
    }
});

// Sortăm să vedem ce e mai popular
const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1]) // De la cel mai frecvent la cel mai rar
    .slice(0, 30); // Luăm doar primele 30

console.log("🌟 TOP 30 GENURI POPULARE (Folosește-le pe acestea în UI):");
console.log(sortedGenres);
        
    } catch (err) {
        console.error('❌ Database connection error:', err);
    }
});