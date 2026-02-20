import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={{ padding: '15px', background: '#222', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      
      {/* Logo-ul rămâne mereu vizibil */}
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>
        📚 Book Recommender
      </Link>

      {/* Logica meniului */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        
        {/* CAZ 1: E logat, DAR e blocat pe completarea profilului */}
        {user && !user.isProfileComplete ? (
            <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.9rem' }}>
                Completare profil în curs...
            </span>
        ) 
        /* CAZ 2: E logat și are profilul complet (are voie la tot) */
        : user ? (
          <>
            <Link to="/home" style={{ color: '#ddd', textDecoration: 'none' }}>Home</Link>
            <span style={{ color: '#d6ad5b', fontWeight: 'bold' }}>Salut, {user.nume}!</span>
            <button onClick={logout} className="btn btn-sm btn-danger shadow-sm">
              Logout
            </button>
          </>
        ) 
        /* CAZ 3: Vizitator nelogat */
        : (
          <>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" className="btn btn-sm" style={{ background: '#d6ad5b', color: '#222', fontWeight: 'bold' }}>
                Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;