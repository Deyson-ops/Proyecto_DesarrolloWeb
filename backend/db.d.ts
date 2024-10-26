// db.d.ts

declare module '../db' {
    import { Pool } from 'mssql'; // or the appropriate type based on your DB library

    export const poolPromise: Pool; // Export the poolPromise
    // Add any other exports or types that you need
}
