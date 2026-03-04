import { Book, User, UserBook, Recommendation } from '../models/index.js';
import { Op } from 'sequelize';

export const getRecommendations = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // =========================================================
        // PASUL 1: Verificăm Tabelul de Recomandări 
        // (Acesta va fi populat de Python / Collaborative Filtering)
        // =========================================================
        const userRecommendations = await Recommendation.findAll({
            where: { userId: userId },
            include: [{
                model: Book,
                as: 'book', // Asigură-te că alias-ul corespunde cu cel din index.js
                attributes: ['id', 'titlu', 'autor', 'coperta_url', 'rating_mediu']
            }],
            order: [['score', 'DESC']], // Le sortăm după scorul calculat de algoritm
            limit: 20
        });

        // Dacă avem recomandări precalculate în tabel, i le dăm pe acelea
        if (userRecommendations && userRecommendations.length > 0) {
            // Extragem doar cărțile din obiectul Recommendation
            const recommendedBooks = userRecommendations.map(rec => rec.book);
            
            return res.status(200).json({ 
                type: 'collaborative-filtering', 
                message: "Recomandări personalizate bazate pe algoritm",
                books: recommendedBooks 
            });
        }

        // =========================================================
        // PASUL 2: LOGICA COLD START (Fallback)
        // Dacă tabelul e gol (user nou sau algoritmul nu a rulat)
        // =========================================================
        const user = await User.findByPk(userId);
        
        if (!user || !user.genuri_preferate) {
            return res.status(200).json({ type: 'cold-start', books: [] });
        }

        const genresArray = user.genuri_preferate.split(',');

        const coldStartBooks = await Book.findAll({
            where: {
                [Op.or]: genresArray.map(genre => ({
                    // Înlocuiește 'genuri' cu numele coloanei tale (ex: descriere sau genuri)
                    descriere: { [Op.like]: `%${genre.trim()}%` } 
                }))
            },
            limit: 20,
            order: [['rating_mediu', 'DESC']]
        });

        return res.status(200).json({ 
            type: 'cold-start', 
            message: "Recomandări bazate pe genurile alese",
            books: coldStartBooks 
        });

    } catch (error) {
        console.error("Eroare la preluarea recomandărilor:", error);
        next(error);
    }
};