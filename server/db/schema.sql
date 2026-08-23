-- ============================================================
-- ЛОКО — Схема базы данных (PostgreSQL)
-- Запуск: psql $DATABASE_URL -f schema.sql
-- ============================================================

-- Организации (партнёры платформы)
CREATE TABLE IF NOT EXISTS organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  logo          VARCHAR(10)  DEFAULT '',          -- эмодзи/инициал
  logo_color    VARCHAR(7)   DEFAULT '#A855F7',   -- HEX-цвет
  address       VARCHAR(500) NOT NULL,
  zone          VARCHAR(100) NOT NULL,
  has_tablet    BOOLEAN      DEFAULT false,
  participates_in_offers BOOLEAN DEFAULT false,
  phone         VARCHAR(30)  DEFAULT '',
  email         VARCHAR(255) DEFAULT '',
  created_at    TIMESTAMPTZ  DEFAULT now()
);

-- Расширение organizations: новые поля
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS description   VARCHAR(500) DEFAULT '',
  ADD COLUMN IF NOT EXISTS working_hours VARCHAR(200) DEFAULT '',
  ADD COLUMN IF NOT EXISTS category      VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS services      TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_url      VARCHAR(500) DEFAULT '',
  ADD COLUMN IF NOT EXISTS status        VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active','suspended'));

-- Пользователи системы (админ, партнёры, планшеты)
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  role             VARCHAR(20) NOT NULL
                   CHECK (role IN ('admin','partner','tablet')),
  name             VARCHAR(255) NOT NULL DEFAULT '',
  organization_id  UUID REFERENCES organizations(id) ON DELETE SET NULL,
  is_active        BOOLEAN DEFAULT true,
  must_change_pwd  BOOLEAN DEFAULT false,
  telegram_chat_id VARCHAR(50) DEFAULT '',
  telegram_username VARCHAR(100) DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Точки партнёров
CREATE TABLE IF NOT EXISTS points (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  address           VARCHAR(500) NOT NULL,
  phone             VARCHAR(30) DEFAULT '',
  contact_name      VARCHAR(255) DEFAULT '',
  email             VARCHAR(255) DEFAULT '',
  working_hours     VARCHAR(100) DEFAULT '09:00-21:00',
  is_active         BOOLEAN DEFAULT true,
  has_tablet        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_points_org ON points(organization_id);

-- Акции (предложения от организаций)
CREATE TABLE IF NOT EXISTS offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(255) NOT NULL,
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  description     TEXT         DEFAULT '',
  emoji           VARCHAR(10)  DEFAULT '🎁',
  bg_gradient     VARCHAR(255) DEFAULT 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
  starts_at       TIMESTAMPTZ  NOT NULL,
  ends_at         TIMESTAMPTZ  NOT NULL,
  weight          INTEGER      DEFAULT 10,        -- приоритет/шанс выпадения
  zone            VARCHAR(100) DEFAULT '',
  allowed_org_ids UUID[]       DEFAULT '{}',      -- какие организации могут показывать
  status          VARCHAR(20)  DEFAULT 'active'   -- active | scheduled | expired | paused
                CHECK (status IN ('active','scheduled','expired','paused')),
  total_issued    INTEGER      DEFAULT 0,
  total_redeemed  INTEGER      DEFAULT 0,
  created_at      TIMESTAMPTZ  DEFAULT now()
);

-- Расширение offers: время суток
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS time_from  TIME,
  ADD COLUMN IF NOT EXISTS time_to    TIME;

-- Связь точка ↔ акция с лимитом
CREATE TABLE IF NOT EXISTS point_offers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id     UUID NOT NULL REFERENCES points(id) ON DELETE CASCADE,
  offer_id     UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  max_count    INTEGER,                    -- NULL = без лимита
  issued_count INTEGER DEFAULT 0,          -- сколько уже выдано
  is_active    BOOLEAN DEFAULT true,       -- админ может остановить
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(point_id, offer_id)
);
CREATE INDEX IF NOT EXISTS idx_point_offers_point ON point_offers(point_id);

-- Участники (физические лица, игроки)
CREATE TABLE IF NOT EXISTS participants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(255) NOT NULL,
  phone                 VARCHAR(30)  NOT NULL UNIQUE,
  total_participations  INTEGER      DEFAULT 0,
  total_wins            INTEGER      DEFAULT 0,
  pdn_consent           BOOLEAN      DEFAULT false,
  marketing_consent     BOOLEAN      DEFAULT false,
  pdn_consent_at        TIMESTAMPTZ,
  source                VARCHAR(255) DEFAULT '',   -- откуда пришёл
  created_at            TIMESTAMPTZ  DEFAULT now()
);

-- Планшеты (устройства в точках)
CREATE TABLE IF NOT EXISTS tablets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(50)  NOT NULL,           -- например «Т-042»
  serial          VARCHAR(50)  NOT NULL UNIQUE,
  organization_id UUID         REFERENCES organizations(id) ON DELETE SET NULL,
  point           VARCHAR(100) DEFAULT '',         -- «Касса 1», «Холл 2 этаж»
  zone            VARCHAR(100) DEFAULT '',
  status          VARCHAR(10)  DEFAULT 'offline'
                  CHECK (status IN ('online','offline','issue')),
  last_seen       TIMESTAMPTZ,
  app_version     VARCHAR(20)  DEFAULT '1.0.0',
  created_at      TIMESTAMPTZ  DEFAULT now()
);

-- Расширение tablets: привязка к точке + логин/пароль
ALTER TABLE tablets
  ADD COLUMN IF NOT EXISTS point_id      UUID REFERENCES points(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS login         VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Купоны
CREATE TABLE IF NOT EXISTS coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(30)  NOT NULL UNIQUE,
  user_id         UUID         REFERENCES participants(id) ON DELETE SET NULL,
  offer_id        UUID         NOT NULL REFERENCES offers(id)      ON DELETE CASCADE,
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  address         VARCHAR(500) DEFAULT '',
  source_tablet_id UUID        REFERENCES tablets(id) ON DELETE SET NULL,
  source_point    VARCHAR(100) DEFAULT '',
  source_zone     VARCHAR(100) DEFAULT '',
  status          VARCHAR(20)  DEFAULT 'issued'
                  CHECK (status IN ('issued','redeemed','expired','cancelled')),
  issued_at       TIMESTAMPTZ  DEFAULT now(),
  expires_at      TIMESTAMPTZ  NOT NULL,
  redeemed_at     TIMESTAMPTZ,
  redeemed_by     VARCHAR(255)
);

-- Расширение coupons: привязка к точке
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS source_point_id UUID REFERENCES points(id) ON DELETE SET NULL;

-- Лиды (связь купона с контактом)
CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id       UUID    NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  client_name     VARCHAR(255) NOT NULL,
  client_phone    VARCHAR(30)  NOT NULL,
  offer_title     VARCHAR(255) NOT NULL,
  organization_id UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_tablet   VARCHAR(50)  DEFAULT '',
  source_point    VARCHAR(100) DEFAULT '',
  source_zone     VARCHAR(100) DEFAULT '',
  contacted       BOOLEAN      DEFAULT false,
  redeemed        BOOLEAN      DEFAULT false,
  created_at      TIMESTAMPTZ  DEFAULT now()
);

-- Расширение leads: привязка к точке
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS source_point_id UUID REFERENCES points(id) ON DELETE SET NULL;

-- Один розыгрыш на точку (защита от повторного участия)
CREATE TABLE IF NOT EXISTS spin_participations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        VARCHAR(30) NOT NULL,
  point_id     UUID NOT NULL REFERENCES points(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phone, point_id)
);
CREATE INDEX IF NOT EXISTS idx_spin_part_phone ON spin_participations(phone);
CREATE INDEX IF NOT EXISTS idx_spin_part_point ON spin_participations(point_id);

-- Инвайты для регистрации партнёров
CREATE TABLE IF NOT EXISTS invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       VARCHAR(64) NOT NULL UNIQUE,
  role        VARCHAR(20) NOT NULL DEFAULT 'partner'
              CHECK (role IN ('admin','partner')),
  email       VARCHAR(255),
  meta        JSONB DEFAULT '{}',
  created_by  UUID REFERENCES users(id),
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Заявки партнёров админу
CREATE TABLE IF NOT EXISTS tickets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subject           VARCHAR(255) NOT NULL,
  message           TEXT NOT NULL,
  status            VARCHAR(20) DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','resolved','closed')),
  created_by        UUID REFERENCES users(id),
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tickets_org ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- Сессии (для express-session + connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  sid     VARCHAR NOT NULL COLLATE "default",
  sess    JSON NOT NULL,
  expire  TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON "session" (expire);

-- Гео-зоны
CREATE TABLE IF NOT EXISTS geo_zones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city                VARCHAR(100) NOT NULL,
  name                VARCHAR(100) NOT NULL,
  sector              VARCHAR(10),
  organizations_count INTEGER DEFAULT 0,
  tablets_count       INTEGER DEFAULT 0,
  offers_count        INTEGER DEFAULT 0
);

-- Уведомления
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel     VARCHAR(10) NOT NULL CHECK (channel IN ('max','email')),
  event       VARCHAR(500) NOT NULL,
  recipient   VARCHAR(255) NOT NULL,
  status      VARCHAR(20) DEFAULT 'pending'
              CHECK (status IN ('delivered','pending','failed')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Экраны/мониторы
CREATE TABLE IF NOT EXISTS screens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  organization_id UUID         REFERENCES organizations(id) ON DELETE SET NULL,
  point           VARCHAR(100) DEFAULT '',
  content         VARCHAR(255) DEFAULT '',
  status          VARCHAR(10)  DEFAULT 'active'
                  CHECK (status IN ('active','paused','error')),
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  DEFAULT now()
);

-- ============================================================
-- Индексы для частых запросов
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_offers_status       ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_org          ON offers(organization_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status      ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_user        ON coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_offer       ON coupons(offer_id);
CREATE INDEX IF NOT EXISTS idx_coupons_org         ON coupons(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org           ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_participants_phone  ON participants(phone);
CREATE INDEX IF NOT EXISTS idx_tablets_org         ON tablets(organization_id);
