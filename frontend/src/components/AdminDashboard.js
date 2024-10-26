// src/components/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { getCampaigns, closeCampaign } from '../api/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCampaigns = async () => {
            setLoading(true);
            try {
                const response = await getCampaigns();
                setCampaigns(response.data);
            } catch (error) {
                console.error('Error al obtener campañas', error);
                setError('No se pudieron cargar las campañas');
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, []);

    const handleCloseCampaign = async (id) => {
        const confirmed = window.confirm('¿Estás seguro de que quieres cerrar esta campaña?');
        if (!confirmed) return;

        try {
            await closeCampaign(id);
            toast.success('Campaña cerrada');
            setCampaigns(campaigns.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error al cerrar la campaña', error);
            toast.error('Error al cerrar la campaña');
        }
    };

    return (
        <div className="container">
            <h2>Panel de Administración</h2>
            {loading ? (
                <p>Cargando campañas...</p>
            ) : error ? (
                <p>{error}</p>
            ) : (
                <>
                    <h3>Campañas Activas</h3>
                    <ul>
                        {campaigns.map((campaign) => (
                            <li key={campaign.id}>
                                {campaign.title}
                                <button onClick={() => handleCloseCampaign(campaign.id)}>Cerrar Campaña</button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <ToastContainer />
        </div>
    );
};

export default AdminDashboard;
