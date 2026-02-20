import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Welcome = () => {
    const { user } = useAuth();

    // Redirecționare dacă este deja logat (opțional, poți activa când ești gata)
    if (user) { 
        return <Navigate to={user.isProfileComplete ? "/home" : "/update-profile"} />; 
    }

    return (
        /* Container principal: Centrare totală, înălțime minimă ecran, font Serif */
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100" 
             style={{ backgroundColor: '#f4f1ea', fontFamily: "'Georgia', serif" }}>
            
            {/* Cardul central alb */}
            <div className="card shadow-lg p-5 text-center border-0" 
                 style={{ maxWidth: '450px', width: '90%', borderRadius: '15px' }}>
                
                <h1 className="fw-bold mb-2" style={{ color: '#382110', fontSize: '2.8rem' }}>
                    BookRecommender
                </h1>
                
                <p className="text-muted mb-4" style={{ fontFamily: 'sans-serif' }}>
                    Descoperă cărțile care ți se potrivesc.
                </p>

                <div className="d-flex flex-column gap-2">
                    {/* Buton Register (Galben/Auriu) */}
                    <Link to="/register" 
                          className="btn fw-bold py-3 shadow-sm" 
                          style={{ backgroundColor: '#d6ad5b', color: 'black', border: '1px solid #c49b4a' }}>
                        Creează cont nou
                    </Link>
                    
                    <p className="my-2 text-muted small" style={{ fontFamily: 'sans-serif' }}>SAU</p>
                    
                    {/* Buton Login (Alb/Contur) */}
                    <Link to="/login" 
                          className="btn btn-outline-dark fw-bold py-3 shadow-sm">
                        Intră în cont
                    </Link>
                </div>

                <footer className="mt-5 text-muted small" style={{ fontFamily: 'sans-serif' }}>
                    &copy; 2024 Sistem de Recomandări Cărți
                </footer>
            </div>
        </div>
    );
};

export default Welcome;