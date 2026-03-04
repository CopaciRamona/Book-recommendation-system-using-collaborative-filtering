import { Book, UserBook, User, Review, GoodreadsReview } from '../models/index.js';
import { Op } from 'sequelize';

export const getBookById = async (req, res, next) => {
    try {
        const bookId = req.params.id;

        const book = await Book.findByPk(bookId, {
            include: [
                {
                    model: Review,
                    as: 'appReviews',
                    // MODIFICARE: Mapăm 'text_recenzie' la 'text' pentru frontend
                    attributes: ['id', 'rating', ['text_recenzie', 'text'], 'createdAt'],
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['nume', 'profile_picture']
                    }]
                },
                {
                    model: GoodreadsReview,
                    as: 'goodreadsReviews',
                    // MODIFICARE: Mapăm și aici 'text_recenzie' la 'text'
                    attributes: ['id', 'rating','user_name', 'data_recenzie', ['text_recenzie', 'text']],
                    limit: 10
                }
            ]
        });

        if (!book) {
            return res.status(404).json({ message: "Cartea nu a fost găsită." });
        }

        return res.status(200).json({
            message: "Detalii carte preluate cu succes",
            book: book
        });

    } catch (error) {
        console.error("Eroare la preluarea cărții:", error);
        next(error);
    }
};


// Asigură-te că ai Op importat sus: import { Op } from 'sequelize';

export const searchBooks = async (req, res, next) => {
    try {
        // Luăm termenul de căutare din URL (ex: /api/books/search?q=Harry)
        const searchQuery = req.query.q;

        if (!searchQuery) {
            return res.status(400).json({ message: "Te rog introdu un termen de căutare." });
        }

        // Căutăm cărțile al căror titlu conține textul tastat
        const books = await Book.findAll({
            where: {
                titlu: {
                    [Op.like]: `%${searchQuery}%` // Semnul % înseamnă "orice text înainte sau după"
                }
            },
            // Aducem doar detaliile necesare pentru a afișa o listă rapidă (scutim baza de date)
            attributes: ['id', 'titlu', 'autor', 'coperta_url', 'rating_mediu'],
            limit: 10 // Arătăm maxim 10 rezultate ca să nu blocăm ecranul
        });

        return res.status(200).json({
            message: "Căutare finalizată",
            books: books
        });

    } catch (error) {
        console.error("Eroare la căutarea cărților:", error);
        next(error);
    }
};