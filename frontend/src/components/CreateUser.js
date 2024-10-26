import React, { useState } from 'react';
import { createUser } from '../api/api';
import { toast } from 'react-toastify'; // Asegúrate de tener esta librería instalada
import 'react-toastify/dist/ReactToastify.css';

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
            const response = await createUser(formData);
            toast.success(`Usuario ${response.data.user.name} creado con éxito`); // Notificación de éxito
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
            if (error.response) {
                // Si el error es de respuesta, muestra el mensaje específico
                toast.error(error.response.data.message || 'Error al crear usuario');
            } else {
                toast.error('Error inesperado al crear usuario'); // Notificación de error general
            }
            console.error('Error creando usuario', error); // Log del error
        } finally {
            setLoading(false); // Finaliza carga
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Crear Usuario</h2>
            <form onSubmit={handleSubmit} className="bg-light p-4 rounded shadow">
                <div className="mb-3">
                    <label htmlFor="colegiado" className="form-label">Colegiado</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        id="colegiado" 
                        name="colegiado" 
                        onChange={handleChange} 
                        value={formData.colegiado} 
                        required 
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">Nombre</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        id="name" 
                        name="name" 
                        onChange={handleChange} 
                        value={formData.name} 
                        required 
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input 
                        type="email" 
                        className="form-control" 
                        id="email" 
                        name="email" 
                        onChange={handleChange} 
                        value={formData.email} 
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
                        value={formData.dpi} 
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
                        value={formData.birthDate} 
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
                        value={formData.password} 
                        required 
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? 'Creando...' : 'Crear Usuario'}
                </button>
            </form>
        </div>
    );
};

export default CreateUser;
