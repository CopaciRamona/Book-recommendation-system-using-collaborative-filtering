import { UserBook, Book, User } from '../models/index.js';

// Funcție pentru a aduce cărțile pe baza statusului (raftului)
export const getLibraryByStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Extragem statusul din URL (ex: dacă ruta e /api/library/read, statusul va fi 'read')
        const requestedStatus = req.params.status; 

        // 1. Măsură de siguranță: verificăm dacă statusul cerut este valid
        const validStatuses = ['want_to_read', 'reading', 'read'];
        if (!validStatuses.includes(requestedStatus)) {
            return res.status(400).json({ message: "Status invalid. Folosește: want_to_read, reading sau read." });
        }

        // 2. CĂUTAREA MAGICĂ: 
        // Aducem Utilizatorul și includem ('join') modelul Book DOAR dacă statusul din UserBook se potrivește
        const user = await User.findByPk(userId, {
            include: [{
                model: Book,
                as: 'myLibrary', // Folosim EXACT alias-ul pe care l-ai pus în index.js
                through: {
                    where: { status: requestedStatus }, // Aici e filtrul! Aducem doar cărțile de pe acest 'raft'
                    attributes: ['status', 'rating', 'createdAt'] // Vrem să vedem și când a adăugat-o sau ce notă i-a dat
                }
            }]
        });

        if (!user) {
            return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
        }

        // 3. Trimitem array-ul de cărți către Frontend
        // Dacă nu are nicio carte pe acel raft, Sequelize va returna un array gol [], ceea ce e perfect.
        return res.status(200).json({
            message: `Cărțile din categoria '${requestedStatus}' au fost preluate.`,
            books: user.myLibrary 
        });

    } catch (error) {
        console.error("Eroare la preluarea bibliotecii:", error);
        next(error);
    }
};

// Funcție pentru a adăuga o carte sau a-i schimba statusul
export const updateBookStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // NOU: Am adăugat 'rating' în lista de date extrase
        const { bookId, status, rating, data_incepere, data_terminare } = req.body; 

        if (!bookId || !status) {
            return res.status(400).json({ message: "Te rog să trimiți bookId și status." });
        }

        const validStatuses = ['want_to_read', 'reading', 'read'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Status invalid." });
        }

        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({ message: "Cartea nu a fost găsită." });
        }

        let userBook = await UserBook.findOne({
            where: { userId: userId, bookId: bookId }
        });

        if (userBook) {
            // ACTUALIZĂM CARTEA EXISTENTĂ
            userBook.status = status;
            
            // NOU: Dacă am primit o notă nouă de la React, o salvăm!
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
            return res.status(200).json({ message: "Status și date actualizate!", userBook });

        } else {
            // CREĂM CARTEA NOUĂ ÎN BIBLIOTECĂ
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
                rating: rating || null, // NOU: Salvăm nota la creare
                data_incepere: autoDataIncepere,
                data_terminare: autoDataTerminare
            });
            
            return res.status(201).json({ message: "Cartea a fost adăugată!", userBook });
        }
    } catch (error) {
        console.error("Eroare la actualizarea statusului:", error);
        next(error);
    }
};

//Functie pentru modificarea progresului unei carti care e in starea de reading
export const updateReadingProgress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { bookId, pagina_curenta } = req.body; // Trimise de React

        if (!bookId || pagina_curenta === undefined) {
            return res.status(400).json({ message: "Te rog trimite ID-ul cărții și pagina curentă." });
        }

        // 1. Căutăm legătura dintre user și carte în biblioteca lui
        let userBook = await UserBook.findOne({
            where: { userId: userId, bookId: bookId }
        });

        if (!userBook) {
            return res.status(404).json({ message: "Cartea nu este în biblioteca ta." });
        }

        // 2. Aducem detaliile cărții ca să știm numărul total de pagini
        const book = await Book.findByPk(bookId);
        
        const paginiIntroduse = parseInt(pagina_curenta, 10);
        // Atenție: dacă în baza ta de date coloana se numește altfel (ex: "pages"), schimbă "numar_pagini" de mai jos!
        const totalPagini = book && book.numar_pagini ? parseInt(book.numar_pagini, 10) : null; 

        // 3. Nu îl lăsăm să bage mai multe pagini decât are cartea (ex: 500 din 300)
        if (totalPagini && paginiIntroduse > totalPagini) {
            userBook.pagina_curenta = totalPagini;
        } else {
            userBook.pagina_curenta = paginiIntroduse;
        }

        // Salvăm noua pagină în baza de date
        await userBook.save();

        // 4. Calculăm procentajul pentru bara ta din React
        let procentaj = 0;
        if (totalPagini && totalPagini > 0) {
            procentaj = Math.round((userBook.pagina_curenta / totalPagini) * 100);
        }

        return res.status(200).json({
            message: "Progres actualizat cu succes!",
            userBook: userBook,
            procentaj: procentaj // Îl trimitem gata calculat! (ex: 45)
        });

    } catch (error) {
        console.error("Eroare la actualizarea progresului:", error);
        next(error);
    }
};

// 2. FUNCȚIA DE ȘTERGERE COMPLETĂ (Scoate cartea de pe orice raft)
export const removeBookFromLibrary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const bookId = req.params.bookId;

        const deletedCount = await UserBook.destroy({
            where: { userId: userId, bookId: bookId }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ message: "Cartea nu era în biblioteca ta." });
        }

        return res.status(200).json({ message: "Cartea a fost ștearsă din biblioteca ta." });

    } catch (error) {
        console.error("Eroare la ștergerea cărții:", error);
        next(error);
    }
};

// 1. FUNCȚIA DE VERIFICARE (Aflăm statusul curent pentru o singură carte)
export const checkBookInLibrary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const bookId = req.params.bookId;

        const userBook = await UserBook.findOne({
            where: { userId: userId, bookId: bookId }
        });

        // Dacă nu o are în listă, returnăm un mesaj clar, ca React-ul să știe
        if (!userBook) {
            return res.status(200).json({ inLibrary: false });
        }

        // Dacă o are, returnăm exact datele (status, pagina_curenta, is_liked)
        return res.status(200).json({
            inLibrary: true,
            userBook: userBook
        });

    } catch (error) {
        console.error("Eroare la verificarea cărții:", error);
        next(error);
    }
};