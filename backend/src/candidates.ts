import { Router, Request, Response } from 'express';
import { authenticateToken, checkRole } from './index'; // Import your middlewares
const { poolPromise } = require('../db');

const router = Router();

// Create a new candidate
router.post('/', authenticateToken, checkRole('admin'), async (req: Request, res: Response): Promise<void> => {
    const { name, campaignId } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Name', name)
            .input('CampaignId', campaignId)
            .query(`
                INSERT INTO Candidates (Name, CampaignId)
                VALUES (@Name, @CampaignId);
                SELECT * FROM Candidates WHERE Id = SCOPE_IDENTITY();
            `);

        res.status(201).json(result.recordset[0]); // Respond with the created candidate
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el candidato' });
    }
});

// Get all candidates
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Candidates');
        res.json(result.recordset); // Respond with all candidates
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los candidatos' });
    }
});

// Get candidates by campaign
router.get('/campaign/:campaignId', async (req: Request, res: Response): Promise<void> => {
    const { campaignId } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('CampaignId', parseInt(campaignId))
            .query('SELECT * FROM Candidates WHERE CampaignId = @CampaignId');
        res.json(result.recordset); // Respond with the campaign's candidates
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los candidatos de la campaña' });
    }
});

// Delete a candidate
router.delete('/:id', authenticateToken, checkRole('admin'), async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('Id', parseInt(id))
            .query('DELETE FROM Candidates WHERE Id = @Id');
        res.status(204).send(); // Respond with 204 No Content
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el candidato' });
    }
});

export default router;
