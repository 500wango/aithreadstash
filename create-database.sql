-- Create database if not exists
SELECT 'CREATE DATABASE aithreadstash'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aithreadstash')\gexec