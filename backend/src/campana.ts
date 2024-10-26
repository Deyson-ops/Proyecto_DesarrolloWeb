import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, checkRole } from './index'; // Asegúrate de importar tus middlewares

const router = Router();
const prisma = new PrismaClient();

// Tipo para un candidato
interface Candidate {
    name: string;
    party: string; // O cualquier otra propiedad que tu modelo de candidato tenga
}

// Crear una nueva campaña
router.post('/', authenticateToken, checkRole('admin'), async (req: Request, res: Response): Promise<void> => {
    const { title, description, candidates }: { title: string; description: string; candidates: Candidate[] } = req.body;

    try {
        const newCampaign = await prisma.campaign.create({
            data: {
                title,
                description,
                isActive: true, // Por defecto, habilitar la campaña
            },
        });

        // Agregar candidatos a la campaña
        if (candidates && candidates.length > 0) {
            const candidatePromises = candidates.map((candidate) => {
                return prisma.candidate.create({
                    data: {
                        name: candidate.name,
                        party: candidate.party,
                        campaignId: newCampaign.id, // Asociar candidato con la campaña
                    },
                });
            });
            await Promise.all(candidatePromises);
        }

        res.status(201).json(newCampaign);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la campaña' });
    }
});

// Obtener todas las campañas
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const campaigns = await prisma.campaign.findMany();
        res.json(campaigns);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las campañas' });
    }
});

// Habilitar o deshabilitar una campaña
router.patch('/:id/status', authenticateToken, checkRole('admin'), async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { isActive } = req.body; // Espera que el cuerpo de la solicitud tenga un campo 'isActive'

    try {
        const updatedCampaign = await prisma.campaign.update({
            where: { id: parseInt(id) },
            data: { isActive },
        });
        res.json(updatedCampaign);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el estado de la campaña' });
    }
});

// Cerrar una campaña y visualizar resultados finales
router.post('/:id/close', authenticateToken, checkRole('admin'), async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const closedCampaign = await prisma.campaign.update({
            where: { id: parseInt(id) },
            data: { isActive: false }, // Desactivar la campaña
        });
        
        // Aquí puedes agregar lógica para obtener y mostrar resultados finales si es necesario

        res.json(closedCampaign);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cerrar la campaña' });
    }
});

// Obtener resultados de una campaña (opcional)
router.get('/:id/results', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const campaign = await prisma.campaign.findUnique({
            where: { id: parseInt(id) },
            include: { candidates: true }, // Incluye candidatos relacionados
        });

        if (!campaign) {
            res.status(404).json({ message: 'Campaña no encontrada' });
            return;
        }

        // Aquí puedes calcular los resultados y devolverlos
        res.json(campaign);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los resultados de la campaña' });
    }
});

export default router;
