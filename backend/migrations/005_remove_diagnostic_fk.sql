-- Remove foreign key constraint from diagnostic_results to allow chapter IDs (1-5)
-- that don't necessarily exist in topics table

-- Drop the FK constraint
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_diag_topic')
BEGIN
    ALTER TABLE diagnostic_results DROP CONSTRAINT FK_diag_topic;
    PRINT 'FK_diag_topic constraint dropped successfully';
END
ELSE
BEGIN
    PRINT 'FK_diag_topic constraint does not exist';
END
GO

-- Add a check constraint instead to ensure topic_id is 1-5 (chapter IDs)
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_diagnostic_chapter_id')
BEGIN
    ALTER TABLE diagnostic_results 
    ADD CONSTRAINT CK_diagnostic_chapter_id 
    CHECK (topic_id BETWEEN 1 AND 5);
    PRINT 'CK_diagnostic_chapter_id constraint added successfully';
END
ELSE
BEGIN
    PRINT 'CK_diagnostic_chapter_id constraint already exists';
END
GO

