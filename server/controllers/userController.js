import { User, Book, Review, UserBook } from '../models/index.js';

/**
 * @desc    Obține datele profilului utilizatorului curent + Activitatea (Cărți & Recenzii)
 * @route   GET /api/users/profile
 * @access  Private (necesită token)
 */
export const getUserProfile = async (req, res, next) => {
    try {
        // ID-ul vine din middleware-ul 'protect' care decodează token-ul
        const userId = req.user.id; 

        // Extragem utilizatorul din baza de date
        const user = await User.findByPk(userId, {
            // SUPER IMPORTANT: Nu trimitem parola hash-uită către frontend!
            attributes: { exclude: ['password'] }, 
            
            // Aducem absolut tot ce ține de acest utilizator
            include: [
                {
                    // 1. BIBLIOTECA LUI (PENTRU RAFTURI ȘI ACTIVITATE)
                    model: Book,
                    as: 'myLibrary', // Alias-ul din models/index.js
                    through: { 
                        // Din tabelul de legătură vrem să știm unde a pus cartea (status),
                        // dacă i-a dat like, și CÂND a făcut asta (createdAt/updatedAt)
                        attributes: ['status', 'is_liked', 'createdAt', 'updatedAt'] 
                    },
                    // Aducem doar detaliile esențiale ale cărții pentru a nu îngreuna răspunsul
                    attributes: ['id', 'titlu', 'autor', 'coperta_url'] 
                },
                {
                    // 2. RECENZIILE LUI (PENTRU ACTIVITATE)
                    model: Review,
                    as: 'myReviews', // Alias-ul din models/index.js
                    include: [{
                        model: Book,
                        as: 'book',
                        // Aducem și detaliile cărții la care a dat recenzia, ca să îi afișăm coperta
                        attributes: ['id', 'titlu', 'autor', 'coperta_url']
                    }],
                    // Le ordonăm de la cea mai nouă la cea mai veche
                    order: [['createdAt', 'DESC']]
                }
            ]
        });

        // Verificăm dacă utilizatorul chiar există
        if (!user) {
            return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
        }

        // Returnăm JSON-ul uriaș către React
        return res.status(200).json({
            message: "Profil și activitate încărcate cu succes",
            profile: user
        });

    } catch (error) {
        console.error("Eroare la încărcarea profilului:", error);
        next(error);
    }
};

export const updateUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { varsta, sex, genuri, location, birthday } = req.body;

        const user = await User.findByPk(userId);
        if(!user){
            return res.status(404).json({ message: 'Utilizator negasit!'});
        }

        // Foarte inteligentă abordarea asta pentru array!
        const genuriString = Array.isArray(genuri) ? genuri.join(',') : genuri;
        
        user.varsta = varsta || user.varsta;
        user.sex = sex || user.sex;
        user.genuri_preferate = genuriString || user.genuri_preferate;
        user.location = location || user.location;
        user.birthday = birthday || user.birthday;

        if (req.file) {
            user.profile_picture = `/uploads/${req.file.filename}`;
        }

        // ---> ADAUGĂ LINIA ASTA <---
        // Salvăm și în baza de date faptul că a terminat onboarding-ul!
        user.isProfileComplete = true; 

        await user.save();

        return res.status(200).json({
            message: "Profil completat cu succes!",
            user: {
                id: user.id,
                nume: user.nume,
                varsta: user.varsta,
                sex: user.sex,
                profile_picture: user.profile_picture,
                isProfileComplete: user.isProfileComplete // Acum e luat direct din DB
            }
        });

    } catch(error){
        console.error("Eroare la completarea profilului!", error);
        next(error);
    }
}