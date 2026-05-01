export const isAdmin = (req, res, next) => {
    try {
        // Logăm obiectul req.user pentru a vedea ce a lăsat middleware-ul 'protect' în urmă
        console.log("Verificare Admin - User Data:", req.user);

        // Verificăm ambele variante (role și rol) pentru siguranță maximă
        const userRole = req.user?.role || req.user?.rol;

        if (userRole === 'admin') {
            return next(); // Totul e ok, treci mai departe
        }

        // Dacă ajunge aici, înseamnă că rolul nu este 'admin'
        console.warn(`Acces refuzat: Rolul găsit este "${userRole}"`);
        return res.status(403).json({ 
            message: "Acces interzis! Nu ai permisiuni de administrator." 
        });

    } catch (error) {
        console.error("Eroare în middleware-ul isAdmin:", error);
        return res.status(500).json({ message: "Eroare server la verificarea permisiunilor." });
    }
};