import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    const isActive = (path) => location.pathname === path ? 'active' : '';

    let profilePicUrl = null;
    if (user && user.profile_picture) {
        const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';
        profilePicUrl = `${baseUrl}${user.profile_picture}`;
    }

    const displayName = user?.nume || 'Profilul Meu';

    return (
        // AM SCOS padding-ul (px-4, pb-4) de aici. Acum containerul e "lipit" de margini.
        <div className="d-flex flex-column flex-shrink-0 custom-sidebar" style={{ width: '320px', minHeight: '100vh' }}>

            {/* SECȚIUNEA LOGO */}
            {/* Am adăugat 'px-4' AICI pentru a indenta textul logo-ului */}
            {/* Border-bottom este pe acest div, deci va fi pe toată lățimea */}
            <div
                className="d-flex align-items-center px-4"
                style={{
                    height: '86px', // Ajustează asta dacă nu se aliniază perfect cu bara de sus
                    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                    marginBottom: '30px'
                }}
            >
                <Link to="/home" className="text-decoration-none w-100">
                    <span className="fs-3 fw-bold sidebar-logo">📚 BookAI</span>
                </Link>
            </div>

            {/* SECȚIUNEA DE NAVIGARE (Link-uri) */}
            {/* Am învelit lista într-un div cu 'px-4' pentru indentare și 'flex-grow-1' pentru a ocupa spațiul rămas */}
            <div className="px-4 flex-grow-1">
                <ul className="nav nav-pills flex-column mb-auto gap-3">
                    <li className="nav-item">
                        <Link to="/home" className={`nav-link sidebar-link d-flex align-items-center ${isActive('/home')}`} style={{ fontSize: '1.2rem' }}>
                            <span className="me-3 fs-4">🏠</span> Acasă
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/library" className={`nav-link sidebar-link d-flex align-items-center ${isActive('/library')}`} style={{ fontSize: '1.2rem' }}>
                            <span className="me-3 fs-4">📚</span> Biblioteca Mea
                        </Link>
                    </li>

                    <li className="nav-item">
                        <Link to="/profile" className={`nav-link sidebar-link d-flex align-items-center ${isActive('/profile')}`} style={{ fontSize: '1.2rem' }}>
                            {profilePicUrl ? (
                                <img
                                    src={profilePicUrl}
                                    alt="avatar"
                                    className="rounded-circle me-3"
                                    style={{ width: '45px', height: '45px', objectFit: 'cover', border: '2px solid rgba(147, 51, 234, 0.5)' }}
                                    onError={(e) => { e.target.style.display = 'none'; console.error("Eroare poza:", profilePicUrl); }}
                                />
                            ) : (
                                <span className="me-3 fs-3">👤</span>
                            )}
                            <span className="fw-medium text-truncate" style={{ maxWidth: '190px' }}>
                                {displayName}
                            </span>
                        </Link>
                    </li>

                    <li className="nav-item">
                        <Link to="/chatbot" className={`nav-link sidebar-link d-flex align-items-center ${isActive('/chatbot')}`} style={{ fontSize: '1.2rem' }}>
                            <span className="me-3 fs-4">🤖</span> Asistent Inteligent
                        </Link>
                    </li>
                </ul>
            </div>

            {/* LINIA DE SEPARARE DE JOS */}
            {/* Acum este în afara containerelor cu padding, deci va fi PE TOATĂ LĂȚIMEA */}
            {/* Am adăugat 'm-0' pentru a scoate marginile implicite */}
            <hr className="text-secondary m-0" />

            {/* SECȚIUNEA DECONECTARE */}
            {/* Am adăugat 'px-4' și 'pb-4' AICI pentru indentare și spațiu jos */}
            <div className="dropdown mt-3 px-4 pb-4">
                <button onClick={handleLogout} className="btn btn-outline-danger w-100 fw-bold py-3 fs-5" style={{ borderRadius: '10px' }}>
                    🚪 Deconectare
                </button>
            </div>
        </div>
    );
};

export default Sidebar;