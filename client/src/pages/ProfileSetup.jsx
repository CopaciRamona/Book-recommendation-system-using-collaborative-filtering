import { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProfileSetup = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    
    // 1. Am adăugat 'profile_picture' setat inițial pe null
    const [formData, setFormData] = useState({
        varsta: '',
        sex: 'Nu specific',
        location: '',
        birthday: '', 
        profile_picture: null, // <--- NOU: Aici vom stoca fișierul fizic
        genuri: [] 
    });

    const genresList = ["Fiction", "Fantasy", "Romance", "Young Adult", "Classics", 
        "Nonfiction", "Historical Fiction", "Mystery", "Contemporary", 
        "Thriller", "Science Fiction", "Adventure", "Paranormal", 
        "Horror", "Crime", "History", "Biography", "Humor", 
        "Suspense", "Literary Fiction"];

    // Funcție pentru toggle genuri (stil "chips/pastile")
    const handleGenreToggle = (genre) => {
        setFormData(prev => {
            if (prev.genuri.includes(genre)) {
                return { ...prev, genuri: prev.genuri.filter(g => g !== genre) };
            } else {
                return { ...prev, genuri: [...prev.genuri, genre] };
            }
        });
    };

    // Funcție care rulează când utilizatorul selectează o poză din calculator
    const handleFileChange = (e) => {
        const file = e.target.files[0]; // Luăm primul fișier selectat
        setFormData(prev => ({ ...prev, profile_picture: file }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            
            // 2. CREĂM UN OBIECT FormData (Obligatoriu pentru upload de fișiere)
            const submitData = new FormData();
            submitData.append('varsta', formData.varsta);
            submitData.append('sex', formData.sex);
            submitData.append('location', formData.location);
            submitData.append('birthday', formData.birthday);
            
            // Pentru genuri, le trimitem ca un string separat prin virgulă, sau le atașăm pe rând
            formData.genuri.forEach(gen => {
                submitData.append('genuri[]', gen); // Backend-ul va ști să le citească
            });

            // Dacă a selectat o poză, o atașăm la pachet sub numele 'profile_picture'
            if (formData.profile_picture) {
                submitData.append('profile_picture', formData.profile_picture);
            }
            
            // 3. Trimitem cererea (Axios va seta automat header-ul 'multipart/form-data')
            const response = await axios.post('/auth/update-profile', submitData, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                    // Nu pune 'Content-Type': 'multipart/form-data' manual, axios îl pune singur corect!
                }
            });

            // Actualizăm starea userului în context
            setUser(prev => ({ 
                ...prev, 
                isProfileComplete: true,
                profile_picture: response.data.user.profile_picture // Salvăm poza și în context, dacă vrem să o afișăm pe viitor
            }));
            
            alert("Profil salvat cu succes!");
            navigate('/', { replace: true }); 
            
        } catch (err) {
            console.error(err);
            alert("Eroare la salvarea profilului.");
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#f4f1ea' }}>
            <div className="card shadow-lg p-4 border-0" style={{ maxWidth: '600px', width: '100%', borderRadius: '15px' }}>
                
                <form onSubmit={handleSubmit}>
                    <h2 className="text-center mb-3" style={{ fontFamily: 'Georgia, serif', color: '#382110' }}>
                        🎯 Completează Profilul
                    </h2>
                    <p className="text-center text-muted mb-4">
                        Salut, <strong>{user?.nume}</strong>! Mai avem nevoie de câteva detalii pentru recomandări mai bune.
                    </p>

                    {/* Rândul 1: Vârstă și Gen */}
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold">Vârsta</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                placeholder="Ex: 25"
                                value={formData.varsta} 
                                onChange={e => setFormData({...formData, varsta: e.target.value})} 
                                required
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold">Gen</label>
                            <select 
                                className="form-select" 
                                value={formData.sex} 
                                onChange={e => setFormData({...formData, sex: e.target.value})}
                            >
                                <option value="Nu specific">Nu specific</option>
                                <option value="Masculin">Masculin</option>
                                <option value="Feminin">Feminin</option>
                            </select>
                        </div>
                    </div>

                    {/* Rândul 2: Oraș/Locație și Data Nașterii */}
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold">Oraș / Locație</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Ex: București"
                                value={formData.location} 
                                onChange={e => setFormData({...formData, location: e.target.value})} 
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold">Data Nașterii</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={formData.birthday} 
                                onChange={e => setFormData({...formData, birthday: e.target.value})} 
                            />
                        </div>
                    </div>

                    {/* Încărcare Poză de Profil (NOU) */}
                    <div className="mb-3">
                        <label className="form-label small fw-bold">Poză de Profil (Opțional)</label>
                        <input 
                            type="file" 
                            className="form-control" 
                            accept="image/*" // Acceptă doar imagini (jpeg, png, etc.)
                            onChange={handleFileChange} 
                        />
                    </div>

                    {/* Selecție Genuri Literare sub formă de Chips */}
                    <div className="mb-4 mt-2">
                        <label className="form-label small fw-bold d-block mb-2">Ce genuri de cărți îți plac?</label>
                        <div className="d-flex flex-wrap gap-2">
                            {genresList.map(g => {
                                const isSelected = formData.genuri.includes(g);
                                return (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => handleGenreToggle(g)}
                                        className={`btn btn-sm rounded-pill px-3 py-2 transition-all ${isSelected ? 'btn-dark' : 'btn-outline-secondary'}`}
                                        style={isSelected ? { backgroundColor: '#382110', borderColor: '#382110' } : {}}
                                    >
                                        {isSelected ? `✓ ${g}` : `+ ${g}`}
                                    </button>
                                );
                            })}
                        </div>
                        {formData.genuri.length < 2 && (
                            <small className="text-muted d-block mt-2">Alege cel puțin 2 genuri.</small>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="btn w-100 fw-bold py-2 mt-3 text-white shadow-sm"
                        style={{ backgroundColor: '#d6ad5b', border: 'none' }}
                        disabled={formData.genuri.length < 2}
                    >
                        Finalizează Profilul
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;