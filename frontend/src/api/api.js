// src/api/api.js
import axios from 'axios';

// Cambia la URL a la de tu API en Render
const API_URL = 'https://proyecto-desarrolloweb.onrender.com';

// Funciones para manejar usuarios
export const createUser = async (userData) => {
    return await axios.post(`${API_URL}/users`, {
        ...userData,
        role: userData.role || 'voter' // Asegúrate de que se establezca un rol por defecto
    });
};
export const loginUser = async (credentials) => {
    return await axios.post(`${API_URL}/login`, credentials);
};

// Funciones para manejar campañas
export const getCampaigns = async () => {
    return await axios.get(`${API_URL}/campaigns`);
};

export const createCampaign = async (campaignData) => {
    return await axios.post(`${API_URL}/campaigns`, campaignData);
};

export const closeCampaign = async (id) => {
    return await axios.post(`${API_URL}/campaigns/${id}/close`);
};

export const updateCampaignStatus = async (id, campaignData) => {
    return await axios.put(`${API_URL}/campaigns/${id}`, campaignData);
};

// Funciones para votantes
export const getVoterCampaigns = async () => {
    return await axios.get(`${API_URL}/voters/campaigns`);
};

export const vote = async (candidateId, campaignId) => {
    return await axios.post(`${API_URL}/voters/vote`, { candidateId, campaignId });
};
