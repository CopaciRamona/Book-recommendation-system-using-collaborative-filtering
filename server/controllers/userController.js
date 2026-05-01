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

// Șterge un utilizator
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevenim adminul să se șteargă pe sine însuși din greșeală
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: "Nu îți poți șterge propriul cont de admin!" });
        }

        const userToDelete = await User.findByPk(id);
        if (!userToDelete) {
            return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
        }

        await userToDelete.destroy();
        res.status(200).json({ message: "Utilizator șters cu succes." });
    } catch (error) {
        console.error("Eroare la ștergerea utilizatorului:", error);
        res.status(500).json({ message: "Eroare la server." });
    }
};

// 1. Obține toți utilizatorii (cu toate datele lor)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            // Am adăugat toate câmpurile din poza ta
            attributes: ['id', 'nume', 'email', 'role', 'varsta', 'sex', 'genuri_preferate', 'location', 'birthday', 'reading_goal'], 
            order: [['id', 'ASC']]
        });
        res.status(200).json(users);
    } catch (error) {
        console.error("Eroare la obținerea utilizatorilor:", error);
        res.status(500).json({ message: "Eroare la server." });
    }
};

// 2. Update pe orice câmp
export const updateUserAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        // Extragem TOATE câmpurile posibile din cerere
        const { nume, email, role, varsta, sex, genuri_preferate, location, birthday, reading_goal } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
        }

        // Actualizăm câmpurile (doar dacă au fost trimise)
        if (nume !== undefined) user.nume = nume;
        if (email !== undefined) user.email = email;
        if (role !== undefined) user.role = role;
        if (varsta !== undefined) user.varsta = varsta === '' ? null : varsta; 
        if (sex !== undefined) user.sex = sex;
        if (genuri_preferate !== undefined) user.genuri_preferate = genuri_preferate;
        if (location !== undefined) user.location = location;
        if (birthday !== undefined) user.birthday = birthday === '' ? null : birthday;
        if (reading_goal !== undefined) user.reading_goal = reading_goal === '' ? null : reading_goal;

        await user.save();

        res.status(200).json({ message: "Profil actualizat cu succes!", user });
    } catch (error) {
        console.error("Eroare la update admin:", error);
        res.status(500).json({ message: "Eroare la server." });
    }
};