-- ============================================================
-- SoftBricksAI — Full PostgreSQL Schema
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ADMIN USERS
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'admin',
  avatar        TEXT,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SITE SETTINGS (single row)
CREATE TABLE IF NOT EXISTS site_settings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name           VARCHAR(255) NOT NULL DEFAULT 'SoftBricksAI',
  tagline             TEXT,
  logo_url            TEXT,
  favicon_url         TEXT,
  contact_email       VARCHAR(255),
  support_email       VARCHAR(255),
  phone               VARCHAR(100),
  address_us          TEXT,
  address_cm          TEXT,
  smtp_host           VARCHAR(255),
  smtp_port           INT DEFAULT 587,
  smtp_user           VARCHAR(255),
  smtp_password       TEXT,
  timezone            VARCHAR(100) DEFAULT 'UTC',
  language            VARCHAR(10)  DEFAULT 'en',
  primary_color       VARCHAR(20)  DEFAULT '#3b82f6',
  accent_color        VARCHAR(20)  DEFAULT '#60a5fa',
  theme               VARCHAR(20)  DEFAULT 'dark',
  maintenance_mode    BOOLEAN DEFAULT FALSE,
  show_hiring_banner  BOOLEAN DEFAULT TRUE,
  google_analytics_id VARCHAR(100),
  google_search_console TEXT,
  bing_webmaster      TEXT,
  default_seo_title   TEXT,
  default_seo_desc    TEXT,
  seo_keywords        TEXT,
  social_links        JSONB DEFAULT '{}',
  notification_prefs  JSONB DEFAULT '{"newMessage":true,"newEnrollment":true,"adExpiry":true,"weeklyReport":false,"systemAlerts":true}',
  security_settings   JSONB DEFAULT '{"twoFactorAuth":false,"sessionTimeout":"24h","maxLoginAttempts":5}',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PAGES
CREATE TABLE IF NOT EXISTS pages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'live' CHECK (status IN ('live','draft')),
  seo_title       TEXT,
  seo_description TEXT,
  hero_title      TEXT,
  hero_subtitle   TEXT,
  hero_image      TEXT,
  sections        JSONB DEFAULT '[]',
  last_edited     TIMESTAMPTZ DEFAULT NOW(),
  edited_by       UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- 4. BLOG POSTS
CREATE TABLE IF NOT EXISTS blog_posts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          VARCHAR(500) NOT NULL,
  title_fr       VARCHAR(500),
  slug           VARCHAR(500) UNIQUE NOT NULL,
  excerpt        TEXT,
  content        TEXT,
  featured_image TEXT,
  author         VARCHAR(255),
  category       VARCHAR(100),
  tags           JSONB DEFAULT '[]',
  status         VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','scheduled','archived')),
  views          INT DEFAULT 0,
  published_at   TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  created_by     UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TEAM MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(255),
  department    VARCHAR(100),
  bio           TEXT,
  avatar        TEXT,
  email         VARCHAR(255),
  linkedin      TEXT,
  twitter       TEXT,
  location      VARCHAR(255),
  joined        VARCHAR(50),
  status        VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active','Remote','On Leave')),
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- 6. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(500) NOT NULL,
  slug         VARCHAR(500) UNIQUE NOT NULL,
  description  TEXT,
  content      TEXT,
  thumbnail    TEXT,
  gallery      JSONB DEFAULT '[]',
  category     VARCHAR(100),
  technologies JSONB DEFAULT '[]',
  client       VARCHAR(255),
  result       VARCHAR(255),
  industry     VARCHAR(100),
  live_url     TEXT,
  github_url   TEXT,
  featured     BOOLEAN DEFAULT FALSE,
  status       VARCHAR(50) DEFAULT 'In Progress' CHECK (status IN ('Live','In Progress','Completed','On Hold')),
  start_date   VARCHAR(50),
  end_date     VARCHAR(50),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- 7. COURSES
CREATE TABLE IF NOT EXISTS courses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(500) NOT NULL,
  title_fr    VARCHAR(500),
  description TEXT,
  thumbnail   TEXT,
  category    VARCHAR(100),
  level       VARCHAR(50) CHECK (level IN ('beginner','intermediate','advanced','beginner to advanced')),
  duration    VARCHAR(100),
  price       DECIMAL(10,2) DEFAULT 0,
  status      VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  enrolled    INT DEFAULT 0,
  rating      DECIMAL(3,2) DEFAULT 0,
  instructor  VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- 8. MODULES
CREATE TABLE IF NOT EXISTS modules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       VARCHAR(500) NOT NULL,
  order_index INT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. LESSONS
CREATE TABLE IF NOT EXISTS lessons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id   UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title       VARCHAR(500) NOT NULL,
  type        VARCHAR(20) DEFAULT 'video' CHECK (type IN ('video','article','quiz')),
  duration    VARCHAR(50),
  content     TEXT,
  video_url   TEXT,
  order_index INT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ADS
CREATE TABLE IF NOT EXISTS ads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(500) NOT NULL,
  type        VARCHAR(50) DEFAULT 'Banner' CHECK (type IN ('Banner','Display','Text','Sponsored')),
  placement   VARCHAR(100),
  status      VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Active','Paused','Scheduled','Expired')),
  client      VARCHAR(255),
  image_url   TEXT,
  link_url    TEXT,
  headline    VARCHAR(500),
  description TEXT,
  start_date  VARCHAR(50),
  end_date    VARCHAR(50),
  impressions INT DEFAULT 0,
  clicks      INT DEFAULT 0,
  budget      DECIMAL(10,2) DEFAULT 0,
  spent       DECIMAL(10,2) DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- 11. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type             VARCHAR(20) DEFAULT 'contact' CHECK (type IN ('contact','job','internship','client')),
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) NOT NULL,
  phone            VARCHAR(100),
  location         VARCHAR(255),
  subject          VARCHAR(500),
  message          TEXT,
  status           VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread','read','replied','archived')),
  priority         VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  is_starred       BOOLEAN DEFAULT FALSE,
  company          VARCHAR(255),
  company_size     VARCHAR(100),
  budget           VARCHAR(100),
  timeline         VARCHAR(100),
  project_type     VARCHAR(100),
  position         VARCHAR(255),
  resume_url       TEXT,
  portfolio_url    TEXT,
  linkedin         TEXT,
  github           TEXT,
  experience       VARCHAR(100),
  education        TEXT,
  skills           JSONB DEFAULT '[]',
  available_from   VARCHAR(50),
  expected_salary  VARCHAR(100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. VISITORS
CREATE TABLE IF NOT EXISTS visitors (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address   VARCHAR(50),
  country      VARCHAR(100),
  city         VARCHAR(100),
  device       VARCHAR(50),
  browser      VARCHAR(100),
  os           VARCHAR(100),
  is_returning BOOLEAN DEFAULT FALSE,
  visited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. PAGE VIEWS
CREATE TABLE IF NOT EXISTS page_views (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id   UUID REFERENCES visitors(id) ON DELETE SET NULL,
  page_path    VARCHAR(500) NOT NULL,
  time_on_page INT DEFAULT 0,
  bounced      BOOLEAN DEFAULT FALSE,
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. DAILY STATS
CREATE TABLE IF NOT EXISTS daily_stats (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_date            DATE UNIQUE NOT NULL,
  visitors             INT DEFAULT 0,
  page_views           INT DEFAULT 0,
  sessions             INT DEFAULT 0,
  bounce_rate          DECIMAL(5,2) DEFAULT 0,
  avg_session_duration DECIMAL(8,2) DEFAULT 0,
  new_users            INT DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. SERVICES
CREATE TABLE IF NOT EXISTS services (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          VARCHAR(500) NOT NULL,
  title_fr       VARCHAR(500),
  slug           VARCHAR(500) UNIQUE NOT NULL,
  description    TEXT,
  description_fr TEXT,
  details        TEXT,
  details_fr     TEXT,
  icon           VARCHAR(100),
  image          TEXT,
  tech_stack     JSONB DEFAULT '[]',
  featured       BOOLEAN DEFAULT FALSE,
  display_order  INT DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_by     UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- 16. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_name    VARCHAR(255) NOT NULL,
  author_company VARCHAR(255),
  author_role    VARCHAR(255),
  avatar         TEXT,
  rating         INT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  content        TEXT NOT NULL,
  service        VARCHAR(255),
  featured       BOOLEAN DEFAULT FALSE,
  status         VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. CRM CONTACTS
CREATE TABLE IF NOT EXISTS crm_contacts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255),
  phone          VARCHAR(100),
  company        VARCHAR(255),
  position       VARCHAR(255),
  status         VARCHAR(50) DEFAULT 'lead' CHECK (status IN ('lead','prospect','client','churned')),
  source         VARCHAR(100),
  deal_value     DECIMAL(12,2) DEFAULT 0,
  pipeline_stage VARCHAR(100) DEFAULT 'new',
  notes          JSONB DEFAULT '[]',
  tags           JSONB DEFAULT '[]',
  assigned_to    UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  last_contact   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. BILLING
CREATE TABLE IF NOT EXISTS billing (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name      VARCHAR(255) NOT NULL,
  client_email     VARCHAR(255),
  service          VARCHAR(255),
  amount           DECIMAL(12,2) NOT NULL,
  currency         VARCHAR(10) DEFAULT 'USD',
  status           VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  invoice_number   VARCHAR(100) UNIQUE,
  payment_method   VARCHAR(100),
  notes            TEXT,
  due_date         TIMESTAMPTZ,
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject         VARCHAR(500) NOT NULL,
  description     TEXT,
  status          VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority        VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  category        VARCHAR(100),
  requester_name  VARCHAR(255),
  requester_email VARCHAR(255),
  assigned_to     UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. BACKUPS
CREATE TABLE IF NOT EXISTS backups (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(255) NOT NULL,
  type         VARCHAR(50) DEFAULT 'full' CHECK (type IN ('full','partial','database','files')),
  status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  size         VARCHAR(50),
  storage_path TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- 21. ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id   UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action     VARCHAR(255) NOT NULL,
  entity     VARCHAR(100),
  entity_id  UUID,
  details    JSONB DEFAULT '{}',
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Click Events Table
CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
  element_id VARCHAR(255),
  element_type VARCHAR(100),
  element_text TEXT,
  page_path VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_click_events_visitor ON click_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_click_events_page ON click_events(page_path);
CREATE INDEX IF NOT EXISTS idx_click_events_created ON click_events(created_at);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_blog_posts_status    ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug      ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_messages_status      ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_type        ON messages(type);
CREATE INDEX IF NOT EXISTS idx_ads_status           ON ads(status);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date     ON daily_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_page_views_path      ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status  ON crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_billing_status       ON billing(status);
CREATE INDEX IF NOT EXISTS idx_support_status       ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_activity_admin       ON activity_log(admin_id);