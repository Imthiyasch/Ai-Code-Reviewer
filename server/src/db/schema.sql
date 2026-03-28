-- AI Code Review Tool — PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id      VARCHAR(255) UNIQUE NOT NULL,
  email          VARCHAR(255) UNIQUE NOT NULL,
  name           VARCHAR(255) NOT NULL,
  avatar_url     TEXT,
  role           VARCHAR(50)  DEFAULT 'user',
  created_at     TIMESTAMPTZ  DEFAULT now(),
  last_active_at TIMESTAMPTZ  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type   VARCHAR(50)  NOT NULL,           -- 'paste' | 'github'
  github_url    TEXT,
  language      VARCHAR(100),
  code_snippet  TEXT         NOT NULL,           -- first 500 chars
  full_code     TEXT         NOT NULL,
  quality_score INTEGER      CHECK (quality_score >= 1 AND quality_score <= 10),
  summary       TEXT,
  bugs          JSONB        DEFAULT '[]',
  improvements  JSONB        DEFAULT '[]',
  documentation JSONB        DEFAULT '[]',
  created_at    TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_user_created ON reviews(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_created      ON reviews(created_at DESC);
