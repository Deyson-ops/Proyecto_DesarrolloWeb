// src/components/Login.js
import React, { useState, useContext } from 'react';
import { loginUser } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '../App';

const Login = () => {
    const [credentials, setCredentials] = useState({
        colegiado: '',
        dpi: '',
        birthDate: '',
        password: '',
    });

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext); // Contexto para el usuario

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials({ ...credentials, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await loginUser(credentials);
            setUser(response.data); // Guarda el usuario en el contexto
            
            toast.success('Inicio de sesión exitoso');

            // Redirigir según el rol
            if (response.data.role === 'admin') {
                navigate('/admin');
            } else if (response.data.role === 'voter') {
                navigate('/voter');
            }
        } catch (error) {
            console.error('Error al iniciar sesión', error);
            toast.error('Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Iniciar Sesión</h2>
            <form onSubmit={handleSubmit} className="bg-light p-4 rounded shadow">
                <div className="mb-3">
                    <label htmlFor="colegiado" className="form-label">Colegiado</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        id="colegiado" 
                        name="colegiado" 
                        onChange={handleChange} 
                        value={credentials.colegiado} 
                        required 
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="dpi" className="form-label">DPI</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        id="dpi" 
                        name="dpi" 
                        onChange={handleChange} 
                        value={credentials.dpi} 
                        required 
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="birthDate" className="form-label">Fecha de Nacimiento</label>
                    <input 
                        type="date" 
                        className="form-control" 
                        id="birthDate" 
                        name="birthDate" 
                        onChange={handleChange} 
                        value={credentials.birthDate} 
                        required 
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Contraseña</label>
                    <input 
                        type="password" 
                        className="form-control" 
                        id="password" 
                        name="password" 
                        onChange={handleChange} 
                        value={credentials.password} 
                        required 
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
            </form>
            <div className="text-center mt-3">
                <p>No tienes una cuenta? <a href="/create-user">Crear Usuario</a></p>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Login;
