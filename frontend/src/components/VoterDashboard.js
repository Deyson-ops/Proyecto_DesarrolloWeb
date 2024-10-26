// src/components/VoterDashboard.js
import React, { useEffect, useState } from 'react';
import { getVoterCampaigns, vote, updateCampaignStatus } from '../api/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts';

const VoterDashboard = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [votedCandidates, setVotedCandidates] = useState(new Set());

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await getVoterCampaigns();
                setCampaigns(response.data);
            } catch (error) {
                console.error('Error al obtener campañas', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, []);

    const handleVote = async (candidateId, campaignId) => {
        if (window.confirm('¿Estás seguro de que deseas votar por este candidato?')) {
            try {
                await vote(candidateId, campaignId);
                toast.success('Voto registrado');
                setVotedCandidates((prev) => new Set(prev).add(candidateId));
            } catch (error) {
                console.error('Error al votar', error);
                toast.error('Error al registrar el voto. Inténtalo de nuevo.');
            }
        }
    };

    const handleEndCampaign = async (campaignId) => {
        if (window.confirm('¿Estás seguro de que deseas finalizar la campaña?')) {
            try {
                await updateCampaignStatus(campaignId, { status: 'closed' });
                toast.success('Campaña finalizada');
                setCampaigns(campaigns.filter(c => c.id !== campaignId)); // Opcional: quitar campaña de la vista
            } catch (error) {
                console.error('Error al finalizar la campaña', error);
                toast.error('Error al finalizar la campaña');
            }
        }
    };

    if (loading) {
        return <div className="container">Cargando campañas...</div>;
    }

    return (
        <div className="container">
            <h2>Página de Votación</h2>
            <h3>Campañas Disponibles</h3>
            {campaigns.map((campaign) => (
                <div key={campaign.id}>
                    <h4>{campaign.title}</h4>
                    <h5>Candidatos:</h5>
                    <ul>
                        {campaign.candidates.map((candidate) => (
                            <li key={candidate.id}>
                                {candidate.name}
                                <button
                                    onClick={() => handleVote(candidate.id, campaign.id)}
                                    disabled={votedCandidates.has(candidate.id) || campaign.status !== 'enabled'}
                                >
                                    Votar
                                </button>
                            </li>
                        ))}
                    </ul>
                    <h5>Resultados de Votación:</h5>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={campaign.candidates}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <CartesianGrid strokeDasharray="3 3" />
                            <Bar dataKey="votes" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                    <button onClick={() => handleEndCampaign(campaign.id)}>Finalizar Campaña</button>
                </div>
            ))}
            <ToastContainer />
        </div>
    );
};

export default VoterDashboard;
