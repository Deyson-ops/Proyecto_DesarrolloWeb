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
const db_1 = require("../db");
const index_1 = require("./index"); // Importa tus middlewares
const router = (0, express_1.Router)();
// Crear una nueva campaña
router.post('/', index_1.authenticateToken, (0, index_1.checkRole)('admin'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, candidates } = req.body;
    try {
        // Obtener conexión de la base de datos
        const pool = yield db_1.poolPromise;
        // Crear una nueva campaña
        const result = yield pool.request()
            .input('Title', db_1.sql.VarChar, title)
            .input('Description', db_1.sql.VarChar, description)
            .input('IsActive', db_1.sql.Bit, true) // Por defecto, habilitar la campaña
            .query(`
                INSERT INTO Campaigns (Title, Description, IsActive)
                OUTPUT INSERTED.Id, INSERTED.Title, INSERTED.Description, INSERTED.IsActive
                VALUES (@Title, @Description, @IsActive)
            `);
        const newCampaign = result.recordset[0];
        if (candidates && candidates.length > 0) {
            const candidatePromises = candidates.map((candidate) => {
                return pool.request()
                    .input('Name', db_1.sql.VarChar, candidate.name)
                    .input('Party', db_1.sql.VarChar, candidate.party)
                    .input('CampaignId', db_1.sql.Int, newCampaign.Id)
                    .query(`
                        INSERT INTO Candidates (Name, Party, CampaignId)
                        VALUES (@Name, @Party, @CampaignId)
                    `);
            });
            yield Promise.all(candidatePromises);
        }
        res.status(201).json(newCampaign);
    }
    catch (error) {
        console.error('Error al crear la campaña:', error);
        res.status(500).json({ message: 'Error al crear la campaña' });
    }
}));
// Obtener todas las campañas
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pool = yield db_1.poolPromise;
        const result = yield pool.request().query(`
            SELECT Id, Title, Description, IsActive FROM Campaigns
        `);
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error al obtener las campañas:', error);
        res.status(500).json({ message: 'Error al obtener las campañas' });
    }
}));
// Habilitar o deshabilitar una campaña
router.patch('/:id/status', index_1.authenticateToken, (0, index_1.checkRole)('admin'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { isActive } = req.body; // Espera que el cuerpo de la solicitud tenga un campo 'isActive'
    try {
        const pool = yield db_1.poolPromise;
        const result = yield pool.request()
            .input('IsActive', db_1.sql.Bit, isActive)
            .input('Id', db_1.sql.Int, parseInt(id))
            .query(`
                UPDATE Campaigns SET IsActive = @IsActive
                WHERE Id = @Id;
                SELECT * FROM Campaigns WHERE Id = @Id;
            `);
        res.json(result.recordset[0]);
    }
    catch (error) {
        console.error('Error al actualizar el estado de la campaña:', error);
        res.status(500).json({ message: 'Error al actualizar el estado de la campaña' });
    }
}));
// Cerrar una campaña
router.post('/:id/close', index_1.authenticateToken, (0, index_1.checkRole)('admin'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const pool = yield db_1.poolPromise;
        const result = yield pool.request()
            .input('Id', db_1.sql.Int, parseInt(id))
            .query(`
                UPDATE Campaigns SET IsActive = 0 WHERE Id = @Id;
                SELECT * FROM Campaigns WHERE Id = @Id;
            `);
        res.json(result.recordset[0]);
    }
    catch (error) {
        console.error('Error al cerrar la campaña:', error);
        res.status(500).json({ message: 'Error al cerrar la campaña' });
    }
}));
// Obtener resultados de una campaña (opcional)
router.get('/:id/results', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const pool = yield db_1.poolPromise;
        const campaignResult = yield pool.request()
            .input('Id', db_1.sql.Int, parseInt(id))
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
    }
    catch (error) {
        console.error('Error al obtener los resultados de la campaña:', error);
        res.status(500).json({ message: 'Error al obtener los resultados de la campaña' });
    }
}));
exports.default = router;
