import { Book, UserBook, User } from '../models/index.js';
import { Op } from 'sequelize';

export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Verificăm interacțiunile (UserBook)
        const userLibraryCount = await UserBook.count({ where: { userId } });

        // 2. LOGICA COLD START (Bazată strict pe genurile alese la început)
        if (userLibraryCount === 0) {
            const user = await User.findByPk(userId);
            
            // Transformăm string-ul "Ficțiune,Mister" în array-ul ["Ficțiune", "Mister"]
            const genresArray = user.genuri_preferate.split(',');

            // Căutăm cărți care conțin în coloana titlu sau descriere oricare din aceste genuri
            const recommendedBooks = await Book.findAll({
                where: {
                    [Op.or]: genresArray.map(genre => ({
                        // Nota: Schimbă 'descriere' cu numele coloanei unde ții genurile în tabela books_goodreads dacă e cazul
                        descriere: { [Op.like]: `%${genre.trim()}%` } 
                    }))
                },
                limit: 20, // Îi dăm o listă mai generoasă la început
                order: [['rating_mediu', 'DESC']] // Sortăm după cele mai bune note
            });

            return res.json({ type: 'cold-start', books: recommendedBooks });
        }

        // 3. LOGICA COLLABORATIVE FILTERING
        // (Vom reveni aici când facem algoritmul bazat pe ce au citit alții)
        return res.json({ type: 'cf-placeholder', books: [] });

    } catch (error) {
        console.error("Eroare recomandări:", error);
        res.status(500).json({ message: "Eroare server" });
    }
};