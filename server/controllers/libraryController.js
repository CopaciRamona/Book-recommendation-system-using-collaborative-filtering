import { UserBook, Book, User } from '../models/index.js';
import { generateAndSaveRecommendations } from '../utils/aiGenerator.js';


export const getLibraryByStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const requestedStatus = req.params.status; 
        const validStatuses = ['want_to_read', 'reading', 'read'];

        if (!validStatuses.includes(requestedStatus)) {
            return res.status(400).json({ message: "Invalid status. Use: want_to_read, reading, or read." });
        }

    
        const user = await User.findByPk(userId, {
            include: [{
                model: Book,
                as: 'myLibrary', 
                through: {
                    where: { status: requestedStatus }, 
                    attributes: ['status', 'rating', 'createdAt','pagina_curenta'] 
                }
            }]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json({
            message: `Books from category '${requestedStatus}' retrieved successfully.`,
            books: user.myLibrary 
        });

    } catch (error) {
        console.error("Error fetching library:", error);
        next(error);
    }
};

export const updateReadingProgress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { bookId, pagina_curenta } = req.body; 

        if (!bookId || pagina_curenta === undefined) {
            return res.status(400).json({ message: "Please provide the book ID and current page." });
        }

        let userBook = await UserBook.findOne({
            where: { userId: userId, bookId: bookId }
        });

        if (!userBook) {
            return res.status(404).json({ message: "The book is not in your library." });
        }

        const book = await Book.findByPk(bookId);
        const paginiIntroduse = parseInt(pagina_curenta, 10);
        const totalPagini = book && book.numar_pagini ? parseInt(book.numar_pagini, 10) : null; 


        if (totalPagini && paginiIntroduse > totalPagini) {
            userBook.pagina_curenta = totalPagini;
        } else {
            userBook.pagina_curenta = paginiIntroduse;
        }

        await userBook.save();

        let procentaj = 0;
        if (totalPagini && totalPagini > 0) {
            procentaj = Math.round((userBook.pagina_curenta / totalPagini) * 100);
        }

        return res.status(200).json({
            message: "Progress updated successfully!",
            userBook: userBook,
            procentaj: procentaj 
        });

    } catch (error) {
        console.error("Error updating progress:", error);
        next(error);
    }
};


export const checkBookInLibrary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const bookId = req.params.bookId;

        const userBook = await UserBook.findOne({
            where: { userId: userId, bookId: bookId }
        });

        if (!userBook) {
            return res.status(200).json({ inLibrary: false });
        }

        return res.status(200).json({
            inLibrary: true,
            userBook: userBook
        });

    } catch (error) {
        console.error("Error checking book:", error);
        next(error);
    }
};

export const updateBookStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { bookId, status, rating, data_incepere, data_terminare } = req.body; 

        if (!bookId || !status) {
            return res.status(400).json({ message: "Please provide bookId and status." });
        }

        const validStatuses = ['want_to_read', 'reading', 'read'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({ message: "Book not found." });
        }

        let userBook = await UserBook.findOne({
            where: { userId: userId, bookId: bookId }
        });

        if (userBook) {
            userBook.status = status;
            
            if (rating !== undefined) {
                userBook.rating = rating;
            }

            if (data_incepere) userBook.data_incepere = data_incepere;
            if (data_terminare) userBook.data_terminare = data_terminare;

            if (status === 'reading' && !userBook.data_incepere) {
                userBook.data_incepere = new Date().toISOString().split('T')[0];
            }
            if (status === 'read' && !userBook.data_terminare && !data_terminare) {
                userBook.data_terminare = new Date().toISOString().split('T')[0];
            }

            await userBook.save();
    
            return res.status(200).json({ message: "Status and data updated!", userBook });

        } else {
            let autoDataIncepere = data_incepere || null;
            let autoDataTerminare = data_terminare || null;

            if (status === 'reading' && !autoDataIncepere) {
                autoDataIncepere = new Date().toISOString().split('T')[0];
            }
            if (status === 'read' && !autoDataTerminare) {
                autoDataTerminare = new Date().toISOString().split('T')[0];
            }

            userBook = await UserBook.create({
                userId: userId,
                bookId: bookId,
                status: status,
                rating: rating || null,
                data_incepere: autoDataIncepere,
                data_terminare: autoDataTerminare
            });
    
            await generateAndSaveRecommendations(userId);
            
            return res.status(201).json({ message: "Book added successfully!", userBook });
        }
    } catch (error) {
        console.error("Error updating status:", error);
        next(error);
    }
};

export const removeBookFromLibrary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const bookId = req.params.bookId;

        const deletedCount = await UserBook.destroy({
            where: { userId: userId, bookId: bookId }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ message: "The book was not in your library." });
        }
        
        await generateAndSaveRecommendations(userId);

        return res.status(200).json({ message: "The book has been removed from your library." });

    } catch (error) {
        console.error("Error removing book:", error);
        next(error);
    }
};

