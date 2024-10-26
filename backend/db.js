const sql = require('mssql');

/**
 * @typedef {import('mssql').ConnectionPool} ConnectionPool
 * @type {import('mssql')}
 */

const config = {
  user: 'SA',
  password: 'Umg123',
  server: 'DEY', // nombre o IP del servidor
  database: 'VotingSystemDB',
  options: {
    encrypt: true, // Para conexiones seguras
    trustServerCertificate: true // Si usas un certificado autofirmado
  }
};

/** @type {Promise<ConnectionPool>} */
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Conectado a la base de datos');
    return pool;
  })
  .catch(err => {
    console.error('Error de conexión a la base de datos:', err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise
};
