// src/components/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css'; // Asegúrate de crear este archivo para los estilos

const Navbar = () => {
    const location = useLocation();

    return (
        <nav>
            <ul className="navbar">
                <li className={location.pathname === '/' ? 'active' : ''}>
                    <Link to="/">Inicio</Link>
                </li>
                <li className={location.pathname === '/create-user' ? 'active' : ''}>
                    <Link to="/create-user">Crear Usuario</Link>
                </li>
                <li className={location.pathname === '/login' ? 'active' : ''}>
                    <Link to="/login">Iniciar Sesión</Link>
                </li>
                <li className={location.pathname === '/admin' ? 'active' : ''}>
                    <Link to="/admin">Panel de Administración</Link>
                </li>
                <li className={location.pathname === '/voter' ? 'active' : ''}>
                    <Link to="/voter">Votación</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
