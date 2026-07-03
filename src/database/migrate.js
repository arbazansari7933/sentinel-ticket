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
        const files = await fs.readdir(migrationPath);
        const sqlFiles = files.filter(f => f.endsWith(".sql")).sort();

        console.log(`Found ${sqlFiles.length} migration files`);

        for (const file of sqlFiles) {
            const filePath = path.join(migrationPath, file);
            const sql = await fs.readFile(filePath, "utf8");

            try {
                await client.query(sql);
                console.log(`Ran: ${file}`);
            } catch (error) {
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