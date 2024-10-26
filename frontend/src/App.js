// src/App.js
import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import CreateUser from './components/CreateUser';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import VoterDashboard from './components/VoterDashboard';
import Home from './components/Home'; // Importa el nuevo componente Home

// Exportar el contexto para que pueda ser utilizado en otros componentes
export const AuthContext = createContext();

const PrivateRoute = ({ children, role }) => {
    const { user } = useContext(AuthContext);
    return user && user.role === role ? children : <Navigate to="/login" />;
};

const App = () => {
    const [user, setUser] = useState(null);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/create-user" element={<CreateUser />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
                    <Route path="/voter" element={<PrivateRoute role="voter"><VoterDashboard /></PrivateRoute>} />
                    {/* Cambia la página principal para usar el componente Home */}
                    <Route path="/" element={<Home />} />
                    <Route path="*" element={<h1>Página no encontrada</h1>} />
                </Routes>
            </Router>
        </AuthContext.Provider>
    );
};

export default App;
