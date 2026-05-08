import { useState } from 'react';
import axios from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        nume: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

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

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/auth/register', {
                nume: formData.nume,
                email: formData.email,
                password: formData.password
            });

            // LOGICA TA OBLIGATORIE:
            if (response.data.token && response.data.user) {
                login(response.data.user, response.data.token); 
                navigate('/update-profile', { replace: true }); 
            } else {
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#09090b', position: 'relative', overflow: 'hidden' }}>
            
            <div style={{
                position: 'absolute', width: '600px', height: '600px',
                background: 'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, rgba(9, 9, 11, 0) 70%)',
                top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 0, pointerEvents: 'none'
            }}></div>

            <div className="card shadow-lg p-5 border-0" style={{ 
                maxWidth: '450px', width: '90%', 
                borderRadius: '16px', 
                backgroundColor: '#18181b', 
                border: '1px solid rgba(147, 51, 234, 0.2)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(147, 51, 234, 0.05)',
                zIndex: 1, backdropFilter: 'blur(10px)'
            }}>
                
                <form onSubmit={handleSubmit}>
                    <div className="text-center mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: '50px', height: '50px', backgroundColor: 'rgba(147, 51, 234, 0.1)', color: '#d8b4fe', border: '1px solid rgba(147, 51, 234, 0.3)' }}>
                            <UserPlus size={22} strokeWidth={2} />
                        </div>
                        <h2 className="fw-bold" style={{ fontFamily: '"Playfair Display", serif', color: '#f4f4f5', letterSpacing: '0.5px' }}>
                            Create Account
                        </h2>
                        <p className="text-white-50 small mt-1" style={{ fontFamily: '"Inter", sans-serif' }}>Join Nocturne and find your next story.</p>
                    </div>

                    {error && (
                        <div className="alert py-2 text-center" role="alert" style={{ fontSize: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px' }}>
                            {error}
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Full Name</label>
                        <input
                            type="text"
                            name="nume"
                            placeholder="John Doe"
                            className="form-control shadow-none"
                            value={formData.nume}
                            onChange={handleChange}
                            required
                            style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px 16px' }}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="name@example.com"
                            className="form-control shadow-none"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px 16px' }}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            className="form-control shadow-none"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="6"
                            style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px 16px' }}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label small fw-medium" style={{ color: '#a1a1aa' }}>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="••••••••"
                            className="form-control shadow-none"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px 16px' }}
                        />
                    </div>
                    
                    <button
                        type="submit"
                        className="btn w-100 fw-bold py-3 shadow-sm d-flex align-items-center justify-content-center"
                        style={{ backgroundColor: '#9333ea', color: 'white', border: 'none', borderRadius: '8px', transition: 'all 0.3s ease' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status"></span> Creating...</>
                        ) : 'Sign Up'}
                    </button>

                    <div className="mt-4 text-center" style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>
                        Already have an account? <Link to="/login" className="text-decoration-none fw-bold" style={{ color: '#d8b4fe' }}>Log In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;