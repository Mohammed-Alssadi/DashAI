-- ══════════════════════════════════════════════════════════════
-- ملف SQL لإعداد قاعدة بيانات DashAI في Supabase
-- انسخ هذا الكود كاملاً والصقه في: Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. جدول المتاجر المربوطة
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS linked_stores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform          VARCHAR(10) NOT NULL CHECK (platform IN ('salla', 'zid')),
  platform_store_id VARCHAR(100) NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (platform, platform_store_id)
);

-- ─────────────────────────────────────────
-- 2. جدول التوكنات
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID REFERENCES linked_stores(id) ON DELETE CASCADE NOT NULL UNIQUE,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  manager_token TEXT,              -- خاص بزد فقط
  expires_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────
-- 3. تفعيل حماية RLS
-- ─────────────────────────────────────────
ALTER TABLE linked_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_tokens  ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- 4. سياسات RLS
-- التاجر يرى ويدير متاجره الخاصة فقط
-- الدوال السحابية (Service Role) تتجاوز RLS تلقائياً
-- ─────────────────────────────────────────
CREATE POLICY "user_owns_store" ON linked_stores
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "user_owns_store_tokens" ON store_tokens
  FOR ALL USING (
    store_id IN (
      SELECT id FROM linked_stores
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- ─────────────────────────────────────────
-- 5. فهرس للبحث السريع
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_linked_stores_platform_store_id
  ON linked_stores (platform, platform_store_id);

CREATE INDEX IF NOT EXISTS idx_store_tokens_store_id
  ON store_tokens (store_id);
