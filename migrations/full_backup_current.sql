--
-- PostgreSQL database dump
--

\restrict B9dp0JxSrfhjdJmtWxvpGeMSSKNLn3maQ49elSQ42g5Ubrlo5A4TACaKN7YAuMV

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'student',
    'teacher',
    'headteacher',
    'deputy_headteacher',
    'finance',
    'parent',
    'superadmin'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: update_learning_area_strands(character varying, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_learning_area_strands(p_code character varying, p_strands jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE learning_areas
    SET strands = p_strands,
        updated_at = CURRENT_TIMESTAMP
    WHERE code = p_code;
END;
$$;


ALTER FUNCTION public.update_learning_area_strands(p_code character varying, p_strands jsonb) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_submissions (
    id integer NOT NULL,
    assignment_id integer,
    student_id integer,
    submission_text text,
    submission_files jsonb,
    submitted_at timestamp without time zone,
    is_late boolean DEFAULT false,
    status character varying(20) DEFAULT 'submitted'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assignment_submissions OWNER TO postgres;

--
-- Name: assignment_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assignment_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignment_submissions_id_seq OWNER TO postgres;

--
-- Name: assignment_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assignment_submissions_id_seq OWNED BY public.assignment_submissions.id;


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id integer NOT NULL,
    course_id integer,
    module_id integer,
    title character varying(200) NOT NULL,
    description text,
    assignment_type character varying(50) DEFAULT 'homework'::character varying,
    total_points numeric(10,2) NOT NULL,
    due_date timestamp without time zone,
    allow_late_submission boolean DEFAULT true,
    late_penalty_percent numeric(5,2) DEFAULT 0,
    instructions text,
    attachments jsonb,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignments_id_seq OWNER TO postgres;

--
-- Name: assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assignments_id_seq OWNED BY public.assignments.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    course_id integer,
    student_id integer,
    attendance_date date NOT NULL,
    status character varying(20) NOT NULL,
    notes text,
    marked_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: book_issuances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.book_issuances (
    id integer NOT NULL,
    book_id integer,
    learner_id integer,
    issued_by integer,
    issue_date date DEFAULT CURRENT_DATE,
    due_date date,
    return_date date,
    status character varying(20) DEFAULT 'issued'::character varying,
    condition_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.book_issuances OWNER TO postgres;

--
-- Name: book_issuances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.book_issuances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.book_issuances_id_seq OWNER TO postgres;

--
-- Name: book_issuances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.book_issuances_id_seq OWNED BY public.book_issuances.id;


--
-- Name: books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.books (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    isbn character varying(50),
    learning_area_id integer,
    total_copies integer DEFAULT 0,
    available_copies integer DEFAULT 0,
    publisher character varying(200),
    edition character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.books OWNER TO postgres;

--
-- Name: books_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.books_id_seq OWNER TO postgres;

--
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.books_id_seq OWNED BY public.books.id;


--
-- Name: bursary_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bursary_applications (
    id integer NOT NULL,
    learner_id integer,
    parent_id integer,
    amount_requested numeric(10,2) NOT NULL,
    outstanding_balance numeric(10,2),
    status character varying(50) DEFAULT 'pending'::character varying,
    supporting_docs jsonb,
    finance_review_notes text,
    headteacher_notes text,
    sponsor_submission_date timestamp without time zone,
    submitted_to_sponsor boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bursary_applications OWNER TO postgres;

--
-- Name: bursary_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bursary_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bursary_applications_id_seq OWNER TO postgres;

--
-- Name: bursary_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bursary_applications_id_seq OWNED BY public.bursary_applications.id;


--
-- Name: course_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_enrollments (
    id integer NOT NULL,
    student_id integer,
    course_id integer,
    enrollment_date date DEFAULT CURRENT_DATE,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    authorized_by integer,
    authorization_status character varying(20) DEFAULT 'pending'::character varying,
    authorization_date timestamp without time zone,
    authorization_notes text
);


ALTER TABLE public.course_enrollments OWNER TO postgres;

--
-- Name: course_enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_enrollments_id_seq OWNER TO postgres;

--
-- Name: course_enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_enrollments_id_seq OWNED BY public.course_enrollments.id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    course_code character varying(20) NOT NULL,
    course_name character varying(200) NOT NULL,
    description text,
    teacher_id integer,
    academic_year character varying(20) NOT NULL,
    semester character varying(20),
    credits integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    learning_area_id integer
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_id_seq OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: curriculum_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.curriculum_progress (
    id integer NOT NULL,
    school_id integer,
    learning_area_id integer,
    strand_code character varying(50),
    sub_strand_code character varying(50),
    last_updated_rubric_level integer,
    progress_percentage numeric(5,2),
    updated_by integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.curriculum_progress OWNER TO postgres;

--
-- Name: curriculum_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.curriculum_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.curriculum_progress_id_seq OWNER TO postgres;

--
-- Name: curriculum_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.curriculum_progress_id_seq OWNED BY public.curriculum_progress.id;


--
-- Name: final_grades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.final_grades (
    id integer NOT NULL,
    student_id integer,
    course_id integer,
    final_percentage numeric(5,2) NOT NULL,
    letter_grade character varying(5) NOT NULL,
    gpa_points numeric(3,2),
    calculated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    approved_by integer,
    approved_at timestamp without time zone
);


ALTER TABLE public.final_grades OWNER TO postgres;

--
-- Name: final_grades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.final_grades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.final_grades_id_seq OWNER TO postgres;

--
-- Name: final_grades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.final_grades_id_seq OWNED BY public.final_grades.id;


--
-- Name: financial_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_transactions (
    id integer NOT NULL,
    learner_id integer,
    transaction_type character varying(50) NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(50),
    mpesa_confirmation_code character varying(50),
    reference_number character varying(100),
    transaction_date date DEFAULT CURRENT_DATE,
    verified boolean DEFAULT false,
    verified_at timestamp without time zone,
    verified_by integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.financial_transactions OWNER TO postgres;

--
-- Name: financial_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.financial_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.financial_transactions_id_seq OWNER TO postgres;

--
-- Name: financial_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.financial_transactions_id_seq OWNED BY public.financial_transactions.id;


--
-- Name: formative_assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formative_assessments (
    id integer NOT NULL,
    learner_id integer,
    learning_area_id integer,
    strand_code character varying(50),
    sub_strand_code character varying(50),
    indicator_code character varying(50),
    rubric_level integer,
    score numeric(5,2),
    term integer,
    academic_year character varying(20) NOT NULL,
    teacher_id integer,
    notes text,
    assessed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT formative_assessments_rubric_level_check CHECK (((rubric_level >= 1) AND (rubric_level <= 4))),
    CONSTRAINT formative_assessments_term_check CHECK (((term >= 1) AND (term <= 3)))
);


ALTER TABLE public.formative_assessments OWNER TO postgres;

--
-- Name: formative_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.formative_assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.formative_assessments_id_seq OWNER TO postgres;

--
-- Name: formative_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.formative_assessments_id_seq OWNED BY public.formative_assessments.id;


--
-- Name: grade_scale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grade_scale (
    id integer NOT NULL,
    letter_grade character varying(5) NOT NULL,
    min_percentage numeric(5,2) NOT NULL,
    max_percentage numeric(5,2) NOT NULL,
    gpa_points numeric(3,2) NOT NULL,
    description character varying(100),
    is_active boolean DEFAULT true
);


ALTER TABLE public.grade_scale OWNER TO postgres;

--
-- Name: grade_scale_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grade_scale_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grade_scale_id_seq OWNER TO postgres;

--
-- Name: grade_scale_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grade_scale_id_seq OWNED BY public.grade_scale.id;


--
-- Name: grades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grades (
    id integer NOT NULL,
    student_id integer,
    course_id integer,
    assignment_id integer,
    grade_type character varying(50) NOT NULL,
    points_earned numeric(10,2) NOT NULL,
    points_possible numeric(10,2) NOT NULL,
    percentage numeric(5,2),
    letter_grade character varying(5),
    comments text,
    graded_by integer,
    graded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.grades OWNER TO postgres;

--
-- Name: grades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grades_id_seq OWNER TO postgres;

--
-- Name: grades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grades_id_seq OWNED BY public.grades.id;


--
-- Name: infrastructure_projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.infrastructure_projects (
    id integer NOT NULL,
    school_id integer,
    name character varying(200) NOT NULL,
    description text,
    budget numeric(15,2),
    expenditure numeric(15,2) DEFAULT 0,
    progress_percentage numeric(5,2) DEFAULT 0,
    start_date date,
    expected_completion_date date,
    actual_completion_date date,
    status character varying(50) DEFAULT 'planned'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.infrastructure_projects OWNER TO postgres;

--
-- Name: infrastructure_projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.infrastructure_projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.infrastructure_projects_id_seq OWNER TO postgres;

--
-- Name: infrastructure_projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.infrastructure_projects_id_seq OWNED BY public.infrastructure_projects.id;


--
-- Name: learner_learning_areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.learner_learning_areas (
    id integer NOT NULL,
    learner_id integer,
    learning_area_id integer,
    is_core boolean DEFAULT false,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.learner_learning_areas OWNER TO postgres;

--
-- Name: learner_learning_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.learner_learning_areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.learner_learning_areas_id_seq OWNER TO postgres;

--
-- Name: learner_learning_areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.learner_learning_areas_id_seq OWNED BY public.learner_learning_areas.id;


--
-- Name: learner_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.learner_profiles (
    id integer NOT NULL,
    user_id integer,
    school_id integer,
    admission_number character varying(50),
    pathway_id integer,
    parent_id integer,
    kjsea_results jsonb,
    registration_date date DEFAULT CURRENT_DATE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.learner_profiles OWNER TO postgres;

--
-- Name: learner_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.learner_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.learner_profiles_id_seq OWNER TO postgres;

--
-- Name: learner_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.learner_profiles_id_seq OWNED BY public.learner_profiles.id;


--
-- Name: learner_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.learner_transfers (
    id integer NOT NULL,
    learner_id integer,
    from_school_id integer,
    to_school_id integer,
    transfer_reason text,
    status character varying(50) DEFAULT 'pending'::character varying,
    requested_by integer,
    approved_by integer,
    approval_date date,
    transfer_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.learner_transfers OWNER TO postgres;

--
-- Name: learner_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.learner_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.learner_transfers_id_seq OWNER TO postgres;

--
-- Name: learner_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.learner_transfers_id_seq OWNED BY public.learner_transfers.id;


--
-- Name: learning_areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.learning_areas (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(50) NOT NULL,
    pathway_id integer,
    is_core boolean DEFAULT false,
    description text,
    strands jsonb,
    rubrics jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.learning_areas OWNER TO postgres;

--
-- Name: learning_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.learning_areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.learning_areas_id_seq OWNER TO postgres;

--
-- Name: learning_areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.learning_areas_id_seq OWNED BY public.learning_areas.id;


--
-- Name: learning_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.learning_modules (
    id integer NOT NULL,
    course_id integer,
    module_name character varying(200) NOT NULL,
    module_description text,
    module_order integer DEFAULT 0,
    is_published boolean DEFAULT false,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.learning_modules OWNER TO postgres;

--
-- Name: learning_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.learning_modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.learning_modules_id_seq OWNER TO postgres;

--
-- Name: learning_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.learning_modules_id_seq OWNED BY public.learning_modules.id;


--
-- Name: message_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message_attachments (
    id integer NOT NULL,
    message_id integer,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    file_type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.message_attachments OWNER TO postgres;

--
-- Name: message_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.message_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_attachments_id_seq OWNER TO postgres;

--
-- Name: message_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.message_attachments_id_seq OWNED BY public.message_attachments.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    sender_id integer,
    recipient_id integer,
    subject character varying(200) NOT NULL,
    message_body text NOT NULL,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    is_important boolean DEFAULT false,
    attachments jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: module_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.module_content (
    id integer NOT NULL,
    module_id integer,
    content_type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    content_url character varying(500),
    content_text text,
    file_name character varying(255),
    file_size integer,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.module_content OWNER TO postgres;

--
-- Name: module_content_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.module_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.module_content_id_seq OWNER TO postgres;

--
-- Name: module_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.module_content_id_seq OWNED BY public.module_content.id;


--
-- Name: parent_student_relationships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parent_student_relationships (
    id integer NOT NULL,
    parent_id integer,
    student_id integer,
    relationship_type character varying(50) DEFAULT 'parent'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.parent_student_relationships OWNER TO postgres;

--
-- Name: parent_student_relationships_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.parent_student_relationships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parent_student_relationships_id_seq OWNER TO postgres;

--
-- Name: parent_student_relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.parent_student_relationships_id_seq OWNED BY public.parent_student_relationships.id;


--
-- Name: pathways; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pathways (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pathways OWNER TO postgres;

--
-- Name: pathways_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pathways_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pathways_id_seq OWNER TO postgres;

--
-- Name: pathways_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pathways_id_seq OWNED BY public.pathways.id;


--
-- Name: result_slip_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.result_slip_details (
    id integer NOT NULL,
    result_slip_id integer,
    learning_area_id integer,
    average_formative_score numeric(5,2),
    summative_score numeric(5,2),
    final_score numeric(5,2),
    final_grade character varying(5),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.result_slip_details OWNER TO postgres;

--
-- Name: result_slip_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.result_slip_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.result_slip_details_id_seq OWNER TO postgres;

--
-- Name: result_slip_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.result_slip_details_id_seq OWNED BY public.result_slip_details.id;


--
-- Name: result_slips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.result_slips (
    id integer NOT NULL,
    learner_id integer,
    term integer,
    academic_year character varying(20) NOT NULL,
    synthesized_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    synthesized_by integer,
    CONSTRAINT result_slips_term_check CHECK (((term >= 1) AND (term <= 3)))
);


ALTER TABLE public.result_slips OWNER TO postgres;

--
-- Name: result_slips_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.result_slips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.result_slips_id_seq OWNER TO postgres;

--
-- Name: result_slips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.result_slips_id_seq OWNED BY public.result_slips.id;


--
-- Name: schools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schools (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(50) NOT NULL,
    county character varying(100),
    sub_county character varying(100),
    address text,
    headteacher_id integer,
    logo_url character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.schools OWNER TO postgres;

--
-- Name: schools_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schools_id_seq OWNER TO postgres;

--
-- Name: schools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schools_id_seq OWNED BY public.schools.id;


--
-- Name: summative_assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.summative_assessments (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    type character varying(50) NOT NULL,
    term integer,
    academic_year character varying(20) NOT NULL,
    school_id integer,
    learning_area_id integer,
    total_marks numeric(10,2) DEFAULT 100,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT summative_assessments_term_check CHECK (((term >= 1) AND (term <= 3)))
);


ALTER TABLE public.summative_assessments OWNER TO postgres;

--
-- Name: summative_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.summative_assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.summative_assessments_id_seq OWNER TO postgres;

--
-- Name: summative_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.summative_assessments_id_seq OWNED BY public.summative_assessments.id;


--
-- Name: summative_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.summative_results (
    id integer NOT NULL,
    assessment_id integer,
    learner_id integer,
    score numeric(10,2) NOT NULL,
    percentage numeric(5,2),
    grade character varying(5),
    entered_by integer,
    entered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.summative_results OWNER TO postgres;

--
-- Name: summative_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.summative_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.summative_results_id_seq OWNER TO postgres;

--
-- Name: summative_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.summative_results_id_seq OWNED BY public.summative_results.id;


--
-- Name: system_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_analytics (
    id integer NOT NULL,
    metric_name character varying(100) NOT NULL,
    metric_value text,
    metric_type character varying(50),
    category character varying(50),
    calculated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_analytics OWNER TO postgres;

--
-- Name: system_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_analytics_id_seq OWNER TO postgres;

--
-- Name: system_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_analytics_id_seq OWNED BY public.system_analytics.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text,
    description text,
    updated_by integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO postgres;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: teacher_allocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_allocations (
    id integer NOT NULL,
    teacher_id integer,
    course_id integer,
    allocated_by integer,
    allocation_date date DEFAULT CURRENT_DATE,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.teacher_allocations OWNER TO postgres;

--
-- Name: teacher_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teacher_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teacher_allocations_id_seq OWNER TO postgres;

--
-- Name: teacher_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teacher_allocations_id_seq OWNED BY public.teacher_allocations.id;


--
-- Name: teacher_course_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_course_assignments (
    id integer NOT NULL,
    course_id integer NOT NULL,
    teacher_id integer NOT NULL,
    term_number integer NOT NULL,
    academic_year character varying(20) NOT NULL,
    assigned_by integer,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    CONSTRAINT teacher_course_assignments_term_number_check CHECK (((term_number >= 1) AND (term_number <= 3)))
);


ALTER TABLE public.teacher_course_assignments OWNER TO postgres;

--
-- Name: teacher_course_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teacher_course_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teacher_course_assignments_id_seq OWNER TO postgres;

--
-- Name: teacher_course_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teacher_course_assignments_id_seq OWNED BY public.teacher_course_assignments.id;


--
-- Name: teacher_ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_ratings (
    id integer NOT NULL,
    teacher_id integer,
    rated_by_user_id integer,
    rating integer,
    feedback_type character varying(50),
    comments text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT teacher_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.teacher_ratings OWNER TO postgres;

--
-- Name: teacher_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teacher_ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teacher_ratings_id_seq OWNER TO postgres;

--
-- Name: teacher_ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teacher_ratings_id_seq OWNED BY public.teacher_ratings.id;


--
-- Name: terms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.terms (
    id integer NOT NULL,
    term_number integer NOT NULL,
    academic_year character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    date_range_start character varying(50) NOT NULL,
    date_range_end character varying(50) NOT NULL,
    start_date date,
    end_date date,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT terms_term_number_check CHECK (((term_number >= 1) AND (term_number <= 3)))
);


ALTER TABLE public.terms OWNER TO postgres;

--
-- Name: terms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.terms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.terms_id_seq OWNER TO postgres;

--
-- Name: terms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.terms_id_seq OWNED BY public.terms.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    role public.user_role NOT NULL,
    phone character varying(20),
    address text,
    date_of_birth date,
    profile_image_url character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tsc_number character varying(50),
    id_number character varying(50),
    is_verified boolean DEFAULT false,
    verification_token character varying(255),
    verification_token_expires timestamp without time zone,
    school_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: assignment_submissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions ALTER COLUMN id SET DEFAULT nextval('public.assignment_submissions_id_seq'::regclass);


--
-- Name: assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments ALTER COLUMN id SET DEFAULT nextval('public.assignments_id_seq'::regclass);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: book_issuances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_issuances ALTER COLUMN id SET DEFAULT nextval('public.book_issuances_id_seq'::regclass);


--
-- Name: books id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books ALTER COLUMN id SET DEFAULT nextval('public.books_id_seq'::regclass);


--
-- Name: bursary_applications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bursary_applications ALTER COLUMN id SET DEFAULT nextval('public.bursary_applications_id_seq'::regclass);


--
-- Name: course_enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments ALTER COLUMN id SET DEFAULT nextval('public.course_enrollments_id_seq'::regclass);


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: curriculum_progress id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculum_progress ALTER COLUMN id SET DEFAULT nextval('public.curriculum_progress_id_seq'::regclass);


--
-- Name: final_grades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_grades ALTER COLUMN id SET DEFAULT nextval('public.final_grades_id_seq'::regclass);


--
-- Name: financial_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_transactions ALTER COLUMN id SET DEFAULT nextval('public.financial_transactions_id_seq'::regclass);


--
-- Name: formative_assessments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formative_assessments ALTER COLUMN id SET DEFAULT nextval('public.formative_assessments_id_seq'::regclass);


--
-- Name: grade_scale id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_scale ALTER COLUMN id SET DEFAULT nextval('public.grade_scale_id_seq'::regclass);


--
-- Name: grades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades ALTER COLUMN id SET DEFAULT nextval('public.grades_id_seq'::regclass);


--
-- Name: infrastructure_projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infrastructure_projects ALTER COLUMN id SET DEFAULT nextval('public.infrastructure_projects_id_seq'::regclass);


--
-- Name: learner_learning_areas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_learning_areas ALTER COLUMN id SET DEFAULT nextval('public.learner_learning_areas_id_seq'::regclass);


--
-- Name: learner_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_profiles ALTER COLUMN id SET DEFAULT nextval('public.learner_profiles_id_seq'::regclass);


--
-- Name: learner_transfers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_transfers ALTER COLUMN id SET DEFAULT nextval('public.learner_transfers_id_seq'::regclass);


--
-- Name: learning_areas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_areas ALTER COLUMN id SET DEFAULT nextval('public.learning_areas_id_seq'::regclass);


--
-- Name: learning_modules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_modules ALTER COLUMN id SET DEFAULT nextval('public.learning_modules_id_seq'::regclass);


--
-- Name: message_attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_attachments ALTER COLUMN id SET DEFAULT nextval('public.message_attachments_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: module_content id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_content ALTER COLUMN id SET DEFAULT nextval('public.module_content_id_seq'::regclass);


--
-- Name: parent_student_relationships id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_student_relationships ALTER COLUMN id SET DEFAULT nextval('public.parent_student_relationships_id_seq'::regclass);


--
-- Name: pathways id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathways ALTER COLUMN id SET DEFAULT nextval('public.pathways_id_seq'::regclass);


--
-- Name: result_slip_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.result_slip_details ALTER COLUMN id SET DEFAULT nextval('public.result_slip_details_id_seq'::regclass);


--
-- Name: result_slips id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.result_slips ALTER COLUMN id SET DEFAULT nextval('public.result_slips_id_seq'::regclass);


--
-- Name: schools id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools ALTER COLUMN id SET DEFAULT nextval('public.schools_id_seq'::regclass);


--
-- Name: summative_assessments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summative_assessments ALTER COLUMN id SET DEFAULT nextval('public.summative_assessments_id_seq'::regclass);


--
-- Name: summative_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summative_results ALTER COLUMN id SET DEFAULT nextval('public.summative_results_id_seq'::regclass);


--
-- Name: system_analytics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_analytics ALTER COLUMN id SET DEFAULT nextval('public.system_analytics_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: teacher_allocations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_allocations ALTER COLUMN id SET DEFAULT nextval('public.teacher_allocations_id_seq'::regclass);


--
-- Name: teacher_course_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments ALTER COLUMN id SET DEFAULT nextval('public.teacher_course_assignments_id_seq'::regclass);


--
-- Name: teacher_ratings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_ratings ALTER COLUMN id SET DEFAULT nextval('public.teacher_ratings_id_seq'::regclass);


--
-- Name: terms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms ALTER COLUMN id SET DEFAULT nextval('public.terms_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: assignment_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignment_submissions (id, assignment_id, student_id, submission_text, submission_files, submitted_at, is_late, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (id, course_id, module_id, title, description, assignment_type, total_points, due_date, allow_late_submission, late_penalty_percent, instructions, attachments, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, course_id, student_id, attendance_date, status, notes, marked_by, created_at) FROM stdin;
\.


--
-- Data for Name: book_issuances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.book_issuances (id, book_id, learner_id, issued_by, issue_date, due_date, return_date, status, condition_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.books (id, title, isbn, learning_area_id, total_copies, available_copies, publisher, edition, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bursary_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bursary_applications (id, learner_id, parent_id, amount_requested, outstanding_balance, status, supporting_docs, finance_review_notes, headteacher_notes, sponsor_submission_date, submitted_to_sponsor, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: course_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_enrollments (id, student_id, course_id, enrollment_date, status, created_at, authorized_by, authorization_status, authorization_date, authorization_notes) FROM stdin;
1	5	1	2025-12-27	active	2025-12-27 12:02:14.776655	\N	pending	\N	\N
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, course_code, course_name, description, teacher_id, academic_year, semester, credits, is_active, created_at, updated_at, learning_area_id) FROM stdin;
1	MATH10	Mathematics Grade 10	Core mathematics for grade 10 students	4	2024-2025	\N	1	t	2025-12-27 12:02:14.776655	2025-12-27 12:02:14.776655	\N
7	AGRICULTURE	Agriculture	Senior School subject: Agriculture	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	32
8	ARABIC	Arabic	Senior School subject: Arabic	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	18
9	AVIATION	Aviation	Senior School subject: Aviation	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	35
10	BIOLOGY	Biology	Senior School subject: Biology	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	28
11	BUILDING	Building Construction	Senior School subject: Building Construction	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	36
12	BUSINESS	Business Studies	Senior School subject: Business Studies	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	25
13	CHEMISTRY	Chemistry	Senior School subject: Chemistry	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	29
14	COMPUTER	Computer Studies	Senior School subject: Computer Studies	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	33
15	CRE	Christian Religious Education	Senior School subject: Christian Religious Education	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	4
16	CSL	Community Service Learning	Senior School subject: Community Service Learning	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	9
17	ELECTRICITY	Electricity	Senior School subject: Electricity	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	37
18	ENG	English	Senior School subject: English	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	1
19	FASIHI	Fasihi ya Kiswahili	Senior School subject: Fasihi ya Kiswahili	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	16
20	FINE_ARTS	Fine Arts	Senior School subject: Fine Arts	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	13
21	FRENCH	French	Senior School subject: French	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	19
22	GEN_SCI	General Science	Senior School subject: General Science	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	31
23	GEOGRAPHY	Geography	Senior School subject: Geography	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	27
24	GERMAN	German	Senior School subject: German	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	20
25	HISTORY	History and Citizenship	Senior School subject: History and Citizenship	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	26
26	HOME_SCI	Home Science	Senior School subject: Home Science	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	34
27	HRE	Hindu Religious Education	Senior School subject: Hindu Religious Education	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	24
28	ICT	Information Communication and Technology	Senior School subject: Information Communication and Technology	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	44
29	IND_LANG	Indigenous Languages	Senior School subject: Indigenous Languages	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	15
30	IRE	Islamic Religious Education	Senior School subject: Islamic Religious Education	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	23
31	KIS	Kiswahili	Senior School subject: Kiswahili	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	2
32	KISW	Kiswahili/KSL	Senior School subject: Kiswahili/KSL	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	6
33	LIT_ENG	Literature in English	Senior School subject: Literature in English	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	14
34	MANDARIN	Mandarin Chinese	Senior School subject: Mandarin Chinese	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	21
35	MARINE	Marine and Fisheries Technology	Senior School subject: Marine and Fisheries Technology	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	42
36	MATH	Mathematics	Senior School subject: Mathematics	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	3
37	MATH_ESS	Essential Mathematics	Senior School subject: Essential Mathematics	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	8
38	MEDIA_TECH	Media Technology	Senior School subject: Media Technology	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	41
39	METALWORK	Metalwork	Senior School subject: Metalwork	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	38
40	MUSIC	Music and Dance	Senior School subject: Music and Dance	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	11
41	P_RPI	Pastoral/Religious Programme of Instruction	Senior School subject: Pastoral/Religious Programme of Instruction	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	45
42	PE	Physical Education	Senior School subject: Physical Education	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	43
43	PHYSICS	Physics	Senior School subject: Physics	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	30
44	POWER_MECH	Power Mechanics	Senior School subject: Power Mechanics	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	39
45	SIGN_LANG	Sign Language	Senior School subject: Sign Language	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	17
46	SPORTS	Sports and Recreation	Senior School subject: Sports and Recreation	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	10
47	THEATRE	Theatre and Film	Senior School subject: Theatre and Film	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	12
48	WOOD_TECH	Wood Technology	Senior School subject: Wood Technology	\N	2025-2026	\N	1	t	2025-12-29 20:41:43.406477	2025-12-29 20:41:43.406477	40
\.


--
-- Data for Name: curriculum_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.curriculum_progress (id, school_id, learning_area_id, strand_code, sub_strand_code, last_updated_rubric_level, progress_percentage, updated_by, updated_at) FROM stdin;
\.


--
-- Data for Name: final_grades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.final_grades (id, student_id, course_id, final_percentage, letter_grade, gpa_points, calculated_at, approved_by, approved_at) FROM stdin;
\.


--
-- Data for Name: financial_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_transactions (id, learner_id, transaction_type, amount, payment_method, mpesa_confirmation_code, reference_number, transaction_date, verified, verified_at, verified_by, notes, created_at) FROM stdin;
\.


--
-- Data for Name: formative_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.formative_assessments (id, learner_id, learning_area_id, strand_code, sub_strand_code, indicator_code, rubric_level, score, term, academic_year, teacher_id, notes, assessed_at, created_at) FROM stdin;
\.


--
-- Data for Name: grade_scale; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grade_scale (id, letter_grade, min_percentage, max_percentage, gpa_points, description, is_active) FROM stdin;
1	A+	97.00	100.00	4.00	Excellent	t
2	A	93.00	96.90	4.00	Excellent	t
3	A-	90.00	92.90	3.70	Good	t
4	B+	87.00	89.90	3.30	Good	t
5	B	83.00	86.90	3.00	Good	t
6	B-	80.00	82.90	2.70	Satisfactory	t
7	C+	77.00	79.90	2.30	Satisfactory	t
8	C	73.00	76.90	2.00	Satisfactory	t
9	C-	70.00	72.90	1.70	Below Average	t
10	D+	67.00	69.90	1.30	Below Average	t
11	D	63.00	66.90	1.00	Below Average	t
12	D-	60.00	62.90	0.70	Passing	t
13	F	0.00	59.90	0.00	Failing	t
\.


--
-- Data for Name: grades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grades (id, student_id, course_id, assignment_id, grade_type, points_earned, points_possible, percentage, letter_grade, comments, graded_by, graded_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: infrastructure_projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.infrastructure_projects (id, school_id, name, description, budget, expenditure, progress_percentage, start_date, expected_completion_date, actual_completion_date, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: learner_learning_areas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.learner_learning_areas (id, learner_id, learning_area_id, is_core, assigned_at) FROM stdin;
\.


--
-- Data for Name: learner_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.learner_profiles (id, user_id, school_id, admission_number, pathway_id, parent_id, kjsea_results, registration_date, created_at, updated_at) FROM stdin;
1	5	\N	5	\N	\N	\N	2025-12-29	2025-12-29 21:23:25.35735	2025-12-29 21:23:25.35735
\.


--
-- Data for Name: learner_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.learner_transfers (id, learner_id, from_school_id, to_school_id, transfer_reason, status, requested_by, approved_by, approval_date, transfer_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: learning_areas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.learning_areas (id, name, code, pathway_id, is_core, description, strands, rubrics, created_at, updated_at) FROM stdin;
2	Kiswahili	KIS	\N	t	Core Kiswahili Language	\N	\N	2025-12-27 15:37:07.579873	2025-12-27 15:37:07.579873
8	Essential Mathematics	MATH_ESS	\N	t	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
12	Theatre and Film	THEATRE	2	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
13	Fine Arts	FINE_ARTS	2	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
14	Literature in English	LIT_ENG	9	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
15	Indigenous Languages	IND_LANG	9	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
16	Fasihi ya Kiswahili	FASIHI	9	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
17	Sign Language	SIGN_LANG	9	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
18	Arabic	ARABIC	9	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
19	French	FRENCH	9	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
20	German	GERMAN	9	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
21	Mandarin Chinese	MANDARIN	9	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
23	Islamic Religious Education	IRE	9	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
24	Hindu Religious Education	HRE	9	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
31	General Science	GEN_SCI	1	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
32	Agriculture	AGRICULTURE	1	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
34	Home Science	HOME_SCI	1	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
35	Aviation	AVIATION	1	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
36	Building Construction	BUILDING	1	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
37	Electricity	ELECTRICITY	1	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
38	Metalwork	METALWORK	1	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
39	Power Mechanics	POWER_MECH	1	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
40	Wood Technology	WOOD_TECH	1	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
41	Media Technology	MEDIA_TECH	1	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
42	Marine and Fisheries Technology	MARINE	1	f	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
43	Physical Education	PE	\N	t	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
44	Information Communication and Technology	ICT	\N	t	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
45	Pastoral/Religious Programme of Instruction	P_RPI	\N	t	\N	[]	[]	2025-12-29 19:01:01.281518	2025-12-29 19:01:01.281518
1	English	ENG	\N	t	Core English Language	[{"strand_code": "STR1", "strand_name": "Listening and Speaking", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Listen and respond to oral texts"}, {"indicator_code": "IND1.1.2", "indicator_name": "Identify main ideas and supporting details"}, {"indicator_code": "IND1.1.3", "indicator_name": "Make inferences from oral texts"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Listening Comprehension"}, {"indicators": [{"indicator_code": "IND1.2.1", "indicator_name": "Participate in conversations"}, {"indicator_code": "IND1.2.2", "indicator_name": "Present ideas clearly and coherently"}, {"indicator_code": "IND1.2.3", "indicator_name": "Use appropriate language register"}], "sub_strand_code": "SS1.2", "sub_strand_name": "Speaking Skills"}]}, {"strand_code": "STR2", "strand_name": "Reading", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Read and understand various text types"}, {"indicator_code": "IND2.1.2", "indicator_name": "Analyze literary texts"}, {"indicator_code": "IND2.1.3", "indicator_name": "Extract information from texts"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Reading Comprehension"}, {"indicators": [{"indicator_code": "IND2.2.1", "indicator_name": "Build vocabulary through reading"}, {"indicator_code": "IND2.2.2", "indicator_name": "Use context clues to determine meaning"}], "sub_strand_code": "SS2.2", "sub_strand_name": "Vocabulary Development"}]}, {"strand_code": "STR3", "strand_name": "Writing", "sub_strands": [{"indicators": [{"indicator_code": "IND3.1.1", "indicator_name": "Write different types of compositions"}, {"indicator_code": "IND3.1.2", "indicator_name": "Use appropriate writing conventions"}, {"indicator_code": "IND3.1.3", "indicator_name": "Edit and revise written work"}], "sub_strand_code": "SS3.1", "sub_strand_name": "Composition Writing"}, {"indicators": [{"indicator_code": "IND3.2.1", "indicator_name": "Apply grammar rules correctly"}, {"indicator_code": "IND3.2.2", "indicator_name": "Use varied sentence structures"}], "sub_strand_code": "SS3.2", "sub_strand_name": "Grammar and Language Use"}]}]	\N	2025-12-27 15:37:07.579873	2026-01-06 21:33:58.551488
5	English	ENG	\N	t	\N	[{"strand_code": "STR1", "strand_name": "Listening and Speaking", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Listen and respond to oral texts"}, {"indicator_code": "IND1.1.2", "indicator_name": "Identify main ideas and supporting details"}, {"indicator_code": "IND1.1.3", "indicator_name": "Make inferences from oral texts"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Listening Comprehension"}, {"indicators": [{"indicator_code": "IND1.2.1", "indicator_name": "Participate in conversations"}, {"indicator_code": "IND1.2.2", "indicator_name": "Present ideas clearly and coherently"}, {"indicator_code": "IND1.2.3", "indicator_name": "Use appropriate language register"}], "sub_strand_code": "SS1.2", "sub_strand_name": "Speaking Skills"}]}, {"strand_code": "STR2", "strand_name": "Reading", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Read and understand various text types"}, {"indicator_code": "IND2.1.2", "indicator_name": "Analyze literary texts"}, {"indicator_code": "IND2.1.3", "indicator_name": "Extract information from texts"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Reading Comprehension"}, {"indicators": [{"indicator_code": "IND2.2.1", "indicator_name": "Build vocabulary through reading"}, {"indicator_code": "IND2.2.2", "indicator_name": "Use context clues to determine meaning"}], "sub_strand_code": "SS2.2", "sub_strand_name": "Vocabulary Development"}]}, {"strand_code": "STR3", "strand_name": "Writing", "sub_strands": [{"indicators": [{"indicator_code": "IND3.1.1", "indicator_name": "Write different types of compositions"}, {"indicator_code": "IND3.1.2", "indicator_name": "Use appropriate writing conventions"}, {"indicator_code": "IND3.1.3", "indicator_name": "Edit and revise written work"}], "sub_strand_code": "SS3.1", "sub_strand_name": "Composition Writing"}, {"indicators": [{"indicator_code": "IND3.2.1", "indicator_name": "Apply grammar rules correctly"}, {"indicator_code": "IND3.2.2", "indicator_name": "Use varied sentence structures"}], "sub_strand_code": "SS3.2", "sub_strand_name": "Grammar and Language Use"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
6	Kiswahili/KSL	KISW	\N	t	\N	[{"strand_code": "STR1", "strand_name": "Kusikiliza na Kuzungumza", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Sikiliza na uelewe maudhui ya matini"}, {"indicator_code": "IND1.1.2", "indicator_name": "Tambua wazo kuu na maelezo ya ziada"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Kusikiliza Kwa Makini"}, {"indicators": [{"indicator_code": "IND1.2.1", "indicator_name": "Shiriki katika mazungumzo"}, {"indicator_code": "IND1.2.2", "indicator_name": "Toa mawazo kwa uwazi"}], "sub_strand_code": "SS1.2", "sub_strand_name": "Kuzungumza"}]}, {"strand_code": "STR2", "strand_name": "Kusoma", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Soma na uelewe aina mbalimbali za matini"}, {"indicator_code": "IND2.1.2", "indicator_name": "Chambua matini za fasihi"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Kusoma na Kuelewa"}]}, {"strand_code": "STR3", "strand_name": "Kuandika", "sub_strands": [{"indicators": [{"indicator_code": "IND3.1.1", "indicator_name": "Andika aina mbalimbali za insha"}, {"indicator_code": "IND3.1.2", "indicator_name": "Tumia kanuni za uandishi kwa usahihi"}], "sub_strand_code": "SS3.1", "sub_strand_name": "Kuandika Insha"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
3	Mathematics	MATH	\N	t	Core Mathematics	[{"strand_code": "STR1", "strand_name": "Number", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Work with real numbers"}, {"indicator_code": "IND1.1.2", "indicator_name": "Perform operations on numbers"}, {"indicator_code": "IND1.1.3", "indicator_name": "Solve problems involving numbers"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Number Concepts"}, {"indicators": [{"indicator_code": "IND1.2.1", "indicator_name": "Add, subtract, multiply, and divide"}, {"indicator_code": "IND1.2.2", "indicator_name": "Work with fractions and decimals"}], "sub_strand_code": "SS1.2", "sub_strand_name": "Number Operations"}]}, {"strand_code": "STR2", "strand_name": "Algebra", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Simplify algebraic expressions"}, {"indicator_code": "IND2.1.2", "indicator_name": "Factorize expressions"}, {"indicator_code": "IND2.1.3", "indicator_name": "Solve equations and inequalities"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Algebraic Expressions"}, {"indicators": [{"indicator_code": "IND2.2.1", "indicator_name": "Understand and use functions"}, {"indicator_code": "IND2.2.2", "indicator_name": "Graph functions"}], "sub_strand_code": "SS2.2", "sub_strand_name": "Functions"}]}, {"strand_code": "STR3", "strand_name": "Geometry", "sub_strands": [{"indicators": [{"indicator_code": "IND3.1.1", "indicator_name": "Identify and classify shapes"}, {"indicator_code": "IND3.1.2", "indicator_name": "Calculate areas and volumes"}], "sub_strand_code": "SS3.1", "sub_strand_name": "Geometric Shapes"}, {"indicators": [{"indicator_code": "IND3.2.1", "indicator_name": "Understand geometric theorems"}, {"indicator_code": "IND3.2.2", "indicator_name": "Apply geometric principles"}], "sub_strand_code": "SS3.2", "sub_strand_name": "Geometric Relationships"}]}, {"strand_code": "STR4", "strand_name": "Statistics and Probability", "sub_strands": [{"indicators": [{"indicator_code": "IND4.1.1", "indicator_name": "Collect and organize data"}, {"indicator_code": "IND4.1.2", "indicator_name": "Represent data graphically"}, {"indicator_code": "IND4.1.3", "indicator_name": "Analyze and interpret data"}], "sub_strand_code": "SS4.1", "sub_strand_name": "Data Handling"}, {"indicators": [{"indicator_code": "IND4.2.1", "indicator_name": "Understand probability concepts"}, {"indicator_code": "IND4.2.2", "indicator_name": "Calculate probabilities"}], "sub_strand_code": "SS4.2", "sub_strand_name": "Probability"}]}]	\N	2025-12-27 15:37:07.579873	2026-01-06 21:33:58.551488
7	Core Mathematics	MATH	\N	t	\N	[{"strand_code": "STR1", "strand_name": "Number", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Work with real numbers"}, {"indicator_code": "IND1.1.2", "indicator_name": "Perform operations on numbers"}, {"indicator_code": "IND1.1.3", "indicator_name": "Solve problems involving numbers"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Number Concepts"}, {"indicators": [{"indicator_code": "IND1.2.1", "indicator_name": "Add, subtract, multiply, and divide"}, {"indicator_code": "IND1.2.2", "indicator_name": "Work with fractions and decimals"}], "sub_strand_code": "SS1.2", "sub_strand_name": "Number Operations"}]}, {"strand_code": "STR2", "strand_name": "Algebra", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Simplify algebraic expressions"}, {"indicator_code": "IND2.1.2", "indicator_name": "Factorize expressions"}, {"indicator_code": "IND2.1.3", "indicator_name": "Solve equations and inequalities"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Algebraic Expressions"}, {"indicators": [{"indicator_code": "IND2.2.1", "indicator_name": "Understand and use functions"}, {"indicator_code": "IND2.2.2", "indicator_name": "Graph functions"}], "sub_strand_code": "SS2.2", "sub_strand_name": "Functions"}]}, {"strand_code": "STR3", "strand_name": "Geometry", "sub_strands": [{"indicators": [{"indicator_code": "IND3.1.1", "indicator_name": "Identify and classify shapes"}, {"indicator_code": "IND3.1.2", "indicator_name": "Calculate areas and volumes"}], "sub_strand_code": "SS3.1", "sub_strand_name": "Geometric Shapes"}, {"indicators": [{"indicator_code": "IND3.2.1", "indicator_name": "Understand geometric theorems"}, {"indicator_code": "IND3.2.2", "indicator_name": "Apply geometric principles"}], "sub_strand_code": "SS3.2", "sub_strand_name": "Geometric Relationships"}]}, {"strand_code": "STR4", "strand_name": "Statistics and Probability", "sub_strands": [{"indicators": [{"indicator_code": "IND4.1.1", "indicator_name": "Collect and organize data"}, {"indicator_code": "IND4.1.2", "indicator_name": "Represent data graphically"}, {"indicator_code": "IND4.1.3", "indicator_name": "Analyze and interpret data"}], "sub_strand_code": "SS4.1", "sub_strand_name": "Data Handling"}, {"indicators": [{"indicator_code": "IND4.2.1", "indicator_name": "Understand probability concepts"}, {"indicator_code": "IND4.2.2", "indicator_name": "Calculate probabilities"}], "sub_strand_code": "SS4.2", "sub_strand_name": "Probability"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
9	Community Service Learning	CSL	\N	t	\N	[{"strand_code": "STR1", "strand_name": "Community Engagement", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Identify community needs"}, {"indicator_code": "IND1.1.2", "indicator_name": "Plan community service activities"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Community Needs Assessment"}, {"indicators": [{"indicator_code": "IND1.2.1", "indicator_name": "Participate in community service"}, {"indicator_code": "IND1.2.2", "indicator_name": "Reflect on service experiences"}], "sub_strand_code": "SS1.2", "sub_strand_name": "Service Implementation"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
28	Biology	BIOLOGY	1	f	\N	[{"strand_code": "STR1", "strand_name": "Cell Biology", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Describe cell structure"}, {"indicator_code": "IND1.1.2", "indicator_name": "Explain cell functions"}, {"indicator_code": "IND1.1.3", "indicator_name": "Compare plant and animal cells"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Cell Structure and Function"}, {"indicators": [{"indicator_code": "IND1.2.1", "indicator_name": "Understand mitosis and meiosis"}, {"indicator_code": "IND1.2.2", "indicator_name": "Explain cell cycle"}], "sub_strand_code": "SS1.2", "sub_strand_name": "Cell Division"}]}, {"strand_code": "STR2", "strand_name": "Genetics", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Understand inheritance patterns"}, {"indicator_code": "IND2.1.2", "indicator_name": "Solve genetic problems"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Heredity"}]}, {"strand_code": "STR3", "strand_name": "Ecology", "sub_strands": [{"indicators": [{"indicator_code": "IND3.1.1", "indicator_name": "Describe ecosystem components"}, {"indicator_code": "IND3.1.2", "indicator_name": "Explain ecological relationships"}], "sub_strand_code": "SS3.1", "sub_strand_name": "Ecosystems"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
29	Chemistry	CHEMISTRY	1	f	\N	[{"strand_code": "STR1", "strand_name": "Atomic Structure", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Describe atomic structure"}, {"indicator_code": "IND1.1.2", "indicator_name": "Explain electron configuration"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Atomic Theory"}]}, {"strand_code": "STR2", "strand_name": "Chemical Bonding", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Understand ionic and covalent bonds"}, {"indicator_code": "IND2.1.2", "indicator_name": "Explain bond formation"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Types of Bonds"}]}, {"strand_code": "STR3", "strand_name": "Chemical Reactions", "sub_strands": [{"indicators": [{"indicator_code": "IND3.1.1", "indicator_name": "Classify chemical reactions"}, {"indicator_code": "IND3.1.2", "indicator_name": "Balance chemical equations"}], "sub_strand_code": "SS3.1", "sub_strand_name": "Reaction Types"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
30	Physics	PHYSICS	1	f	\N	[{"strand_code": "STR1", "strand_name": "Mechanics", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Describe motion and forces"}, {"indicator_code": "IND1.1.2", "indicator_name": "Apply Newton's laws"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Motion"}, {"indicators": [{"indicator_code": "IND1.2.1", "indicator_name": "Understand energy concepts"}, {"indicator_code": "IND1.2.2", "indicator_name": "Apply conservation of energy"}], "sub_strand_code": "SS1.2", "sub_strand_name": "Energy"}]}, {"strand_code": "STR2", "strand_name": "Waves and Optics", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Describe wave characteristics"}, {"indicator_code": "IND2.1.2", "indicator_name": "Explain wave behavior"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Wave Properties"}]}, {"strand_code": "STR3", "strand_name": "Electricity and Magnetism", "sub_strands": [{"indicators": [{"indicator_code": "IND3.1.1", "indicator_name": "Understand electrical circuits"}, {"indicator_code": "IND3.1.2", "indicator_name": "Calculate electrical quantities"}], "sub_strand_code": "SS3.1", "sub_strand_name": "Electric Circuits"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
33	Computer Studies	COMPUTER	1	f	\N	[{"strand_code": "STR1", "strand_name": "Computer Fundamentals", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Understand computer components"}, {"indicator_code": "IND1.1.2", "indicator_name": "Explain computer operations"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Computer Systems"}]}, {"strand_code": "STR2", "strand_name": "Programming", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Write simple programs"}, {"indicator_code": "IND2.1.2", "indicator_name": "Debug programs"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Programming Concepts"}]}, {"strand_code": "STR3", "strand_name": "Data Management", "sub_strands": [{"indicators": [{"indicator_code": "IND3.1.1", "indicator_name": "Design simple databases"}, {"indicator_code": "IND3.1.2", "indicator_name": "Query databases"}], "sub_strand_code": "SS3.1", "sub_strand_name": "Databases"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
10	Sports and Recreation	SPORTS	2	f	\N	[{"strand_code": "STR1", "strand_name": "Physical Fitness", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Understand fitness components"}, {"indicator_code": "IND1.1.2", "indicator_name": "Assess fitness levels"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Fitness Components"}]}, {"strand_code": "STR2", "strand_name": "Sports Skills", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Demonstrate sports skills"}, {"indicator_code": "IND2.1.2", "indicator_name": "Apply game strategies"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Game Skills"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
11	Music and Dance	MUSIC	2	f	\N	[{"strand_code": "STR1", "strand_name": "Music Theory", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Understand musical notation"}, {"indicator_code": "IND1.1.2", "indicator_name": "Identify musical elements"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Musical Elements"}]}, {"strand_code": "STR2", "strand_name": "Performance", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Perform musical pieces"}, {"indicator_code": "IND2.1.2", "indicator_name": "Demonstrate dance skills"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Musical Performance"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
26	History and Citizenship	HISTORY	9	f	\N	[{"strand_code": "STR1", "strand_name": "Historical Inquiry", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Analyze historical sources"}, {"indicator_code": "IND1.1.2", "indicator_name": "Evaluate historical evidence"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Historical Sources"}]}, {"strand_code": "STR2", "strand_name": "Historical Knowledge", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Understand historical periods"}, {"indicator_code": "IND2.1.2", "indicator_name": "Explain historical events"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Historical Periods"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
27	Geography	GEOGRAPHY	9	f	\N	[{"strand_code": "STR1", "strand_name": "Physical Geography", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Describe landforms"}, {"indicator_code": "IND1.1.2", "indicator_name": "Explain formation processes"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Landforms"}]}, {"strand_code": "STR2", "strand_name": "Human Geography", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Analyze population patterns"}, {"indicator_code": "IND2.1.2", "indicator_name": "Explain population dynamics"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Population"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
25	Business Studies	BUSINESS	9	f	\N	[{"strand_code": "STR1", "strand_name": "Business Environment", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Classify business types"}, {"indicator_code": "IND1.1.2", "indicator_name": "Understand business environment"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Business Types"}]}, {"strand_code": "STR2", "strand_name": "Business Operations", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Understand business functions"}, {"indicator_code": "IND2.1.2", "indicator_name": "Apply business principles"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Business Functions"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
22	Christian Religious Education	CRE	9	f	\N	[{"strand_code": "STR1", "strand_name": "Biblical Studies", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Study Old Testament texts"}, {"indicator_code": "IND1.1.2", "indicator_name": "Apply biblical teachings"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Old Testament"}, {"indicators": [{"indicator_code": "IND1.2.1", "indicator_name": "Study New Testament texts"}, {"indicator_code": "IND1.2.2", "indicator_name": "Understand Christian doctrines"}], "sub_strand_code": "SS1.2", "sub_strand_name": "New Testament"}]}, {"strand_code": "STR2", "strand_name": "Christian Living", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Apply Christian values"}, {"indicator_code": "IND2.1.2", "indicator_name": "Demonstrate Christian character"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Christian Ethics"}]}]	[]	2025-12-29 19:01:01.281518	2026-01-06 21:33:58.551488
4	Christian Religious Education	CRE	\N	t	Core Religious Education	[{"strand_code": "STR1", "strand_name": "Biblical Studies", "sub_strands": [{"indicators": [{"indicator_code": "IND1.1.1", "indicator_name": "Study Old Testament texts"}, {"indicator_code": "IND1.1.2", "indicator_name": "Apply biblical teachings"}], "sub_strand_code": "SS1.1", "sub_strand_name": "Old Testament"}, {"indicators": [{"indicator_code": "IND1.2.1", "indicator_name": "Study New Testament texts"}, {"indicator_code": "IND1.2.2", "indicator_name": "Understand Christian doctrines"}], "sub_strand_code": "SS1.2", "sub_strand_name": "New Testament"}]}, {"strand_code": "STR2", "strand_name": "Christian Living", "sub_strands": [{"indicators": [{"indicator_code": "IND2.1.1", "indicator_name": "Apply Christian values"}, {"indicator_code": "IND2.1.2", "indicator_name": "Demonstrate Christian character"}], "sub_strand_code": "SS2.1", "sub_strand_name": "Christian Ethics"}]}]	\N	2025-12-27 15:37:07.579873	2026-01-06 21:33:58.551488
\.


--
-- Data for Name: learning_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.learning_modules (id, course_id, module_name, module_description, module_order, is_published, created_by, created_at, updated_at) FROM stdin;
1	1	Introduction to Algebra	Basic algebraic concepts and operations	1	t	4	2025-12-27 12:02:14.776655	2025-12-27 12:02:14.776655
\.


--
-- Data for Name: message_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.message_attachments (id, message_id, file_name, file_path, file_size, file_type, created_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, sender_id, recipient_id, subject, message_body, is_read, read_at, is_important, attachments, created_at) FROM stdin;
\.


--
-- Data for Name: module_content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.module_content (id, module_id, content_type, title, content_url, content_text, file_name, file_size, display_order, created_at) FROM stdin;
1	1	text	Welcome to Algebra	\N	This module introduces basic algebraic concepts including variables, expressions, and equations.	\N	\N	1	2025-12-27 12:02:14.776655
\.


--
-- Data for Name: parent_student_relationships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parent_student_relationships (id, parent_id, student_id, relationship_type, created_at) FROM stdin;
1	6	5	parent	2025-12-27 12:02:14.776655
\.


--
-- Data for Name: pathways; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pathways (id, name, code, description, is_active, created_at) FROM stdin;
1	STEM	STEM	Science, Technology, Engineering, and Mathematics Pathway	t	2025-12-27 15:37:07.579873
2	Arts	ARTS	Arts and Sports Science Pathway	t	2025-12-27 15:37:07.579873
3	Social Sciences	SOC	Social Sciences Pathway	t	2025-12-27 15:37:07.579873
9	Social Sciences	SOCIAL	Social Sciences	t	2025-12-29 19:01:01.281518
\.


--
-- Data for Name: result_slip_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.result_slip_details (id, result_slip_id, learning_area_id, average_formative_score, summative_score, final_score, final_grade, created_at) FROM stdin;
\.


--
-- Data for Name: result_slips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.result_slips (id, learner_id, term, academic_year, synthesized_at, synthesized_by) FROM stdin;
\.


--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schools (id, name, code, county, sub_county, address, headteacher_id, logo_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: summative_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.summative_assessments (id, name, type, term, academic_year, school_id, learning_area_id, total_marks, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: summative_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.summative_results (id, assessment_id, learner_id, score, percentage, grade, entered_by, entered_at) FROM stdin;
\.


--
-- Data for Name: system_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_analytics (id, metric_name, metric_value, metric_type, category, calculated_at) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, setting_key, setting_value, description, updated_by, updated_at) FROM stdin;
\.


--
-- Data for Name: teacher_allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_allocations (id, teacher_id, course_id, allocated_by, allocation_date, notes, created_at) FROM stdin;
\.


--
-- Data for Name: teacher_course_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_course_assignments (id, course_id, teacher_id, term_number, academic_year, assigned_by, assigned_at, is_active) FROM stdin;
1	37	4	1	2025-2026	1	2025-12-29 21:37:32.053674	t
\.


--
-- Data for Name: teacher_ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_ratings (id, teacher_id, rated_by_user_id, rating, feedback_type, comments, created_at) FROM stdin;
\.


--
-- Data for Name: terms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.terms (id, term_number, academic_year, name, date_range_start, date_range_end, start_date, end_date, is_active, created_by, created_at, updated_at) FROM stdin;
1	1	2025-2026	Term 1 2025	January	April	\N	\N	t	\N	2025-12-29 18:45:26.672459	2025-12-29 18:45:26.672459
2	2	2025-2026	Term 2 2025	April	July	\N	\N	t	\N	2025-12-29 18:45:26.672459	2025-12-29 18:45:26.672459
3	3	2025-2026	Term 3 2025	August	October	\N	\N	t	\N	2025-12-29 18:45:26.672459	2025-12-29 18:45:26.672459
7	1	2026-2027	Term 1 2026	January	April	\N	\N	t	1	2026-01-06 22:49:28.36013	2026-01-06 22:56:07.271272
8	2	2026-2027	Term 2 2026	may	august	\N	\N	t	1	2026-01-06 22:57:08.384179	2026-01-06 22:57:08.384179
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, first_name, last_name, role, phone, address, date_of_birth, profile_image_url, is_active, created_at, updated_at, tsc_number, id_number, is_verified, verification_token, verification_token_expires, school_id) FROM stdin;
1	headteacher	headteacher@school.com	$2a$10$AE5Y9etCp6S/gPsK/SyzSe/uwVuW.t/MFLndrjGXWu8O0GeKoh/Ou	John	Principal	headteacher	555-0101	\N	\N	\N	t	2025-12-27 12:02:14.776655	2025-12-27 12:02:14.776655	\N	\N	f	\N	\N	\N
2	deputy	deputy@school.com	$2a$10$AE5Y9etCp6S/gPsK/SyzSe/uwVuW.t/MFLndrjGXWu8O0GeKoh/Ou	Jane	Vice-Principal	deputy_headteacher	555-0102	\N	\N	\N	t	2025-12-27 12:02:14.776655	2025-12-27 12:02:14.776655	\N	\N	f	\N	\N	\N
3	finance	finance@school.com	$2a$10$AE5Y9etCp6S/gPsK/SyzSe/uwVuW.t/MFLndrjGXWu8O0GeKoh/Ou	Mike	Accountant	finance	555-0103	\N	\N	\N	t	2025-12-27 12:02:14.776655	2025-12-27 12:02:14.776655	\N	\N	f	\N	\N	\N
4	teacher1	teacher1@school.com	$2a$10$AE5Y9etCp6S/gPsK/SyzSe/uwVuW.t/MFLndrjGXWu8O0GeKoh/Ou	Sarah	Educator	teacher	555-0104	\N	\N	\N	t	2025-12-27 12:02:14.776655	2025-12-27 12:02:14.776655	\N	\N	f	\N	\N	\N
5	student1	student1@school.com	$2a$10$AE5Y9etCp6S/gPsK/SyzSe/uwVuW.t/MFLndrjGXWu8O0GeKoh/Ou	Alex	Student	student	555-0105	\N	2008-01-15	\N	t	2025-12-27 12:02:14.776655	2025-12-27 12:02:14.776655	\N	\N	f	\N	\N	\N
6	parent1	parent1@email.com	$2a$10$AE5Y9etCp6S/gPsK/SyzSe/uwVuW.t/MFLndrjGXWu8O0GeKoh/Ou	Robert	Parent	parent	555-0106	\N	\N	\N	t	2025-12-27 12:02:14.776655	2025-12-27 12:02:14.776655	\N	\N	f	\N	\N	\N
7	superadmin	superadmin@school.com	$2a$10$o2hqrADH9jkzLrHpX9doaeHTLQ5HH7TqbsI718Er4WIUnTHfsCG6i	Super	Admin	superadmin	\N	\N	\N	\N	t	2025-12-27 12:48:16.817578	2025-12-27 12:48:16.817578	\N	\N	f	\N	\N	\N
\.


--
-- Name: assignment_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assignment_submissions_id_seq', 1, false);


--
-- Name: assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assignments_id_seq', 1, false);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 1, false);


--
-- Name: book_issuances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.book_issuances_id_seq', 1, false);


--
-- Name: books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.books_id_seq', 1, false);


--
-- Name: bursary_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bursary_applications_id_seq', 1, false);


--
-- Name: course_enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_enrollments_id_seq', 1, true);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_id_seq', 48, true);


--
-- Name: curriculum_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.curriculum_progress_id_seq', 1, false);


--
-- Name: final_grades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.final_grades_id_seq', 1, false);


--
-- Name: financial_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.financial_transactions_id_seq', 1, false);


--
-- Name: formative_assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.formative_assessments_id_seq', 1, false);


--
-- Name: grade_scale_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grade_scale_id_seq', 13, true);


--
-- Name: grades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grades_id_seq', 1, false);


--
-- Name: infrastructure_projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.infrastructure_projects_id_seq', 1, false);


--
-- Name: learner_learning_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.learner_learning_areas_id_seq', 1, false);


--
-- Name: learner_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.learner_profiles_id_seq', 1, true);


--
-- Name: learner_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.learner_transfers_id_seq', 1, false);


--
-- Name: learning_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.learning_areas_id_seq', 45, true);


--
-- Name: learning_modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.learning_modules_id_seq', 1, true);


--
-- Name: message_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.message_attachments_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: module_content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.module_content_id_seq', 1, true);


--
-- Name: parent_student_relationships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parent_student_relationships_id_seq', 1, true);


--
-- Name: pathways_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pathways_id_seq', 9, true);


--
-- Name: result_slip_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.result_slip_details_id_seq', 1, false);


--
-- Name: result_slips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.result_slips_id_seq', 1, false);


--
-- Name: schools_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schools_id_seq', 1, false);


--
-- Name: summative_assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.summative_assessments_id_seq', 1, false);


--
-- Name: summative_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.summative_results_id_seq', 1, false);


--
-- Name: system_analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_analytics_id_seq', 1, false);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 1, false);


--
-- Name: teacher_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teacher_allocations_id_seq', 1, false);


--
-- Name: teacher_course_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teacher_course_assignments_id_seq', 1, true);


--
-- Name: teacher_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teacher_ratings_id_seq', 1, false);


--
-- Name: terms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.terms_id_seq', 8, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: assignment_submissions assignment_submissions_assignment_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_student_id_key UNIQUE (assignment_id, student_id);


--
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_course_id_student_id_attendance_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_course_id_student_id_attendance_date_key UNIQUE (course_id, student_id, attendance_date);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: book_issuances book_issuances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_issuances
    ADD CONSTRAINT book_issuances_pkey PRIMARY KEY (id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: bursary_applications bursary_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bursary_applications
    ADD CONSTRAINT bursary_applications_pkey PRIMARY KEY (id);


--
-- Name: course_enrollments course_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (id);


--
-- Name: course_enrollments course_enrollments_student_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_student_id_course_id_key UNIQUE (student_id, course_id);


--
-- Name: courses courses_course_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_course_code_key UNIQUE (course_code);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: curriculum_progress curriculum_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculum_progress
    ADD CONSTRAINT curriculum_progress_pkey PRIMARY KEY (id);


--
-- Name: curriculum_progress curriculum_progress_school_id_learning_area_id_strand_code__key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculum_progress
    ADD CONSTRAINT curriculum_progress_school_id_learning_area_id_strand_code__key UNIQUE (school_id, learning_area_id, strand_code, sub_strand_code);


--
-- Name: final_grades final_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_grades
    ADD CONSTRAINT final_grades_pkey PRIMARY KEY (id);


--
-- Name: final_grades final_grades_student_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_grades
    ADD CONSTRAINT final_grades_student_id_course_id_key UNIQUE (student_id, course_id);


--
-- Name: financial_transactions financial_transactions_mpesa_confirmation_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_mpesa_confirmation_code_key UNIQUE (mpesa_confirmation_code);


--
-- Name: financial_transactions financial_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_pkey PRIMARY KEY (id);


--
-- Name: formative_assessments formative_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formative_assessments
    ADD CONSTRAINT formative_assessments_pkey PRIMARY KEY (id);


--
-- Name: grade_scale grade_scale_letter_grade_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_scale
    ADD CONSTRAINT grade_scale_letter_grade_key UNIQUE (letter_grade);


--
-- Name: grade_scale grade_scale_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_scale
    ADD CONSTRAINT grade_scale_pkey PRIMARY KEY (id);


--
-- Name: grades grades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_pkey PRIMARY KEY (id);


--
-- Name: infrastructure_projects infrastructure_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infrastructure_projects
    ADD CONSTRAINT infrastructure_projects_pkey PRIMARY KEY (id);


--
-- Name: learner_learning_areas learner_learning_areas_learner_id_learning_area_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_learning_areas
    ADD CONSTRAINT learner_learning_areas_learner_id_learning_area_id_key UNIQUE (learner_id, learning_area_id);


--
-- Name: learner_learning_areas learner_learning_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_learning_areas
    ADD CONSTRAINT learner_learning_areas_pkey PRIMARY KEY (id);


--
-- Name: learner_profiles learner_profiles_admission_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_profiles
    ADD CONSTRAINT learner_profiles_admission_number_key UNIQUE (admission_number);


--
-- Name: learner_profiles learner_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_profiles
    ADD CONSTRAINT learner_profiles_pkey PRIMARY KEY (id);


--
-- Name: learner_profiles learner_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_profiles
    ADD CONSTRAINT learner_profiles_user_id_key UNIQUE (user_id);


--
-- Name: learner_transfers learner_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_transfers
    ADD CONSTRAINT learner_transfers_pkey PRIMARY KEY (id);


--
-- Name: learning_areas learning_areas_code_pathway_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_areas
    ADD CONSTRAINT learning_areas_code_pathway_id_key UNIQUE (code, pathway_id);


--
-- Name: learning_areas learning_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_areas
    ADD CONSTRAINT learning_areas_pkey PRIMARY KEY (id);


--
-- Name: learning_modules learning_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_modules
    ADD CONSTRAINT learning_modules_pkey PRIMARY KEY (id);


--
-- Name: message_attachments message_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: module_content module_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_content
    ADD CONSTRAINT module_content_pkey PRIMARY KEY (id);


--
-- Name: parent_student_relationships parent_student_relationships_parent_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_student_relationships
    ADD CONSTRAINT parent_student_relationships_parent_id_student_id_key UNIQUE (parent_id, student_id);


--
-- Name: parent_student_relationships parent_student_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_student_relationships
    ADD CONSTRAINT parent_student_relationships_pkey PRIMARY KEY (id);


--
-- Name: pathways pathways_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathways
    ADD CONSTRAINT pathways_code_key UNIQUE (code);


--
-- Name: pathways pathways_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pathways
    ADD CONSTRAINT pathways_pkey PRIMARY KEY (id);


--
-- Name: result_slip_details result_slip_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.result_slip_details
    ADD CONSTRAINT result_slip_details_pkey PRIMARY KEY (id);


--
-- Name: result_slip_details result_slip_details_result_slip_id_learning_area_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.result_slip_details
    ADD CONSTRAINT result_slip_details_result_slip_id_learning_area_id_key UNIQUE (result_slip_id, learning_area_id);


--
-- Name: result_slips result_slips_learner_id_term_academic_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.result_slips
    ADD CONSTRAINT result_slips_learner_id_term_academic_year_key UNIQUE (learner_id, term, academic_year);


--
-- Name: result_slips result_slips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.result_slips
    ADD CONSTRAINT result_slips_pkey PRIMARY KEY (id);


--
-- Name: schools schools_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_code_key UNIQUE (code);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: summative_assessments summative_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summative_assessments
    ADD CONSTRAINT summative_assessments_pkey PRIMARY KEY (id);


--
-- Name: summative_results summative_results_assessment_id_learner_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summative_results
    ADD CONSTRAINT summative_results_assessment_id_learner_id_key UNIQUE (assessment_id, learner_id);


--
-- Name: summative_results summative_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summative_results
    ADD CONSTRAINT summative_results_pkey PRIMARY KEY (id);


--
-- Name: system_analytics system_analytics_metric_name_calculated_at_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_analytics
    ADD CONSTRAINT system_analytics_metric_name_calculated_at_key UNIQUE (metric_name, calculated_at);


--
-- Name: system_analytics system_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_analytics
    ADD CONSTRAINT system_analytics_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: teacher_allocations teacher_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_allocations
    ADD CONSTRAINT teacher_allocations_pkey PRIMARY KEY (id);


--
-- Name: teacher_allocations teacher_allocations_teacher_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_allocations
    ADD CONSTRAINT teacher_allocations_teacher_id_course_id_key UNIQUE (teacher_id, course_id);


--
-- Name: teacher_course_assignments teacher_course_assignments_course_id_teacher_id_term_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments
    ADD CONSTRAINT teacher_course_assignments_course_id_teacher_id_term_number_key UNIQUE (course_id, teacher_id, term_number, academic_year);


--
-- Name: teacher_course_assignments teacher_course_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments
    ADD CONSTRAINT teacher_course_assignments_pkey PRIMARY KEY (id);


--
-- Name: teacher_ratings teacher_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_ratings
    ADD CONSTRAINT teacher_ratings_pkey PRIMARY KEY (id);


--
-- Name: teacher_ratings teacher_ratings_teacher_id_rated_by_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_ratings
    ADD CONSTRAINT teacher_ratings_teacher_id_rated_by_user_id_key UNIQUE (teacher_id, rated_by_user_id);


--
-- Name: terms terms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_pkey PRIMARY KEY (id);


--
-- Name: terms terms_term_number_academic_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_term_number_academic_year_key UNIQUE (term_number, academic_year);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_assignments_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_course ON public.assignments USING btree (course_id);


--
-- Name: idx_assignments_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_due_date ON public.assignments USING btree (due_date);


--
-- Name: idx_attendance_course_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_course_date ON public.attendance USING btree (course_id, attendance_date);


--
-- Name: idx_attendance_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_student ON public.attendance USING btree (student_id);


--
-- Name: idx_book_issuances_learner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_book_issuances_learner ON public.book_issuances USING btree (learner_id, status);


--
-- Name: idx_bursary_applications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bursary_applications_status ON public.bursary_applications USING btree (status);


--
-- Name: idx_course_enrollments_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_enrollments_course ON public.course_enrollments USING btree (course_id);


--
-- Name: idx_course_enrollments_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_enrollments_student ON public.course_enrollments USING btree (student_id);


--
-- Name: idx_enrollments_authorization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_authorization ON public.course_enrollments USING btree (authorization_status);


--
-- Name: idx_financial_transactions_learner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_financial_transactions_learner ON public.financial_transactions USING btree (learner_id, transaction_date);


--
-- Name: idx_formative_assessments_learner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_formative_assessments_learner ON public.formative_assessments USING btree (learner_id, academic_year, term);


--
-- Name: idx_grades_student_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_grades_student_course ON public.grades USING btree (student_id, course_id);


--
-- Name: idx_learner_learning_areas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_learner_learning_areas ON public.learner_learning_areas USING btree (learner_id);


--
-- Name: idx_learner_profiles_pathway; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_learner_profiles_pathway ON public.learner_profiles USING btree (pathway_id);


--
-- Name: idx_learner_profiles_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_learner_profiles_school ON public.learner_profiles USING btree (school_id);


--
-- Name: idx_messages_recipient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_recipient ON public.messages USING btree (recipient_id, is_read);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- Name: idx_result_slips_learner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_result_slips_learner ON public.result_slips USING btree (learner_id, academic_year);


--
-- Name: idx_submissions_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_assignment ON public.assignment_submissions USING btree (assignment_id);


--
-- Name: idx_submissions_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_student ON public.assignment_submissions USING btree (student_id);


--
-- Name: idx_summative_assessments_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_summative_assessments_school ON public.summative_assessments USING btree (school_id, academic_year, term);


--
-- Name: idx_teacher_allocations_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_allocations_course ON public.teacher_allocations USING btree (course_id);


--
-- Name: idx_teacher_allocations_teacher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_allocations_teacher ON public.teacher_allocations USING btree (teacher_id);


--
-- Name: idx_teacher_course_assignments_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_course_assignments_course ON public.teacher_course_assignments USING btree (course_id, is_active);


--
-- Name: idx_teacher_course_assignments_teacher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_course_assignments_teacher ON public.teacher_course_assignments USING btree (teacher_id, is_active);


--
-- Name: idx_teacher_course_assignments_term; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_course_assignments_term ON public.teacher_course_assignments USING btree (term_number, academic_year);


--
-- Name: idx_terms_academic_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_terms_academic_year ON public.terms USING btree (academic_year);


--
-- Name: idx_terms_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_terms_active ON public.terms USING btree (is_active);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: assignment_submissions assignment_submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: assignment_submissions assignment_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: assignments assignments_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.learning_modules(id) ON DELETE SET NULL;


--
-- Name: attendance attendance_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.users(id);


--
-- Name: attendance attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: book_issuances book_issuances_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_issuances
    ADD CONSTRAINT book_issuances_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_issuances book_issuances_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_issuances
    ADD CONSTRAINT book_issuances_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES public.users(id);


--
-- Name: book_issuances book_issuances_learner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_issuances
    ADD CONSTRAINT book_issuances_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.learner_profiles(id) ON DELETE CASCADE;


--
-- Name: books books_learning_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_learning_area_id_fkey FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE SET NULL;


--
-- Name: bursary_applications bursary_applications_learner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bursary_applications
    ADD CONSTRAINT bursary_applications_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.learner_profiles(id) ON DELETE CASCADE;


--
-- Name: bursary_applications bursary_applications_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bursary_applications
    ADD CONSTRAINT bursary_applications_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: course_enrollments course_enrollments_authorized_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_authorized_by_fkey FOREIGN KEY (authorized_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: course_enrollments course_enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_enrollments course_enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: courses courses_learning_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_learning_area_id_fkey FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE SET NULL;


--
-- Name: courses courses_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: curriculum_progress curriculum_progress_learning_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculum_progress
    ADD CONSTRAINT curriculum_progress_learning_area_id_fkey FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE CASCADE;


--
-- Name: curriculum_progress curriculum_progress_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculum_progress
    ADD CONSTRAINT curriculum_progress_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: curriculum_progress curriculum_progress_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculum_progress
    ADD CONSTRAINT curriculum_progress_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: final_grades final_grades_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_grades
    ADD CONSTRAINT final_grades_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: final_grades final_grades_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_grades
    ADD CONSTRAINT final_grades_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: final_grades final_grades_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_grades
    ADD CONSTRAINT final_grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: financial_transactions financial_transactions_learner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.learner_profiles(id) ON DELETE CASCADE;


--
-- Name: financial_transactions financial_transactions_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: formative_assessments formative_assessments_learner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formative_assessments
    ADD CONSTRAINT formative_assessments_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.learner_profiles(id) ON DELETE CASCADE;


--
-- Name: formative_assessments formative_assessments_learning_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formative_assessments
    ADD CONSTRAINT formative_assessments_learning_area_id_fkey FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE CASCADE;


--
-- Name: formative_assessments formative_assessments_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formative_assessments
    ADD CONSTRAINT formative_assessments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: grades grades_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE SET NULL;


--
-- Name: grades grades_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: grades grades_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.users(id);


--
-- Name: grades grades_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: infrastructure_projects infrastructure_projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infrastructure_projects
    ADD CONSTRAINT infrastructure_projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: infrastructure_projects infrastructure_projects_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infrastructure_projects
    ADD CONSTRAINT infrastructure_projects_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: learner_learning_areas learner_learning_areas_learner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_learning_areas
    ADD CONSTRAINT learner_learning_areas_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.learner_profiles(id) ON DELETE CASCADE;


--
-- Name: learner_learning_areas learner_learning_areas_learning_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_learning_areas
    ADD CONSTRAINT learner_learning_areas_learning_area_id_fkey FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE CASCADE;


--
-- Name: learner_profiles learner_profiles_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_profiles
    ADD CONSTRAINT learner_profiles_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: learner_profiles learner_profiles_pathway_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_profiles
    ADD CONSTRAINT learner_profiles_pathway_id_fkey FOREIGN KEY (pathway_id) REFERENCES public.pathways(id) ON DELETE SET NULL;


--
-- Name: learner_profiles learner_profiles_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_profiles
    ADD CONSTRAINT learner_profiles_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: learner_profiles learner_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_profiles
    ADD CONSTRAINT learner_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: learner_transfers learner_transfers_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_transfers
    ADD CONSTRAINT learner_transfers_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: learner_transfers learner_transfers_from_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_transfers
    ADD CONSTRAINT learner_transfers_from_school_id_fkey FOREIGN KEY (from_school_id) REFERENCES public.schools(id) ON DELETE SET NULL;


--
-- Name: learner_transfers learner_transfers_learner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_transfers
    ADD CONSTRAINT learner_transfers_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.learner_profiles(id) ON DELETE CASCADE;


--
-- Name: learner_transfers learner_transfers_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_transfers
    ADD CONSTRAINT learner_transfers_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id);


--
-- Name: learner_transfers learner_transfers_to_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learner_transfers
    ADD CONSTRAINT learner_transfers_to_school_id_fkey FOREIGN KEY (to_school_id) REFERENCES public.schools(id) ON DELETE SET NULL;


--
-- Name: learning_areas learning_areas_pathway_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_areas
    ADD CONSTRAINT learning_areas_pathway_id_fkey FOREIGN KEY (pathway_id) REFERENCES public.pathways(id) ON DELETE SET NULL;


--
-- Name: learning_modules learning_modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_modules
    ADD CONSTRAINT learning_modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: learning_modules learning_modules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_modules
    ADD CONSTRAINT learning_modules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: message_attachments message_attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: messages messages_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: module_content module_content_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_content
    ADD CONSTRAINT module_content_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.learning_modules(id) ON DELETE CASCADE;


--
-- Name: parent_student_relationships parent_student_relationships_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_student_relationships
    ADD CONSTRAINT parent_student_relationships_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: parent_student_relationships parent_student_relationships_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_student_relationships
    ADD CONSTRAINT parent_student_relationships_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: result_slip_details result_slip_details_learning_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.result_slip_details
    ADD CONSTRAINT result_slip_details_learning_area_id_fkey FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE CASCADE;


--
-- Name: result_slip_details result_slip_details_result_slip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.result_slip_details
    ADD CONSTRAINT result_slip_details_result_slip_id_fkey FOREIGN KEY (result_slip_id) REFERENCES public.result_slips(id) ON DELETE CASCADE;


--
-- Name: result_slips result_slips_learner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.result_slips
    ADD CONSTRAINT result_slips_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.learner_profiles(id) ON DELETE CASCADE;


--
-- Name: result_slips result_slips_synthesized_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.result_slips
    ADD CONSTRAINT result_slips_synthesized_by_fkey FOREIGN KEY (synthesized_by) REFERENCES public.users(id);


--
-- Name: schools schools_headteacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_headteacher_id_fkey FOREIGN KEY (headteacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: summative_assessments summative_assessments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summative_assessments
    ADD CONSTRAINT summative_assessments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: summative_assessments summative_assessments_learning_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summative_assessments
    ADD CONSTRAINT summative_assessments_learning_area_id_fkey FOREIGN KEY (learning_area_id) REFERENCES public.learning_areas(id) ON DELETE CASCADE;


--
-- Name: summative_assessments summative_assessments_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summative_assessments
    ADD CONSTRAINT summative_assessments_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: summative_results summative_results_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summative_results
    ADD CONSTRAINT summative_results_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.summative_assessments(id) ON DELETE CASCADE;


--
-- Name: summative_results summative_results_entered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summative_results
    ADD CONSTRAINT summative_results_entered_by_fkey FOREIGN KEY (entered_by) REFERENCES public.users(id);


--
-- Name: summative_results summative_results_learner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summative_results
    ADD CONSTRAINT summative_results_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.learner_profiles(id) ON DELETE CASCADE;


--
-- Name: system_settings system_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: teacher_allocations teacher_allocations_allocated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_allocations
    ADD CONSTRAINT teacher_allocations_allocated_by_fkey FOREIGN KEY (allocated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: teacher_allocations teacher_allocations_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_allocations
    ADD CONSTRAINT teacher_allocations_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: teacher_allocations teacher_allocations_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_allocations
    ADD CONSTRAINT teacher_allocations_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teacher_course_assignments teacher_course_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments
    ADD CONSTRAINT teacher_course_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: teacher_course_assignments teacher_course_assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments
    ADD CONSTRAINT teacher_course_assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: teacher_course_assignments teacher_course_assignments_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_assignments
    ADD CONSTRAINT teacher_course_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teacher_ratings teacher_ratings_rated_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_ratings
    ADD CONSTRAINT teacher_ratings_rated_by_user_id_fkey FOREIGN KEY (rated_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: teacher_ratings teacher_ratings_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_ratings
    ADD CONSTRAINT teacher_ratings_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: terms terms_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: users users_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict B9dp0JxSrfhjdJmtWxvpGeMSSKNLn3maQ49elSQ42g5Ubrlo5A4TACaKN7YAuMV

