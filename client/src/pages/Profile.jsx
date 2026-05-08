import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Settings, Cake, User as UserIcon, MapPin, CalendarHeart, Bookmark, BookOpen, BookCheck, Star, PenLine, TrendingUp, Inbox } from 'lucide-react';

const Profile = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState({ read: 0, reading: 0, want: 0 });
    const [loading, setLoading] = useState(true);

    const [showEditModal, setShowEditModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [birthdayError, setBirthdayError] = useState('');

    const [booksReadThisYear, setBooksReadThisYear] = useState(0);

    const [editData, setEditData] = useState({
        nume: '',
        varsta: '',
        sex: 'Not specified',
        location: '',
        birthday: '',
        reading_goal: 12,
        genuri: []
    });

    const [selectedFile, setSelectedFile] = useState(null);

    const themePurple = '#9333ea';

    const genresList = ["Fiction", "Fantasy", "Romance", "Young Adult", "Classics",
        "Nonfiction", "Historical Fiction", "Mystery", "Contemporary",
        "Thriller", "Science Fiction", "Adventure", "Paranormal",
        "Horror", "Crime", "History", "Biography", "Humor",
        "Suspense", "Literary Fiction"];

    let profilePicUrl = null;
    if (profileData && profileData.profile_picture) {
        if (profileData.profile_picture.startsWith('http')) {
            profilePicUrl = profileData.profile_picture;
        } else {
            const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';
            const imagePath = profileData.profile_picture.startsWith('/') ? profileData.profile_picture : `/${profileData.profile_picture}`;
            profilePicUrl = `${baseUrl}${imagePath}`;
        }
    }

    const initiala = profileData?.nume ? profileData.nume.charAt(0).toUpperCase() : 'U';

    useEffect(() => {
        const fetchCompleteProfile = async () => {
            try {
                setLoading(true);
                const response = await api.get('/users/profile');
                const pData = response.data.profile;
                setProfileData(pData);

                let sRead = 0, sReading = 0, sWant = 0;
                let readThisYearCounter = 0;
                let allActivities = [];

                const currentYear = new Date().getFullYear();

                if (pData.myLibrary) {
                    pData.myLibrary.forEach(book => {
                        const status = book.UserBook?.status;
                        const dateAdded = new Date(book.UserBook?.createdAt);
                        const dateUpdated = new Date(book.UserBook?.updatedAt);
                        const currentPage = book.UserBook?.pagina_curenta;

                        if (status === 'want_to_read') {
                            sWant++;
                            allActivities.push({ id: `lib_w_${book.id}`, type: 'WANT_TO_READ', book, date: dateAdded });
                        }

                        if (status === 'reading' || status === 'read') {
                            if (status === 'reading') sReading++;
                            if (status === 'read') {
                                sRead++;
                                if (dateUpdated.getFullYear() === currentYear) {
                                    readThisYearCounter++;
                                }
                            }

                            allActivities.push({ id: `lib_start_${book.id}`, type: 'READING', book, date: dateAdded });

                            if (currentPage && Number(currentPage) > 0) {
                                allActivities.push({
                                    id: `lib_prog_${book.id}`,
                                    type: 'PROGRESS',
                                    page: currentPage,
                                    book: book,
                                    date: new Date(dateUpdated.getTime() - 1000)
                                });
                            }

                            if (status === 'read') {
                                allActivities.push({ id: `lib_rd_${book.id}`, type: 'READ', book, date: dateUpdated });
                            }
                        }
                    });
                }

                if (pData.myReviews) {
                    pData.myReviews.forEach(rev => {
                        if (rev.book) {
                            const continutRecenzie = rev.text_recenzie || rev.textRecenzie || rev.text || '';
                            const revDate = new Date(rev.createdAt);

                            if (rev.rating > 0) {
                                allActivities.push({
                                    id: `rev_rate_${rev.id}`,
                                    type: 'RATED',
                                    rating: rev.rating,
                                    book: rev.book,
                                    date: new Date(revDate.getTime() - 2000)
                                });
                            }

                            if (continutRecenzie.trim().length > 0) {
                                allActivities.push({
                                    id: `rev_text_${rev.id}`,
                                    type: 'REVIEWED',
                                    text: continutRecenzie,
                                    book: rev.book,
                                    date: revDate
                                });
                            }
                        }
                    });
                }

                setStats({ read: sRead, reading: sReading, want: sWant });
                setBooksReadThisYear(readThisYearCounter);
                allActivities.sort((a, b) => b.date - a.date);
                setActivities(allActivities);

            } catch (error) {
                console.error("Eroare la încărcarea profilului:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchCompleteProfile();
        }
    }, [user]);

    const formatDate = (dateObj) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
    };

    const formatDateForUI = (isoDate) => {
        if (!isoDate) return '';
        const parts = isoDate.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return isoDate;
    };

    const handleOpenEditModal = () => {
        let currentGenres = [];
        if (profileData.genuri_preferate) {
            currentGenres = profileData.genuri_preferate.replace(/[\[\]"']/g, '').split(',').map(g => g.trim()).filter(Boolean);
        }

        setEditData({
            nume: profileData.nume || '',
            varsta: profileData.varsta || '',
            sex: profileData.sex || 'Not specified',
            location: profileData.location || '',
            birthday: formatDateForUI(profileData.birthday),
            reading_goal: profileData.reading_goal || 12,
            genuri: currentGenres
        });
        setSelectedFile(null);
        setBirthdayError('');
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleGenreToggle = (genre) => {
        setEditData(prev => {
            if (prev.genuri.includes(genre)) {
                return { ...prev, genuri: prev.genuri.filter(g => g !== genre) };
            } else {
                return { ...prev, genuri: [...prev.genuri, genre] };
            }
        });
    };

    const handleBirthdayChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        let formatted = '';

        if (val.length > 0) formatted += val.substring(0, 2);
        if (val.length >= 3) formatted += '/' + val.substring(2, 4);
        if (val.length >= 5) formatted += '/' + val.substring(4, 8);

        setEditData(prev => ({ ...prev, birthday: formatted }));

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

    const handleSaveProfile = async () => {
        if (birthdayError) return;

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('nume', editData.nume);
            formData.append('varsta', editData.varsta);
            formData.append('sex', editData.sex);
            formData.append('location', editData.location);
            formData.append('reading_goal', editData.reading_goal);

            let dateForBackend = editData.birthday;
            if (dateForBackend.length === 10 && !birthdayError) {
                const [day, month, year] = dateForBackend.split('/');
                dateForBackend = `${year}-${month}-${day}`;
            }
            formData.append('birthday', dateForBackend);
            formData.append('genuri', editData.genuri.join(','));

            if (selectedFile) {
                formData.append('profile_picture', selectedFile);
            }

            const response = await api.put('users/update-profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data && response.data.user && setUser) {
                setUser(response.data.user);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            setShowEditModal(false);
            window.location.reload();
        } catch (error) {
            console.error("Eroare la salvarea profilului", error);
            alert("An error occurred while saving the data.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!profileData) return (
        <div style={{ backgroundColor: '#09090b', minHeight: '100vh' }} className="d-flex justify-content-center align-items-center">
            <div className="spinner-border" style={{ color: themePurple }}></div>
        </div>
    );

    const yearlyGoal = profileData?.reading_goal || 12;
    const goalPercentage = Math.min(Math.round((booksReadThisYear / yearlyGoal) * 100), 100);

    return (
        <div style={{ backgroundColor: '#09090b', minHeight: '100vh', color: '#e4e4e7', paddingBottom: '50px', position: 'relative' }}>

            {showEditModal && (
                <>
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100"
                        style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1040, backdropFilter: 'blur(5px)' }}
                        onClick={() => setShowEditModal(false)}
                    ></div>

                    <div
                        className="position-fixed top-50 start-50 translate-middle shadow-lg rounded"
                        style={{ backgroundColor: '#18181b', border: `1px solid ${themePurple}`, zIndex: 1050, width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '30px' }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="text-white fw-bold mb-0">Edit Profile</h4>
                            <button className="btn btn-link text-white-50 p-0 fs-4 text-decoration-none" onClick={() => setShowEditModal(false)}>×</button>
                        </div>

                        <div className="row g-3">
                            <div className="col-12">
                                <label className="text-white-50 small mb-1">Name</label>
                                <input
                                    type="text"
                                    name="nume"
                                    className="form-control text-white shadow-none"
                                    style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)' }}
                                    value={editData.nume}
                                    onChange={handleEditChange}
                                />
                            </div>

                            <div className="col-sm-6">
                                <label className="text-white-50 small mb-1">Age</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="form-control text-white shadow-none"
                                    style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)' }}
                                    value={editData.varsta}
                                    onChange={(e) => {
                                        const onlyNums = e.target.value.replace(/\D/g, '');
                                        setEditData({ ...editData, varsta: onlyNums });
                                    }}
                                    maxLength="3"
                                />
                            </div>

                            <div className="col-sm-6">
                                <label className="text-white-50 small mb-1">Gender</label>
                                <select name="sex" className="form-select text-white shadow-none" style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)' }} value={editData.sex} onChange={handleEditChange}>
                                    <option value="Not specified">Not specified</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="col-sm-6">
                                <label className="text-white-50 small mb-1">Location (City, Country)</label>
                                <input type="text" name="location" className="form-control text-white shadow-none" style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)' }} value={editData.location} onChange={handleEditChange} />
                            </div>

                            <div className="col-sm-6">
                                <label className="text-white-50 small mb-1">Birthday</label>
                                <div className="position-relative d-flex align-items-center">
                                    <div
                                        className="position-absolute"
                                        style={{
                                            left: '13px',
                                            color: '#52525b',
                                            pointerEvents: 'none',
                                            zIndex: 1,
                                            fontFamily: 'monospace',
                                            fontSize: '1rem',
                                            letterSpacing: '1px'
                                        }}
                                    >
                                        <span style={{ opacity: 0 }}>{editData.birthday}</span>
                                        <span>{'DD/MM/YYYY'.substring(editData.birthday.length)}</span>
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className={`form-control shadow-none position-relative text-white ${birthdayError ? 'is-invalid border-danger' : ''}`}
                                        style={{
                                            backgroundColor: '#27272a',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            zIndex: 2,
                                            fontFamily: 'monospace',
                                            fontSize: '1rem',
                                            letterSpacing: '1px'
                                        }}
                                        value={editData.birthday}
                                        onChange={handleBirthdayChange}
                                        maxLength="10"
                                    />
                                </div>
                                {birthdayError && <small className="text-danger mt-1 d-block">{birthdayError}</small>}
                            </div>

                            <div className="col-sm-6">
                                <label className="text-white-50 small mb-1">Reading Goal ({new Date().getFullYear()})</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    name="reading_goal"
                                    className="form-control text-white shadow-none"
                                    style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)' }}
                                    value={editData.reading_goal}
                                    onChange={(e) => {
                                        const onlyNums = e.target.value.replace(/\D/g, '');
                                        setEditData({ ...editData, reading_goal: onlyNums });
                                    }}
                                    maxLength="3"
                                />
                            </div>

                            <div className="col-12 mt-4">
                                <label className="text-white-50 small mb-2">Favorite Genres (Min. 2)</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {genresList.map(g => {
                                        const isSelected = editData.genuri.includes(g);
                                        return (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => handleGenreToggle(g)}
                                                className={`btn btn-sm rounded-pill px-3 py-1 transition-all ${isSelected ? 'text-white' : 'text-white-50'}`}
                                                style={{
                                                    backgroundColor: isSelected ? themePurple : '#27272a',
                                                    border: `1px solid ${isSelected ? themePurple : 'rgba(255,255,255,0.1)'}`
                                                }}
                                            >
                                                {isSelected ? `✓ ${g}` : `+ ${g}`}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="col-12 mt-3">
                                <label className="text-white-50 small mb-1">Upload New Picture (Optional)</label>
                                <input type="file" accept="image/*" className="form-control text-white shadow-none" style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)' }} onChange={handleFileChange} />
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top border-secondary border-opacity-25">
                            <button className="btn text-white-50" onClick={() => setShowEditModal(false)} disabled={isSaving}>Cancel</button>
                            <button
                                className="btn text-white px-4 fw-bold transition-hover"
                                style={{ backgroundColor: themePurple, borderRadius: '8px' }}
                                onClick={handleSaveProfile}
                                disabled={isSaving || editData.genuri.length < 2 || !!birthdayError}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* --- BANNER MOV --- */}
            <div
                style={{
                    height: '240px',
                    background: 'linear-gradient(135deg, #4c1d95 0%, #9333ea 100%)',
                    position: 'relative',
                    // TRUCUL AICI: Marginile negative anulează spațiul (padding-ul) lăsat de layout-ul tău principal
                    marginTop: '-24px',   // Îl lipește de linia de sus (sub bara de căutare)
                    marginLeft: '-24px',  // Îl lipește de bara laterală (sidebar)
                    marginRight: '-24px', // Îl lipește de marginea din dreapta a ecranului
                }}
            ></div>

            <div className="container" style={{ maxWidth: '900px', marginTop: '-80px', position: 'relative', zIndex: 10 }}>

                <div className="card mb-5 shadow-lg border-0 position-relative" style={{ backgroundColor: '#18181b', borderRadius: '16px' }}>
                    <button
                        onClick={handleOpenEditModal}
                        className="btn position-absolute d-flex align-items-center gap-2 shadow-sm transition-hover"
                        style={{
                            top: '20px', right: '20px',
                            backgroundColor: 'rgba(147, 51, 234, 0.15)',
                            color: '#d8b4fe',
                            border: '1px solid rgba(147, 51, 234, 0.3)',
                            borderRadius: '50px',
                            padding: '6px 16px',
                            fontWeight: '500',
                            fontSize: '0.9rem',
                            zIndex: 5
                        }}
                    >
                        <Settings size={16} strokeWidth={2} /> Edit Profile
                    </button>

                    <div className="card-body p-4 p-md-5 d-flex flex-column flex-md-row align-items-center align-items-md-start gap-4 mt-3 mt-md-0">

                        <div style={{ position: 'relative' }}>
                            {profilePicUrl ? (
                                <img
                                    src={profilePicUrl}
                                    alt="Profile"
                                    className="rounded-circle shadow"
                                    style={{ width: '150px', height: '150px', objectFit: 'cover', border: '6px solid #18181b', backgroundColor: '#27272a' }}
                                />
                            ) : (
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center shadow"
                                    style={{ width: '150px', height: '150px', border: '6px solid #18181b', backgroundColor: themePurple, fontSize: '4rem', fontWeight: 'bold', color: '#fff' }}
                                >
                                    {initiala}
                                </div>
                            )}
                        </div>

                        <div className="text-center text-md-start flex-grow-1 mt-2 w-100">
                            <h2 className="fw-bold text-white mb-3" style={{ fontSize: '2.2rem', letterSpacing: '-0.5px' }}>{profileData.nume}</h2>

                            <div className="d-flex flex-wrap justify-content-center justify-content-md-start gap-2 mb-4">
                                <span className="badge rounded-pill px-3 py-2 d-flex align-items-center gap-2" style={{ backgroundColor: 'rgba(147, 51, 234, 0.15)', color: '#d8b4fe', border: '1px solid rgba(147, 51, 234, 0.3)' }}>
                                    <Cake size={14} strokeWidth={2.5} /> Age: {profileData.varsta ? `${profileData.varsta} years` : 'Not specified'}
                                </span>

                                <span className="badge rounded-pill px-3 py-2 d-flex align-items-center gap-2" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                                    <UserIcon size={14} strokeWidth={2.5} /> Gender: {profileData.sex || 'Not specified'}
                                </span>

                                <span className="badge rounded-pill px-3 py-2 d-flex align-items-center gap-2" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                    <MapPin size={14} strokeWidth={2.5} /> Location: {profileData.location || 'Not specified'}
                                </span>

                                <span className="badge rounded-pill px-3 py-2 d-flex align-items-center gap-2" style={{ backgroundColor: 'rgba(244, 114, 182, 0.15)', color: '#f9a8d4', border: '1px solid rgba(244, 114, 182, 0.3)' }}>
                                    <CalendarHeart size={14} strokeWidth={2.5} /> Born on: {profileData.birthday ? new Date(profileData.birthday).toLocaleDateString('en-US') : 'Not specified'}
                                </span>
                            </div>

                            <div>
                                <small className="d-block mb-3 text-uppercase" style={{ letterSpacing: '2px', fontFamily: '"Playfair Display", serif', color: '#a1a1aa', fontWeight: '700', fontSize: '0.85rem' }}>Favorite Genres</small>
                                <div className="d-flex flex-wrap justify-content-center justify-content-md-start gap-2">
                                    {profileData.genuri_preferate ? (
                                        profileData.genuri_preferate.replace(/[\[\]"']/g, '').split(',').map((gen, idx) => {
                                            const cleanGen = gen.trim();
                                            if (!cleanGen) return null;
                                            return (
                                                <span key={idx} className="badge bg-transparent border border-secondary text-light px-3 py-2 rounded-pill">
                                                    {cleanGen}
                                                </span>
                                            );
                                        })
                                    ) : (
                                        <span className="text-white-50 fst-italic" style={{ fontSize: '0.9rem' }}>No genres added.</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-top border-secondary border-opacity-25 w-100">
                                <div className="d-flex justify-content-between align-items-end mb-2">
                                    <div>
                                        <small className="d-block text-uppercase mb-2" style={{ letterSpacing: '2px', fontFamily: '"Playfair Display", serif', color: '#a1a1aa', fontWeight: '700', fontSize: '0.85rem' }}>
                                            {new Date().getFullYear()} Reading Challenge
                                        </small>
                                        <span className="text-white" style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', fontWeight: '700' }}>
                                            {booksReadThisYear} / {yearlyGoal} <span className="text-white-50 ms-1" style={{ fontFamily: '"Lora", serif', fontSize: '1.05rem', fontStyle: 'italic', textTransform: 'none', letterSpacing: '0', fontWeight: '400' }}>books read</span>
                                        </span>
                                    </div>
                                    <strong style={{ color: themePurple, fontSize: '1.2rem', fontFamily: '"Playfair Display", serif' }}>
                                        {goalPercentage}%
                                    </strong>
                                </div>
                                <div className="progress" style={{ height: '8px', backgroundColor: '#27272a', borderRadius: '10px' }}>
                                    <div
                                        className="progress-bar progress-bar-striped progress-bar-animated"
                                        role="progressbar"
                                        style={{
                                            width: `${goalPercentage}%`,
                                            backgroundColor: themePurple,
                                            boxShadow: '0 0 10px rgba(147, 51, 234, 0.5)'
                                        }}
                                    ></div>
                                </div>
                            </div>

                        </div>

                        <div className="d-flex flex-row flex-md-column gap-3 mt-5 mt-md-5 pt-md-4 ms-md-auto pe-md-2">
                            <div className="text-center px-4 py-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', minWidth: '100px' }}>
                                <h3 className="fw-bold mb-0" style={{ color: themePurple, fontFamily: '"Playfair Display", serif', fontSize: '2.5rem' }}>{stats.read}</h3>
                                <small className="text-white-50" style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: '0.95rem' }}>Books read</small>
                            </div>
                            <div className="text-center px-4 py-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', minWidth: '100px' }}>
                                <h3 className="fw-bold text-white mb-0" style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.5rem' }}>{stats.reading}</h3>
                                <small className="text-white-50" style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: '0.95rem' }}>Reading now</small>
                            </div>
                        </div>
                    </div>
                </div>

                <h4 className="fw-bold text-white mb-4 mt-5" style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.8rem' }}>
                    Recent Activity
                </h4>

                {activities.length === 0 ? (
                    <div className="text-center py-5 rounded" style={{ backgroundColor: '#18181b', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <Inbox size={48} strokeWidth={1} style={{ opacity: 0.3, marginBottom: '15px', color: '#a1a1aa' }} />
                        <h5 className="text-white-50" style={{ fontFamily: '"Lora", serif' }}>You don't have any activity yet.</h5>
                        <p className="text-muted">Start adding books to your library to build your history!</p>
                    </div>
                ) : (
                    <div className="position-relative" style={{ borderLeft: `2px solid rgba(147, 51, 234, 0.3)`, marginLeft: '20px', paddingLeft: '30px' }}>
                        {activities.map((act) => (
                            <div key={act.id} className="mb-5 position-relative">
                                <div
                                    className="position-absolute rounded-circle d-flex align-items-center justify-content-center shadow"
                                    style={{
                                        width: '36px', height: '36px',
                                        left: '-49px', top: '0',
                                        backgroundColor: '#18181b',
                                        border: `2px solid ${themePurple}`,
                                    }}
                                >
                                    {act.type === 'WANT_TO_READ' && <Bookmark size={16} strokeWidth={2.5} color={themePurple} />}
                                    {act.type === 'READING' && <BookOpen size={16} strokeWidth={2.5} color="#38bdf8" />}
                                    {act.type === 'READ' && <BookCheck size={16} strokeWidth={2.5} color="#10b981" />}
                                    {act.type === 'RATED' && <Star size={16} strokeWidth={2.5} color="#f59e0b" />}
                                    {act.type === 'REVIEWED' && <PenLine size={16} strokeWidth={2.5} color="#f472b6" />}
                                    {act.type === 'PROGRESS' && <TrendingUp size={16} strokeWidth={2.5} color={themePurple} />}
                                </div>

                                <div
                                    className="card transition-hover"
                                    style={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer' }}
                                    onClick={() => navigate(`/book/${act.book.id}`)}
                                >
                                    <div className="card-body p-3 d-flex align-items-start gap-3">
                                        <img
                                            src={act.book.coperta_url || 'https://via.placeholder.com/50x75'}
                                            alt={act.book.titlu}
                                            style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                                        />
                                        <div className="w-100">
                                            <p className="mb-1" style={{ fontSize: '1.05rem', color: '#e4e4e7', lineHeight: '1.4' }}>
                                                {act.type === 'WANT_TO_READ' && <span>You added <strong>{act.book.titlu}</strong> to your <em>Want to read</em> list.</span>}
                                                {act.type === 'READING' && <span>You started reading <strong>{act.book.titlu}</strong>.</span>}
                                                {act.type === 'READ' && <span>You finished reading <strong>{act.book.titlu}</strong>.</span>}
                                                {act.type === 'RATED' && <span>You rated <strong>{act.book.titlu}</strong> with <span style={{ color: '#f59e0b' }}>{'★'.repeat(act.rating)}</span>.</span>}
                                                {act.type === 'PROGRESS' && <span>You reached page <strong style={{ color: themePurple }}>{act.page}</strong> in <strong>{act.book.titlu}</strong>.</span>}
                                                {act.type === 'REVIEWED' && <span>You wrote a review for <strong>{act.book.titlu}</strong>.</span>}
                                            </p>

                                            {act.type === 'REVIEWED' && typeof act.text === 'string' && act.text.trim().length > 0 && (
                                                <div
                                                    className="p-3 mt-3 mb-1 rounded shadow-sm"
                                                    style={{
                                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                                        fontSize: '0.95rem',
                                                        fontStyle: 'italic',
                                                        fontFamily: '"Lora", serif',
                                                        borderLeft: `3px solid ${themePurple}`,
                                                        color: '#e4e4e7',
                                                        whiteSpace: 'pre-wrap',
                                                        lineHeight: '1.6'
                                                    }}
                                                >
                                                    "{act.text}"
                                                </div>
                                            )}

                                            <small className="d-block mt-2" style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>{formatDate(act.date)}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;