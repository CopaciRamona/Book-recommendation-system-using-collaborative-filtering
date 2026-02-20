import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


// Inregistrare
export const registerUser = async (req, res, next) => {
    try {
        const { email, password, nume } = req.body;
        if (!email || !password || !nume) {
            return res.status(400).json({ message: "Toate câmpurile sunt obligatorii!" });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({message: 'Acest mail este deja folosit.'});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            email,
            password: hashedPassword,
            nume
        });

        const token = jwt.sign(
            { id: newUser.id, email:newUser.email },
            process.env.JWT_SECRET || 'parola_secreta_temporara',
            { expiresIn: '24h' }
        );

        return res.status(201).json({
            message: "Cont creat cu succes!Urmeaza completarea profilului.",
            token,
            user:{
                id: newUser.id,
                email: newUser.email,
                nume: newUser.nume,
                isProfileComplete: false
            }
        });

        
    } catch(error){
        console.error("Eroare la inregistare!",error);
        next(error);

    }
};

// Logare
export const loginUser = async (req, res, next) => {

    try{
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email }});
        if(!user){
            return res.status(400).json({message: "Email sau parola incorecta"});
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if(!validPassword) {
            return res.status(400).json({ message: "Email sau parola incorecta."});
        }
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'parola_secreta_temporara',
            { expiresIn: '24h' }
        );

        const isProfileComplete = user.genuri_preferate !== null && user.genuri_preferate !== '';

        return res.status(200).json({
            message: "Te-ai logat cu succes!",
            token, 
            user: {
                id: user.id,
                nume: user.nume,
                email: user.email,
                isProfileComplete: isProfileComplete 
            }
        });

    }catch(error){
        console.error("Eroare la logare",error);
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {

    try {

        const userId = req.user.id;
        const { varsta, sex, genuri, location, birthday } = req.body;

        const user = await User.findByPk(userId);
        if(!user){
            return res.status(404).json({ message: 'Utilizator negasit!'});
        }

        const genuriString = Array.isArray(genuri) ? genuri.join(',') : genuri;
        user.varsta = varsta || user.varsta;
        user.sex = sex || user.sex;
        user.genuri_preferate = genuriString || user.genuri_preferate;
        user.location = location || user.location;
        user.birthday = birthday || user.birthday;

        if (req.file) {
            // Salvăm calea către poză în baza de date (ex: 'uploads/12345678-poza.jpg')
            // Această cale va fi folosită de React pentru a afișa imaginea mai târziu
            user.profile_picture = `/uploads/${req.file.filename}`;
        }

        await user.save();

        return res.status(200).json({
            message: "Profil completat cu succes!",
            user:{
                id: user.id,
                nume: user.nume,
                varsta: user.varsta,
                sex: user.sex,
                profile_picture: user.profile_picture,
                isProfileComplete: true
            }
        })

    } catch(error){
        console.error("Eroare la completarea profilului!", error);
        next(error);
    }
}