import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


import { Sparkles, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={{ 
        padding: '15px 30px', 
        backgroundColor: '#09090b', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky', 
        top: 0,
        zIndex: 1000
    }}>
      
      
      <Link to="/" style={{ 
          color: '#f4f4f5', 
          textDecoration: 'none', 
          fontSize: '1.4rem', 
          fontWeight: '700',
          fontFamily: '"Playfair Display", serif',
          display: 'flex',
          alignItems: 'center',
          letterSpacing: '0.5px'
      }}>
        <Sparkles size={20} color="#d8b4fe" className="me-2" style={{ filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.6))' }} />
        Nocturne
      </Link>

      
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontFamily: '"Inter", sans-serif' }}>
        
        {/* CAZ 1: E logat, DAR e blocat pe completarea profilului */}
        {user && !user.isProfileComplete ? (
            <span style={{ color: '#a1a1aa', fontStyle: 'italic', fontSize: '0.9rem', fontFamily: '"Lora", serif' }}>
                Profile setup in progress...
            </span>
        ) 
        
        /* CAZ 2: E logat și are profilul complet (are voie la tot) */
        : user ? (
          <>
            <Link 
                to="/home" 
                style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.2s ease' }} 
                onMouseOver={(e) => e.target.style.color = '#f4f4f5'} 
                onMouseOut={(e) => e.target.style.color = '#a1a1aa'}
            >
                Home
            </Link>
            
            <span style={{ color: '#d8b4fe', fontWeight: '500', fontSize: '0.95rem' }}>
                Hello, {user.nume}!
            </span>
            
            <button 
                onClick={logout} 
                className="btn btn-sm d-flex align-items-center gap-2"
                style={{ 
                    background: 'transparent', 
                    color: '#a1a1aa', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    fontSize: '0.85rem'
                }}
                onMouseOver={(e) => { 
                    e.currentTarget.style.color = '#ef4444'; 
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; 
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'; 
                }}
                onMouseOut={(e) => { 
                    e.currentTarget.style.color = '#a1a1aa'; 
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; 
                    e.currentTarget.style.backgroundColor = 'transparent'; 
                }}
            >
                <LogOut size={14} />
                Log Out
            </button>
          </>
        ) 
        
        /* CAZ 3: Vizitator nelogat (ex: se află pe /login, /register sau /welcome) */
        : (
          <>
            <Link 
                to="/login" 
                style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s ease' }} 
                onMouseOver={(e) => e.target.style.color = '#d8b4fe'} 
                onMouseOut={(e) => e.target.style.color = '#a1a1aa'}
            >
                Log In
            </Link>
            
            <Link 
                to="/register" 
                className="btn btn-sm shadow-sm" 
                style={{ 
                    background: '#9333ea', 
                    color: 'white', 
                    fontWeight: '500', 
                    borderRadius: '6px',
                    padding: '6px 16px',
                    fontSize: '0.9rem',
                    transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#a855f7'}
                onMouseOut={(e) => e.target.style.background = '#9333ea'}
            >
                Create Account
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;