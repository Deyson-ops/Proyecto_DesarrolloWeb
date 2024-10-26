// db.ts
import { ConnectionPool, config } from 'mssql';

const poolPromise = new ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to the database');
        return pool;
    })
    .catch(err => console.log('Database connection failed: ', err));

export { poolPromise };
export * as sql from 'mssql'; // Exportar todas las funcionalidades de mssql
