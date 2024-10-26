"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const index_1 = require("./index"); // Asegúrate de importar tus middlewares
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Crear una nueva campaña
router.post('/', index_1.authenticateToken, (0, index_1.checkRole)('admin'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, candidates } = req.body;
    try {
        const newCampaign = yield prisma.campaign.create({
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
            yield Promise.all(candidatePromises);
        }
        res.status(201).json(newCampaign);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la campaña' });
    }
}));
// Obtener todas las campañas
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const campaigns = yield prisma.campaign.findMany();
        res.json(campaigns);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las campañas' });
    }
}));
// Habilitar o deshabilitar una campaña
router.patch('/:id/status', index_1.authenticateToken, (0, index_1.checkRole)('admin'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { isActive } = req.body; // Espera que el cuerpo de la solicitud tenga un campo 'isActive'
    try {
        const updatedCampaign = yield prisma.campaign.update({
            where: { id: parseInt(id) },
            data: { isActive },
        });
        res.json(updatedCampaign);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el estado de la campaña' });
    }
}));
// Cerrar una campaña y visualizar resultados finales
router.post('/:id/close', index_1.authenticateToken, (0, index_1.checkRole)('admin'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const closedCampaign = yield prisma.campaign.update({
            where: { id: parseInt(id) },
            data: { isActive: false }, // Desactivar la campaña
        });
        // Aquí puedes agregar lógica para obtener y mostrar resultados finales si es necesario
        res.json(closedCampaign);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cerrar la campaña' });
    }
}));
// Obtener resultados de una campaña (opcional)
router.get('/:id/results', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const campaign = yield prisma.campaign.findUnique({
            where: { id: parseInt(id) },
            include: { candidates: true }, // Incluye candidatos relacionados
        });
        if (!campaign) {
            res.status(404).json({ message: 'Campaña no encontrada' });
            return;
        }
        // Aquí puedes calcular los resultados y devolverlos
        res.json(campaign);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los resultados de la campaña' });
    }
}));
exports.default = router;
