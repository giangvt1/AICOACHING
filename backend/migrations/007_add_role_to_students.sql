-- Migration: Add role column to students table for admin/student differentiation
-- Created: 2025-11-20

-- Add role column with default value 'student'
ALTER TABLE students 
ADD COLUMN role VARCHAR(20) DEFAULT 'student' NOT NULL;

-- Add check constraint to ensure role is either 'student' or 'admin'
ALTER TABLE students 
ADD CONSTRAINT CK_student_role CHECK (role IN ('student', 'admin'));

-- Create index on role column for performance
CREATE INDEX idx_students_role ON students(role);

-- Update existing records to have role='student' (safety measure)
UPDATE students SET role = 'student' WHERE role IS NULL OR role = '';

-- Verification query (commented out for script execution)
-- SELECT id, email, role FROM students;

