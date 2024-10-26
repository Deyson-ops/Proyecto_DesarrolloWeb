import { Router, Request, Response } from 'express';
import { poolPromise, sql } from '../db'; // Importar correctamente la conexión a la base de datos
import { authenticateToken, checkRole } from './index'; // Importa tus middlewares

const router = Router();

// Crear una nueva campaña
router.post('/', authenticateToken, checkRole('admin'), async (req: Request, res: Response): Promise<void> => {
    const { title, description, candidates } = req.body;

    try {
        // Obtener conexión de la base de datos
        const pool = await poolPromise;

        // Crear una nueva campaña
        const result = await pool.request()
            .input('Title', sql.VarChar, title)
            .input('Description', sql.VarChar, description)
            .input('IsActive', sql.Bit, true) // Por defecto, habilitar la campaña
            .query(`
                INSERT INTO Campaigns (Title, Description, IsActive)
                OUTPUT INSERTED.Id, INSERTED.Title, INSERTED.Description, INSERTED.IsActive
                VALUES (@Title, @Description, @IsActive)
            `);

        const newCampaign = result.recordset[0];

        // Agregar candidatos a la campaña si existen
        if (candidates && candidates.length > 0) {
            const candidatePromises = candidates.map(candidate => {
                return pool.request()
                    .input('Name', sql.VarChar, candidate.name)
                    .input('Party', sql.VarChar, candidate.party)
                    .input('CampaignId', sql.Int, newCampaign.Id)
                    .query(`
                        INSERT INTO Candidates (Name, Party, CampaignId)
                        VALUES (@Name, @Party, @CampaignId)
                    `);
            });
            await Promise.all(candidatePromises);
        }

        res.status(201).json(newCampaign);
    } catch (error) {
        console.error('Error al crear la campaña:', error);
        res.status(500).json({ message: 'Error al crear la campaña' });
    }
});

// Obtener todas las campañas
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT Id, Title, Description, IsActive FROM Campaigns
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener las campañas:', error);
        res.status(500).json({ message: 'Error al obtener las campañas' });
    }
});

// Habilitar o deshabilitar una campaña
router.patch('/:id/status', authenticateToken, checkRole('admin'), async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { isActive } = req.body; // Espera que el cuerpo de la solicitud tenga un campo 'isActive'

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('IsActive', sql.Bit, isActive)
            .input('Id', sql.Int, parseInt(id))
            .query(`
                UPDATE Campaigns SET IsActive = @IsActive
                WHERE Id = @Id;
                SELECT * FROM Campaigns WHERE Id = @Id;
            `);

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error al actualizar el estado de la campaña:', error);
        res.status(500).json({ message: 'Error al actualizar el estado de la campaña' });
    }
});

// Cerrar una campaña
router.post('/:id/close', authenticateToken, checkRole('admin'), async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Id', sql.Int, parseInt(id))
            .query(`
                UPDATE Campaigns SET IsActive = 0 WHERE Id = @Id;
                SELECT * FROM Campaigns WHERE Id = @Id;
            `);

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error al cerrar la campaña:', error);
        res.status(500).json({ message: 'Error al cerrar la campaña' });
    }
});

// Obtener resultados de una campaña (opcional)
router.get('/:id/results', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const campaignResult = await pool.request()
            .input('Id', sql.Int, parseInt(id))
            .query(`
                SELECT Id, Title, Description, IsActive FROM Campaigns WHERE Id = @Id
            `);

        const campaign = campaignResult.recordset[0];
        if (!campaign) {
            res.status(404).json({ message: 'Campaña no encontrada' });
            return;
        }

        // Aquí puedes calcular los resultados y devolverlos
        res.json(campaign);
    } catch (error) {
        console.error('Error al obtener los resultados de la campaña:', error);
        res.status(500).json({ message: 'Error al obtener los resultados de la campaña' });
    }
});

export default router;
