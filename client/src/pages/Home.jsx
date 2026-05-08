import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Trash2, Edit, ShieldAlert, X, Sparkles, Mail } from 'lucide-react'; 
import './Home.css';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); 

    // --- STATE PENTRU USER NORMAL ---
    const [books, setBooks] = useState([]);
    const [recInfo, setRecInfo] = useState({ type: '', message: '' });
    
    // --- STATE PENTRU ADMIN ---
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- STATE PENTRU MAIL-URI (Admin) ---
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailMessage, setEmailMessage] = useState('');

    // --- STATE PENTRU MODALUL DE EDITARE (Stil ProfileSetup) ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [birthdayError, setBirthdayError] = useState('');
    
    const [editFormData, setEditFormData] = useState({
        nume: '', email: '', role: 'user', 
        varsta: '', sex: 'Nu specific', location: '', 
        birthday: '', reading_goal: '', genuri: [],
        profile_picture: null
    });

    const genresList = ["Fiction", "Fantasy", "Romance", "Young Adult", "Classics", 
        "Nonfiction", "Historical Fiction", "Mystery", "Contemporary", 
        "Thriller", "Science Fiction", "Adventure", "Paranormal", 
        "Horror", "Crime", "History", "Biography", "Humor", 
        "Suspense", "Literary Fiction"];

    useEffect(() => {
        if (user?.role === 'admin') fetchUsers();
        else fetchRecommendations();
    }, [user, location.key]); 

    // ==========================================
    // LOGICĂ PRELUARE DATE
    // ==========================================
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users/admin/users'); 
            if (res.data) setAllUsers(res.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/recommendations?t=${new Date().getTime()}`);
            if (res.data && res.data.books) {
                setBooks(res.data.books);
                setRecInfo({ type: res.data.type, message: res.data.message });
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleDeleteUser = async (id, nume) => {
        if (!window.confirm(`Ștergi definitiv pe ${nume}?`)) return;
        try {
            await api.delete(`/users/admin/users/${id}`);
            setAllUsers(allUsers.filter(u => u.id !== id));
        } catch (error) { alert("Eroare la ștergere!"); }
    };

    // ==========================================
    // LOGICĂ TRIMITERE E-MAILURI (Admin)
    // ==========================================
    const handleSendEmails = async () => {
        if (!window.confirm("Ești sigur că vrei să trimiți mail-uri către utilizatorii inactivi?")) return;

        setEmailLoading(true);
        setEmailMessage('');

        try {
            const response = await api.post('/emails/trigger-emails');
            setEmailMessage(`✅ Succes: ${response.data.mesaj || "Mail-urile au fost trimise!"}`);
        } catch (error) {
            console.error("Eroare trimitere mailuri:", error);
            setEmailMessage(`❌ Eroare: ${error.response?.data?.message || "Nu s-au putut trimite mail-urile."}`);
        } finally {
            setEmailLoading(false);
            // Șterge mesajul după câteva secunde pentru un UI curat
            setTimeout(() => setEmailMessage(''), 6000);
        }
    };

    // ==========================================
    // LOGICĂ MODAL EDITARE (Stil Setup)
    // ==========================================
    const openEditModal = (u) => {
        setEditingUser(u);
        
        let formattedBday = '';
        if (u.birthday) {
            const dateObj = new Date(u.birthday);
            if (!isNaN(dateObj)) {
                formattedBday = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
            }
        }

        const genuriArray = u.genuri_preferate ? u.genuri_preferate.split(',').map(g => g.trim()) : [];

        setEditFormData({
            nume: u.nume || '',
            email: u.email || '',
            role: u.role || 'user',
            varsta: u.varsta || '',
            sex: u.sex || 'Nu specific',
            location: u.location || '',
            birthday: formattedBday,
            reading_goal: u.reading_goal || '',
            genuri: genuriArray,
            profile_picture: null
        });
        setBirthdayError('');
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenreToggle = (genre) => {
        setEditFormData(prev => ({
            ...prev,
            genuri: prev.genuri.includes(genre) 
                ? prev.genuri.filter(g => g !== genre) 
                : [...prev.genuri, genre]
        }));
    };

    const handleFileChange = (e) => {
        setEditFormData(prev => ({ ...prev, profile_picture: e.target.files[0] }));
    };

    const handleBirthdayChange = (e) => {
        let val = e.target.value.replace(/\D/g, ''); 
        let formatted = '';
        if (val.length > 0) formatted += val.substring(0, 2);
        if (val.length >= 3) formatted += '/' + val.substring(2, 4);
        if (val.length >= 5) formatted += '/' + val.substring(4, 8);

        setEditFormData(prev => ({ ...prev, birthday: formatted }));

        if (formatted.length < 10) { setBirthdayError(''); return; }

        if (formatted.length === 10) {
            const [day, month, year] = formatted.split('/').map(Number);
            const currentYear = new Date().getFullYear();
            if (month < 1 || month > 12) return setBirthdayError('Luna trebuie să fie între 01 și 12.');
            if (year < 1900 || year > currentYear) return setBirthdayError(`Anul invalid.`);
            const daysInMonth = new Date(year, month, 0).getDate();
            if (day < 1 || day > daysInMonth) return setBirthdayError(`Zi invalidă pentru această lună.`);
            setBirthdayError('');
        }
    };

    const submitEditForm = async (e) => {
        e.preventDefault();
        if (birthdayError) return;

        try {
            const submitData = new FormData();
            submitData.append('nume', editFormData.nume);
            submitData.append('email', editFormData.email);
            submitData.append('role', editFormData.role);
            submitData.append('varsta', editFormData.varsta);
            submitData.append('sex', editFormData.sex);
            submitData.append('location', editFormData.location);
            submitData.append('reading_goal', editFormData.reading_goal);
            submitData.append('genuri_preferate', editFormData.genuri.join(','));

            let dateForBackend = editFormData.birthday;
            if (dateForBackend.length === 10 && !birthdayError) {
                const [day, month, year] = dateForBackend.split('/');
                dateForBackend = `${year}-${month}-${day}`; 
            }
            submitData.append('birthday', dateForBackend);

            if (editFormData.profile_picture) {
                submitData.append('profile_picture', editFormData.profile_picture);
            }
            
            const res = await api.put(`/users/admin/users/${editingUser.id}`, submitData);
            
            setAllUsers(allUsers.map(u => u.id === editingUser.id ? res.data.user : u));
            setIsEditModalOpen(false);
            alert("Profil actualizat cu succes!");
        } catch (error) {
            console.error("Eroare la actualizare:", error);
            alert("Eroare la salvare.");
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100 home-container">
                <div className="spinner-border" role="status" style={{width: '3rem', height: '3rem', color: '#c084fc'}}></div>
            </div>
        );
    }

    // ==========================================
    // RENDER ADMIN
    // ==========================================
    if (user?.role === 'admin') {
        const isSuccessMsg = emailMessage.includes('✅');

        return (
            <div className="home-container d-flex justify-content-center position-relative" style={{ minHeight: '100vh', paddingTop: '40px', paddingBottom: '40px' }}>
                <div className="container" style={{ maxWidth: '1100px' }}>
                    
                    {/* Header Admin */}
                    <div className="d-flex align-items-center mb-4" style={{ padding: '24px', background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.1) 0%, transparent 100%)', borderRadius: '16px', borderLeft: '4px solid #a855f7' }}>
                        <ShieldAlert size={36} color="#d8b4fe" className="me-4" />
                        <div>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#f4f4f5', margin: 0, fontWeight: '700' }}>Panou de Control Utilizatori</h2>
                            <p className="m-0 mt-1" style={{ fontSize: '15px', color: '#a1a1aa' }}>Gestionează conturile și reangajarea utilizatorilor Nocturne.</p>
                        </div>
                    </div>

                    {/* Secțiune nouă de Email integrată compact */}
                    <div className="card shadow-sm p-4 border-0 mb-4" style={{ backgroundColor: '#18181b', border: '1px solid rgba(147, 51, 234, 0.2)', borderRadius: '16px' }}>
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                            <div>
                                <h5 className="fw-bold mb-1 d-flex align-items-center" style={{ color: '#d8b4fe', fontFamily: '"Inter", sans-serif' }}>
                                    <Mail className="me-2" size={20} /> Reangajare Utilizatori Inactivi
                                </h5>
                                <p className="small mb-0" style={{ color: '#a1a1aa', fontFamily: '"Inter", sans-serif' }}>
                                    Trimite recomandări automate utilizatorilor care nu au mai fost activi recent.
                                </p>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                {emailMessage && (
                                    <span className="small fw-medium px-2 py-1 rounded" style={{ 
                                        backgroundColor: isSuccessMsg ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: isSuccessMsg ? '#86efac' : '#fca5a5',
                                        border: `1px solid ${isSuccessMsg ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                    }}>
                                        {emailMessage}
                                    </span>
                                )}
                                <button 
                                    className="btn fw-bold px-4 py-2 shadow-sm d-flex align-items-center transition-all" 
                                    onClick={handleSendEmails} 
                                    disabled={emailLoading}
                                    style={{ 
                                        backgroundColor: '#9333ea', color: 'white', border: 'none', borderRadius: '8px', 
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseOver={(e) => !emailLoading && (e.currentTarget.style.backgroundColor = '#a855f7')}
                                    onMouseOut={(e) => !emailLoading && (e.currentTarget.style.backgroundColor = '#9333ea')}
                                >
                                    {emailLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Trimite Mail-uri'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabel Utilizatori */}
                    <div className="table-responsive rounded-4" style={{ background: 'rgba(30, 30, 36, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(168, 85, 247, 0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                        <table className="table table-hover mb-0" style={{ '--bs-table-bg': 'transparent', '--bs-table-color': '#e4e4e7', '--bs-table-hover-bg': 'rgba(168, 85, 247, 0.05)' }}>
                            <thead style={{ borderBottom: '2px solid rgba(168, 85, 247, 0.3)' }}>
                                <tr>
                                    <th className="p-4 border-0" style={{ color: '#d8b4fe', fontWeight: '600' }}>ID</th>
                                    <th className="p-4 border-0" style={{ color: '#d8b4fe', fontWeight: '600' }}>Nume</th>
                                    <th className="p-4 border-0" style={{ color: '#d8b4fe', fontWeight: '600' }}>Email</th>
                                    <th className="p-4 border-0" style={{ color: '#d8b4fe', fontWeight: '600' }}>Rol</th>
                                    <th className="p-4 border-0 text-end" style={{ color: '#d8b4fe', fontWeight: '600' }}>Acțiuni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map((u) => (
                                    <tr key={u.id} style={{ verticalAlign: 'middle', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td className="p-4 border-0" style={{ color: '#a1a1aa' }}>#{u.id}</td>
                                        <td className="p-4 border-0 fw-bold" style={{ color: '#f4f4f5', fontSize: '1.05rem' }}>{u.nume}</td>
                                        <td className="p-4 border-0" style={{ color: '#a1a1aa' }}>{u.email}</td>
                                        <td className="p-4 border-0">
                                            <span className="badge" style={{ backgroundColor: u.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: u.role === 'admin' ? '#fca5a5' : '#93c5fd', padding: '8px 12px', borderRadius: '8px' }}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 border-0 text-end">
                                            <button onClick={() => openEditModal(u)} className="btn btn-sm me-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#d8b4fe', border: '1px solid rgba(216, 180, 254, 0.2)' }} title="Editează Profil complet">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDeleteUser(u.id, u.nume)} className="btn btn-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', opacity: u.id === user.id ? 0.5 : 1 }} disabled={u.id === user.id}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ================= MODAL STIL SETUP ================= */}
                {isEditModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                        <div className="card shadow-lg p-4 p-md-5 border-0" style={{ 
                            width: '95%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
                            borderRadius: '20px', backgroundColor: '#18181b', border: '1px solid rgba(147, 51, 234, 0.2)' 
                        }}>
                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <div className="text-start">
                                    <Sparkles size={24} color="#d8b4fe" className="mb-2" />
                                    <h3 className="fw-bold" style={{ fontFamily: '"Playfair Display", serif', color: '#f4f4f5', margin: 0 }}>
                                        Editare: {editingUser?.nume}
                                    </h3>
                                    <p className="text-white-50 m-0">Modifică datele de profil din baza de date.</p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                                    <X size={28} />
                                </button>
                            </div>

                            <form onSubmit={submitEditForm}>
                                <div className="row">
                                    {/* COLOANA 1 */}
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold text-white-50">Nume Complet</label>
                                        <input type="text" name="nume" className="form-control shadow-none" value={editFormData.nume} onChange={handleEditFormChange} required style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold text-white-50">Email</label>
                                        <input type="email" name="email" className="form-control shadow-none" value={editFormData.email} onChange={handleEditFormChange} required style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold text-white-50">Vârstă</label>
                                        <input type="text" inputMode="numeric" name="varsta" className="form-control shadow-none" value={editFormData.varsta} onChange={e => setEditFormData({...editFormData, varsta: e.target.value.replace(/\D/g, '')})} maxLength="3" style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold text-white-50">Sex</label>
                                        <select name="sex" className="form-select shadow-none" value={editFormData.sex} onChange={handleEditFormChange} style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                            <option value="Nu specific">Nespecificat</option>
                                            <option value="Masculin">Masculin</option>
                                            <option value="Feminin">Feminin</option>
                                            <option value="Altul">Altul</option>
                                        </select>
                                    </div>

                                    {/* COLOANA 2 */}
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold text-white-50">Locație</label>
                                        <input type="text" name="location" className="form-control shadow-none" value={editFormData.location} onChange={handleEditFormChange} style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold text-white-50">Data Nașterii</label>
                                        <div className="position-relative d-flex align-items-center">
                                            <div className="position-absolute" style={{ left: '13px', color: '#52525b', pointerEvents: 'none', zIndex: 1, fontFamily: 'monospace', fontSize: '1.05rem', letterSpacing: '1px' }}>
                                                <span style={{ opacity: 0 }}>{editFormData.birthday}</span>
                                                <span>{'DD/MM/YYYY'.substring(editFormData.birthday.length)}</span>
                                            </div>
                                            <input type="text" inputMode="numeric" className={`form-control shadow-none position-relative ${birthdayError ? 'is-invalid' : ''}`} style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', zIndex: 2, fontFamily: 'monospace', fontSize: '1.05rem' }} value={editFormData.birthday} onChange={handleBirthdayChange} maxLength="10" />
                                        </div>
                                        {birthdayError && <small className="text-danger mt-1 d-block fw-bold">{birthdayError}</small>}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold text-white-50">Rol Utilizator</label>
                                        <select name="role" className="form-select shadow-none" value={editFormData.role} onChange={handleEditFormChange} style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                            <option value="user">USER (Normal)</option>
                                            <option value="admin">ADMIN (Administrator)</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label small fw-bold text-white-50">Reading Goal</label>
                                        <input type="number" name="reading_goal" className="form-control shadow-none" value={editFormData.reading_goal} onChange={handleEditFormChange} style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-white-50">Profile Picture (Înlocuiește poza curentă)</label>
                                    <input type="file" className="form-control shadow-none" accept="image/*" onChange={handleFileChange} style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                </div>

                                {/* GENURI CA BUTOANE */}
                                <div className="mb-4 mt-3">
                                    <label className="form-label small fw-bold text-white-50 d-block mb-2">Genuri Preferate</label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {Array.from(new Set([...genresList, ...editFormData.genuri])).filter(g => g.trim() !== '').map(g => {
                                            const isSelected = editFormData.genuri.includes(g);
                                            return (
                                                <button key={g} type="button" onClick={() => handleGenreToggle(g)} className="btn btn-sm rounded-pill px-3 py-2 transition-all" style={{ backgroundColor: isSelected ? '#9333ea' : '#27272a', borderColor: isSelected ? '#9333ea' : 'rgba(255,255,255,0.1)', color: isSelected ? '#fff' : '#a1a1aa' }}>
                                                    {isSelected ? `✓ ${g}` : `+ ${g}`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid #27272a' }}>
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: 'transparent', color: '#a1a1aa' }}>
                                        Anulează
                                    </button>
                                    <button type="submit" disabled={!!birthdayError} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#a855f7', color: 'white', fontWeight: 'bold' }}>
                                        Salvează Profilul
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // RENDER PENTRU USER NORMAL
    // ==========================================
    return (
        <div className="home-container">
            <div className="container py-5" style={{ maxWidth: '1400px' }}>
                <div className="mb-5">
                    <h1 className="modern-title">
                        {recInfo.type === 'collaborative-filtering' ? '✨ Chosen for you' : 'Discover Books'}
                    </h1>
                    <p className="subtitle-text">
                        {recInfo.message || "Our algorithm analyzed thousands of volumes to find your perfect match."}
                    </p>
                </div>
                {books.length === 0 ? (
                    <div className="text-center p-5 rounded-5 shadow-sm empty-state-card">
                        <h3 className="mb-3 text-white">No books yet...</h3>
                        <p style={{color: '#a1a1aa'}}>Add interests to your profile to train the artificial intelligence!</p>
                    </div>
                ) : (
                    <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-4">
                        {books.map((book) => (
                            <div className="col" key={book.id}>
                                <div className="glass-card h-100 d-flex flex-column position-relative" onClick={() => navigate(`/book/${book.id}`)}>
                                    <div className="cover-wrapper">
                                        <img src={book.coperta_url || 'https://via.placeholder.com/300x450'} className="cover-image" alt={book.titlu} />
                                        <div className="floating-badge">⭐ {book.rating_mediu ? Number(book.rating_mediu).toFixed(1) : '5.0'}</div>
                                    </div>
                                    <div className="card-info p-3">
                                        <h6 className="book-title text-truncate mb-1" title={book.titlu}>{book.titlu}</h6>
                                        <p className="book-author text-truncate mb-0">{book.autor}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;