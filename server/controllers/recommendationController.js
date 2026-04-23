import { Book, User, UserBook, Recommendation, Review } from '../models/index.js';
import { Op } from 'sequelize';

export const getRecommendations = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userLibrary = await UserBook.findAll({ 
            where: { userId: userId }, 
            attributes: ['bookId'] 
        });
        
        const excludeIds = userLibrary.map(ub => Number(ub.bookId)); 

        // 1. RECOMANDĂRI AI 
        const savedRecommendations = await Recommendation.findAll({
            where: { userId: userId },
            include: [{ model: Book, as: 'book' }],
            order: [['score', 'DESC']]
        });

        if (savedRecommendations && savedRecommendations.length > 0) {
            
            const filteredRecs = savedRecommendations.filter(rec => !excludeIds.includes(Number(rec.bookId)));

            if (filteredRecs.length > 0) {
                const books = filteredRecs.map(rec => ({
                    ...rec.book.toJSON(),
                    scor_ai: rec.score,
                    motiv: rec.motiv
                }));

                const motivGeneral = filteredRecs[0].motiv || "Personalized recommendations";

                return res.status(200).json({
                    type: 'ai-content-based',
                    message: motivGeneral,
                    books: books
                });
            }
        }
        
        // 2. COLD START 
        const user = await User.findByPk(userId);

        if (!user || !user.genuri_preferate) {
            return res.status(200).json({ 
                type: 'cold-start', 
                message: 'Complete your profile or add your first book to your library to get recommendations!', 
                books: [] 
            });
        }

        const genresArray = user.genuri_preferate.replace(/[\[\]"']/g, '').split(',').map(g => g.trim()).filter(g => g);

        let whereClause = {
            [Op.or]: genresArray.map(genre => ({
                genuri: { [Op.like]: `%${genre}%` } 
            }))
        };

        if (excludeIds.length > 0) {
            whereClause.id = { [Op.notIn]: excludeIds };
        }

        const rawBooks = await Book.findAll({
            where: whereClause,
            limit: 60, 
            order: [
                [Book.sequelize.literal('CAST(numar_voturi AS UNSIGNED)'), 'DESC'],
                ['rating_mediu', 'DESC']
            ]
        });

        const diverseBooks = [];
        const seenAuthors = new Set();

        for (const book of rawBooks) {
            if (!seenAuthors.has(book.autor)) {
                diverseBooks.push(book);
                seenAuthors.add(book.autor);
            }
            
            if (diverseBooks.length >= 20) {
                break;
            }
        }

        return res.status(200).json({ 
            type: 'cold-start', 
            message: "Top diverse recommendations from your favorite genres",
            books: diverseBooks 
        });

    } catch (error) {
        console.error("Error fetching recommendations:", error);
        next(error);
    }
};