# Gestión de Usuarios API

Esta es una API RESTful para gestionar usuarios, desarrollada con Node.js, Express y autenticación mediante JSON Web Tokens (JWT). Además, se han agregado validaciones de tipo mediante TypeScript.

La API está desplegada en Render y puedes acceder a ella mediante la siguiente URL:  
**[https://apirest-typescript-vfy3.onrender.com](https://apirest-typescript-vfy3.onrender.com)**

## Descripción

Esta API permite la gestión de usuarios con funcionalidades de login, creación, actualización y eliminación de usuarios. Además, los endpoints sensibles están protegidos mediante JWT para garantizar que solo los usuarios autenticados puedan acceder a ellos.

## Instrucciones para ejecutar la API localmente

### Clonar el repositorio:

```bash
git clone https://github.com/Deyson-ops/ApiRest.git
```

### Instalar las dependencias:

```bash
npm install
```

### Crear un archivo `.env`:

Dentro del directorio raíz del proyecto, crea un archivo llamado `.env` con las siguientes variables:

```
JWT_SECRET=#ConejoV3loz.1
JWT_EXPIRATION=90s
PORT=3000
```

### Ejecutar la API:

```bash
npm start
```

### URL de la API local:

```
http://localhost:3000
```

## Endpoints (pruebas realizadas con Postman)

### 1. **Crear un Usuario**

Crea un nuevo usuario.

- **URL**: `/users`
- **Método**: `POST`
- **Cuerpo de la solicitud**:
  ```json
  {
    "dpi": "123456789",
    "name": "Deyson Donado",
    "email": "dey@gmail.com",
    "password": "password"
  }
  ```
- **Respuestas**:
  - `201 Created`: Usuario creado correctamente.
  - `400 Bad Request`: El DPI o email ya está registrado.

---

### 2. **Login**

Genera un token JWT válido por 90 segundos.

- **URL**: `/login`
- **Método**: `POST`
- **Cuerpo de la solicitud**:
  ```json
  {
    "email": "dey@gmail.com",
    "password": "password"
  }
  ```
- **Respuesta**:
  ```json
  {
    "token": "jwt_token_generado"
  }
  ```

---

### 3. **Listar Usuarios** (Protegido por JWT)

Obtiene una lista de todos los usuarios registrados.

- **URL**: `/users`
- **Método**: `GET`
- **Headers**:  
  `Authorization: Bearer jwt_token_generado`

- **Respuesta**:
  ```json
  [
    {
      "dpi": "123456789",
      "name": "Deyson Donado",
      "email": "dey@gmail.com"
    },
    ...
  ]
  ```

---

### 4. **Actualizar un Usuario** (Protegido por JWT)

Actualiza los datos de un usuario existente por su DPI.

- **URL**: `/users/:dpi`
- **Método**: `PUT`
- **Headers**:  
  `Authorization: Bearer jwt_token_generado`
- **Cuerpo de la solicitud**:
  ```json
  {
    "name": "Deyson López",
    "email": "deyl@gmail.com",
    "password": "password2"
  }
  ```
- **Respuestas**:
  - `200 OK`: Usuario actualizado correctamente.
  - `404 Not Found`: Usuario no encontrado.

---

### 5. **Eliminar un Usuario** (Protegido por JWT)

Elimina un usuario existente por su DPI.

- **URL**: `/users/:dpi`
- **Método**: `DELETE`
- **Headers**:  
  `Authorization: Bearer jwt_token_generado`
- **Respuestas**:
  - `204 No Content`: Usuario eliminado correctamente.
  - `404 Not Found`: Usuario no encontrado.

---

## Ejemplos de Solicitudes

### 1. **POST** `/login`:

```json
{
  "email": "dey@gmail.com"
  "password": "password1"
}
```

**Respuesta**:
```json
{
  "token": "jwt_token_generado"
}
```

---

### 2. **GET** `/users` (Autenticado):

Headers:  
`Authorization: Bearer jwt_token_generado`

**Respuesta**:
```json
[
  {
    "dpi": "123456789",
    "name": "Deyson Donado",
    "email": "dey@gmail.com"
  }
]
```

---

### 3. **PUT** `/users/123456789` (Autenticado):

Headers:  
`Authorization: Bearer jwt_token_generado`

```json
{
  "name": "Deyson López",
  "email": "deyl@gmail.com",
  "password": "password2"
}
```

**Respuesta**:
```json
{
  "dpi": "123456789",
  "name": "Deyson López",
  "email": "deyl@gmail.com"
}
```

---

### 4. **DELETE** `/users/123456789` (Autenticado):

Headers:  
`Authorization: Bearer jwt_token_generado`

**Respuesta**:
```json
{
    "message": "Usuario con DPI 123456789 eliminado exitosamente"
}
```

---
