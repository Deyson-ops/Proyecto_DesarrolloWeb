import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import moment from 'moment';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const app = express();
const prisma = new PrismaClient();
app.use(express.json());

interface User {
  colegiado: string;
  name: string;
  email: string;
  dpi: string;
  birthDate: string;
  password: string;
  role: 'admin' | 'voter'; // Agregar rol
}

interface RequestWithUser extends Request {
  user?: { email: string; role: 'admin' | 'voter' };
}

interface Vote {
  userEmail: string;
  candidate: string;
}

// Funciones de validación
function isValidDPI(dpi: string): boolean {
  const regex = /^\d{13}$/;
  return regex.test(dpi);
}

function isValidDate(date: string): boolean {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!regex.test(date)) return false;

  const [_, day, month, year] = regex.exec(date)!;
  const birthDate = new Date(`${year}-${month}-${day}`);
  const now = new Date();
  return birthDate < now && birthDate > new Date("1900-01-01");
}

function isValidPassword(password: string): boolean {
  const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&#.]{8,}$/;
  return regex.test(password);
}

// Middleware de autenticación
export function authenticateToken(req: RequestWithUser, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
      res.sendStatus(401);
      return;
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
      if (err) {
          res.sendStatus(403);
          return;
      }
      req.user = user as { email: string; role: 'admin' | 'voter' };
      next();
  });
}

// Middleware para verificar el rol
export function checkRole(role: 'admin' | 'voter') {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
      if (req.user?.role !== role) {
          res.status(403).json({ message: 'Acceso denegado' });
          return; // Asegúrate de que haya un return aquí
      }
      next(); // Llama a next() para continuar
  };
}

// Endpoint para crear un usuario
app.post('/users', async (req: Request, res: Response): Promise<void> => {
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

  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Crear el usuario en la base de datos
  const newUser = await prisma.user.create({
    data: { colegiado, name, email, dpi, birthDate, password: hashedPassword, role }
  });

  res.status(201).json({ message: 'Usuario creado exitosamente', user: newUser });
});

// Endpoint para iniciar sesión y generar un token JWT
app.post('/login', async (req: Request, res: Response): Promise<void> => {
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

  if (!moment(birthDate, 'DD/MM/YYYY', true).isValid()) {
    res.status(400).json({ message: 'La fecha de nacimiento debe estar en formato dd/mm/yyyy.' });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      colegiado: colegiado,
      dpi: dpi,
      birthDate: birthDate
    }
  });
  

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: 'Credenciales inválidas' });
    return;
  }

  const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '30m' });
  res.json({ message: `Bienvenido ${user.name}`, token });
});

// Endpoint para emitir un voto
app.post('/vote', authenticateToken, async (req: RequestWithUser, res: Response): Promise<void> => {
  const { candidate } = req.body;
  const userEmail = req.user?.email;

  const existingVote = await prisma.vote.findFirst({
    where: {
      userEmail: userEmail,
      candidate: candidate
    },
  });
  

  if (existingVote) {
    res.status(400).json({ message: 'Ya has emitido tu voto' });
    return;
  }

  await prisma.vote.create({
    data: { userEmail: userEmail!, candidate }
  });

  res.status(201).json({ message: 'Voto registrado con éxito' });
});

// Endpoint para listar los resultados de la votación
app.get('/results', authenticateToken, async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const votes = await prisma.vote.groupBy({
      by: ['candidate'],
      _count: {
        candidate: true,
      },
    });

    interface VoteResult {
      candidate: string;
      _count: {
        candidate: number;
      };
    }

    const results: { candidate: string; count: number }[] = votes.map((vote: VoteResult) => ({
      candidate: vote.candidate,
      count: vote._count.candidate,
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los resultados', error });
  }
});

// Endpoint para actualizar un usuario
app.put('/users/:dpi', authenticateToken, async (req: RequestWithUser, res: Response): Promise<void> => {
  const { dpi } = req.params;
  const { name, email, password, newDpi, newColeg, birthDate } = req.body;

  // Buscar el usuario por DPI
  const user = await prisma.user.findFirst({
    where: { dpi } // Verificamos que el usuario existe
  });

  // Verificar si el usuario existe
  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' });
    return;
  }

  // Verificar si el nuevo DPI o colegiado ya están en uso
  if (newDpi && await prisma.user.findFirst({ where: { dpi: newDpi } })) {
    res.status(400).json({ message: 'El nuevo DPI ya está registrado' });
    return;
  }

  if (newColeg && await prisma.user.findFirst({ where: { colegiado: newColeg } })) {
    res.status(400).json({ message: 'El nuevo colegiado ya está registrado' });
    return;
  }

  // Crear el objeto updatedUser
  const updatedUser: Partial<User> = {
    colegiado: newColeg || user.colegiado,
    name: name || user.name,
    email: email || user.email,
    dpi: newDpi || user.dpi,
    birthDate: birthDate || user.birthDate,
    password: password ? await bcrypt.hash(password, 10) : user.password,
  };

  // Actualizar el usuario utilizando su ID
  await prisma.user.update({
    where: { id: user.id }, // Usamos el ID para la búsqueda
    data: updatedUser
  });

  res.status(200).json({ message: 'Usuario actualizado correctamente', user: updatedUser });
});



// Endpoint para eliminar un usuario
app.delete('/users/:dpi', authenticateToken, async (req: RequestWithUser, res: Response): Promise<void> => {
  const { dpi } = req.params;

  // Buscar el usuario por DPI
  const user = await prisma.user.findFirst({
    where: { dpi } // Utilizando findFirst para buscar un usuario por DPI
  });

  // Verificar si el usuario existe
  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' });
    return;
  }

  // Eliminar el usuario
  await prisma.user.delete({
    where: { id: user.id } // Usamos el ID para eliminar al usuario
  });

  // Enviar respuesta exitosa
  res.status(200).json({ message: `Usuario con DPI ${dpi} eliminado exitosamente` });
});


// Rutas para votantes y campañas
app.get('/votantes', authenticateToken, checkRole('voter'), (req: RequestWithUser, res: Response) => {
  res.json({ message: 'Funciones de votante' });
});

app.get('/campañas', authenticateToken, checkRole('admin'), (req: RequestWithUser, res: Response) => {
  res.json({ message: 'Funciones de administración de campañas' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});


