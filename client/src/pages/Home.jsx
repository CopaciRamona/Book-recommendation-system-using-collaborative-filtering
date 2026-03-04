import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Am importat useNavigate
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recInfo, setRecInfo] = useState({ type: '', message: '' });
    
    const navigate = useNavigate(); // 2. Am inițializat funcția de navigare

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true);
                const res = await api.get('/recommendations');
                
                if (res.data && res.data.books) {
                    setBooks(res.data.books);
                    setRecInfo({ 
                        type: res.data.type, 
                        message: res.data.message 
                    });
                }
            } catch (err) {
                console.error("Eroare la încărcarea recomandărilor:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    // Loader adaptat la tema închisă
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100 home-container">
                <div className="spinner-border" role="status" style={{width: '3rem', height: '3rem', color: '#c084fc'}}>
                    <span className="visually-hidden">Se încarcă...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="container py-5">
                
                {/* Header Secțiune */}
                <div className="mb-5 text-center">
                    <h1 className="modern-title">
                        {recInfo.type === 'collaborative-filtering' ? '✨ Alese pentru tine' : '📚 Descoperă Cărți'}
                    </h1>
                    <p className="fw-medium mx-auto" style={{maxWidth: '600px', color: 'var(--text-muted)'}}>
                        {recInfo.message || "Algoritmul nostru a analizat mii de volume pentru a găsi potrivirea ta perfectă."}
                    </p>
                    {/* Linia despărțitoare purpurie */}
                    <div className="mt-4 mx-auto" style={{width: '60px', height: '4px', background: 'var(--accent-main)', borderRadius: '10px', boxShadow: '0 0 10px rgba(147,51,234,0.5)'}}></div>
                </div>

                {books.length === 0 ? (
                    <div className="text-center p-5 rounded-5 shadow-sm empty-state-card">
                        <h3 className="mb-3">Încă nicio carte...</h3>
                        <p style={{color: 'var(--text-muted)'}}>Adaugă interese în profil pentru a antrena inteligența artificială!</p>
                    </div>
                ) : (
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-5">
                        {books.map((book) => (
                            <div className="col" key={book.id}>
                                <div className="card book-card-modern h-100 p-2">
                                    <div className="book-cover-container">
                                        <img 
                                            src={book.coperta_url || 'https://via.placeholder.com/200x300'} 
                                            className="book-cover-img" 
                                            alt={book.titlu}
                                        />
                                    </div>
                                    <div className="card-body d-flex flex-column pt-3 px-3 pb-3">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <span className="rating-badge">⭐ {book.rating_mediu || '5.0'}</span>
                                        </div>
                                        <h6 className="fw-bold mb-1" style={{fontSize: '1.1rem', color: 'var(--text-primary)'}}>
                                            {book.titlu}
                                        </h6>
                                        <p className="small mb-4" style={{color: 'var(--text-muted)'}}>
                                            {book.autor}
                                        </p>
                                        
                                        {/* 3. Am adăugat evenimentul onClick pe buton */}
                                        <button 
                                            className="btn btn-modern-action mt-auto w-100"
                                            onClick={() => navigate(`/book/${book.id}`)}
                                        >
                                            Vezi detalii
                                        </button>
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