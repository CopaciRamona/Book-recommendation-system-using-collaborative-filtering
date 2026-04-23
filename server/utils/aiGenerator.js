import { Book, User, Recommendation } from '../models/index.js';
import axios from 'axios';

export const generateAndSaveRecommendations = async (userId) => {
    try {
        console.log(`[AI Worker] Încep lucrul pentru userul: ${userId}`);

        // 1. Luăm userul și cărțile din biblioteca lui
        const user = await User.findByPk(userId, {
            include: [{ model: Book, as: 'myLibrary', through: { attributes: ['status', 'updatedAt'] } }]
        });

        if (!user || !user.myLibrary || user.myLibrary.length === 0) {
            console.log(`[AI Worker] Userul ${userId} nu are cărți. Nu generez nimic.`);
            return;
        }

        const userLibraryBookIds = user.myLibrary.map(b => Number(b.id));
        
        // Sortăm să luăm cele mai recente cărți adăugate
        const sortedLibrary = user.myLibrary.sort((a, b) => b.UserBook.updatedAt - a.UserBook.updatedAt);
        const favoriteBooks = sortedLibrary.slice(0, 40).map(b => b.titlu);

        if (favoriteBooks.length > 0) {
            console.log(`[AI Worker] Trimit cerere către FastAPI...`);
            
            // 2. SUNĂM LA SERVERUL FASTAPI
            const response = await axios.post('http://127.0.0.1:8000/recomanda', {
                book_titles: favoriteBooks,
                top_n: 30
            });

            const recommendedBooksRaw = response.data;
            const newRecommendations = recommendedBooksRaw
                .filter(book => !userLibraryBookIds.includes(Number(book.id)))
                .slice(0, 20); 

            if (newRecommendations.length > 0) {
                console.log(`[AI Worker] Am primit ${newRecommendations.length} recomandări. Salvez în BD...`);
                await Recommendation.destroy({ where: { userId: userId } });

                const dataToSave = newRecommendations.map(book => ({
                    userId: userId,
                    bookId: book.id,
                    score: book.scor_ai,
                    motiv: "Recommendations based on your library"
                }));

                await Recommendation.bulkCreate(dataToSave);
                
                console.log(`[AI Worker] GATA! Am actualizat recomandările pentru userul: ${userId}`);
            }
        }
    } catch (error) {
        console.error(`[AI Worker] Eroare:`, error.message);
    }
};