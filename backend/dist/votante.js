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
const index_1 = require("./index"); // Asegúrate de importar el middleware de autenticación
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Obtener todas las campañas habilitadas para votar
router.get('/campaigns', index_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const campaigns = yield prisma.campaign.findMany({
            where: { isActive: true }, // Solo obtener campañas habilitadas
            include: { candidates: true }, // Incluir candidatos relacionados
        });
        res.json(campaigns); // Responder con las campañas
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las campañas' });
    }
}));
// Votar por un candidato en una campaña
router.post('/vote', index_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { candidateId, campaignId } = req.body;
    try {
        // Comprobar si el votante ya ha votado en esta campaña
        const existingVote = yield prisma.vote.findUnique({
            where: {
                voterId_campaignId: {
                    voterId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, // Asumiendo que el ID del votante está en el token
                    campaignId: campaignId,
                },
            },
        });
        if (existingVote) {
            res.status(400).json({ message: 'Ya has votado en esta campaña' });
            return; // Termina la ejecución
        }
        const vote = yield prisma.vote.create({
            data: {
                candidateId,
                campaignId,
                voterId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id, // Asumiendo que el ID del votante está en el token
            },
        });
        res.status(201).json(vote); // Responder con el voto creado
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el voto' });
    }
}));
exports.default = router;
