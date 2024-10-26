// src/components/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css'; // Asegúrate de crear este archivo para los estilos

const Navbar = () => {
    const location = useLocation();

    return (
        <nav className="navbar">
            <ul className="navbar-list">
                <li className={`navbar-item ${location.pathname === '/' ? 'active' : ''}`}>
                    <Link to="/" className="navbar-link">Inicio</Link>
                </li>
                <li className={`navbar-item ${location.pathname === '/create-user' ? 'active' : ''}`}>
                    <Link to="/create-user" className="navbar-link">Crear Usuario</Link>
                </li>
                <li className={`navbar-item ${location.pathname === '/login' ? 'active' : ''}`}>
                    <Link to="/login" className="navbar-link">Iniciar Sesión</Link>
                </li>
                <li className={`navbar-item ${location.pathname === '/admin' ? 'active' : ''}`}>
                    <Link to="/admin" className="navbar-link">Panel de Administración</Link>
                </li>
                <li className={`navbar-item ${location.pathname === '/voter' ? 'active' : ''}`}>
                    <Link to="/voter" className="navbar-link">Votación</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
