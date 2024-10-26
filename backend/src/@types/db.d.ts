declare module '../db' {
    import { ConnectionPool } from 'mssql';

    export const poolPromise: Promise<ConnectionPool>;
    export const sql: any; // O puedes ser más específico si conoces la estructura
}
