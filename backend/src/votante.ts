import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './index'; // Asegúrate de importar el middleware de autenticación

const router = Router();
const prisma = new PrismaClient();

// Obtener todas las campañas habilitadas para votar
router.get('/campaigns', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const campaigns = await prisma.campaign.findMany({
            where: { isActive: true }, // Solo obtener campañas habilitadas
            include: { candidates: true }, // Incluir candidatos relacionados
        });
        res.json(campaigns); // Responder con las campañas
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las campañas' });
    }
});

// Votar por un candidato en una campaña
router.post('/vote', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    const { candidateId, campaignId } = req.body;

    try {
        // Comprobar si el votante ya ha votado en esta campaña
        const existingVote = await prisma.vote.findUnique({
            where: {
                voterId_campaignId: {
                    voterId: req.user?.id, // Asumiendo que el ID del votante está en el token
                    campaignId: campaignId,
                },
            },
        });

        if (existingVote) {
            res.status(400).json({ message: 'Ya has votado en esta campaña' });
            return; // Termina la ejecución
        }

        const vote = await prisma.vote.create({
            data: {
                candidateId,
                campaignId,
                voterId: req.user?.id, // Asumiendo que el ID del votante está en el token
            },
        });
        res.status(201).json(vote); // Responder con el voto creado
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el voto' });
    }
});

export default router;
