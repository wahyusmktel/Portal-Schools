-- Migration 026: Add role 'redaksi' to users table
ALTER TABLE users MODIFY role ENUM('superadmin', 'admin', 'contributor', 'admin-spmb', 'redaksi') NOT NULL DEFAULT 'contributor';
