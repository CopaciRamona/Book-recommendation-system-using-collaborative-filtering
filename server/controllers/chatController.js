import { Book } from '../models/index.js';
import { detecteazaEmotiaCuPython } from '../utils/pythonHelper.js';
import { Op, Sequelize } from 'sequelize';

export const handleChat = async (req, res) => {
    try {
        const { mesaj, emotie, actiune, book_id, carti_excluse = [] } = req.body;

        // SCENARIUL 1: Utilizatorul vrea detalii despre o carte specifică
        if (actiune === 'detalii' && book_id) {
            const carte = await Book.findOne({ where: { id: book_id } });
            if (carte) {
                const descriere = carte.descriere ? `"${carte.descriere}"` : "Description not available.";
                const mesajFormatat = `✨ Here are more details:\n\n📕 **Title:** ${carte.titlu}\n✍️ **Author:** ${carte.autor}\n⭐ **Rating:** ${carte.rating_mediu} / 5\n📖 **Summary:**\n*${descriere}*\n\nWant to explore other options? 👇`;
                return res.status(200).json({ raspunsBot: mesajFormatat, carti: [], arataButoane: true });
            }
            return res.status(200).json({ raspunsBot: "🤔 **Book not found.**", carti: [], arataButoane: true });
        }

        // =========================================================
        // SCENARIUL 2: Căutare după mesaj liber sau buton
        // =========================================================
        let emotieCautata = emotie; 
        let includeGenres = [];
        let excludeGenres = [];
        let keywords = [];

        // Dacă nu a apăsat pe buton, ci a scris text:
        if (!emotieCautata && mesaj) {
            const nlpContext = await detecteazaEmotiaCuPython(mesaj);
            
            console.log("-> [DEBUG] Răspuns brut de la Python:", nlpContext);

            // Preluăm emoția de la Python și o curățăm
            emotieCautata = nlpContext.emotion ? nlpContext.emotion.trim().toLowerCase() : "null";
            
            includeGenres = nlpContext.include_genres || [];
            excludeGenres = nlpContext.exclude_genres || [];
            keywords = nlpContext.keywords || []; 
        }

        // Lista de emoții acceptate de baza ta de date
        const emotiiValide = ['joy', 'sadness', 'fear', 'anger', 'anticipation', 'surprise', 'trust', 'disgust'];
        
        // Dacă Python a dat null sau o emoție inventată, îi cerem userului să aleagă un buton
        if (!emotieCautata || emotieCautata === "null" || !emotiiValide.includes(emotieCautata)) {
            return res.status(200).json({
                raspunsBot: "🤔 **I couldn't quite figure out the mood.**\n\nChoose one of the options below so I can help you better:",
                carti: [], 
                arataButoane: true
            });
        }

        // --- CONSTRUIM INTEROGAREA SMART (SEQUELIZE) ---
        let whereClause = {
            emotie_dominanta: emotieCautata,
            rating_mediu: { [Op.gte]: 3.9 } // Doar cărți bune
        };

        // Memorie: nu îi arătăm ce a văzut deja
        if (carti_excluse && carti_excluse.length > 0) {
            whereClause.id = { [Op.notIn]: carti_excluse };
        }

        let conditionsAnd = [];

        // Filtru: Excludem genurile cerute
        if (excludeGenres.length > 0) {
            excludeGenres.forEach(g => {
                conditionsAnd.push({ genuri: { [Op.notLike]: `%${g}%` } });
            });
        }

        let matchConditions = [];
        
        // Filtru: Căutăm genurile incluse
        if (includeGenres.length > 0) {
            includeGenres.forEach(g => {
                matchConditions.push({ genuri: { [Op.like]: `%${g}%` } });
            });
        }

        // Filtru: Căutăm cuvinte cheie în genuri sau descriere
        if (keywords.length > 0) {
            keywords.forEach(kw => {
                matchConditions.push({ genuri: { [Op.like]: `%${kw}%` } });
                matchConditions.push({ descriere: { [Op.like]: `%${kw}%` } });
            });
        }

        // Aplicăm filtrele flexibile (OR)
        if (matchConditions.length > 0) {
            conditionsAnd.push({ [Op.or]: matchConditions });
        }

        // Lipim totul în clauza WHERE
        if (conditionsAnd.length > 0) {
            whereClause[Op.and] = conditionsAnd;
        }

        // Executăm interogarea (Aducem top 15)
        const cartiDeElita = await Book.findAll({
            where: whereClause,
            order: [
                [Book.sequelize.literal('CAST(numar_voturi AS UNSIGNED)'), 'DESC'],
                ['rating_mediu', 'DESC']
            ], 
            limit: 15
        });

        // Amestecăm și extragem 3 cărți la întâmplare
        const cartiGasite = cartiDeElita.sort(() => 0.5 - Math.random()).slice(0, 3);

        const traducereEmotie = {
            'joy': 'joyful or romantic', 'sadness': 'heartfelt', 'fear': 'horror', 'anger': 'intense',
            'anticipation': 'suspenseful', 'surprise': 'surprising', 'trust': 'inspirational', 'disgust': 'provocative'
        };

        const raspunsText = actiune === 'refresh' 
            ? "I searched deeper in the library.\n\nHere are 3 other options:" 
            : `🎉 **Understood perfectly!**\n\nHere are 3 top recommendations for a *${traducereEmotie[emotieCautata] || 'fitting'}* read.\n\nClick on **View Details** under a book for more info! 👇`;

        return res.status(200).json({
            raspunsBot: raspunsText,
            carti: cartiGasite, 
            arataButoane: true, 
            emotieCurenta: emotieCautata 
        });

    } catch (error) {
        console.error("[ChatController] Eroare:", error);
        return res.status(500).json({ raspunsBot: "⚠️ **An error occurred.**\nPlease try again!", carti: [], arataButoane: true });
    }
};