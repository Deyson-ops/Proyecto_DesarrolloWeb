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
        <div className="container">
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    name="colegiado" 
                    placeholder="Colegiado" 
                    onChange={handleChange} 
                    value={credentials.colegiado} 
                    required 
                />
                <input 
                    type="text" 
                    name="dpi" 
                    placeholder="DPI" 
                    onChange={handleChange} 
                    value={credentials.dpi} 
                    required 
                />
                <input 
                    type="date" 
                    name="birthDate" 
                    placeholder="Fecha de Nacimiento" 
                    onChange={handleChange} 
                    value={credentials.birthDate} 
                    required 
                />
                <input 
                    type="password" 
                    name="password" 
                    placeholder="Contraseña" 
                    onChange={handleChange} 
                    value={credentials.password} 
                    required 
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
            </form>
            <ToastContainer />
        </div>
    );
};

export default Login;
