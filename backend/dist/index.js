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
exports.authenticateToken = authenticateToken;
exports.checkRole = checkRole;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const moment_1 = __importDefault(require("moment"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use(express_1.default.json());
// Funciones de validación
function isValidDPI(dpi) {
    const regex = /^\d{13}$/;
    return regex.test(dpi);
}
function isValidDate(date) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(date))
        return false;
    const [_, day, month, year] = regex.exec(date);
    const birthDate = new Date(`${year}-${month}-${day}`);
    const now = new Date();
    return birthDate < now && birthDate > new Date("1900-01-01");
}
function isValidPassword(password) {
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}
// Middleware de autenticación
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.sendStatus(401);
        return;
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        req.user = user;
        next();
    });
}
// Middleware para verificar el rol
function checkRole(role) {
    return (req, res, next) => {
        var _a;
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== role) {
            res.status(403).json({ message: 'Acceso denegado' });
            return; // Asegúrate de que haya un return aquí
        }
        next(); // Llama a next() para continuar
    };
}
// Endpoint para crear un usuario
app.post('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { colegiado, name, email, dpi, birthDate, password, role } = req.body;
    if (!colegiado || !name || !email || !dpi || !birthDate || !password || !role) {
        res.status(400).json({ message: 'Todos los campos son requeridos' });
        return;
    }
    if (!isValidDPI(dpi)) {
        res.status(400).json({ message: 'DPI inválido' });
        return;
    }
    if (!isValidDate(birthDate)) {
        res.status(400).json({ message: 'Fecha de nacimiento inválida. Use formato DD/MM/AAAA' });
        return;
    }
    if (!isValidPassword(password)) {
        res.status(400).json({
            message: 'La contraseña debe tener al menos 8 caracteres, incluir una letra mayúscula, una minúscula, un número y un carácter especial',
        });
        return;
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    // Crear el usuario en la base de datos
    const newUser = yield prisma.user.create({
        data: { colegiado, name, email, dpi, birthDate, password: hashedPassword, role }
    });
    res.status(201).json({ message: 'Usuario creado exitosamente', user: newUser });
}));
// Endpoint para iniciar sesión y generar un token JWT
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { colegiado, dpi, birthDate, password } = req.body;
    // Validaciones
    if (!/^\d+$/.test(colegiado)) {
        res.status(400).json({ message: 'El número de colegiado debe ser numérico.' });
        return;
    }
    if (!/^\d{13}$/.test(dpi)) {
        res.status(400).json({ message: 'El DPI debe tener 13 dígitos.' });
        return;
    }
    if (!(0, moment_1.default)(birthDate, 'DD/MM/YYYY', true).isValid()) {
        res.status(400).json({ message: 'La fecha de nacimiento debe estar en formato dd/mm/yyyy.' });
        return;
    }
    const user = yield prisma.user.findUnique({
        where: { colegiado_dpi_birthDate: { colegiado, dpi, birthDate } }
    });
    if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
        res.status(401).json({ message: 'Credenciales inválidas' });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30m' });
    res.json({ message: `Bienvenido ${user.name}`, token });
}));
// Endpoint para emitir un voto
app.post('/vote', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { candidate } = req.body;
    const userEmail = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    const existingVote = yield prisma.vote.findUnique({
        where: {
            userEmail_candidate: {
                userEmail: userEmail,
                candidate,
            },
        },
    });
    if (existingVote) {
        res.status(400).json({ message: 'Ya has emitido tu voto' });
        return;
    }
    yield prisma.vote.create({
        data: { userEmail: userEmail, candidate }
    });
    res.status(201).json({ message: 'Voto registrado con éxito' });
}));
// Endpoint para listar los resultados de la votación
app.get('/results', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const votes = yield prisma.vote.groupBy({
            by: ['candidate'],
            _count: {
                candidate: true,
            },
        });
        const results = votes.map((vote) => ({
            candidate: vote.candidate,
            count: vote._count.candidate,
        }));
        res.json(results);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener los resultados', error });
    }
}));
// Endpoint para actualizar un usuario
app.put('/users/:dpi', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { dpi } = req.params;
    const { name, email, password, newDpi, birthDate } = req.body;
    const user = yield prisma.user.findUnique({
        where: { dpi }
    });
    if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
    }
    if (newDpi && (yield prisma.user.findUnique({ where: { dpi: newDpi } }))) {
        res.status(400).json({ message: 'El nuevo DPI ya está registrado' });
        return;
    }
    // Crear el objeto updatedUser, incluyendo birthDate si se proporciona
    const updatedUser = Object.assign(Object.assign({}, user), { name: name || user.name, email: email || user.email, password: password ? yield bcrypt_1.default.hash(password, 10) : user.password, dpi: newDpi || dpi, birthDate: birthDate || user.birthDate });
    yield prisma.user.update({
        where: { dpi },
        data: updatedUser
    });
    res.status(200).json({ message: 'Usuario actualizado correctamente', user: updatedUser });
}));
// Endpoint para eliminar un usuario
app.delete('/users/:dpi', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { dpi } = req.params;
    const user = yield prisma.user.findUnique({
        where: { dpi }
    });
    if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
    }
    yield prisma.user.delete({
        where: { dpi }
    });
    res.status(200).json({ message: `Usuario con DPI ${dpi} eliminado exitosamente` });
}));
// Rutas para votantes y campañas
app.get('/votantes', authenticateToken, checkRole('voter'), (req, res) => {
    res.json({ message: 'Funciones de votante' });
});
app.get('/campañas', authenticateToken, checkRole('admin'), (req, res) => {
    res.json({ message: 'Funciones de administración de campañas' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
