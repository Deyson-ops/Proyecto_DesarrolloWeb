// src/components/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { getCampaigns, createCampaign, closeCampaign, updateCampaignStatus } from '../api/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newCampaign, setNewCampaign] = useState({ title: '', description: '', enabled: false });
    const [isLoadingAction, setIsLoadingAction] = useState(false); // Estado para las acciones

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

        setIsLoadingAction(true); // Iniciar carga
        try {
            await closeCampaign(id);
            toast.success('Campaña cerrada');
            setCampaigns(campaigns.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error al cerrar la campaña', error);
            toast.error('Error al cerrar la campaña');
        } finally {
            setIsLoadingAction(false); // Finalizar carga
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        setIsLoadingAction(true); // Iniciar carga
        try {
            const response = await createCampaign(newCampaign);
            setCampaigns([...campaigns, response.data]);
            setNewCampaign({ title: '', description: '', enabled: false });
            toast.success('Campaña creada exitosamente');
        } catch (error) {
            console.error('Error al crear la campaña', error);
            toast.error('Error al crear la campaña');
        } finally {
            setIsLoadingAction(false); // Finalizar carga
        }
    };

    const handleToggleStatus = async (campaign) => {
        setIsLoadingAction(true); // Iniciar carga
        try {
            const updatedCampaign = { ...campaign, enabled: !campaign.enabled };
            await updateCampaignStatus(campaign.id, updatedCampaign);
            setCampaigns(campaigns.map(c => (c.id === campaign.id ? updatedCampaign : c)));
            toast.success(`Campaña ${updatedCampaign.enabled ? 'habilitada' : 'deshabilitada'} para votación`);
        } catch (error) {
            console.error('Error al actualizar el estado de la campaña', error);
            toast.error('Error al actualizar el estado de la campaña');
        } finally {
            setIsLoadingAction(false); // Finalizar carga
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
                                <h4>{campaign.title}</h4>
                                <p>{campaign.description}</p>
                                <p>Estado: {campaign.enabled ? 'Habilitada' : 'Deshabilitada'}</p>
                                <button onClick={() => handleToggleStatus(campaign)} disabled={isLoadingAction}>
                                    {campaign.enabled ? 'Deshabilitar' : 'Habilitar'} Votación
                                </button>
                                <button onClick={() => handleCloseCampaign(campaign.id)} disabled={isLoadingAction}>
                                    Cerrar Campaña
                                </button>
                            </li>
                        ))}
                    </ul>

                    <h3>Crear Nueva Campaña</h3>
                    <form onSubmit={handleCreateCampaign}>
                        <div>
                            <label>Título:</label>
                            <input
                                type="text"
                                value={newCampaign.title}
                                onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label>Descripción:</label>
                            <textarea
                                value={newCampaign.description}
                                onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                                required
                            ></textarea>
                        </div>
                        <div>
                            <label>
                                Habilitar Votación:
                                <input
                                    type="checkbox"
                                    checked={newCampaign.enabled}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, enabled: e.target.checked })}
                                />
                            </label>
                        </div>
                        <button type="submit" disabled={isLoadingAction}>Crear Campaña</button>
                    </form>
                </>
            )}
            <ToastContainer />
        </div>
    );
};

export default AdminDashboard;
