import { Router, Request, Response } from 'express';
const { poolPromise } = require('../db'); // Asegúrate de que la ruta a db.js es correcta
import { authenticateToken } from './index'; // Importar el middleware de autenticación

const router = Router();

// Definir la interfaz para Candidate y Campaign
interface Candidate {
    Id: number;           // ID del candidato
    Name: string;        // Nombre del candidato
    CampaignId: number;  // ID de la campaña a la que pertenece
}

interface Campaign {
    Id: number;          // ID de la campaña
    Title: string;       // Título de la campaña
    Description: string; // Descripción de la campaña
    IsActive: boolean;   // Estado de la campaña (activa/inactiva)
    candidates?: Candidate[]; // Candidatos relacionados, puede ser opcional
}

// Obtener todas las campañas habilitadas para votar
router.get('/campaigns', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const pool = await poolPromise; // Obtener el pool
        const campaignsResult = await pool.request().query(`
            SELECT Id, Title, Description, IsActive FROM Campaigns WHERE IsActive = 1
        `);

        // Obtener candidatos relacionados para cada campaña
        const campaignIds = campaignsResult.recordset.map((campaign: Campaign) => campaign.Id);
        const candidatesResult = await pool.request().query(`
            SELECT * FROM Candidates WHERE CampaignId IN (${campaignIds.join(',')})
        `);

        // Asociar candidatos con campañas
        const campaignsWithCandidates = campaignsResult.recordset.map((campaign: Campaign) => ({
            ...campaign,
            candidates: candidatesResult.recordset.filter((candidate: Candidate) => candidate.CampaignId === campaign.Id),
        }));

        res.json(campaignsWithCandidates); // Responder con las campañas
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las campañas' });
    }
});

// Votar por un candidato en una campaña
router.post('/vote', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    const { candidateId, campaignId } = req.body;
    const userEmail = req.user?.email; // Asegúrate de que el correo electrónico del usuario esté en el token

    try {
        const pool = await poolPromise; // Obtener el pool

        // Verificar si el votante ya ha votado en esta campaña
        const existingVoteResult = await pool.request()
            .input('UserEmail', userEmail)
            .input('CampaignId', campaignId)
            .query(`
                SELECT * FROM Votes 
                WHERE UserEmail = @UserEmail AND CampaignId = @CampaignId
            `);

        if (existingVoteResult.recordset.length > 0) {
            res.status(400).json({ message: 'Ya has votado en esta campaña' });
            return; // Finalizar ejecución
        }

        const voteResult = await pool.request()
            .input('UserEmail', userEmail)
            .input('CandidateId', candidateId)
            .input('CampaignId', campaignId)
            .query(`
                INSERT INTO Votes (UserEmail, CandidateId, CampaignId)
                VALUES (@UserEmail, @CandidateId, @CampaignId);
                SELECT * FROM Votes WHERE UserEmail = @UserEmail AND CampaignId = @CampaignId;
            `);

        res.status(201).json(voteResult.recordset[0]); // Responder con el voto creado
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el voto' });
    }
});

export default router;
