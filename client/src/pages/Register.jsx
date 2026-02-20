import { useState } from 'react';
import axios from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const Register = () => {
    const [formData, setFormData] = useState({ nume: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/auth/register', formData);
            if (response.data.token && response.data.user) {
                login(response.data.user, response.data.token);
               navigate('/update-profile', { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la conectare.');
        } finally {
            setLoading(false);
        }
    };

    return (
        /* Container principal: Flexbox pt centrare, înălțime minimă ecran, culoare fundal crem */
        <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#f4f1ea' }}>
            
            {/* Cardul formularului: fundal alb, umbră, padding, lățime maximă */}
            <div className="card shadow p-4 border-0" style={{ maxWidth: '400px', width: '100%', borderRadius: '10px' }}>
                
                <form onSubmit={handleSubmit}>
                    <h2 className="text-center mb-2" style={{ fontFamily: 'Georgia, serif', color: '#382110' }}>
                        📝 Creează Cont Nou
                    </h2>
                    <p className="text-center text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                        Începe călătoria ta în lumea cărților.
                    </p>

                    {/* Alertă Bootstrap pentru eroare */}
                    {error && (
                        <div className="alert alert-danger py-2 text-center" role="alert" style={{ fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    )}

                    <div className="mb-3">
                        <input 
                            type="text" 
                            name="nume" 
                            placeholder="Numele tău complet" 
                            className="form-control" 
                            value={formData.nume}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Adresa de Email" 
                            className="form-control" 
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Parola" 
                            className="form-control" 
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="6"
                        />
                    </div>
                    
                    {/* Buton personalizat cu culorile tale */}
                    <button 
                        type="submit" 
                        className="btn w-100 fw-bold text-white py-2 mt-2" 
                        style={{ backgroundColor: '#382110', border: 'none' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        ) : null}
                        {loading ? 'Se creează contul...' : 'Înregistrează-te'}
                    </button>

                    <div className="mt-4 text-center" style={{ fontSize: '0.9rem' }}>
                        Ai deja un cont? <Link to="/login" className="text-decoration-none fw-bold" style={{ color: '#d6ad5b' }}>Loghează-te aici</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;