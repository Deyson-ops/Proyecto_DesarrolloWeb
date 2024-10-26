import React, { useState } from 'react';
import { createUser } from '../api/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CreateUser = () => {
    const [formData, setFormData] = useState({
        colegiado: '',
        name: '',
        email: '',
        dpi: '',
        birthDate: '',
        password: '',
        role: 'voter',
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const validateForm = () => {
        if (formData.dpi.length !== 13) {
            toast.error('El DPI debe tener exactamente 13 caracteres');
            return false;
        }

        if (!/[A-Z]/.test(formData.password)) {
            toast.error('La contraseña debe contener al menos una letra mayúscula');
            return false;
        }

        for (const key in formData) {
            if (!formData[key]) {
                toast.error(`El campo ${key} es obligatorio`);
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            return; // Si la validación falla, no continuar
        }

        try {
            const response = await createUser(formData);
            toast.success(`Usuario ${response.data.user.name} creado con éxito`);
            setFormData({
                colegiado: '',
                name: '',
                email: '',
                dpi: '',
                birthDate: '',
                password: '',
                role: 'voter',
            });
        } catch (error) {
            if (error.response) {
                toast.error(error.response.data.message || 'Error al crear usuario');
            } else {
                toast.error('Error inesperado al crear usuario');
            }
            console.error('Error creando usuario', error);
        } finally {
            setLoading(false);
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
