// src/components/VoterDashboard.js
import React, { useEffect, useState } from 'react';
import { getVoterCampaigns, vote } from '../api/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
                                    disabled={votedCandidates.has(candidate.id)}
                                >
                                    Votar
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
            <ToastContainer />
        </div>
    );
};

export default VoterDashboard;
