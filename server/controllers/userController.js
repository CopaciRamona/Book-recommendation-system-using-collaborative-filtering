import { User, Book, Review, UserBook } from '../models/index.js';

export const getUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.id; 

        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }, 
            include: [
                {
                    model: Book,
                    as: 'myLibrary', 
                    through: { 
                        attributes: ['status', 'pagina_curenta', 'createdAt', 'updatedAt'] 
                    },
                    attributes: ['id', 'titlu', 'autor', 'coperta_url'] 
                },
                {
                    model: Review,
                    as: 'myReviews', 
                    include: [{
                        model: Book,
                        as: 'book',
                        attributes: ['id', 'titlu', 'autor', 'coperta_url']
                    }],
                    order: [['createdAt', 'DESC']]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
        }

        return res.status(200).json({
            message: "Profil și activitate încărcate cu succes",
            profile: user
        });

    } catch (error) {
        console.log("EROARE SERVER DETALIATĂ:", error.message);
        console.log("SQL ERROR:", error.sql);
        console.error("Eroare la încărcarea profilului:", error);
        next(error);
    }
};

export const updateUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { nume, varsta, sex, genuri, location, birthday, reading_goal } = req.body;

        const user = await User.findByPk(userId);
        if(!user){
            return res.status(404).json({ message: 'Utilizator negasit!'});
        }

        const genuriString = Array.isArray(genuri) ? genuri.join(',') : genuri;
        
        if (nume) user.nume = nume;
        if (reading_goal) user.reading_goal = parseInt(reading_goal, 10);
        
        user.varsta = varsta || user.varsta;
        user.sex = sex || user.sex;
        user.genuri_preferate = genuriString || user.genuri_preferate;
        user.location = location || user.location;
        user.birthday = birthday || user.birthday;

        if (req.file) {
            user.profile_picture = `/uploads/${req.file.filename}`;
        }

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
                reading_goal: user.reading_goal,
                isProfileComplete: user.isProfileComplete
            }
        });

    } catch(error){
        console.error("Eroare la completarea profilului!", error);
        next(error);
    }
}