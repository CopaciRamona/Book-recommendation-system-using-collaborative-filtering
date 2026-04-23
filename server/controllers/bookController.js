import { Book, UserBook, User, Review, GoodreadsReview } from '../models/index.js';
import { Op } from 'sequelize';

export const getBookById = async (req, res, next) => {
    try {
        const bookId = req.params.id; 
        const book = await Book.findByPk(bookId);

        if (!book) {
            return res.status(404).json({ message: "Cartea nu a fost găsită." });
        }

        const [appReviews, goodreadsReviews] = await Promise.all([
            Review.findAll({
                where: { bookId: bookId }, 
                attributes: ['id', 'rating', ['text_recenzie', 'text'], 'createdAt'],
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['nume', 'profile_picture']
                }],
                order: [['createdAt', 'DESC']],
                limit: 15
            }),
            GoodreadsReview.findAll({
                where: { book_id_original: book.book_id_original },
                attributes: ['id', 'rating', 'user_name', 'data_recenzie', ['text_recenzie', 'text']],
                order: [['data_recenzie', 'DESC']],
                limit: 10
            })
        ]);

        const bookWithDetails = {
            ...book.toJSON(),
            appReviews: appReviews,
            goodreadsReviews: goodreadsReviews
        };

        return res.status(200).json({
            message: "Detalii carte preluate cu succes",
            book: bookWithDetails
        });

    } catch (error) {
        console.error("Eroare la preluarea cărții:", error);
        next(error);
    }
};


export const searchBooks = async (req, res, next) => {
    try {
        const searchQuery = req.query.q;

        if (!searchQuery) {
            return res.status(400).json({ message: "Te rog introdu un termen de căutare." });
        }

        const books = await Book.findAll({
            where: {
                [Op.or]: [
                    { titlu: { [Op.like]: `%${searchQuery}%` } },
                    { autor: { [Op.like]: `%${searchQuery}%` } }
                ]
            },
            attributes: ['id', 'titlu', 'autor', 'coperta_url', 'rating_mediu', 'book_id_original'],
            limit: 15
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

export const getDiscoverBooks = async (req, res, next) => {
    try {
        const categoriiPrincipale = ['Romance', 'Fantasy', 'Science Fiction', 'Thriller', 'Historical Fiction', 'Young Adult'];
        const discoverData = [];

        for (const gen of categoriiPrincipale) {
            const books = await Book.findAll({
                where: { genuri: { [Op.like]: `%${gen}%` } },
                limit: 10,
                // FILTRUL SUPREM: Sortăm mai întâi după popularitate (număr de recenzii real), apoi după nota medie
                order: [
                    [Book.sequelize.literal('CAST(numar_voturi AS UNSIGNED)'), 'DESC'],
                    ['rating_mediu', 'DESC']
                ]
            });

            if (books.length > 0) {
                discoverData.push({
                    titlu_categorie: gen,
                    carti: books
                });
            }
        }

        return res.status(200).json(discoverData);

    } catch (error) {
        console.error("Eroare la Discover:", error);
        next(error);
    }
};

export const getBooksByGenre = async (req, res, next) => {
    try {
        const { genreName } = req.params;
        
        const books = await Book.findAll({
            where: { genuri: { [Op.like]: `%${genreName}%` } },
            limit: 200,
            // ACELAȘI FILTRU: Ca să nu primești prostii nici pe pagina mare de categorie
            order: [
                [Book.sequelize.literal('CAST(numar_voturi AS UNSIGNED)'), 'DESC'],
                ['rating_mediu', 'DESC']
            ]
        });

        return res.status(200).json(books);
    } catch (error) {
        console.error("Eroare la aducerea cărților pe gen:", error);
        next(error);
    }
};