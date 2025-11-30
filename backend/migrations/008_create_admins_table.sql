-- Migration: Create separate admins table
-- Date: 2025-11-26
-- Fixed version with explicit created_at

USE [ai_coaching]
GO

-- Drop table if exists (for clean re-run)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'admins')
BEGIN
    DROP TABLE admins;
    PRINT 'Dropped existing admins table';
END
GO

-- Create admins table
CREATE TABLE admins (
    id INT IDENTITY(1,1) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    last_login DATETIME2 NULL,
    CONSTRAINT PK_admins PRIMARY KEY CLUSTERED (id ASC)
);
GO

-- Create unique constraint on email
ALTER TABLE admins ADD CONSTRAINT UQ_admins_email UNIQUE (email);
GO

-- Create index on email for faster lookups
CREATE INDEX idx_admins_email ON admins(email);
GO

PRINT 'Admins table created successfully';
GO

-- Insert default admin (password: admin123)
INSERT INTO admins (email, password_hash, full_name, created_at)
VALUES (
    'admin@aicoach.com',
    '$2b$12$LQKfKZ8GJXjOE8iYw8vV6eqYQH9K5YF5QQtP4ZMm5XqrJ8YN5YmBi',
    'System Administrator',
    GETUTCDATE()
);
GO

PRINT 'Default admin created successfully';
GO

-- Verify
SELECT 
    id, 
    email, 
    full_name, 
    created_at,
    CASE WHEN last_login IS NULL THEN 'Never' ELSE CAST(last_login AS VARCHAR) END as last_login
FROM admins;
GO

PRINT '';
PRINT '================================================================';
PRINT 'Migration 008 completed successfully!';
PRINT '================================================================';
PRINT 'Admin login URL: http://localhost:3000/admin/login';
PRINT 'Email: admin@aicoach.com';
PRINT 'Password: admin123';
PRINT '================================================================';
GO

