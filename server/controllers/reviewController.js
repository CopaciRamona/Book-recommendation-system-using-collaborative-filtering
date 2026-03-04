import { Review, Book } from '../models/index.js';

export const addReview = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // 1. Schimbăm 'comment' în 'text_recenzie' aici
        const { bookId, rating, text_recenzie } = req.body; 

        if (!bookId || !rating) {
            return res.status(400).json({ message: "Cartea și nota sunt obligatorii!" });
        }

        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({ message: "Cartea nu există." });
        }

        const existingReview = await Review.findOne({ where: { userId, bookId } });
        let oldRating = null;

        if (existingReview) {
            oldRating = existingReview.rating; 
            existingReview.rating = rating;
            // 2. Actualizăm coloana corectă
            existingReview.text_recenzie = text_recenzie; 
            await existingReview.save();
        } else {
            // 3. Creăm folosind numele corect de coloană
            await Review.create({ userId, bookId, rating, text_recenzie });
        }

        // --- PARTEA DE LOGICĂ PENTRU DISTRIBUȚIE (Rămâne neschimbată, e ok) ---
        let distStr = book.rating_distributie || "{'5': '0', '4': '0', '3': '0', '2': '0', '1': '0'}";
        let validJsonStr = distStr.replace(/'/g, '"');
        let distObj = JSON.parse(validJsonStr);

        const parseVotes = (str) => parseInt(String(str).replace(/,/g, ''), 10) || 0;

        if (oldRating) {
            const oldStarKey = String(oldRating);
            let currentOldVotes = parseVotes(distObj[oldStarKey]);
            distObj[oldStarKey] = Math.max(0, currentOldVotes - 1).toLocaleString('en-US'); 
        }

        const newStarKey = String(rating);
        let currentNewVotes = parseVotes(distObj[newStarKey]);
        distObj[newStarKey] = (currentNewVotes + 1).toLocaleString('en-US');

        let totalVotes = 0;
        let totalScore = 0;

        for (let i = 1; i <= 5; i++) {
            let count = parseVotes(distObj[i]);
            totalVotes += count;
            totalScore += (count * i);
        }

        let newAverage = totalVotes === 0 ? "0.00" : (totalScore / totalVotes).toFixed(2);

        // --- SALVARE STATISTICI CARTE ---
        book.rating_distributie = JSON.stringify(distObj).replace(/"/g, "'");
        book.rating_mediu = String(newAverage);
        
        if (book.numar_voturi !== undefined) {
            book.numar_voturi = String(totalVotes);
        }

        await book.save();

        return res.status(200).json({ 
            message: "Recenzie salvată și absolut toate statisticile au fost sincronizate!",
            nouaMedie: book.rating_mediu,
            totalVoturi: book.numar_voturi,
            nouaDistributie: book.rating_distributie
        });

    } catch (error) {
        console.error("Eroare la adăugarea recenziei:", error);
        next(error);
    }
};

// 2. RECENZIILE UTILIZATORULUI LOGAT
export const getMyReviews = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const reviews = await Review.findAll({
            where: { userId },
            include: [{ 
                model: Book, 
                // AICI ERA PROBLEMA: Trebuie să pui exact alias-ul din index.js
                as: 'book', 
                attributes: ['id', 'titlu', 'coperta_url', 'autor'] 
            }],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(reviews);
    } catch (error) {
        // Dacă eroarea persistă, trimitem eroarea la middleware-ul de error handling
        next(error); 
    }
};

export const updateReview = async (req, res, next) => {
try {
    const userId = req.user.id;
    const { id } = req.params; // ID-ul recenziei
    const { rating, text_recenzie } = req.body;

    const review = await Review.findOne({ where: { id, userId } });
    if (!review) {
        return res.status(404).json({ message: "Recenzia nu a fost găsită." });
    }

    const book = await Book.findByPk(review.bookId);
    const oldRating = review.rating;

    // 1. Actualizăm datele recenziei
    review.rating = rating || review.rating;
    review.text_recenzie = text_recenzie || review.text_recenzie;
    await review.save();

    // 2. Dacă nota s-a schimbat, recalculăm distribuția cărții
    if (rating && rating !== oldRating) {
        let distObj = JSON.parse(book.rating_distributie.replace(/'/g, '"'));
        const parseVotes = (str) => parseInt(String(str).replace(/,/g, ''), 10) || 0;

        // Scădem nota veche
        const oldKey = String(oldRating);
        distObj[oldKey] = Math.max(0, parseVotes(distObj[oldKey]) - 1).toLocaleString('en-US');

        // Adăugăm nota nouă
        const newKey = String(rating);
        distObj[newKey] = (parseVotes(distObj[newKey]) + 1).toLocaleString('en-US');

        // Recalculăm media generală
        let totalVotes = 0;
        let totalScore = 0;
        for (let i = 1; i <= 5; i++) {
            let count = parseVotes(distObj[i]);
            totalVotes += count;
            totalScore += (count * i);
        }

        book.rating_distributie = JSON.stringify(distObj).replace(/"/g, "'");
        book.rating_mediu = totalVotes === 0 ? "0.00" : (totalScore / totalVotes).toFixed(2);
        await book.save();
    }

    return res.status(200).json({ message: "Recenzie actualizată!", review, nouaMedie: book.rating_mediu });
} catch (error) {
    next(error);
}
};

// 1. ȘTERGERE RECENZIE (cu recalculare statistici)
export const deleteReview = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params; // ID-ul recenziei

        const review = await Review.findOne({ where: { id, userId } });
        if (!review) {
            return res.status(404).json({ message: "Recenzia nu a fost găsită sau nu îți aparține." });
        }

        const bookId = review.bookId;
        const ratingDeSters = review.rating;

        // Ștergem recenzia
        await review.destroy();

        // RECALCULĂM STATISTICILE CĂRȚII
        const book = await Book.findByPk(bookId);
        if (book) {
            let distStr = book.rating_distributie || "{'5': '0', '4': '0', '3': '0', '2': '0', '1': '0'}";
            let distObj = JSON.parse(distStr.replace(/'/g, '"'));
            
            const parseVotes = (str) => parseInt(String(str).replace(/,/g, ''), 10) || 0;

            // Scădem votul din distribuție
            const starKey = String(ratingDeSters);
            let currentVotes = parseVotes(distObj[starKey]);
            distObj[starKey] = Math.max(0, currentVotes - 1).toLocaleString('en-US');

            // Recalculăm media
            let totalVotes = 0;
            let totalScore = 0;
            for (let i = 1; i <= 5; i++) {
                let count = parseVotes(distObj[i]);
                totalVotes += count;
                totalScore += (count * i);
            }

            book.rating_distributie = JSON.stringify(distObj).replace(/"/g, "'");
            book.rating_mediu = totalVotes === 0 ? "0.00" : (totalScore / totalVotes).toFixed(2);
            if (book.numar_voturi !== undefined) book.numar_voturi = String(totalVotes);

            await book.save();
        }

        return res.status(200).json({ message: "Recenzia a fost ștearsă." });
    } catch (error) {
        next(error);
    }
};

// pentru pescuirea recenziei
export const checkUserReview = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { bookId } = req.params

        const review = await Review.findOne({ where: { userId, bookId } });

        if (review) {
            return res.status(200).json({ hasReviewed: true, review });
        }
        
        return res.status(200).json({ hasReviewed: false });
    } catch (error) {
        next(error);
    }
};