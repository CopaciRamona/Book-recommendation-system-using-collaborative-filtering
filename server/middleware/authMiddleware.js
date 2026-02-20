import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const protect = async (req, res, next) => {

    let token;
    if (

        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')

    ){
        try {

        token=req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user=decoded;
        return next();

        } catch(error){
            console.error(error);
            return res.status(401).json({message: 'Token invalid, acces interzis.'});
        }
    }

    if(!token){
        return res.status(401).json({message:'Nu esti autentificat, lipseste token-ul!'});
    }

}