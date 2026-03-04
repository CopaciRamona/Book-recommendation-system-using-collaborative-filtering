import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const statusToDb = {
    'Vreau să citesc': 'want_to_read',
    'În curs de citire': 'reading',
    'Citită': 'read'
};

const dbToStatus = {
    'want_to_read': 'Vreau să citesc',
    'reading': 'În curs de citire',
    'read': 'Citită'
};

const formatReviewDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

const ExpandableReview = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const maxLength = 250; 

    if (!text) return null;

    if (text.length <= maxLength) {
        return <p className="text-light mb-0" style={{ lineHeight: '1.7', fontSize: '0.95rem', whiteSpace: 'pre-line', wordBreak: 'break-word', fontFamily: '"Lora", serif' }}>{text}</p>;
    }

    return (
        <div style={{ fontFamily: '"Lora", serif' }}>
            <p className="text-light mb-1" style={{ lineHeight: '1.7', fontSize: '0.95rem', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                {isExpanded ? text : `${text.substring(0, maxLength)}...`}
            </p>
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="btn btn-link p-0 text-decoration-none transition-hover mt-1"
                style={{ color: '#d8b4fe', fontSize: '0.9rem', fontWeight: '500' }}
            >
                {isExpanded ? 'Vezi mai puțin ▲' : 'Vezi mai mult ▼'}
            </button>
        </div>
    );
};

const BookDetails = () => {
    const { id } = useParams(); 
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const themePurple = '#9333ea';

    const [isInLibrary, setIsInLibrary] = useState(false);
    const [readingStatus, setReadingStatus] = useState('Adaugă în listă');
    const [userRating, setUserRating] = useState(0); 
    const [hoverRating, setHoverRating] = useState(0); 
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateSuccessMsg, setDateSuccessMsg] = useState('');

    const [currentPage, setCurrentPage] = useState('');
    const [progressPercent, setProgressPercent] = useState(0);
    const [progressMsg, setProgressMsg] = useState('');

    const [myReviewId, setMyReviewId] = useState(null); 
    const [myReviewText, setMyReviewText] = useState('');
    const [hasReviewed, setHasReviewed] = useState(false);
    const [isEditingReview, setIsEditingReview] = useState(false); 
    const [reviewMsg, setReviewMsg] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const bookRes = await api.get(`/books/${id}`);
                setBook(bookRes.data.book);

                const libRes = await api.get(`/library/check/${id}`);
                if (libRes.data.inLibrary) {
                    setIsInLibrary(true);
                    setReadingStatus(dbToStatus[libRes.data.userBook.status] || 'Adaugă în listă');
                    setUserRating(libRes.data.userBook.rating || 0);
                    setStartDate(libRes.data.userBook.data_incepere || '');
                    setEndDate(libRes.data.userBook.data_terminare || '');
                    
                    // PRELUĂM PAGINA CURENTĂ ȘI CALCULĂM PROCENTUL INIȚIAL
                    const savedPage = libRes.data.userBook.pagina_curenta || 0;
                    setCurrentPage(savedPage);
                    const totalPages = bookRes.data.book.numar_pagini ? parseInt(bookRes.data.book.numar_pagini.replace(/\D/g, ''), 10) : 0;
                    if (totalPages > 0) {
                        setProgressPercent(Math.min(100, Math.round((savedPage / totalPages) * 100)));
                    }
                } else {
                    setIsInLibrary(false);
                    setReadingStatus('Adaugă în listă');
                    setUserRating(0);
                    setStartDate('');
                    setEndDate('');
                    setCurrentPage('');
                    setProgressPercent(0);
                }

                try {
                    const reviewRes = await api.get(`/reviews/check/${id}`);
                    if (reviewRes.data.hasReviewed) {
                        setHasReviewed(true);
                        setMyReviewId(reviewRes.data.review.id); 
                        setMyReviewText(reviewRes.data.review.text_recenzie || '');
                    }
                } catch (revErr) {
                    console.log("Nu am găsit recenzie anterioară.");
                }

            } catch (err) {
                setError("Nu am putut încărca detaliile.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const saveToLibrary = async (statusRomana, nota, dataInceput = startDate, dataSfarsit = endDate) => {
        try {
            const statusPentruDb = statusToDb[statusRomana];
            if (!statusPentruDb) return;

            await api.post('/library/update-status', {
                bookId: id,
                status: statusPentruDb,
                rating: nota,
                data_incepere: dataInceput || null,
                data_terminare: dataSfarsit || null
            });
            setIsInLibrary(true); 
        } catch (err) {
            console.error("Eroare la salvare:", err);
            alert("A apărut o eroare la salvarea cărții.");
        }
    };

    const removeFromLibrary = async () => {
        try {
            await api.delete(`/library/remove/${id}`);
            setIsInLibrary(false);
            setReadingStatus('Adaugă în listă');
            setUserRating(0);
            setStartDate('');
            setEndDate('');
            setCurrentPage('');
            setProgressPercent(0);
            setIsMenuOpen(false);
        } catch (err) {
            console.error("Eroare la ștergere:", err);
            alert("Nu am putut șterge cartea din listă.");
        }
    };

    const handleSchimbaRaft = (statusNou) => {
        setReadingStatus(statusNou);
        setIsMenuOpen(false);
        saveToLibrary(statusNou, userRating);
    };

    const handleApasareStea = (nota) => {
        setUserRating(nota);
        setReadingStatus('Citită'); 
        saveToLibrary('Citită', nota);
    };

    const handleStartDateChange = (e) => {
        setStartDate(e.target.value);
        setDateSuccessMsg(''); 
    };

    const handleEndDateChange = (e) => {
        setEndDate(e.target.value);
        setDateSuccessMsg(''); 
    };

    const handleSaveDates = async () => {
        await saveToLibrary(readingStatus, userRating, startDate, endDate);
        setDateSuccessMsg('Datele au fost salvate cu succes! ✅');
        setTimeout(() => setDateSuccessMsg(''), 3000);
    };

    // ========================================================
    // LOGICA NOUĂ PENTRU ACTUALIZARE PROGRES (LEAGATĂ LA BACKEND)
    // ========================================================
    const handleUpdateProgress = async () => {
        if (currentPage === '' || currentPage < 0) return;

        try {
            // Trimitem la backend ruta de update
            const res = await api.put('/library/update-progress', {
                bookId: id,
                pagina_curenta: currentPage
            });

            const newPercentage = res.data.procentaj;
            setProgressPercent(newPercentage);
            
            // Dacă i-a pus pagina maximă din greșeală, luăm valoarea curățată de backend
            setCurrentPage(res.data.userBook.pagina_curenta); 

            if (newPercentage >= 100) {
                setReadingStatus('Citită');
                const azi = new Date().toISOString().split('T')[0];
                setEndDate(azi);
                await saveToLibrary('Citită', userRating, startDate, azi);
                setProgressMsg('Felicitări! Ai terminat cartea! 🎉');
            } else {
                setProgressMsg('Progres salvat! 🚀');
            }
            
            setTimeout(() => setProgressMsg(''), 3000);
        } catch (err) {
            console.error("Eroare la salvarea progresului", err);
            setProgressMsg('❌ Eroare la salvare.');
            setTimeout(() => setProgressMsg(''), 3000);
        }
    };

    const handleSubmitReview = async () => {
        if (userRating === 0) {
            setReviewMsg('⭐ Te rog acordă o notă (stele) înainte de a posta!');
            setTimeout(() => setReviewMsg(''), 4000);
            return;
        }
        if (!myReviewText.trim()) {
            setReviewMsg('✍️ Te rog scrie un text pentru recenzie.');
            setTimeout(() => setReviewMsg(''), 4000);
            return;
        }

        try {
            if (hasReviewed && myReviewId) {
                await api.put(`/reviews/${myReviewId}`, {
                    rating: userRating,
                    text_recenzie: myReviewText
                });
                setReviewMsg('Recenzia a fost actualizată! ✅');
            } else {
                const res = await api.post('/reviews', {
                    bookId: id,
                    rating: userRating,
                    text_recenzie: myReviewText
                });
                if (res.data.review && res.data.review.id) {
                    setMyReviewId(res.data.review.id);
                }
                setHasReviewed(true);
                setReviewMsg('Recenzia a fost salvată! ✅');
            }
            
            setIsEditingReview(false); 
            
            const bookRes = await api.get(`/books/${id}`);
            setBook(bookRes.data.book);
            
            setTimeout(() => setReviewMsg(''), 3000);
        } catch (err) {
            console.error("Eroare la postarea recenziei", err);
            setReviewMsg('❌ Eroare la salvarea recenziei.');
        }
    };

    const handleDeleteReview = async () => {
        if (!window.confirm("Ești sigur că vrei să ștergi recenzia definitiv?")) return;

        try {
            await api.delete(`/reviews/${myReviewId}`);
            setHasReviewed(false);
            setMyReviewId(null);
            setMyReviewText('');
            setIsEditingReview(false);
            setReviewMsg('Recenzia a fost ștearsă.');
            
            const bookRes = await api.get(`/books/${id}`);
            setBook(bookRes.data.book);

            setTimeout(() => setReviewMsg(''), 3000);
        } catch (err) {
            console.error("Eroare la ștergerea recenziei", err);
            alert("A apărut o eroare la ștergere.");
        }
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        const cifre = String(num).replace(/\D/g, ''); 
        return cifre ? Number(cifre).toLocaleString('ro-RO') : '0';
    };

    const renderDramaticDescription = (text) => {
        if (!text) return "Fără descriere.";
        
        let cleanText = text
            .replace(/\.\.\.([a-zA-Z])/g, '... $1') 
            .replace(/([.!?])([A-Z])/g, '$1 $2');   

        const match = cleanText.match(/^.*?[.!?](?:\s+|$)/); 
        
        if (match && match[0].length < 200) {
            const firstSentence = match[0];
            const restOfText = cleanText.slice(firstSentence.length);
            
            return (
                <div style={{ wordBreak: 'break-word', fontFamily: '"Lora", serif' }}>
                    <span style={{ 
                        fontFamily: '"Playfair Display", serif', 
                        fontSize: '1.65rem', 
                        fontWeight: '700', 
                        color: '#ffffff', 
                        marginRight: '8px',
                        letterSpacing: '0.2px',
                        lineHeight: '1.3'
                    }}>
                        {firstSentence}
                    </span>
                    <span style={{ 
                        fontSize: '1.08rem', 
                        lineHeight: '2', 
                        fontWeight: '400', 
                        color: '#d4d4d8', 
                        letterSpacing: '0.3px'
                    }}>
                        {restOfText}
                    </span>
                </div>
            );
        }
        
        return (
            <p style={{ 
                fontFamily: '"Lora", serif',
                fontSize: '1.08rem', 
                lineHeight: '2', 
                fontWeight: '400', 
                color: '#d4d4d8', 
                letterSpacing: '0.3px',
                wordBreak: 'break-word' 
            }}>
                {cleanText}
            </p>
        );
    };

    if (loading) return <div className="text-center text-white mt-5">Se încarcă...</div>;
    if (error || !book) return <div className="text-center text-danger mt-5">{error}</div>;

    const myReview = book.appReviews ? book.appReviews.find(rev => rev.id === myReviewId) : null;
    const myNota = Math.max(0, Math.min(5, parseInt(myReview?.rating, 10) || userRating));
    const myNumeUser = myReview?.user?.nume || 'Utilizator';
    const myInitial = myNumeUser.charAt(0).toUpperCase();

    let myProfilePicUrl = null;
    if (myReview?.user?.profile_picture) {
        if (myReview.user.profile_picture.startsWith('http')) {
            myProfilePicUrl = myReview.user.profile_picture;
        } else {
            const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';
            const imagePath = myReview.user.profile_picture.startsWith('/') 
                ? myReview.user.profile_picture 
                : `/${myReview.user.profile_picture}`;
            myProfilePicUrl = `${baseUrl}${imagePath}`;
        }
    }

    const communityReviews = book.appReviews ? book.appReviews.filter(rev => rev.id !== myReviewId) : [];

    const totalPagesNum = book.numar_pagini ? parseInt(book.numar_pagini.replace(/\D/g, ''), 10) : 0;

    return (
        <div style={{ backgroundColor: '#09090b', color: '#e4e4e7', minHeight: '100vh', overflowX: 'hidden' }} className="py-4">
            <div className="container" style={{ maxWidth: '1100px' }}>
                <Link to="/home" className="text-white text-decoration-none mb-4 d-inline-block transition-hover">
                    ← Întoarce-te la recomandări
                </Link>

                <div className="row gx-4 gy-5 justify-content-center">
                    
                    <div className="col-12 col-md-4 col-lg-3 text-center text-md-start">
                        <img 
                            src={book.coperta_url || 'https://via.placeholder.com/300x450'} 
                            alt={book.titlu} 
                            className="img-fluid rounded shadow-lg mb-4 w-100 mx-auto d-block"
                            style={{ maxWidth: '280px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        
                        <div className="position-relative w-100 mb-4 text-center mx-auto" style={{ maxWidth: '280px' }}>
                            <button 
                                className="btn w-100 text-white d-flex justify-content-center align-items-center position-relative"
                                style={{ 
                                    backgroundColor: isInLibrary ? themePurple : '#27272a',
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    borderRadius: '50px', 
                                    fontFamily: '"Inter", sans-serif',
                                    fontSize: '0.95rem', fontWeight: '500', letterSpacing: '0.8px', padding: '12px 20px',
                                    boxShadow: isInLibrary ? '0 4px 15px rgba(147, 51, 234, 0.4)' : 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <span>{readingStatus}</span>
                                <span style={{ fontSize: '0.7rem', position: 'absolute', right: '20px' }}>
                                    {isMenuOpen ? '▲' : '▼'}
                                </span>
                            </button>

                            {isMenuOpen && (
                                <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1040 }} onClick={() => setIsMenuOpen(false)}></div>
                            )}

                            {isMenuOpen && (
                                <div className="position-absolute w-100 mt-2 shadow-lg" style={{ zIndex: 1050, backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid rgba(147, 51, 234, 0.3)', overflow: 'hidden' }}>
                                    {['Vreau să citesc', 'În curs de citire', 'Citită'].map((status) => (
                                        <div 
                                            key={status}
                                            onClick={() => handleSchimbaRaft(status)}
                                            className="text-white p-3 text-center transition-hover"
                                            style={{ 
                                                cursor: 'pointer', fontFamily: '"Inter", sans-serif', fontSize: '0.95rem',
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                backgroundColor: readingStatus === status ? 'rgba(147, 51, 234, 0.2)' : 'transparent'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(147, 51, 234, 0.4)'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = readingStatus === status ? 'rgba(147, 51, 234, 0.2)' : 'transparent'}
                                        >
                                            {status}
                                        </div>
                                    ))}
                                    {isInLibrary && (
                                        <div 
                                            onClick={removeFromLibrary}
                                            className="p-3 text-center transition-hover"
                                            style={{ cursor: 'pointer', fontFamily: '"Inter", sans-serif', fontSize: '0.9rem', color: '#ef4444', fontWeight: '500' }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            Șterge din listă
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="text-center w-100 mb-4 mx-auto" style={{ maxWidth: '280px' }}>
                            <small className="text-white d-block mb-2 fw-medium">Evaluează această carte</small>
                            <div className="d-flex justify-content-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span 
                                        key={star}
                                        style={{ 
                                            cursor: 'pointer', fontSize: '2rem', lineHeight: '1',
                                            color: star <= (hoverRating || userRating) ? '#f59e0b' : '#3f3f46',
                                            transition: 'color 0.2s ease-in-out'
                                        }}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onClick={() => handleApasareStea(star)}
                                    >
                                        {star <= (hoverRating || userRating) ? '★' : '☆'}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {readingStatus === 'În curs de citire' && totalPagesNum > 0 && (
                            <div className="p-3 rounded mb-4 mx-auto shadow-sm" style={{ backgroundColor: '#18181b', border: `1px solid rgba(147, 51, 234, 0.3)`, maxWidth: '280px' }}>
                                <small className="text-white d-block mb-3 fw-medium text-center" style={{ letterSpacing: '0.5px' }}>
                                    PROGRES LECTURĂ
                                </small>
                                
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Pagina curentă:</span>
                                    <div className="d-flex align-items-center">
                                        <input 
                                            type="number" 
                                            className="form-control form-control-sm text-center text-white" 
                                            style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', width: '65px', padding: '2px' }}
                                            value={currentPage}
                                            onChange={(e) => setCurrentPage(e.target.value)}
                                            min="0"
                                            max={totalPagesNum}
                                        />
                                        <span className="ms-2" style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>/ {totalPagesNum}</span>
                                    </div>
                                </div>

                                <div className="progress mt-3 mb-2" style={{ height: '8px', backgroundColor: '#27272a', borderRadius: '10px' }}>
                                    <div 
                                        className="progress-bar progress-bar-striped progress-bar-animated" 
                                        role="progressbar" 
                                        style={{ width: `${progressPercent}%`, backgroundColor: themePurple, transition: 'width 0.5s ease' }}
                                    ></div>
                                </div>
                                <div className="text-end mb-3" style={{ fontSize: '0.8rem', color: '#d8b4fe', fontWeight: '500' }}>
                                    {progressPercent}% citit
                                </div>

                                <button 
                                    className="btn btn-sm w-100 transition-hover text-white" 
                                    style={{ backgroundColor: themePurple, fontWeight: '500', borderRadius: '8px' }}
                                    onClick={handleUpdateProgress}
                                >
                                    Actualizează
                                </button>
                                
                                {progressMsg && (
                                    <div className="text-center mt-2" style={{ color: progressMsg.includes('Felicitări') ? '#f59e0b' : '#10b981', fontSize: '0.85rem', animation: 'fadeIn 0.3s' }}>
                                        {progressMsg}
                                    </div>
                                )}
                            </div>
                        )}

                        {readingStatus === 'Citită' && (
                            <div className="p-3 rounded mb-4 mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '280px' }}>
                                <small className="text-white-50 d-block mb-3 fw-medium text-center" style={{ letterSpacing: '0.5px' }}>
                                    JURNAL DE LECTURĂ
                                </small>
                                <div className="d-flex flex-column gap-3 text-start">
                                    <div>
                                        <span className="d-block mb-1" style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Începută:</span>
                                        <input 
                                            type="date" 
                                            className="form-control form-control-sm text-white w-100" 
                                            style={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark', fontSize: '0.85rem' }}
                                            value={startDate}
                                            onChange={handleStartDateChange}
                                        />
                                    </div>
                                    <div>
                                        <span className="d-block mb-1" style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Terminată:</span>
                                        <input 
                                            type="date" 
                                            className="form-control form-control-sm text-white w-100" 
                                            style={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark', fontSize: '0.85rem' }}
                                            value={endDate}
                                            onChange={handleEndDateChange}
                                        />
                                    </div>
                                    <button 
                                        className="btn btn-sm w-100 mt-1 transition-hover" 
                                        style={{ backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#d8b4fe', border: '1px solid rgba(147, 51, 234, 0.4)', fontWeight: '500' }}
                                        onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(147, 51, 234, 0.4)'; e.target.style.color = '#fff'; }}
                                        onMouseLeave={(e) => { e.target.style.backgroundColor = 'rgba(147, 51, 234, 0.2)'; e.target.style.color = '#d8b4fe'; }}
                                        onClick={handleSaveDates}
                                    >
                                        Salvează datele
                                    </button>
                                    {dateSuccessMsg && <div className="text-center mt-1" style={{ color: '#10b981', fontSize: '0.85rem', animation: 'fadeIn 0.3s' }}>{dateSuccessMsg}</div>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="col-12 col-md-8 col-lg-9">
                        <h1 className="mb-2 text-white fw-bold" style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2.5rem, 6vw, 4rem)', letterSpacing: '-1.5px' }}>
                            {book.titlu}
                        </h1>
                        <h4 className="mb-4" style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', color: '#a1a1aa', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>
                            de {book.autor}
                        </h4>
                        
                        <div className="d-flex align-items-center flex-wrap mb-4 mb-md-5 gap-2">
                            <div className="me-2" style={{ color: '#f59e0b', fontSize: '1.4rem' }}>★★★★☆</div>
                            <span className="fs-3 fw-bold text-white me-2">{book.rating_mediu || 'N/A'}</span>
                            <span className="text-white-50">{formatNumber(book.numar_voturi)} evaluări</span>
                        </div>

                        <div className="mb-5">{renderDramaticDescription(book.descriere)}</div>
                        
                        {book.genuri && (
                            <div className="mb-5 d-flex flex-wrap gap-2">
                                <span className="text-white-50 me-2 d-flex align-items-center small">Genuri:</span>
                                {book.genuri.split(',').slice(0, 6).map((genre, i) => {
                                    const clean = genre.replace(/[\[\]"']/g, '').trim();
                                    return clean ? <span key={i} className="badge rounded-pill border border-secondary px-3 py-2 text-light" style={{ fontFamily: '"Inter", sans-serif' }}>{clean}</span> : null;
                                })}
                            </div>
                        )}

                        <hr className="border-secondary opacity-25 mb-4 mt-5" />
                        
                        <div style={{ fontFamily: '"Lora", serif', fontSize: '1.05rem', lineHeight: '1.6', color: '#e4e4e7' }}>
                            {book.format_carte && (
                                <div className="d-flex align-items-start mb-3">
                                    <span style={{ color: themePurple, marginRight: '14px', fontSize: '0.65rem', marginTop: '6px', filter: 'drop-shadow(0 0 5px rgba(147, 51, 234, 0.6))' }}>●</span> 
                                    <div><span style={{ color: '#a1a1aa', marginRight: '8px', letterSpacing: '0.5px' }}>Format:</span> <span className="fw-medium text-white">{book.format_carte.replace(/[\[\]"']/g, '').trim()}</span></div>
                                </div>
                            )}
                            {book.numar_pagini && (
                                <div className="d-flex align-items-start mb-3">
                                    <span style={{ color: themePurple, marginRight: '14px', fontSize: '0.65rem', marginTop: '6px', filter: 'drop-shadow(0 0 5px rgba(147, 51, 234, 0.6))' }}>●</span> 
                                    <div><span style={{ color: '#a1a1aa', marginRight: '8px', letterSpacing: '0.5px' }}>Număr pagini:</span> <span className="fw-medium text-white">{book.numar_pagini.replace(/[\[\]"']/g, '').trim()}</span></div>
                                </div>
                            )}
                            {book.publication_info && (
                                <div className="d-flex align-items-start mb-3">
                                    <span style={{ color: themePurple, marginRight: '14px', fontSize: '0.65rem', marginTop: '6px', filter: 'drop-shadow(0 0 5px rgba(147, 51, 234, 0.6))' }}>●</span> 
                                    <div><span style={{ color: '#a1a1aa', marginRight: '8px', letterSpacing: '0.5px' }}>Publicație:</span> <span className="fw-medium text-white">{book.publication_info.replace(/[\[\]"']/g, '').trim()}</span></div>
                                </div>
                            )}
                            {book.isbn13 && (
                                <div className="d-flex align-items-start mb-3">
                                    <span style={{ color: themePurple, marginRight: '14px', fontSize: '0.65rem', marginTop: '6px', filter: 'drop-shadow(0 0 5px rgba(147, 51, 234, 0.6))' }}>●</span> 
                                    <div><span style={{ color: '#a1a1aa', marginRight: '8px', letterSpacing: '0.5px' }}>ISBN:</span> <span className="fw-medium text-white" style={{ letterSpacing: '1px' }}>{book.isbn13.replace(/[\[\]"']/g, '').trim()}</span></div>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 pt-4 border-top border-secondary border-opacity-25">
                            <h3 className="mb-4 text-white fw-bold" style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>Recenzii</h3>

                            {(!hasReviewed || isEditingReview) && (
                                <div className="mb-5 p-3 p-sm-4 rounded shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h5 className="text-white mb-3" style={{ fontWeight: '600' }}>
                                        {hasReviewed ? 'Actualizează recenzia ta' : 'Scrie o recenzie'}
                                    </h5>
                                    <textarea
                                        className="form-control text-white mb-3 shadow-none"
                                        style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', minHeight: '110px', resize: 'none', fontFamily: '"Lora", serif' }}
                                        placeholder="Ce părere ai despre această carte? Scrie câteva rânduri..."
                                        value={myReviewText}
                                        onChange={(e) => setMyReviewText(e.target.value)}
                                    ></textarea>
                                    <div className="d-flex align-items-center flex-wrap gap-2">
                                        <button
                                            className="btn text-white px-4 fw-medium transition-hover"
                                            style={{ backgroundColor: themePurple, borderRadius: '50px' }}
                                            onClick={handleSubmitReview}
                                        >
                                            {hasReviewed ? 'Salvează modificările' : 'Postează recenzia'}
                                        </button>
                                        
                                        {hasReviewed && (
                                            <button 
                                                className="btn btn-link text-white-50 text-decoration-none"
                                                onClick={() => { setIsEditingReview(false); setReviewMsg(''); }}
                                            >
                                                Anulează
                                            </button>
                                        )}
                                        
                                        {reviewMsg && <span className="fw-medium w-100 mt-1" style={{ color: reviewMsg.includes('Eroare') || reviewMsg.includes('Te rog') ? '#ef4444' : '#10b981', fontSize: '0.9rem' }}>{reviewMsg}</span>}
                                    </div>
                                </div>
                            )}

                            {((hasReviewed && !isEditingReview && myReview) || communityReviews.length > 0) && (
                                <div className="mb-5">
                                    <h5 className="text-white-50 mb-4" style={{ letterSpacing: '0.5px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Din Comunitate</h5>

                                    {(hasReviewed && !isEditingReview && myReview) && (
                                        <div className="mb-4 p-3 p-sm-4 rounded shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.05)', borderLeft: `3px solid ${themePurple}` }}>
                                            <div className="d-flex flex-column flex-sm-row align-items-start justify-content-between mb-3 gap-3">
                                                
                                                <div className="d-flex align-items-center">
                                                    {myProfilePicUrl ? (
                                                        <img 
                                                            src={myProfilePicUrl} 
                                                            alt="avatar" 
                                                            className="rounded-circle me-3 border border-secondary" 
                                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div className="rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: themePurple, color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                            {myInitial}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <strong className="text-white fs-6 d-block">{myNumeUser}</strong>
                                                        <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{formatReviewDate(myReview.createdAt)}</span>
                                                    </div>
                                                </div>

                                                <div className="d-flex flex-row flex-sm-column align-items-center align-items-sm-end gap-2 w-100 w-sm-auto justify-content-between justify-content-sm-end">
                                                    <div className="d-flex align-items-center">
                                                        <div style={{ color: '#f59e0b', fontSize: '1.1rem', marginRight: '8px' }}>
                                                            {'★'.repeat(myNota)}{'☆'.repeat(5 - myNota)}
                                                        </div>
                                                        <span className="text-white-50 fw-medium" style={{ fontSize: '0.9rem' }}>{myNota}/5</span>
                                                    </div>

                                                    <div className="d-flex gap-2">
                                                        <button 
                                                            className="btn btn-sm transition-hover" 
                                                            style={{ backgroundColor: 'rgba(126, 34, 206, 0.15)', color: '#e9d5ff', border: '1px solid #7e22ce', borderRadius: '50px', padding: '2px 12px', fontSize: '0.8rem', fontWeight: '500' }}
                                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(126, 34, 206, 0.25)'}
                                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(126, 34, 206, 0.15)'}
                                                            onClick={() => setIsEditingReview(true)}
                                                        >
                                                            Editează
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm transition-hover" 
                                                            style={{ backgroundColor: 'rgba(185, 28, 28, 0.1)', color: '#ef4444', border: '1px solid #b91c1c', borderRadius: '50px', padding: '2px 12px', fontSize: '0.8rem', fontWeight: '500' }}
                                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(185, 28, 28, 0.2)'}
                                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(185, 28, 28, 0.1)'}
                                                            onClick={handleDeleteReview}
                                                        >
                                                            Șterge
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <ExpandableReview text={myReviewText} />
                                        </div>
                                    )}

                                    {communityReviews.map((rev) => {
                                        const nota = Math.max(0, Math.min(5, parseInt(rev.rating, 10) || 0));
                                        
                                        const numeUser = rev.user?.nume || 'Utilizator';
                                        const initiala = numeUser.charAt(0).toUpperCase();

                                        let profilePicUrl = null;
                                        if (rev.user?.profile_picture) {
                                            if (rev.user.profile_picture.startsWith('http')) {
                                                profilePicUrl = rev.user.profile_picture;
                                            } else {
                                                const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';
                                                const imagePath = rev.user.profile_picture.startsWith('/') 
                                                    ? rev.user.profile_picture 
                                                    : `/${rev.user.profile_picture}`;
                                                profilePicUrl = `${baseUrl}${imagePath}`;
                                            }
                                        }

                                        return (
                                            <div key={rev.id} className="mb-4 p-3 p-sm-4 rounded shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.03)', borderLeft: `3px solid ${themePurple}` }}>
                                                <div className="d-flex flex-column flex-sm-row align-items-start justify-content-between mb-3 gap-2">
                                                    
                                                    <div className="d-flex align-items-center">
                                                        {profilePicUrl ? (
                                                            <img 
                                                                src={profilePicUrl} 
                                                                alt="avatar" 
                                                                className="rounded-circle me-3 border border-secondary" 
                                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <div className="rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: themePurple, color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                                {initiala}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <strong className="text-white fs-6 d-block">{numeUser}</strong>
                                                            <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{formatReviewDate(rev.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="d-flex align-items-center mt-1 mt-sm-0">
                                                        <div style={{ color: '#f59e0b', fontSize: '1.1rem', marginRight: '8px' }}>
                                                            {'★'.repeat(nota)}{'☆'.repeat(5 - nota)}
                                                        </div>
                                                        <span className="text-white-50 fw-medium" style={{ fontSize: '0.9rem' }}>{nota}/5</span>
                                                    </div>
                                                </div>
                                                <ExpandableReview text={rev.text} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {book.goodreadsReviews && book.goodreadsReviews.length > 0 && (
                                <div className="mb-5">
                                    <h5 className="text-white-50 mb-4" style={{ letterSpacing: '0.5px', fontSize: '0.9rem', textTransform: 'uppercase' }}>De pe Goodreads</h5>
                                    {book.goodreadsReviews.map((rev) => {
                                        const reviewerName = rev.user_name || 'Cititor Goodreads';
                                        const initiala = reviewerName.charAt(0).toUpperCase();
                                        
                                        let nota = 0;
                                        if (rev.rating) {
                                            const match = String(rev.rating).match(/\d+/);
                                            if (match) {
                                                nota = parseInt(match[0], 10);
                                            }
                                        }
                                        nota = Math.max(0, Math.min(5, nota));

                                        return (
                                            <div key={rev.id} className="mb-4 p-3 p-sm-4 rounded shadow-sm" style={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.03)', borderLeft: `3px solid ${themePurple}` }}>
                                                <div className="d-flex flex-column flex-sm-row align-items-start justify-content-between mb-3 gap-2">
                                                    <div className="d-flex align-items-center">
                                                        <div className="rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: themePurple, color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                            {initiala}
                                                        </div>
                                                        <div>
                                                            <strong className="text-white fs-6 d-block">{reviewerName}</strong>
                                                            <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Goodreads • {rev.data_recenzie || ''}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {nota > 0 && (
                                                        <div className="d-flex align-items-center mt-1 mt-sm-0">
                                                            <div style={{ color: '#f59e0b', fontSize: '1.1rem', marginRight: '8px' }}>
                                                                {'★'.repeat(nota)}{'☆'.repeat(5 - nota)}
                                                            </div>
                                                            <span className="text-white-50 fw-medium" style={{ fontSize: '0.9rem' }}>{nota}/5</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <ExpandableReview text={rev.text} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookDetails;