import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { poolPromise, sql } from '../db';
import dotenv from 'dotenv';
import cors from 'cors'; // Importa el paquete cors

dotenv.config();

const app = express();
app.use(cors()); // Habilita CORS
app.use(express.json());

// Middleware para autenticar el token
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers['authorization']?.split(' ')[1]; // Asumiendo que el token viene en el header 'Authorization'

  if (!token) {
    res.status(401).json({ message: 'Acceso denegado' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err: any, user: any) => {
    if (err) {
      res.status(403).json({ message: 'Token inválido' });
      return;
    }
    req.user = user; // Almacena la información del usuario en la solicitud
    next(); // Importante: No devolvemos nada aquí, solo llamamos a next()
  });
};

// Middleware para verificar el rol
export const checkRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    next(); // Importante: No devolvemos nada aquí, solo llamamos a next()
  };
};

// Ruta para registrar un nuevo usuario
app.post('/users', async (req: Request, res: Response): Promise<void> => {
  const { colegiado, name, email, dpi, birthDate, password, role } = req.body;

  // Verificación de campos obligatorios
  if (!colegiado || !name || !email || !dpi || !birthDate || !password) {
    res.status(400).json({ message: 'Todos los campos son obligatorios' });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await poolPromise;

    const result = await pool.request()
      .input('colegiado', sql.VarChar, colegiado)
      .input('name', sql.VarChar, name)
      .input('email', sql.VarChar, email)
      .input('dpi', sql.VarChar, dpi)
      .input('birthDate', sql.Date, birthDate)
      .input('password', sql.VarChar, hashedPassword)
      .input('role', sql.VarChar, role || 'voter')
      .query('INSERT INTO Users (colegiado, name, email, dpi, birthDate, password, role) OUTPUT INSERTED.id AS id, INSERTED.*');

    res.status(201).json({ message: 'Usuario creado exitosamente', user: result.recordset[0] });
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ message: 'Error al crear el usuario', error });
  }
});

// Ruta para iniciar sesión
app.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    return;
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (result.recordset.length === 0) {
      res.status(401).json({ message: 'Email o contraseña incorrectos' });
      return;
    }

    const user = result.recordset[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      res.status(401).json({ message: 'Email o contraseña incorrectos' });
      return;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1h' });
    res.json({ message: 'Login exitoso', token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión', error });
  }
});

// Ruta para obtener todos los usuarios (solo para administradores)
app.get('/users', authenticateToken, checkRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Users');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios', error });
  }
});

// Ruta para obtener un usuario específico
app.get('/users/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.id;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT * FROM Users WHERE id = @id');

    if (result.recordset.length === 0) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ message: 'Error al obtener el usuario', error });
  }
});

// Middleware para manejar errores no encontrados
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
