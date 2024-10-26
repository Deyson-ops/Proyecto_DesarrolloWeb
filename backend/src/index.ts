import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { poolPromise, sql } from '../db';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors()); // Habilita CORS
app.use(express.json());

// Middleware para autenticar el token
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers['authorization']?.split(' ')[1];

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
    next();
  });
};


// Middleware para verificar el rol
export const checkRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ message: 'Acceso denegado' });
      return;
    }
    next();
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
    const pool = await poolPromise;

    const query = `
      INSERT INTO Users (colegiado, name, email, dpi, birthDate, password, role)
      OUTPUT INSERTED.id, INSERTED.colegiado, INSERTED.name, INSERTED.email, INSERTED.dpi, INSERTED.birthDate, INSERTED.role
      VALUES (@colegiado, @name, @email, @dpi, @birthDate, @password, @role)
    `;

    const result = await pool.request()
      .input('colegiado', sql.VarChar, colegiado)
      .input('name', sql.VarChar, name)
      .input('email', sql.VarChar, email)
      .input('dpi', sql.VarChar, dpi)
      .input('birthDate', sql.Date, birthDate)
      .input('password', sql.VarChar, password)
      .input('role', sql.VarChar, role || 'voter')
      .query(query);

    res.status(201).json({ message: 'Usuario creado exitosamente', user: result.recordset[0] });
  } catch (error: unknown) { // Declaración de tipo para el error
    if (error instanceof Error) {
      console.error('Error al crear el usuario:', error.message); // Agrega un log para el error
      res.status(500).json({ message: 'Error al crear el usuario', error: error.message });
    } else {
      console.error('Error desconocido al crear el usuario:', error);
      res.status(500).json({ message: 'Error al crear el usuario', error: 'Ocurrió un error desconocido' });
    }
  }
});

import moment from 'moment';

// Ruta para iniciar sesión
app.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { colegiado, dpi, birthDate, password } = req.body;

  // Verificación de campos obligatorios
  if (!colegiado || !dpi || !birthDate || !password) {
    res.status(400).json({ message: 'Número de colegiado, DPI, fecha de nacimiento y contraseña son obligatorios' });
    return;
  }

  try {
    const pool = await poolPromise;

    // Validar formatos de fecha
    const birthDateFormat1 = moment(birthDate, 'YYYY-MM-DD', true); // Formato: año-mes-día
    const birthDateFormat2 = moment(birthDate, 'DD-MM-YYYY', true); // Formato: día-mes-año

    if (!birthDateFormat1.isValid() && !birthDateFormat2.isValid()) {
      res.status(400).json({ message: 'El formato de la fecha de nacimiento es incorrecto. Usa YYYY-MM-DD o DD-MM-YYYY' });
      return;
    }

    // Convertir a formato YYYY-MM-DD para la consulta
    const formattedBirthDate = birthDateFormat1.isValid() 
      ? birthDateFormat1.format('YYYY-MM-DD') 
      : birthDateFormat2.format('DD-MM-YYYY');

    // Consulta para buscar al usuario
    const result = await pool.request()
      .input('colegiado', sql.VarChar, colegiado)
      .input('dpi', sql.VarChar, dpi)
      .input('birthDate', sql.Date, formattedBirthDate)
      .query('SELECT * FROM Users WHERE colegiado = @colegiado AND dpi = @dpi AND birthDate = @birthDate');

    // Verificar si el usuario existe
    if (result.recordset.length === 0) {
      res.status(401).json({ message: 'Número de colegiado, DPI o fecha de nacimiento incorrectos' });
      return;
    }

    const user = result.recordset[0];

// Comparar la contraseña directamente
console.log('Contraseña ingresada:', password);
console.log('Contraseña almacenada:', user.Password);

if (password.trim() !== user.Password.trim()) {
  res.status(401).json({ message: 'Contraseña incorrecta' });
  return;
}


    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login exitoso', token });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error al iniciar sesión:', error.message);
      res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
    } else {
      console.error('Error al iniciar sesión:', error);
      res.status(500).json({ message: 'Error al iniciar sesión', error: 'Ocurrió un error desconocido' });
    }
  }  
});


// Ruta para obtener todos los usuarios (solo para administradores)
app.get('/users', authenticateToken, checkRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
      const pool = await poolPromise;

      // Consulta para obtener todos los usuarios
      const result = await pool.request()
          .query('SELECT id, colegiado, name, email, dpi, birthDate, role FROM Users');

      // Enviar la lista de usuarios como respuesta
      res.json(result.recordset);
  } catch (error) {
      // Aserción de tipo para manejar el error correctamente
      if (error instanceof Error) {
          console.error('Error al obtener los usuarios:', error.message);
          res.status(500).json({ message: 'Error al obtener los usuarios', error: error.message });
      } else {
          console.error('Error al obtener los usuarios:', error);
          res.status(500).json({ message: 'Error al obtener los usuarios', error: 'Ocurrió un error desconocido' });
      }
  }
});

// Ruta para obtener un usuario específico
app.get('/users/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const userId = Number(req.params.id);

  if (isNaN(userId)) {
    res.status(400).json({ message: 'ID de usuario inválido' });
    return;
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT id, colegiado, name, email, dpi, birthDate, role FROM Users WHERE id = @id');

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
