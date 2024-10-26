export interface User {
    colegiado: string;
    name: string;
    email: string;
    dpi: string;
    birthDate: string;
    password: string;
    role: 'admin' | 'voter'; // Agregar rol
  }
