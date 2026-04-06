-- OceanX CMS — Initial Schema Migration
-- Run: psql -U postgres -d oceanx_cms -f migrations/001_initial.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  role        VARCHAR(50)  NOT NULL DEFAULT 'admin',
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en     VARCHAR(500) NOT NULL,
  title_ar     VARCHAR(500),
  body_en      TEXT,
  body_ar      TEXT,
  author       VARCHAR(255),
  publish_date DATE,
  tags         TEXT[]       NOT NULL DEFAULT '{}',
  pdf_url      VARCHAR(1000),
  cover_image  VARCHAR(1000),
  status       VARCHAR(50)  NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ARTICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en    VARCHAR(500) NOT NULL,
  title_ar    VARCHAR(500),
  body_en     TEXT,
  body_ar     TEXT,
  author      VARCHAR(255),
  category    VARCHAR(255),
  cover_image VARCHAR(1000),
  status      VARCHAR(50)  NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  featured    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS pages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             VARCHAR(255) UNIQUE NOT NULL,
  title_en         VARCHAR(500) NOT NULL,
  title_ar         VARCHAR(500),
  sections         JSONB        NOT NULL DEFAULT '[]',
  meta_title       VARCHAR(255),
  meta_description TEXT,
  meta_keywords    VARCHAR(500),
  status           VARCHAR(50)  NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

-- ============================================================
-- MEDIA
-- ============================================================
CREATE TABLE IF NOT EXISTS media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      VARCHAR(500)  NOT NULL,
  original_name VARCHAR(500)  NOT NULL,
  url           VARCHAR(1000) NOT NULL,
  mime_type     VARCHAR(100),
  size          INTEGER,
  tags          TEXT[]        NOT NULL DEFAULT '{}',
  uploaded_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en        VARCHAR(500) NOT NULL,
  title_ar        VARCHAR(500),
  description_en  TEXT,
  description_ar  TEXT,
  icon_url        VARCHAR(1000),
  image_url       VARCHAR(1000),
  order_index     INTEGER      NOT NULL DEFAULT 0,
  active          BOOLEAN      NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS news (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline_en  VARCHAR(500) NOT NULL,
  headline_ar  VARCHAR(500),
  body_en      TEXT,
  body_ar      TEXT,
  source       VARCHAR(255),
  publish_date DATE,
  cover_image  VARCHAR(1000),
  status       VARCHAR(50)  NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_reports_status     ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_status    ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_featured  ON articles(featured);
CREATE INDEX IF NOT EXISTS idx_news_status        ON news(status);
CREATE INDEX IF NOT EXISTS idx_media_created_at   ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_order     ON services(order_index);
