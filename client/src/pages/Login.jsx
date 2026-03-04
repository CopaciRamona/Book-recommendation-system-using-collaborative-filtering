import { useState } from 'react';

import axios from '../api/axios';

import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';



const Login = () => {

    const [formData, setFormData] = useState({ email: '', password: '' });

    const [error, setError] = useState('');

    const [loading, setLoading] = useState(false);

   

    const { login } = useAuth();

    const navigate = useNavigate();



    const handleChange = (e) => {

        setFormData({ ...formData, [e.target.name]: e.target.value });

    };



    const handleSubmit = async (e) => {

        e.preventDefault();

        setError('');

        setLoading(true);



        try {

            const res = await axios.post('/auth/login', formData);

           

            // 1. Salvăm datele în context (token + user)

            login(res.data.user, res.data.token);

           

            // 2. Logica de navigare: Dacă profilul e incomplet, mergem la setup

            if (!res.data.user.isProfileComplete) {

               navigate('/update-profile', { replace: true });

            } else {

                navigate('/recommendations'); // Sau pagina ta principală

            }

        } catch (err) {

            setError(err.response?.data?.message || 'Email sau parolă incorectă.');

        } finally {

            setLoading(false);

        }

    };



    return (

        <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#f4f1ea' }}>

            <div className="card shadow-lg p-4 border-0" style={{ maxWidth: '400px', width: '100%', borderRadius: '12px' }}>

               

                <form onSubmit={handleSubmit}>

                    <h2 className="text-center mb-4" style={{ fontFamily: 'Georgia, serif', color: '#382110' }}>

                        🔐 Autentificare

                    </h2>



                    {error && (

                        <div className="alert alert-danger py-2 text-center" role="alert" style={{ fontSize: '0.85rem' }}>

                            {error}

                        </div>

                    )}



                    <div className="mb-3">

                        <label className="form-label small fw-bold text-muted">Adresa de Email</label>

                        <input

                            type="email"

                            name="email"

                            placeholder="exemplu@mail.com"

                            className="form-control"

                            value={formData.email}

                            onChange={handleChange}

                            required

                        />

                    </div>



                    <div className="mb-4">

                        <label className="form-label small fw-bold text-muted">Parola</label>

                        <input

                            type="password"

                            name="password"

                            placeholder="••••••••"

                            className="form-control"

                            value={formData.password}

                            onChange={handleChange}

                            required

                        />

                    </div>

                   

                    <button

                        type="submit"

                        className="btn btn-primary w-100 fw-bold py-2 shadow-sm"

                        style={{ backgroundColor: '#382110', border: 'none' }}

                        disabled={loading}

                    >

                        {loading ? 'Se verifică...' : 'Intră în cont'}

                    </button>



                    <div className="mt-4 text-center" style={{ fontSize: '0.9rem' }}>

                        Nu ai cont încă? <Link to="/register" className="text-decoration-none fw-bold" style={{ color: '#d6ad5b' }}>Înregistrează-te</Link>

                    </div>

                </form>

            </div>

        </div>

    );

};



export default Login;