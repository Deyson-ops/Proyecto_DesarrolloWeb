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
const index_1 = require("./index"); // Import your middlewares
const { poolPromise } = require('../db');
const router = (0, express_1.Router)();
// Create a new candidate
router.post('/', index_1.authenticateToken, (0, index_1.checkRole)('admin'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, campaignId } = req.body;
    try {
        const pool = yield poolPromise;
        const result = yield pool.request()
            .input('Name', name)
            .input('CampaignId', campaignId)
            .query(`
                INSERT INTO Candidates (Name, CampaignId)
                VALUES (@Name, @CampaignId);
                SELECT * FROM Candidates WHERE Id = SCOPE_IDENTITY();
            `);
        res.status(201).json(result.recordset[0]); // Respond with the created candidate
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el candidato' });
    }
}));
// Get all candidates
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pool = yield poolPromise;
        const result = yield pool.request().query('SELECT * FROM Candidates');
        res.json(result.recordset); // Respond with all candidates
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los candidatos' });
    }
}));
// Get candidates by campaign
router.get('/campaign/:campaignId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { campaignId } = req.params;
    try {
        const pool = yield poolPromise;
        const result = yield pool.request()
            .input('CampaignId', parseInt(campaignId))
            .query('SELECT * FROM Candidates WHERE CampaignId = @CampaignId');
        res.json(result.recordset); // Respond with the campaign's candidates
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los candidatos de la campaña' });
    }
}));
// Delete a candidate
router.delete('/:id', index_1.authenticateToken, (0, index_1.checkRole)('admin'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const pool = yield poolPromise;
        yield pool.request()
            .input('Id', parseInt(id))
            .query('DELETE FROM Candidates WHERE Id = @Id');
        res.status(204).send(); // Respond with 204 No Content
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el candidato' });
    }
}));
exports.default = router;
