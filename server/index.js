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
import chatRoutes from './routes/chatRoutes.js';
import emailRoutes from './routes/emailRoutes.js';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json()); 


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/auth/', authRoutes);
app.use('/api/books/', bookRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/library/', libraryRoutes);
app.use('/api/reviews/', reviewRoutes);
app.use('/api/users/', userRoutes)
app.use('/api/chat', chatRoutes);
app.use('/api/emails', emailRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully!');

        
        await sequelize.sync(); 
        console.log('✅ Tabelele au fost actualizate (synced)!');
        
    } catch (err) {
        console.error('❌ Database connection error:', err);
    }
});