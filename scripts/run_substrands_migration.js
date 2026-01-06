/**
 * Run the sub-strands migration directly
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'grade10_lms',
    password: process.env.DB_PASSWORD || 'kimoda.098',
    port: process.env.DB_PORT || 5432,
});

async function runMigration() {
    const client = await pool.connect();
    
    try {
        console.log('Running sub-strands migration...\n');
        await client.query('BEGIN');
        
        const migrationFile = path.join(__dirname, '..', 'migrations', '008_populate_grade10_substrands.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');
        
        await client.query(sql);
        
        await client.query('COMMIT');
        console.log('\n✅ Sub-strands migration completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Migration failed:', error.message);
        if (error.detail) console.error('Detail:', error.detail);
        if (error.hint) console.error('Hint:', error.hint);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();

