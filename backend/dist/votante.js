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
const { poolPromise } = require('../db'); // Asegúrate de que la ruta a db.js es correcta
const index_1 = require("./index"); // Importar el middleware de autenticación
const router = (0, express_1.Router)();
// Obtener todas las campañas habilitadas para votar
router.get('/campaigns', index_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pool = yield poolPromise; // Obtener el pool
        const campaignsResult = yield pool.request().query(`
            SELECT Id, Title, Description, IsActive FROM Campaigns WHERE IsActive = 1
        `);
        // Obtener candidatos relacionados para cada campaña
        const campaignIds = campaignsResult.recordset.map((campaign) => campaign.Id);
        const candidatesResult = yield pool.request().query(`
            SELECT * FROM Candidates WHERE CampaignId IN (${campaignIds.join(',')})
        `);
        // Asociar candidatos con campañas
        const campaignsWithCandidates = campaignsResult.recordset.map((campaign) => (Object.assign(Object.assign({}, campaign), { candidates: candidatesResult.recordset.filter((candidate) => candidate.CampaignId === campaign.Id) })));
        res.json(campaignsWithCandidates); // Responder con las campañas
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las campañas' });
    }
}));
// Votar por un candidato en una campaña
router.post('/vote', index_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { candidateId, campaignId } = req.body;
    const userEmail = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email; // Asegúrate de que el correo electrónico del usuario esté en el token
    try {
        const pool = yield poolPromise; // Obtener el pool
        // Verificar si el votante ya ha votado en esta campaña
        const existingVoteResult = yield pool.request()
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
        const voteResult = yield pool.request()
            .input('UserEmail', userEmail)
            .input('CandidateId', candidateId)
            .input('CampaignId', campaignId)
            .query(`
                INSERT INTO Votes (UserEmail, CandidateId, CampaignId)
                VALUES (@UserEmail, @CandidateId, @CampaignId);
                SELECT * FROM Votes WHERE UserEmail = @UserEmail AND CampaignId = @CampaignId;
            `);
        res.status(201).json(voteResult.recordset[0]); // Responder con el voto creado
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el voto' });
    }
}));
exports.default = router;
