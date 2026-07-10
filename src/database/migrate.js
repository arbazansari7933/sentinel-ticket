import fs from "fs/promises";
import path from "path";
import pool from "../config/db.js";

const migrationPath = path.join(
    process.cwd(),
    "src",
    "database",
    "migrations"
);

async function runMigrations() {
    const client = await pool.connect();

    try {
        // Create migration history table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename TEXT PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const files = await fs.readdir(migrationPath);
        const sqlFiles = files.filter(file => file.endsWith(".sql")).sort();

        console.log(`Found ${sqlFiles.length} migration files`);

        for (const file of sqlFiles) {

            // Check if migration already ran
            const migration = await client.query(
                `SELECT 1 FROM schema_migrations WHERE filename = $1`,
                [file]
            );

            if (migration.rowCount > 0) {
                console.log(`Skipped: ${file}`);
                continue;
            }

            const filePath = path.join(migrationPath, file);
            const sql = await fs.readFile(filePath, "utf8");

            try {
                await client.query("BEGIN");

                await client.query(sql);

                await client.query(
                    `INSERT INTO schema_migrations(filename)
                     VALUES ($1)`,
                    [file]
                );

                await client.query("COMMIT");

                console.log(`Ran: ${file}`);

            } catch (error) {

                await client.query("ROLLBACK");

                console.error(`Failed: ${file}`);
                console.error(`Reason: ${error.message}`);

                process.exit(1);
            }
        }

        console.log("All migrations completed successfully");

    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();