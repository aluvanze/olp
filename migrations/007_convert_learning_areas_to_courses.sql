-- Convert Learning Areas to Courses
-- This creates courses from all learning areas so they can be assigned to teachers

-- Get current academic year (default to 2025-2026)
DO $$
DECLARE
    current_academic_year VARCHAR(20) := '2025-2026';
    course_count INTEGER := 0;
    la_record RECORD;
    course_code_val VARCHAR(20);
BEGIN
    -- Loop through unique learning areas and create courses
    FOR la_record IN 
        SELECT DISTINCT ON (code) 
            id, 
            code, 
            name 
        FROM learning_areas 
        WHERE code IS NOT NULL AND code != ''
        ORDER BY code, id 
    LOOP
        -- Use learning area code directly (should be unique)
        course_code_val := la_record.code;
        
        -- Check if course with this code already exists
        IF NOT EXISTS (
            SELECT 1 FROM courses 
            WHERE course_code = course_code_val
        ) THEN
            -- Insert course
            BEGIN
                INSERT INTO courses (course_code, course_name, description, academic_year, learning_area_id, is_active)
                VALUES (
                    course_code_val,
                    la_record.name,
                    'Senior School subject: ' || la_record.name,
                    current_academic_year,
                    la_record.id,
                    true
                );
                course_count := course_count + 1;
            EXCEPTION WHEN unique_violation THEN
                -- Skip if duplicate
                NULL;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Created % courses from learning areas', course_count;
END $$;

-- Show summary
SELECT 
    COUNT(*) as total_courses,
    COUNT(DISTINCT learning_area_id) as unique_subjects
FROM courses 
WHERE academic_year = '2025-2026' 
AND learning_area_id IS NOT NULL
AND is_active = true;

