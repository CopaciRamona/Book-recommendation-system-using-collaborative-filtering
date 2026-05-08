import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&display=swap';
fontLink.rel = 'stylesheet';
if (!document.querySelector(`link[href="${fontLink.href}"]`)) {
    document.head.appendChild(fontLink);
}


import { BookCheck, BookOpen, Bookmark, Inbox, CheckCircle, Flame, ChevronRight, Trophy } from 'lucide-react';

const Library = () => {
    const [activeTab, setActiveTab] = useState('read');
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [progressInputs, setProgressInputs] = useState({});
    const [progressMsgs, setProgressMsgs] = useState({});

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [bookToFinish, setBookToFinish] = useState(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const tabs = [
        { id: 'read', label: 'Read', Icon: BookCheck },
        { id: 'reading', label: 'Currently Reading', Icon: BookOpen },
        { id: 'want_to_read', label: 'Want to read', Icon: Bookmark }
    ];

    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/library/${activeTab}`);
                setBooks(response.data.books || []);
                setProgressInputs({});
                setProgressMsgs({});
            } catch (err) {
                console.error("Eroare la încărcarea bibliotecii:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLibrary();
    }, [activeTab]);

    const openFinishModal = (e, book) => {
        e.stopPropagation();
        setBookToFinish(book);
        setReviewRating(0);
        setHoverRating(0);
        setReviewText('');
        setShowReviewModal(true);
    };

    const handleQuickUpdateProgress = async (e, book) => {
        e.stopPropagation();

        const newPage = progressInputs[book.id];
        if (newPage === undefined || newPage === '') return;

        try {
            const res = await api.post('/library/update-progress', {
                bookId: book.id,
                pagina_curenta: newPage
            });

            const procentaj = res.data.procentaj;

            if (procentaj >= 100) {
                openFinishModal(e, book);
            } else {
                const updatedBooks = books.map(b => {
                    if (b.id === book.id) {
                        return {
                            ...b,
                            UserBook: {
                                ...b.UserBook,
                                pagina_curenta: res.data.userBook.pagina_curenta
                            }
                        };
                    }
                    return b;
                });
                setBooks(updatedBooks);

                setProgressMsgs(prev => ({ ...prev, [book.id]: '✅' }));
                setTimeout(() => setProgressMsgs(prev => ({ ...prev, [book.id]: null })), 2500);
            }
        } catch (error) {
            console.error("Eroare la actualizarea progresului", error);
            setProgressMsgs(prev => ({ ...prev, [book.id]: '❌' }));
            setTimeout(() => setProgressMsgs(prev => ({ ...prev, [book.id]: null })), 2500);
        }
    };

    const handleConfirmFinishBook = async () => {
        setIsSubmitting(true);
        try {
            await api.post('/library/update-status', {
                bookId: bookToFinish.id,
                status: 'read',
                rating: reviewRating > 0 ? reviewRating : null,
                data_terminare: new Date().toISOString().split('T')[0]
            });

            if (reviewText.trim()) {
                await api.post('/reviews', {
                    bookId: bookToFinish.id,
                    rating: reviewRating > 0 ? reviewRating : 5,
                    text_recenzie: reviewText
                });
            }

            setBooks(books.filter(b => b.id !== bookToFinish.id));
            setShowReviewModal(false);
            setBookToFinish(null);

        } catch (error) {
            console.error("Eroare la finalizarea cărții", error);
            alert("A apărut o eroare la salvare. Încearcă din nou.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#09090b', minHeight: '100vh', color: '#e4e4e7', position: 'relative' }} className="py-5">

            {/* MODALUL DE RECENZIE */}
            {showReviewModal && (
                <>
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100"
                        style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1040, backdropFilter: 'blur(5px)' }}
                        onClick={() => setShowReviewModal(false)}
                    ></div>

                    <div
                        className="position-fixed top-50 start-50 translate-middle shadow-lg rounded"
                        style={{ backgroundColor: '#18181b', border: '1px solid rgba(147, 51, 234, 0.4)', zIndex: 1050, width: '90%', maxWidth: '500px', padding: '30px' }}
                    >
                        <div className="text-center mb-4">
                            {/* --- ÎNLOCUIT EMOJI-UL 🎉 CU UN TROFEU ELEGANT --- */}
                            <Trophy size={48} strokeWidth={1} color="#d8b4fe" className="mb-3" />
                            <h3 className="text-white fw-bold mt-2" style={{ fontFamily: '"Playfair Display", serif' }}>
                                Congrats!
                            </h3>
                            <p className="text-white-50 mb-0" style={{ fontFamily: '"Lora", serif' }}>You finished the book! <strong>{bookToFinish?.titlu}</strong>.</p>
                        </div>

                        <div className="mb-4 text-center">
                            <small className="text-white-50 d-block mb-2 text-uppercase" style={{ letterSpacing: '1px' }}>Acordă o notă (opțional)</small>
                            <div className="d-flex justify-content-center gap-2" onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        style={{
                                            cursor: 'pointer', fontSize: '2.5rem', lineHeight: '1',
                                            color: star <= (hoverRating || reviewRating) ? '#f59e0b' : '#3f3f46',
                                            transition: 'color 0.2s ease-in-out'
                                        }}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onClick={() => setReviewRating(star)}
                                    >
                                        {star <= (hoverRating || reviewRating) ? '★' : '☆'}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <small className="text-white-50 d-block mb-2 text-uppercase" style={{ letterSpacing: '1px' }}>Write a review! </small>
                            <textarea
                                className="form-control text-white shadow-none"
                                style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', minHeight: '100px', resize: 'none', fontFamily: '"Lora", serif' }}
                                placeholder="Cum ți s-a părut cartea? Ce sentimente ți-a lăsat?"
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="d-flex gap-3">
                            <button
                                className="btn w-50 text-white-50 border border-secondary"
                                style={{ backgroundColor: 'transparent', borderRadius: '10px' }}
                                onClick={() => setShowReviewModal(false)}
                                disabled={isSubmitting}
                            >
                                Anulează
                            </button>
                            <button
                                className="btn w-50 text-white fw-bold"
                                style={{ backgroundColor: '#9333ea', borderRadius: '10px' }}
                                onClick={handleConfirmFinishBook}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Is saving...' : 'Saved to read'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* 1. ZONA TITLULUI */}
            <div className="container" style={{ maxWidth: '1300px' }}>
                <h1 className="mb-5 fw-bold text-white" style={{ fontSize: '2.8rem', fontFamily: '"Playfair Display", serif', letterSpacing: '-0.5px' }}>
                    My library
                </h1>
            </div>

            {/* 2. ZONA TAB-URILOR*/}
            <div style={{ margin: '0 -1.5rem 3rem -1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="container d-flex align-items-end" style={{ maxWidth: '1300px', gap: '2.5rem' }}>
                    {tabs.map((tab) => {
                        const TabIcon = tab.Icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="btn p-0 transition-hover d-flex align-items-center"
                                style={{
                                    backgroundColor: 'transparent',
                                    color: isActive ? '#ffffff' : '#858590',
                                    border: 'none',
                                    boxShadow: 'none',
                                    fontSize: isActive ? '1.2rem' : '1.15rem',
                                    fontFamily: '"Lora", serif',
                                    fontWeight: isActive ? '600' : '400',
                                    paddingBottom: '12px',
                                    position: 'relative',
                                    marginBottom: '-1px',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#d8b4fe'; }}
                                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#858590'; }}
                            >
                                <TabIcon
                                    size={20}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className="me-2 transition-all"
                                    style={{
                                        marginBottom: '2px',
                                        color: isActive ? '#c084fc' : 'inherit',
                                        filter: isActive ? 'drop-shadow(0 0 8px rgba(192, 132, 252, 0.5))' : 'none'
                                    }}
                                />
                                {tab.label}

                                {isActive && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '4px',
                                            backgroundColor: '#a855f7',
                                            borderRadius: '4px 4px 0 0',
                                            boxShadow: '0 -2px 12px rgba(168, 85, 247, 0.6)'
                                        }}
                                    ></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. ZONA DE CĂRȚI */}
            <div className="container" style={{ maxWidth: '1300px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border" role="status" style={{ color: '#9333ea', width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : books.length === 0 ? (
                    <div className="text-center py-5 mt-5">
                        <Inbox size={64} strokeWidth={1} style={{ opacity: 0.3, marginBottom: '20px', color: '#a1a1aa' }} />
                        <h4 className="text-white-50" style={{ fontFamily: '"Lora", serif' }}>You don't have any books on this shelve.</h4>
                        <button
                            className="btn mt-3 px-4 text-white"
                            style={{ backgroundColor: '#27272a', borderRadius: '50px' }}
                            onClick={() => navigate('/home')}
                        >
                            Go to recommendations
                        </button>
                    </div>
                ) : (
                    <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-5 mt-2">
                        {books.map((book) => {
                            const totalPagesNum = book.numar_pagini ? parseInt(book.numar_pagini.replace(/\D/g, ''), 10) : 0;
                            const savedPage = book.UserBook?.pagina_curenta || 0;
                            const typedPage = progressInputs[book.id] !== undefined ? progressInputs[book.id] : savedPage;
                            const currentValNum = parseInt(typedPage, 10) || 0;
                            const percent = totalPagesNum > 0 ? Math.min(100, Math.round((currentValNum / totalPagesNum) * 100)) : 0;

                            return (
                                <div className="col" key={book.id}>
                                    <div className="d-flex flex-column h-100 position-relative">

                                        <div
                                            className="d-flex justify-content-center align-items-end position-relative"
                                            style={{ height: '240px', paddingBottom: '12px', zIndex: 3, cursor: 'pointer' }}
                                            onClick={() => navigate(`/book/${book.id}`)}
                                        >
                                            {activeTab === 'reading' && percent >= 50 && (
                                                <div
                                                    className="position-absolute d-flex align-items-center"
                                                    style={{
                                                        top: '12px',
                                                        right: '-6px',
                                                        background: 'rgba(9, 9, 11, 0.9)',
                                                        backdropFilter: 'blur(4px)',
                                                        border: '1px solid rgba(255, 255, 255, 0.06)',
                                                        color: '#a1a1aa',
                                                        padding: '5px 10px',
                                                        borderRadius: '3px',
                                                        fontSize: '0.65rem',
                                                        fontWeight: '500',
                                                        letterSpacing: '1.5px',
                                                        textTransform: 'uppercase',
                                                        fontFamily: '"Inter", sans-serif',
                                                        boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
                                                        zIndex: 10
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '4px',
                                                        height: '4px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#c084fc',
                                                        marginRight: '6px',
                                                        boxShadow: '0 0 8px #c084fc'
                                                    }}></div>
                                                    Halfway
                                                </div>
                                            )}

                                            <img
                                                src={book.coperta_url || 'https://via.placeholder.com/200x300'}
                                                alt={book.titlu}
                                                style={{
                                                    width: '130px',
                                                    height: '200px',
                                                    objectFit: 'cover',
                                                    borderRadius: '2px 6px 6px 2px',
                                                    boxShadow: '-10px 10px 20px rgba(0,0,0,0.7), inset 3px 0 5px rgba(255,255,255,0.15)',
                                                    borderRight: '1px solid rgba(255,255,255,0.1)',
                                                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                                    transformOrigin: 'bottom center'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'perspective(500px) rotate(-3deg) translateY(-8px) scale(1.03)';
                                                    e.currentTarget.style.boxShadow = '-15px 15px 25px rgba(0,0,0,0.8), inset 3px 0 5px rgba(255,255,255,0.2)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'perspective(500px) rotate(0) translateY(0) scale(1)';
                                                    e.currentTarget.style.boxShadow = '-10px 10px 20px rgba(0,0,0,0.7), inset 3px 0 5px rgba(255,255,255,0.15)';
                                                }}
                                            />
                                        </div>

                                        {/* RAFTUL INDIVIDUAL */}
                                        <div className="position-relative w-100 d-flex justify-content-center" style={{ zIndex: 2 }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '-12px',
                                                width: '200px',
                                                height: '14px',
                                                background: 'linear-gradient(to bottom, #3f3f46 0%, #18181b 100%)',
                                                borderTop: '2px solid #52525b',
                                                borderRadius: '3px',
                                                boxShadow: '0 10px 20px rgba(0,0,0,0.8)'
                                            }}></div>
                                        </div>

                                        <div
                                            className="d-flex flex-column flex-grow-1 p-3 mt-4"
                                            style={{
                                                background: 'rgba(24, 24, 27, 0.5)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                zIndex: 1
                                            }}
                                        >
                                            <h6
                                                className="card-title text-white fw-bold mb-1 transition-hover"
                                                style={{ fontSize: '1.15rem', lineHeight: '1.2', cursor: 'pointer', fontFamily: '"Playfair Display", serif', letterSpacing: '0.3px' }}
                                                onClick={() => navigate(`/book/${book.id}`)}
                                            >
                                                {book.titlu}
                                            </h6>

                                            <span className="card-text mb-3 d-block" style={{ color: '#a1a1aa', fontSize: '0.9rem', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
                                                from {book.autor}
                                            </span>

                                            <div className="mb-3 mt-1">
                                                <span
                                                    style={{
                                                        fontSize: '0.9rem',
                                                        color: '#d8b4fe',
                                                        fontFamily: '"Lora", serif',
                                                        fontStyle: 'italic',
                                                        letterSpacing: '0.3px',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid transparent',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onClick={() => navigate(`/book/${book.id}`)}
                                                    onMouseEnter={(e) => { e.currentTarget.style.color = '#c084fc'; e.currentTarget.style.borderBottom = '1px solid #c084fc'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.color = '#d8b4fe'; e.currentTarget.style.borderBottom = '1px solid transparent'; }}
                                                >
                                                    Check book details <ChevronRight size={14} strokeWidth={2} style={{ marginBottom: '2px' }} />
                                                </span>
                                            </div>

                                            <div className="mt-auto">
                                                {activeTab === 'read' && book.UserBook?.rating > 0 && (
                                                    <div className="d-flex align-items-center mt-2">
                                                        <div style={{ color: '#f59e0b', fontSize: '1.1rem', letterSpacing: '2px' }}>
                                                            {'★'.repeat(book.UserBook.rating)}
                                                        </div>
                                                    </div>
                                                )}

                                                {activeTab === 'reading' && totalPagesNum > 0 && (
                                                    <div
                                                        className="pt-3 mt-3 border-top border-secondary border-opacity-25"
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ fontFamily: '"Inter", sans-serif' }}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                                            <strong style={{ color: '#d8b4fe', fontSize: '0.85rem' }}>{percent}%</strong>
                                                            <small style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>
                                                                {typedPage !== '' ? typedPage : 0} / {totalPagesNum}
                                                            </small>
                                                        </div>

                                                        <div className="progress mb-3" style={{ height: '6px', backgroundColor: '#27272a', borderRadius: '10px' }}>
                                                            <div
                                                                className="progress-bar"
                                                                role="progressbar"
                                                                style={{
                                                                    width: `${percent}%`,
                                                                    backgroundColor: '#9333ea',
                                                                    transition: 'width 0.3s ease'
                                                                }}
                                                            ></div>
                                                        </div>

                                                        <div className="input-group input-group-sm mb-2 shadow-sm">
                                                            <input
                                                                type="number"
                                                                className="form-control text-white text-center shadow-none"
                                                                placeholder={savedPage}
                                                                style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', height: '34px', fontSize: '0.9rem' }}
                                                                value={progressInputs[book.id] !== undefined ? progressInputs[book.id] : ''}
                                                                onChange={(e) => setProgressInputs({ ...progressInputs, [book.id]: e.target.value })}
                                                                min="0"
                                                                max={totalPagesNum}
                                                            />
                                                            <button
                                                                className="btn text-white transition-hover fw-bold px-3 d-flex align-items-center justify-content-center"
                                                                style={{ backgroundColor: '#9333ea', height: '34px', width: '40px' }}
                                                                onClick={(e) => handleQuickUpdateProgress(e, book)}
                                                            >
                                                                {progressMsgs[book.id] ? progressMsgs[book.id] : <CheckCircle size={16} strokeWidth={2} />}
                                                            </button>
                                                        </div>

                                                        <button
                                                            className="btn btn-sm w-100 text-white fw-bold transition-hover d-flex align-items-center justify-content-center gap-2 mt-2 shadow-sm"
                                                            style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '8px' }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)' }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)' }}
                                                            onClick={(e) => openFinishModal(e, book)}
                                                        >
                                                            <CheckCircle size={16} strokeWidth={2.5} />
                                                            Finished
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Library;