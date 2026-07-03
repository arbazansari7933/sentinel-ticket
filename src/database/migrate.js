import fs from "fs/promises";
import path from "path";
import pool from "../config/db.js"

//console.log(process.cwd());

const migrationPath = path.join(
    process.cwd(),
    "src",
    "database",
    "migrations"
)

const files = await fs.readdir(migrationPath);
files.sort();
for (const file of files) {
     //console.log("Running:", file);

    const filePath = path.join(migrationPath, file);
    const sql = await fs.readFile(filePath, "utf8");
    await pool.query(sql);
    //console.log("Finished:", file);

}
