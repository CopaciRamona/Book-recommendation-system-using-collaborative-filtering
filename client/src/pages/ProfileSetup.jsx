import { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react'; 

const ProfileSetup = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        varsta: '',
        sex: 'Nu specific',
        location: '',
        birthday: '', 
        profile_picture: null, 
        genuri: [] 
    });

    const [birthdayError, setBirthdayError] = useState('');

    const genresList = ["Fiction", "Fantasy", "Romance", "Young Adult", "Classics", 
        "Nonfiction", "Historical Fiction", "Mystery", "Contemporary", 
        "Thriller", "Science Fiction", "Adventure", "Paranormal", 
        "Horror", "Crime", "History", "Biography", "Humor", 
        "Suspense", "Literary Fiction"];

    const handleGenreToggle = (genre) => {
        setFormData(prev => {
            if (prev.genuri.includes(genre)) {
                return { ...prev, genuri: prev.genuri.filter(g => g !== genre) };
            } else {
                return { ...prev, genuri: [...prev.genuri, genre] };
            }
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0]; 
        setFormData(prev => ({ ...prev, profile_picture: file }));
    };

    const handleBirthdayChange = (e) => {
        let val = e.target.value.replace(/\D/g, ''); 
        let formatted = '';

        if (val.length > 0) formatted += val.substring(0, 2);
        if (val.length >= 3) formatted += '/' + val.substring(2, 4);
        if (val.length >= 5) formatted += '/' + val.substring(4, 8);

        setFormData(prev => ({ ...prev, birthday: formatted }));

        if (formatted.length < 10) {
            setBirthdayError('');
            return;
        }

        if (formatted.length === 10) {
            const [dayStr, monthStr, yearStr] = formatted.split('/');
            const day = parseInt(dayStr, 10);
            const month = parseInt(monthStr, 10);
            const year = parseInt(yearStr, 10);
            const currentYear = new Date().getFullYear();

            if (month < 1 || month > 12) {
                setBirthdayError('Month must be between 01 and 12.');
                return;
            }
            if (year < 1900 || year > currentYear) {
                setBirthdayError(`Year must be between 1900 and ${currentYear}.`);
                return;
            }
            const daysInMonth = new Date(year, month, 0).getDate();
            if (day < 1 || day > daysInMonth) {
                setBirthdayError(`Day must be between 01 and ${daysInMonth} for this month.`);
                return;
            }
            setBirthdayError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (birthdayError) return;

        try {
            const token = localStorage.getItem('token');
            const submitData = new FormData();
            
            submitData.append('varsta', formData.varsta);
            submitData.append('sex', formData.sex);
            submitData.append('location', formData.location);
            
            let dateForBackend = formData.birthday;
            if (dateForBackend.length === 10 && !birthdayError) {
                const [day, month, year] = dateForBackend.split('/');
                dateForBackend = `${year}-${month}-${day}`; 
            }
            submitData.append('birthday', dateForBackend);
            submitData.append('isProfileComplete', true);
            submitData.append('genuri', formData.genuri.join(','));

            if (formData.profile_picture) {
                submitData.append('profile_picture', formData.profile_picture);
            }
            
            const response = await axios.put('/users/update-profile', submitData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const updatedUser = response.data.user;
            setUser(updatedUser); 
            localStorage.setItem('user', JSON.stringify(updatedUser)); 
            
            navigate('/home', { replace: true }); 
            
        } catch (err) {
            console.error(err);
            alert("Error saving profile.");
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 py-5" style={{ backgroundColor: '#09090b', position: 'relative', overflow: 'hidden' }}>
            
            <div style={{
                position: 'absolute', width: '600px', height: '600px',
                background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, rgba(9, 9, 11, 0) 70%)',
                top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 0, pointerEvents: 'none'
            }}></div>

            <div className="card shadow-lg p-4 p-md-5 border-0" style={{ maxWidth: '650px', width: '90%', borderRadius: '20px', backgroundColor: '#18181b', border: '1px solid rgba(147, 51, 234, 0.2)', zIndex: 1 }}>
                
                <form onSubmit={handleSubmit}>
                    <div className="text-center mb-4">
                        <Sparkles size={32} color="#d8b4fe" className="mb-2" />
                        <h2 className="fw-bold" style={{ fontFamily: '"Playfair Display", serif', color: '#f4f4f5' }}>
                            Complete Your Profile
                        </h2>
                        <p className="text-white-50">
                            Hello, <strong>{user?.nume}</strong>! We need a few more details to give you better recommendations.
                        </p>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold text-white-50">Age</label>
                            <input 
                                type="text" inputMode="numeric" className="form-control shadow-none" 
                                placeholder="Ex: 23" value={formData.varsta} 
                                onChange={e => setFormData({...formData, varsta: e.target.value.replace(/\D/g, '')})} 
                                maxLength="3" required
                                style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold text-white-50">Gender</label>
                            <select 
                                className="form-select shadow-none" value={formData.sex} 
                                onChange={e => setFormData({...formData, sex: e.target.value})}
                                style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            >
                                <option value="Nu specific">Prefer not to say</option>
                                <option value="Masculin">Male</option>
                                <option value="Feminin">Female</option>
                                <option value="Altul">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold text-white-50">City / Location</label>
                            <input 
                                type="text" className="form-control shadow-none" placeholder="Ex: London"
                                value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} 
                                style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold text-white-50">Date of Birth</label>
                            <div className="position-relative d-flex align-items-center">
                                <div className="position-absolute" style={{ left: '13px', color: '#52525b', pointerEvents: 'none', zIndex: 1, fontFamily: 'monospace', fontSize: '1.05rem', letterSpacing: '1px' }}>
                                    <span style={{ opacity: 0 }}>{formData.birthday}</span>
                                    <span>{'DD/MM/YYYY'.substring(formData.birthday.length)}</span>
                                </div>
                                <input 
                                    type="text" inputMode="numeric"
                                    className={`form-control shadow-none position-relative ${birthdayError ? 'is-invalid' : ''}`} 
                                    style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', zIndex: 2, fontFamily: 'monospace', fontSize: '1.05rem' }}
                                    value={formData.birthday} onChange={handleBirthdayChange} maxLength="10"
                                />
                            </div>
                            {birthdayError && <small className="text-danger mt-1 d-block fw-bold">{birthdayError}</small>}
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label small fw-bold text-white-50">Profile Picture (Optional)</label>
                        <input 
                            type="file" className="form-control shadow-none" accept="image/*" 
                            onChange={handleFileChange}
                            style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        />
                    </div>

                    <div className="mb-4 mt-4">
                        <label className="form-label small fw-bold text-white-50 d-block mb-2">What genres do you love?</label>
                        <div className="d-flex flex-wrap gap-2">
                            {genresList.map(g => {
                                const isSelected = formData.genuri.includes(g);
                                return (
                                    <button
                                        key={g} type="button" onClick={() => handleGenreToggle(g)}
                                        className="btn btn-sm rounded-pill px-3 py-2 transition-all"
                                        style={{
                                            backgroundColor: isSelected ? '#9333ea' : '#27272a',
                                            borderColor: isSelected ? '#9333ea' : 'rgba(255,255,255,0.1)',
                                            color: isSelected ? '#fff' : '#a1a1aa'
                                        }}
                                    >
                                        {isSelected ? `✓ ${g}` : `+ ${g}`}
                                    </button>
                                );
                            })}
                        </div>
                        {formData.genuri.length < 2 && (
                            <small className="text-info d-block mt-2">Pick at least 2 genres.</small>
                        )}
                    </div>

                    <button 
                        type="submit" className="btn w-100 fw-bold py-3 mt-3 text-white shadow-sm transition-hover"
                        style={{ backgroundColor: '#9333ea', border: 'none', borderRadius: '10px' }}
                        disabled={formData.genuri.length < 2 || !!birthdayError}
                    >
                        Complete Profile
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;