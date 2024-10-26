// src/components/CreateUser.js
import React, { useState } from 'react';
import { createUser } from '../api/api';
import { toast } from 'react-toastify'; // Asegúrate de tener esta librería instalada

const CreateUser = () => {
    const [formData, setFormData] = useState({
        colegiado: '',
        name: '',
        email: '',
        dpi: '',
        birthDate: '',
        password: '',
        role: 'voter', // El rol se asigna por defecto a 'votante'
    });
    
    const [loading, setLoading] = useState(false); // Estado de carga

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Inicia carga
        try {
            await createUser(formData);
            toast.success('Usuario creado con éxito'); // Notificación de éxito
            setFormData({ // Reiniciar el formulario
                colegiado: '',
                name: '',
                email: '',
                dpi: '',
                birthDate: '',
                password: '',
                role: 'voter', // Mantiene el rol como 'votante'
            });
        } catch (error) {
            console.error('Error creando usuario', error);
            toast.error('Error al crear usuario'); // Notificación de error
        } finally {
            setLoading(false); // Finaliza carga
        }
    };

    return (
        <div className="container">
            <h2>Crear Usuario</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="colegiado" placeholder="Colegiado" onChange={handleChange} value={formData.colegiado} required />
                <input type="text" name="name" placeholder="Nombre" onChange={handleChange} value={formData.name} required />
                <input type="email" name="email" placeholder="Email" onChange={handleChange} value={formData.email} required />
                <input type="text" name="dpi" placeholder="DPI" onChange={handleChange} value={formData.dpi} required />
                <input type="date" name="birthDate" onChange={handleChange} value={formData.birthDate} required />
                <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} value={formData.password} required />
                {/* Eliminar el campo de selección de rol */}
                <button type="submit" disabled={loading}>
                    {loading ? 'Creando...' : 'Crear Usuario'}
                </button>
            </form>
        </div>
    );
};

export default CreateUser;
