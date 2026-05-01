import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import { User, Recommendation, Book } from '../models/index.js';

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
    }
});

export const trimiteReangajare = async (req, res) => {

    try {
        console.log('[Email] Caut utilizatori inactivi...');

        const acum14Zile = new Date();
        acum14Zile.setDate(acum14Zile.getDate() - 14);

        const utilizatoriInactivi = await User.findAll({
            where: { updatedAt: { [Op.lte]: acum14Zile } }
        });

        if (utilizatoriInactivi.length === 0) {
            return res.status(200).json({ message: "Nu sunt utilizatori inactivi azi." });
        }

        let trimise = 0;

        for (const user of utilizatoriInactivi) {
            // Luăm top 3 recomandări pentru user
            const recs = await Recommendation.findAll({
                where: { userId: user.id },
                include: [{ model: Book, as: 'book' }],
                order: [['score', 'DESC']],
                limit: 3
            });

            if (recs.length > 0) {
                const listaCarti = recs.map(r => `<li style="margin-bottom: 8px;"><b>${r.book.titlu}</b> by ${r.book.autor}</li>`).join('');

                const carduriCarti = recs.map(r => `
    <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 15px; margin-bottom: 15px; display: flex; align-items: center;">
        <div style="flex-shrink: 0; margin-right: 15px;">
            <div style="width: 50px; height: 75px; background-color: #3f3f46; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #71717a; font-size: 10px; text-align: center;">
                ${r.book.coperta_url ? `<img src="${r.book.coperta_url}" style="width: 50px; height: 75px; border-radius: 4px; object-fit: cover;">` : 'COPERTĂ'}
            </div>
        </div>
        <div>
            <h4 style="margin: 0; color: #f4f4f5; font-size: 16px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${r.book.titlu}</h4>
            <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 14px;">de ${r.book.autor}</p>
            <div style="margin-top: 8px; display: inline-block; padding: 2px 8px; background: #3b0764; color: #d8b4fe; font-size: 11px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                Recomandat pentru tine
            </div>
        </div>
    </div>
`).join('');

                const htmlEmail = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #09090b; font-family: 'Inter', Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" style="max-width: 500px; background-color: #09090b; border: 1px solid #1e1e1e; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <tr>
                            <td style="padding: 40px 30px 20px; text-align: center;">
                                <h1 style="color: #d8b4fe; font-family: 'Playfair Display', serif; font-size: 28px; margin: 0;">✧ Nocturne</h1>
                                <p style="color: #71717a; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px;">Inteligență Artificială Literară</p>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="padding: 0 30px 20px;">
                                <h2 style="color: #f4f4f5; font-size: 20px; margin-bottom: 10px;">Salut, ${user.nume}!</h2>
                                <p style="color: #a1a1aa; line-height: 1.6; font-size: 15px;">Biblioteca ta Nocturne a simțit că ți-e dor de o poveste bună. Am analizat ultimele tale lecturi și am ales 3 titluri care s-ar putea să te cucerească:</p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 0 30px;">
                                ${carduriCarti}
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 30px; text-align: center;">
                                <a href="http://localhost:3000" style="background: linear-gradient(45deg, #7c3aed, #a855f7); color: white; padding: 14px 30px; text-decoration: none; border-radius: 50px; font-weight: 600; display: inline-block; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);">
                                    Deschide Biblioteca Personală
                                </a>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 20px; background-color: #121214; text-align: center; border-top: 1px solid #27272a;">
                                <p style="color: #52525b; font-size: 12px; margin: 0;">Acesta este un mesaj automat generat de sistemul Nocturne.<br/>Nu răspunde la acest email.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
`;

                await transporter.sendMail({
                    from: '"Nocturne AI" <copaciramona@gmail.com>', // Trimis de la adresa ta
                    to: user.email,
                    subject: '✨ We found your next favorite book!',
                    html: htmlEmail
                });

                trimise++;
            }
        }

        return res.status(200).json({ message: `Gata! Am trimis ${trimise} emailuri.` });

    } catch (error) {
        console.error('[Email] Eroare severă:', error);
        return res.status(500).json({ message: "Eroare la trimitere." });
    }
};