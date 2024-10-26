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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = exports.authenticateToken = void 0;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../db");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors")); // Importa el paquete cors
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)()); // Habilita CORS
app.use(express_1.default.json());
// Middleware para autenticar el token
const authenticateToken = (req, res, next) => {
    var _a;
    const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1]; // Asumiendo que el token viene en el header 'Authorization'
    if (!token) {
        res.status(401).json({ message: 'Acceso denegado' });
        return;
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
        if (err) {
            res.status(403).json({ message: 'Token inválido' });
            return;
        }
        req.user = user; // Almacena la información del usuario en la solicitud
        next(); // Importante: No devolvemos nada aquí, solo llamamos a next()
    });
};
exports.authenticateToken = authenticateToken;
// Middleware para verificar el rol
const checkRole = (role) => {
    return (req, res, next) => {
        var _a;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== role) {
            res.status(403).json({ message: 'Acceso denegado' });
            return;
        }
        next(); // Importante: No devolvemos nada aquí, solo llamamos a next()
    };
};
exports.checkRole = checkRole;
// Ruta para registrar un nuevo usuario
app.post('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { colegiado, name, email, dpi, birthDate, password, role } = req.body;
    // Verificación de campos obligatorios
    if (!colegiado || !name || !email || !dpi || !birthDate || !password) {
        res.status(400).json({ message: 'Todos los campos son obligatorios' });
        return;
    }
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const pool = yield db_1.poolPromise;
        const result = yield pool.request()
            .input('colegiado', db_1.sql.VarChar, colegiado)
            .input('name', db_1.sql.VarChar, name)
            .input('email', db_1.sql.VarChar, email)
            .input('dpi', db_1.sql.VarChar, dpi)
            .input('birthDate', db_1.sql.Date, birthDate)
            .input('password', db_1.sql.VarChar, hashedPassword)
            .input('role', db_1.sql.VarChar, role || 'voter')
            .query('INSERT INTO Users (colegiado, name, email, dpi, birthDate, password, role) OUTPUT INSERTED.id AS id, INSERTED.*');
        res.status(201).json({ message: 'Usuario creado exitosamente', user: result.recordset[0] });
    }
    catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ message: 'Error al crear el usuario', error });
    }
}));
// Ruta para iniciar sesión
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ message: 'Email y contraseña son obligatorios' });
        return;
    }
    try {
        const pool = yield db_1.poolPromise;
        const result = yield pool.request()
            .input('email', db_1.sql.VarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');
        if (result.recordset.length === 0) {
            res.status(401).json({ message: 'Email o contraseña incorrectos' });
            return;
        }
        const user = result.recordset[0];
        const match = yield bcrypt_1.default.compare(password, user.password);
        if (!match) {
            res.status(401).json({ message: 'Email o contraseña incorrectos' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1h' });
        res.json({ message: 'Login exitoso', token });
    }
    catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error al iniciar sesión', error });
    }
}));
// Ruta para obtener todos los usuarios (solo para administradores)
app.get('/users', exports.authenticateToken, (0, exports.checkRole)('admin'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pool = yield db_1.poolPromise;
        const result = yield pool.request().query('SELECT * FROM Users');
        res.json(result.recordset);
    }
    catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ message: 'Error al obtener los usuarios', error });
    }
}));
// Ruta para obtener un usuario específico
app.get('/users/:id', exports.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    try {
        const pool = yield db_1.poolPromise;
        const result = yield pool.request()
            .input('id', db_1.sql.Int, userId)
            .query('SELECT * FROM Users WHERE id = @id');
        if (result.recordset.length === 0) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        res.json(result.recordset[0]);
    }
    catch (error) {
        console.error('Error al obtener el usuario:', error);
        res.status(500).json({ message: 'Error al obtener el usuario', error });
    }
}));
// Middleware para manejar errores no encontrados
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});
// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
