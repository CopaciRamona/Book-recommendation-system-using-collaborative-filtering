import multer from 'multer';
import path from 'path';

// Configurăm "depozitul" unde salvăm pozele
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Spunem să le salveze în folderul 'uploads' creat la Pasul 2
        cb(null, 'uploads/'); 
    },
    filename: function (req, file, cb) {
        // Generăm un nume unic pentru poză (data curentă + extensia originală)
        // Ex: 1698765432-poza-mea.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Opțional: Filtrăm să primim doar imagini (nu executabile sau pdf-uri)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Te rog să încarci doar imagini!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limită maximă de 5MB pe poză
});

export default upload;