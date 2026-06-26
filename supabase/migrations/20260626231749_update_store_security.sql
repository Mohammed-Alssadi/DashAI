-- 0. حذف السجلات القديمة التي تملك قيم فارغة لـ user_id لتفادي خطأ القيد
DELETE FROM linked_stores WHERE user_id IS NULL;

-- 1. تعديل الحقل ليكون إجبارياً
ALTER TABLE linked_stores ALTER COLUMN user_id SET NOT NULL;

-- 2. إزالة سياسات الحماية القديمة
DROP POLICY IF EXISTS "user_owns_store" ON linked_stores;
DROP POLICY IF EXISTS "user_owns_store_tokens" ON store_tokens;

-- 3. إنشاء السياسات الأمنية الجديدة والصارمة
CREATE POLICY "user_owns_store" ON linked_stores
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_owns_store_tokens" ON store_tokens
  FOR ALL USING (
    store_id IN (
      SELECT id FROM linked_stores
      WHERE user_id = auth.uid()
    )
  );
