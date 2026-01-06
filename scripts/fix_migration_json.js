const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, '..', 'migrations', '008_populate_grade10_substrands.sql');
let content = fs.readFileSync(migrationFile, 'utf8');

// Replace all instances of: SELECT update_learning_area_strands('CODE', '[
// With: SELECT update_learning_area_strands('CODE', $json$[
content = content.replace(/SELECT update_learning_area_strands\('([^']+)', '\[/g, "SELECT update_learning_area_strands('$1', $json$[");

// Replace all instances of: ]'::jsonb);
// With: ]$json$::jsonb);
content = content.replace(/\]'::jsonb\);/g, ']$json$::jsonb);');

fs.writeFileSync(migrationFile, content, 'utf8');
console.log('✅ Fixed all JSON strings in migration file');

