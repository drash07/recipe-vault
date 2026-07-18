-- ============================================================
-- Recipe Vault — Database Migration
-- Run this in Supabase → SQL Editor (run once)
-- ============================================================

-- 1. PROFILES TABLE
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name   TEXT,
  dietary_type   TEXT DEFAULT 'vegetarian',   -- 'vegetarian' | 'flexible' | 'vegan'
  eggs_ok        BOOLEAN DEFAULT TRUE,
  sweet_pref     TEXT DEFAULT 'alternatives', -- 'alternatives' | 'any' | 'none'
  sweeteners     TEXT[] DEFAULT '{jaggery}',
  allergies      TEXT[] DEFAULT '{}',
  allergy_notes  TEXT,
  household_size INT DEFAULT 1,
  cook_days      TEXT[] DEFAULT '{mon,tue,wed,thu,fri}',
  meal_types     TEXT[] DEFAULT '{breakfast,dinner}',
  lunch_style    TEXT DEFAULT 'leftovers',    -- 'leftovers' | 'fresh' | 'batch'
  time_weeknight INT DEFAULT 30,
  nutrition_goals TEXT[] DEFAULT '{balanced}',
  plan_source    TEXT DEFAULT 'both',         -- 'mine' | 'vault' | 'both'
  cuisine_roots  TEXT DEFAULT 'Indian',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own profile"
  ON public.profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 2. ADD COLUMNS TO EXISTING TABLES
-- ---------------------------------------------------------
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS shared  BOOLEAN DEFAULT false;

ALTER TABLE public.meal_plan
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.groceries
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);


-- 3. UPDATE meal_plan UNIQUE CONSTRAINT
-- ---------------------------------------------------------
ALTER TABLE public.meal_plan
  DROP CONSTRAINT IF EXISTS meal_plan_day_index_meal_type_week_start_key;

ALTER TABLE public.meal_plan
  ADD CONSTRAINT meal_plan_user_day_meal_week_key
  UNIQUE (user_id, day_index, meal_type, week_start);


-- 4. ENABLE RLS
-- ---------------------------------------------------------
ALTER TABLE public.recipes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groceries ENABLE ROW LEVEL SECURITY;


-- 5. RECIPES POLICIES
-- Own recipes always visible; shared recipes visible to all logged-in users.
-- Only the creator can edit or delete their recipe.
-- ---------------------------------------------------------
CREATE POLICY "users see own and shared recipes" ON public.recipes
  FOR SELECT USING (auth.uid() = user_id OR shared = true);

CREATE POLICY "users can add recipes" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can edit own recipes" ON public.recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete own recipes" ON public.recipes
  FOR DELETE USING (auth.uid() = user_id);


-- 6. MEAL PLAN + GROCERY POLICIES (private per user)
-- ---------------------------------------------------------
CREATE POLICY "users manage own meal_plan" ON public.meal_plan
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users manage own groceries" ON public.groceries
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 7. ONE-TIME: CLAIM YOUR EXISTING RECIPES
-- ---------------------------------------------------------
-- After your first login, run these with your UUID from
-- Supabase → Authentication → Users.
-- Also mark your existing recipes as shared so they appear
-- in the vault for all users.
--
-- UPDATE public.recipes
--   SET user_id = 'your-uuid-here', shared = true
--   WHERE user_id IS NULL;
--
-- UPDATE public.meal_plan
--   SET user_id = 'your-uuid-here'
--   WHERE user_id IS NULL;
--
-- UPDATE public.groceries
--   SET user_id = 'your-uuid-here'
--   WHERE user_id IS NULL;
