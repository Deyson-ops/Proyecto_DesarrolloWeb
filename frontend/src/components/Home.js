// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Asegúrate de crear este archivo para los estilos

const Home = () => {
    return (
        <div className="home-container text-center mt-5">
            <h1 className="home-title">Bienvenido al Sistema de Votación</h1>
            <p className="home-description">Un sistema sencillo y eficiente para gestionar votaciones.</p>
            <div className="home-buttons">
                <Link to="/login" className="home-button btn btn-primary">Iniciar Sesión</Link>
                <Link to="/create-user" className="home-button btn btn-secondary">Crear Usuario</Link>
            </div>
        </div>
    );
};

export default Home;
