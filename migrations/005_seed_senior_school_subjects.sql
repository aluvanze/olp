-- Seed Senior School Subjects (Learning Areas) based on Kenya CBC Curriculum
-- This creates all subjects listed in the Senior School curriculum

-- First, ensure pathways exist
INSERT INTO pathways (name, code, description, is_active) VALUES
    ('STEM', 'STEM', 'Science, Technology, Engineering & Mathematics', true),
    ('Arts and Sports Science', 'ARTS', 'Arts & Sports Science', true),
    ('Social Sciences', 'SOCIAL', 'Social Sciences', true)
ON CONFLICT (code) DO NOTHING;

-- Core Learning Areas (required for all pathways)
INSERT INTO learning_areas (name, code, pathway_id, is_core, strands, rubrics) VALUES
    ('English', 'ENG', NULL, true, '[]'::jsonb, '[]'::jsonb),
    ('Kiswahili/KSL', 'KISW', NULL, true, '[]'::jsonb, '[]'::jsonb),
    ('Core Mathematics', 'MATH', NULL, true, '[]'::jsonb, '[]'::jsonb),
    ('Essential Mathematics', 'MATH_ESS', NULL, true, '[]'::jsonb, '[]'::jsonb),
    ('Community Service Learning', 'CSL', NULL, true, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (code, pathway_id) DO NOTHING;

-- Arts & Sports Science Learning Areas
INSERT INTO learning_areas (name, code, pathway_id, is_core, strands, rubrics) 
SELECT 
    la.name,
    la.code,
    p.id as pathway_id,
    false as is_core,
    '[]'::jsonb as strands,
    '[]'::jsonb as rubrics
FROM (VALUES
    ('Sports and Recreation', 'SPORTS'),
    ('Music and Dance', 'MUSIC'),
    ('Theatre and Film', 'THEATRE'),
    ('Fine Arts', 'FINE_ARTS')
) AS la(name, code)
CROSS JOIN pathways p
WHERE p.code = 'ARTS'
ON CONFLICT (code, pathway_id) DO NOTHING;

-- Social Sciences Learning Areas
INSERT INTO learning_areas (name, code, pathway_id, is_core, strands, rubrics) 
SELECT 
    la.name,
    la.code,
    p.id as pathway_id,
    false as is_core,
    '[]'::jsonb as strands,
    '[]'::jsonb as rubrics
FROM (VALUES
    ('Literature in English', 'LIT_ENG'),
    ('Indigenous Languages', 'IND_LANG'),
    ('Fasihi ya Kiswahili', 'FASIHI'),
    ('Sign Language', 'SIGN_LANG'),
    ('Arabic', 'ARABIC'),
    ('French', 'FRENCH'),
    ('German', 'GERMAN'),
    ('Mandarin Chinese', 'MANDARIN'),
    ('Christian Religious Education', 'CRE'),
    ('Islamic Religious Education', 'IRE'),
    ('Hindu Religious Education', 'HRE'),
    ('Business Studies', 'BUSINESS'),
    ('History and Citizenship', 'HISTORY'),
    ('Geography', 'GEOGRAPHY')
) AS la(name, code)
CROSS JOIN pathways p
WHERE p.code = 'SOCIAL'
ON CONFLICT (code, pathway_id) DO NOTHING;

-- STEM Learning Areas
INSERT INTO learning_areas (name, code, pathway_id, is_core, strands, rubrics) 
SELECT 
    la.name,
    la.code,
    p.id as pathway_id,
    false as is_core,
    '[]'::jsonb as strands,
    '[]'::jsonb as rubrics
FROM (VALUES
    ('Biology', 'BIOLOGY'),
    ('Chemistry', 'CHEMISTRY'),
    ('Physics', 'PHYSICS'),
    ('General Science', 'GEN_SCI'),
    ('Agriculture', 'AGRICULTURE'),
    ('Computer Studies', 'COMPUTER'),
    ('Home Science', 'HOME_SCI'),
    ('Aviation', 'AVIATION'),
    ('Building Construction', 'BUILDING'),
    ('Electricity', 'ELECTRICITY'),
    ('Metalwork', 'METALWORK'),
    ('Power Mechanics', 'POWER_MECH'),
    ('Wood Technology', 'WOOD_TECH'),
    ('Media Technology', 'MEDIA_TECH'),
    ('Marine and Fisheries Technology', 'MARINE')
) AS la(name, code)
CROSS JOIN pathways p
WHERE p.code = 'STEM'
ON CONFLICT (code, pathway_id) DO NOTHING;

-- Note: Physical Education (PE) and ICT are offered to all learners
INSERT INTO learning_areas (name, code, pathway_id, is_core, strands, rubrics) VALUES
    ('Physical Education', 'PE', NULL, true, '[]'::jsonb, '[]'::jsonb),
    ('Information Communication and Technology', 'ICT', NULL, true, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (code, pathway_id) DO NOTHING;

-- Note: Pastoral/Religious Programme of Instruction (P/RPI)
INSERT INTO learning_areas (name, code, pathway_id, is_core, strands, rubrics) VALUES
    ('Pastoral/Religious Programme of Instruction', 'P_RPI', NULL, true, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (code, pathway_id) DO NOTHING;

