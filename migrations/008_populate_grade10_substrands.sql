-- Populate Grade 10 Sub-strands for all Learning Areas
-- Based on KICD CBC Curriculum Designs for Grade 10
-- Structure: Strands -> Sub-strands -> Indicators

-- Function to update learning area strands
CREATE OR REPLACE FUNCTION update_learning_area_strands(
    p_code VARCHAR(50),
    p_strands JSONB
) RETURNS VOID AS $$
BEGIN
    UPDATE learning_areas
    SET strands = p_strands,
        updated_at = CURRENT_TIMESTAMP
    WHERE code = p_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CORE LEARNING AREAS
-- ============================================

-- English (ENG)
SELECT update_learning_area_strands('ENG', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Listening and Speaking",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Listening Comprehension",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Listen and respond to oral texts"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Identify main ideas and supporting details"},
                    {"indicator_code": "IND1.1.3", "indicator_name": "Make inferences from oral texts"}
                ]
            },
            {
                "sub_strand_code": "SS1.2",
                "sub_strand_name": "Speaking Skills",
                "indicators": [
                    {"indicator_code": "IND1.2.1", "indicator_name": "Participate in conversations"},
                    {"indicator_code": "IND1.2.2", "indicator_name": "Present ideas clearly and coherently"},
                    {"indicator_code": "IND1.2.3", "indicator_name": "Use appropriate language register"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Reading",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Reading Comprehension",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Read and understand various text types"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Analyze literary texts"},
                    {"indicator_code": "IND2.1.3", "indicator_name": "Extract information from texts"}
                ]
            },
            {
                "sub_strand_code": "SS2.2",
                "sub_strand_name": "Vocabulary Development",
                "indicators": [
                    {"indicator_code": "IND2.2.1", "indicator_name": "Build vocabulary through reading"},
                    {"indicator_code": "IND2.2.2", "indicator_name": "Use context clues to determine meaning"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR3",
        "strand_name": "Writing",
        "sub_strands": [
            {
                "sub_strand_code": "SS3.1",
                "sub_strand_name": "Composition Writing",
                "indicators": [
                    {"indicator_code": "IND3.1.1", "indicator_name": "Write different types of compositions"},
                    {"indicator_code": "IND3.1.2", "indicator_name": "Use appropriate writing conventions"},
                    {"indicator_code": "IND3.1.3", "indicator_name": "Edit and revise written work"}
                ]
            },
            {
                "sub_strand_code": "SS3.2",
                "sub_strand_name": "Grammar and Language Use",
                "indicators": [
                    {"indicator_code": "IND3.2.1", "indicator_name": "Apply grammar rules correctly"},
                    {"indicator_code": "IND3.2.2", "indicator_name": "Use varied sentence structures"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- Kiswahili/KSL (KISW)
SELECT update_learning_area_strands('KISW', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Kusikiliza na Kuzungumza",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Kusikiliza Kwa Makini",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Sikiliza na uelewe maudhui ya matini"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Tambua wazo kuu na maelezo ya ziada"}
                ]
            },
            {
                "sub_strand_code": "SS1.2",
                "sub_strand_name": "Kuzungumza",
                "indicators": [
                    {"indicator_code": "IND1.2.1", "indicator_name": "Shiriki katika mazungumzo"},
                    {"indicator_code": "IND1.2.2", "indicator_name": "Toa mawazo kwa uwazi"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Kusoma",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Kusoma na Kuelewa",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Soma na uelewe aina mbalimbali za matini"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Chambua matini za fasihi"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR3",
        "strand_name": "Kuandika",
        "sub_strands": [
            {
                "sub_strand_code": "SS3.1",
                "sub_strand_name": "Kuandika Insha",
                "indicators": [
                    {"indicator_code": "IND3.1.1", "indicator_name": "Andika aina mbalimbali za insha"},
                    {"indicator_code": "IND3.1.2", "indicator_name": "Tumia kanuni za uandishi kwa usahihi"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- Core Mathematics (MATH)
SELECT update_learning_area_strands('MATH', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Number",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Number Concepts",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Work with real numbers"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Perform operations on numbers"},
                    {"indicator_code": "IND1.1.3", "indicator_name": "Solve problems involving numbers"}
                ]
            },
            {
                "sub_strand_code": "SS1.2",
                "sub_strand_name": "Number Operations",
                "indicators": [
                    {"indicator_code": "IND1.2.1", "indicator_name": "Add, subtract, multiply, and divide"},
                    {"indicator_code": "IND1.2.2", "indicator_name": "Work with fractions and decimals"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Algebra",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Algebraic Expressions",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Simplify algebraic expressions"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Factorize expressions"},
                    {"indicator_code": "IND2.1.3", "indicator_name": "Solve equations and inequalities"}
                ]
            },
            {
                "sub_strand_code": "SS2.2",
                "sub_strand_name": "Functions",
                "indicators": [
                    {"indicator_code": "IND2.2.1", "indicator_name": "Understand and use functions"},
                    {"indicator_code": "IND2.2.2", "indicator_name": "Graph functions"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR3",
        "strand_name": "Geometry",
        "sub_strands": [
            {
                "sub_strand_code": "SS3.1",
                "sub_strand_name": "Geometric Shapes",
                "indicators": [
                    {"indicator_code": "IND3.1.1", "indicator_name": "Identify and classify shapes"},
                    {"indicator_code": "IND3.1.2", "indicator_name": "Calculate areas and volumes"}
                ]
            },
            {
                "sub_strand_code": "SS3.2",
                "sub_strand_name": "Geometric Relationships",
                "indicators": [
                    {"indicator_code": "IND3.2.1", "indicator_name": "Understand geometric theorems"},
                    {"indicator_code": "IND3.2.2", "indicator_name": "Apply geometric principles"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR4",
        "strand_name": "Statistics and Probability",
        "sub_strands": [
            {
                "sub_strand_code": "SS4.1",
                "sub_strand_name": "Data Handling",
                "indicators": [
                    {"indicator_code": "IND4.1.1", "indicator_name": "Collect and organize data"},
                    {"indicator_code": "IND4.1.2", "indicator_name": "Represent data graphically"},
                    {"indicator_code": "IND4.1.3", "indicator_name": "Analyze and interpret data"}
                ]
            },
            {
                "sub_strand_code": "SS4.2",
                "sub_strand_name": "Probability",
                "indicators": [
                    {"indicator_code": "IND4.2.1", "indicator_name": "Understand probability concepts"},
                    {"indicator_code": "IND4.2.2", "indicator_name": "Calculate probabilities"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- Community Service Learning (CSL)
SELECT update_learning_area_strands('CSL', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Community Engagement",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Community Needs Assessment",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Identify community needs"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Plan community service activities"}
                ]
            },
            {
                "sub_strand_code": "SS1.2",
                "sub_strand_name": "Service Implementation",
                "indicators": [
                    {"indicator_code": "IND1.2.1", "indicator_name": "Participate in community service"},
                    {"indicator_code": "IND1.2.2", "indicator_name": "Reflect on service experiences"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- ============================================
-- STEM PATHWAY LEARNING AREAS
-- ============================================

-- Biology (BIOLOGY)
SELECT update_learning_area_strands('BIOLOGY', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Cell Biology",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Cell Structure and Function",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Describe cell structure"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Explain cell functions"},
                    {"indicator_code": "IND1.1.3", "indicator_name": "Compare plant and animal cells"}
                ]
            },
            {
                "sub_strand_code": "SS1.2",
                "sub_strand_name": "Cell Division",
                "indicators": [
                    {"indicator_code": "IND1.2.1", "indicator_name": "Understand mitosis and meiosis"},
                    {"indicator_code": "IND1.2.2", "indicator_name": "Explain cell cycle"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Genetics",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Heredity",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Understand inheritance patterns"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Solve genetic problems"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR3",
        "strand_name": "Ecology",
        "sub_strands": [
            {
                "sub_strand_code": "SS3.1",
                "sub_strand_name": "Ecosystems",
                "indicators": [
                    {"indicator_code": "IND3.1.1", "indicator_name": "Describe ecosystem components"},
                    {"indicator_code": "IND3.1.2", "indicator_name": "Explain ecological relationships"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- Chemistry (CHEMISTRY)
SELECT update_learning_area_strands('CHEMISTRY', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Atomic Structure",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Atomic Theory",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Describe atomic structure"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Explain electron configuration"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Chemical Bonding",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Types of Bonds",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Understand ionic and covalent bonds"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Explain bond formation"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR3",
        "strand_name": "Chemical Reactions",
        "sub_strands": [
            {
                "sub_strand_code": "SS3.1",
                "sub_strand_name": "Reaction Types",
                "indicators": [
                    {"indicator_code": "IND3.1.1", "indicator_name": "Classify chemical reactions"},
                    {"indicator_code": "IND3.1.2", "indicator_name": "Balance chemical equations"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- Physics (PHYSICS)
SELECT update_learning_area_strands('PHYSICS', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Mechanics",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Motion",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Describe motion and forces"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Apply Newton's laws"}
                ]
            },
            {
                "sub_strand_code": "SS1.2",
                "sub_strand_name": "Energy",
                "indicators": [
                    {"indicator_code": "IND1.2.1", "indicator_name": "Understand energy concepts"},
                    {"indicator_code": "IND1.2.2", "indicator_name": "Apply conservation of energy"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Waves and Optics",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Wave Properties",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Describe wave characteristics"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Explain wave behavior"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR3",
        "strand_name": "Electricity and Magnetism",
        "sub_strands": [
            {
                "sub_strand_code": "SS3.1",
                "sub_strand_name": "Electric Circuits",
                "indicators": [
                    {"indicator_code": "IND3.1.1", "indicator_name": "Understand electrical circuits"},
                    {"indicator_code": "IND3.1.2", "indicator_name": "Calculate electrical quantities"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- Computer Studies (COMPUTER)
SELECT update_learning_area_strands('COMPUTER', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Computer Fundamentals",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Computer Systems",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Understand computer components"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Explain computer operations"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Programming",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Programming Concepts",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Write simple programs"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Debug programs"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR3",
        "strand_name": "Data Management",
        "sub_strands": [
            {
                "sub_strand_code": "SS3.1",
                "sub_strand_name": "Databases",
                "indicators": [
                    {"indicator_code": "IND3.1.1", "indicator_name": "Design simple databases"},
                    {"indicator_code": "IND3.1.2", "indicator_name": "Query databases"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- ============================================
-- ARTS & SPORTS PATHWAY LEARNING AREAS
-- ============================================

-- Sports and Recreation (SPORTS)
SELECT update_learning_area_strands('SPORTS', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Physical Fitness",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Fitness Components",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Understand fitness components"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Assess fitness levels"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Sports Skills",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Game Skills",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Demonstrate sports skills"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Apply game strategies"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- Music and Dance (MUSIC)
SELECT update_learning_area_strands('MUSIC', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Music Theory",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Musical Elements",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Understand musical notation"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Identify musical elements"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Performance",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Musical Performance",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Perform musical pieces"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Demonstrate dance skills"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- ============================================
-- SOCIAL SCIENCES PATHWAY LEARNING AREAS
-- ============================================

-- History and Citizenship (HISTORY)
SELECT update_learning_area_strands('HISTORY', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Historical Inquiry",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Historical Sources",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Analyze historical sources"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Evaluate historical evidence"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Historical Knowledge",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Historical Periods",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Understand historical periods"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Explain historical events"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- Geography (GEOGRAPHY)
SELECT update_learning_area_strands('GEOGRAPHY', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Physical Geography",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Landforms",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Describe landforms"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Explain formation processes"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Human Geography",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Population",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Analyze population patterns"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Explain population dynamics"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- Business Studies (BUSINESS)
SELECT update_learning_area_strands('BUSINESS', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Business Environment",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Business Types",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Classify business types"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Understand business environment"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Business Operations",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Business Functions",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Understand business functions"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Apply business principles"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- Religious Education Subjects
-- Christian Religious Education (CRE)
SELECT update_learning_area_strands('CRE', $json$[
    {
        "strand_code": "STR1",
        "strand_name": "Biblical Studies",
        "sub_strands": [
            {
                "sub_strand_code": "SS1.1",
                "sub_strand_name": "Old Testament",
                "indicators": [
                    {"indicator_code": "IND1.1.1", "indicator_name": "Study Old Testament texts"},
                    {"indicator_code": "IND1.1.2", "indicator_name": "Apply biblical teachings"}
                ]
            },
            {
                "sub_strand_code": "SS1.2",
                "sub_strand_name": "New Testament",
                "indicators": [
                    {"indicator_code": "IND1.2.1", "indicator_name": "Study New Testament texts"},
                    {"indicator_code": "IND1.2.2", "indicator_name": "Understand Christian doctrines"}
                ]
            }
        ]
    },
    {
        "strand_code": "STR2",
        "strand_name": "Christian Living",
        "sub_strands": [
            {
                "sub_strand_code": "SS2.1",
                "sub_strand_name": "Christian Ethics",
                "indicators": [
                    {"indicator_code": "IND2.1.1", "indicator_name": "Apply Christian values"},
                    {"indicator_code": "IND2.1.2", "indicator_name": "Demonstrate Christian character"}
                ]
            }
        ]
    }
]$json$::jsonb);

-- Note: This is a template structure. 
-- For complete and accurate sub-strands, refer to the official KICD Grade 10 Curriculum Design documents
-- available at: https://kicd.ac.ke/cbc-materials/curriculum-designs/grade-ten/

-- Drop the helper function
DROP FUNCTION IF EXISTS update_learning_area_strands(VARCHAR);


