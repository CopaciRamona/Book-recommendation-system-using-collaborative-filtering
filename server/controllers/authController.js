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
                profile_picture: newUser.profile_picture,
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
                profile_picture: user.profile_picture,
                isProfileComplete: isProfileComplete 
            }
        });

    }catch(error){
        console.error("Eroare la logare",error);
        next(error);
    }
};

