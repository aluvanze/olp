/**
 * Script to update learning area sub-strands from KICD curriculum designs
 * 
 * This script provides a template for updating sub-strands with actual KICD data.
 * To use:
 * 1. Download the Grade 10 curriculum design PDFs from KICD website
 * 2. Extract the strands, sub-strands, and indicators for each subject
 * 3. Update the learningAreaData object below with the actual data
 * 4. Run: node scripts/update_substrands_from_kicd.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'grade10_lms',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Template structure for learning area data
// Update this with actual KICD curriculum data
const learningAreaData = {
    // Example: English
    'ENG': {
        strands: [
            {
                strand_code: 'STR1',
                strand_name: 'Listening and Speaking',
                sub_strands: [
                    {
                        sub_strand_code: 'SS1.1',
                        sub_strand_name: 'Listening Comprehension',
                        indicators: [
                            { indicator_code: 'IND1.1.1', indicator_name: 'Listen and respond to oral texts' },
                            { indicator_code: 'IND1.1.2', indicator_name: 'Identify main ideas and supporting details' },
                            // Add more indicators from KICD document
                        ]
                    },
                    // Add more sub-strands from KICD document
                ]
            },
            // Add more strands from KICD document
        ]
    },
    // Add more learning areas following the same structure
};

async function updateLearningAreaStrands(learningAreaCode, strandsData) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            `UPDATE learning_areas 
             SET strands = $1::jsonb, updated_at = CURRENT_TIMESTAMP 
             WHERE code = $2`,
            [JSON.stringify(strandsData.strands), learningAreaCode]
        );
        
        if (result.rowCount === 0) {
            console.warn(`Learning area with code ${learningAreaCode} not found`);
        } else {
            console.log(`✓ Updated ${learningAreaCode} with ${strandsData.strands.length} strand(s)`);
        }
        
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating ${learningAreaCode}:`, error.message);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    console.log('Updating learning area sub-strands from KICD data...\n');
    
    try {
        for (const [code, data] of Object.entries(learningAreaData)) {
            await updateLearningAreaStrands(code, data);
        }
        
        console.log('\n✅ All learning areas updated successfully!');
    } catch (error) {
        console.error('\n❌ Error updating learning areas:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { updateLearningAreaStrands };

