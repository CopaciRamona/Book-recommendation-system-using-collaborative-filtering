import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { Book } from '../models/index.js';

const execPromise = util.promisify(exec);

let genuriCache = "";

const incarcaGenuriDinDB = async () => {
    try {
        const carti = await Book.findAll({ attributes: ['genuri'], raw: true });
        const setGenuri = new Set();
        
        carti.forEach(carte => {
            if (carte.genuri) {
                const cleanGenres = carte.genuri.replace(/[\[\]"']/g, '');
                const arrayGenuri = cleanGenres.split(',').map(g => g.trim());
                arrayGenuri.forEach(gen => { 
                    if (gen && gen.length > 1) setGenuri.add(gen); 
                });
            }
        });
        
        const toateGenurile = Array.from(setGenuri);
        const genuriScurte = toateGenurile.slice(0, 80); 
        
        genuriCache = `[${genuriScurte.join(', ')}]`;
        console.log(`[PythonHelper] Am încărcat ${genuriScurte.length} genuri pentru AI (din totalul de ${toateGenurile.length}).`);

    } catch (error) {
        console.error("[PythonHelper] Eroare încărcare genuri DB:", error);
        genuriCache = "[Fiction, Nonfiction, Romance, Contemporary, Fantasy]";
    }
};

export const detecteazaEmotiaCuPython = async (mesajUser) => {
    if (!mesajUser || mesajUser.trim() === "") {
        return { emotion: null, include_genres: [], exclude_genres: [], keywords: [] };
    }

    if (!genuriCache) await incarcaGenuriDinDB();

    try {
        const cleanMessage = mesajUser.replace(/"/g, '\\"');
        const scriptPath = path.resolve('python_scripts', 'chatbot_brain.py');
        const { stdout, stderr } = await execPromise(`python "${scriptPath}" "${cleanMessage}" "${genuriCache}"`);
        
        const output = stdout.trim();

        try {
            const parsedData = JSON.parse(output); 
            return {
                emotion: parsedData.emotion || null,
                include_genres: parsedData.include_genres || [],
                exclude_genres: parsedData.exclude_genres || [],
                keywords: parsedData.keywords || []
            };
        } catch (parseError) {
            console.error("[PythonHelper] Eroare parsare JSON:", output);
            return { emotion: null, include_genres: [], exclude_genres: [], keywords: [] };
        }
    } catch (error) {
        console.error("[PythonHelper] Eroare execuție Python:", error.message);
        return { emotion: null, include_genres: [], exclude_genres: [], keywords: [] };
    }
};