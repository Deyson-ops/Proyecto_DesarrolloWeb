// src/api/api.js
import axios from 'axios';

// Cambia la URL a la de tu API en Render
const API_URL = 'https://proyecto-desarrolloweb.onrender.com';

export const createUser = async (userData) => {
    return await axios.post(`${API_URL}/users`, userData);
};

export const loginUser = async (credentials) => {
    return await axios.post(`${API_URL}/login`, credentials);
};

export const getCampaigns = async () => {
    return await axios.get(`${API_URL}/campaigns`);
};

export const closeCampaign = async (id) => {
    return await axios.post(`${API_URL}/campaigns/${id}/close`);
};

export const getVoterCampaigns = async () => {
    return await axios.get(`${API_URL}/voters/campaigns`);
};

export const vote = async (candidateId, campaignId) => {
    return await axios.post(`${API_URL}/voters/vote`, { candidateId, campaignId });
};
