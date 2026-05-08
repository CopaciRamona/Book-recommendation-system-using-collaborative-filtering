import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react'; 
import './Welcome.css';

const Welcome = () => {
    const { user } = useAuth();

    if (user) { 
        return <Navigate to={user.isProfileComplete ? "/home" : "/update-profile"} />; 
    }

    return (
        <div className="welcome-container">
            <div className="welcome-glow"></div>
            <div className="welcome-card card shadow-lg p-5 text-center border-0">
                
                <h1 className="welcome-logo d-flex align-items-center justify-content-center gap-2 mb-3">
                    <Sparkles size={32} className="logo-icon" />
                    Nocturne
                </h1>
                
                <p className="welcome-subtitle text-white-50 mb-5">
                    Discover the books that match your soul.
                </p>

                <div className="d-flex flex-column gap-3">
                    <Link to="/register" className="btn btn-register fw-bold py-3 shadow-sm">
                        Create an Account
                    </Link>
                    
                    <div className="d-flex align-items-center my-2">
                        <hr className="flex-grow-1 border-secondary opacity-25" />
                        <span className="mx-3 text-white-50 small" style={{ fontFamily: '"Inter", sans-serif', letterSpacing: '2px' }}>OR</span>
                        <hr className="flex-grow-1 border-secondary opacity-25" />
                    </div>
                
                    <Link to="/login" className="btn btn-login fw-bold py-3 shadow-sm">
                        Log In
                    </Link>
                </div>

                <footer className="mt-5 text-white-50 small" style={{ fontFamily: '"Inter", sans-serif', opacity: 0.5 }}>
                    &copy; {new Date().getFullYear()} Nocturne AI
                </footer>
            </div>
        </div>
    );
};

export default Welcome;