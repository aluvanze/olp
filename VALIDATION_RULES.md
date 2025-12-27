# OLP-Monitor Validation Rules & Business Logic

## Critical Validation Rules

### 1. Pathway Subject Selection (CBC Rule)
**Rule**: A learner MUST have exactly:
- 4 Core Learning Areas
- 3 Elective Learning Areas from their chosen pathway

**Enforcement**: 
- UI must prevent saving if rule is violated
- Backend must validate before creating `learner_learning_areas` records
- Validation function must check:
  ```sql
  -- Count core learning areas
  SELECT COUNT(*) FROM learner_learning_areas 
  WHERE learner_id = ? AND is_core = true
  -- Must equal 4
  
  -- Count pathway electives
  SELECT COUNT(*) FROM learner_learning_areas lla
  INNER JOIN learning_areas la ON lla.learning_area_id = la.id
  WHERE lla.learner_id = ? 
    AND lla.is_core = false
    AND la.pathway_id = (SELECT pathway_id FROM learner_profiles WHERE id = ?)
  -- Must equal 3
  ```

### 2. Formative Assessment Rubric Levels
**Rule**: Rubric levels must be between 1-4
- Level 1: Beginning
- Level 2: Developing  
- Level 3: Approaching Expectations
- Level 4: Meets Expectations

**Score Calculation**:
- Level 1 → Score: 25%
- Level 2 → Score: 50%
- Level 3 → Score: 75%
- Level 4 → Score: 100%

### 3. Result Slip Synthesis
**Rule**: At end of term, system must:
1. Calculate average formative score per learning area
2. Include summative exam score per learning area
3. Calculate final score (weighted: 60% formative + 40% summative)
4. Assign final grade based on percentage
5. Generate result slip document

**Formula**:
```
Final Score = (Average Formative Score × 0.6) + (Summative Score × 0.4)
```

### 4. Teacher Registration
**Required Fields**:
- Name (First & Last)
- ID Number
- TSC Number
- Email (must be active, used for activation)
- Contact (phone)
- School assignment

**Workflow**:
1. Headteacher enters teacher data
2. System generates activation token
3. Email sent to teacher with activation link
4. Teacher clicks link, sets password
5. Account activated

### 5. Bursary Application Workflow
**States**: pending → under_review → approved/rejected → submitted

**Rules**:
- Parent can only apply if required documents uploaded
- Finance Admin must attach outstanding fee balance
- Headteacher must approve/reject with notes
- System auto-submits to sponsor only after approval
- All state changes logged in audit trail

### 6. M-Pesa Payment Validation
**Rules**:
- Confirmation code must be unique
- Must verify amount and date with M-Pesa API
- Transaction must be verified before marking as paid
- Handle API errors gracefully

### 7. Book Issuance Limits
**Rules**:
- Cannot issue if available_copies = 0
- Each learner can have multiple books
- Must track return dates
- Update inventory on issue/return

## Grade Scale (CBC Senior School)
```
A (80-100%) - Exceeds Expectations
B (70-79%)  - Meets Expectations  
C (60-69%)  - Approaching Expectations
D (50-59%)  - Below Expectations
E (0-49%)   - Not Meeting Expectations
```

## Curriculum Progress Calculation
**Formula**:
```
Progress = (Number of Sub-strands with Rubric Level 4) / (Total Sub-strands in Learning Area) × 100
```

