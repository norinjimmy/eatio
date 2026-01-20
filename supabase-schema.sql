-- Eatio Database Schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Recipes table
CREATE TABLE recipes (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions TEXT NOT NULL DEFAULT '',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meals table
CREATE TABLE meals (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  recipe_id BIGINT REFERENCES recipes(id) ON DELETE SET NULL,
  week_start TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grocery Items table
CREATE TABLE grocery_items (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  category TEXT DEFAULT 'other',
  is_bought BOOLEAN NOT NULL DEFAULT false,
  is_custom BOOLEAN NOT NULL DEFAULT true,
  source_meal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Settings table
CREATE TABLE user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  work_days JSONB NOT NULL DEFAULT '[]',
  work_shift TEXT NOT NULL DEFAULT 'day',
  breakfast_days JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meal Plan Shares table
CREATE TABLE meal_plan_shares (
  id BIGSERIAL PRIMARY KEY,
  owner_id TEXT NOT NULL,
  owner_name TEXT,
  invited_email TEXT NOT NULL,
  invited_user_id TEXT,
  permission TEXT NOT NULL DEFAULT 'view',
  status TEXT NOT NULL DEFAULT 'pending',
  share_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Week History table
CREATE TABLE week_history (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  week_start TEXT NOT NULL,
  meals JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_is_favorite ON recipes(is_favorite);
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_week_start ON meals(week_start);
CREATE INDEX idx_grocery_items_user_id ON grocery_items(user_id);
CREATE INDEX idx_grocery_items_is_bought ON grocery_items(is_bought);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_meal_plan_shares_owner_id ON meal_plan_shares(owner_id);
CREATE INDEX idx_meal_plan_shares_invited_email ON meal_plan_shares(invited_email);
CREATE INDEX idx_meal_plan_shares_status ON meal_plan_shares(status);
CREATE INDEX idx_week_history_user_id ON week_history(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes
CREATE POLICY "Users can view their own recipes"
  ON recipes FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON recipes FOR DELETE
  USING (auth.uid()::text = user_id);

-- RLS Policies for meals
CREATE POLICY "Users can view their own meals"
  ON meals FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view shared meals"
  ON meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_shares
      WHERE meal_plan_shares.owner_id = meals.user_id
      AND meal_plan_shares.invited_user_id = auth.uid()::text
      AND meal_plan_shares.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert their own meals"
  ON meals FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own meals"
  ON meals FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Shared users can update meals"
  ON meals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_shares
      WHERE meal_plan_shares.owner_id = meals.user_id
      AND meal_plan_shares.invited_user_id = auth.uid()::text
      AND meal_plan_shares.status = 'accepted'
      AND meal_plan_shares.permission IN ('edit', 'admin')
    )
  );

CREATE POLICY "Users can delete their own meals"
  ON meals FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Shared users can delete meals"
  ON meals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_shares
      WHERE meal_plan_shares.owner_id = meals.user_id
      AND meal_plan_shares.invited_user_id = auth.uid()::text
      AND meal_plan_shares.status = 'accepted'
      AND meal_plan_shares.permission IN ('edit', 'admin')
    )
  );

-- RLS Policies for grocery_items
CREATE POLICY "Users can view their own grocery items"
  ON grocery_items FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view shared grocery items"
  ON grocery_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_shares
      WHERE meal_plan_shares.owner_id = grocery_items.user_id
      AND meal_plan_shares.invited_user_id = auth.uid()::text
      AND meal_plan_shares.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert their own grocery items"
  ON grocery_items FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own grocery items"
  ON grocery_items FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Shared users can update grocery items"
  ON grocery_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_shares
      WHERE meal_plan_shares.owner_id = grocery_items.user_id
      AND meal_plan_shares.invited_user_id = auth.uid()::text
      AND meal_plan_shares.status = 'accepted'
      AND meal_plan_shares.permission IN ('edit', 'admin')
    )
  );

CREATE POLICY "Users can delete their own grocery items"
  ON grocery_items FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Shared users can delete grocery items"
  ON grocery_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_shares
      WHERE meal_plan_shares.owner_id = grocery_items.user_id
      AND meal_plan_shares.invited_user_id = auth.uid()::text
      AND meal_plan_shares.status = 'accepted'
      AND meal_plan_shares.permission IN ('edit', 'admin')
    )
  );

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid()::text = user_id);

-- RLS Policies for meal_plan_shares
CREATE POLICY "Users can view shares they own"
  ON meal_plan_shares FOR SELECT
  USING (auth.uid()::text = owner_id);

CREATE POLICY "Users can view shares they are invited to"
  ON meal_plan_shares FOR SELECT
  USING (auth.uid()::text = invited_user_id);

CREATE POLICY "Users can view pending invitations by email"
  ON meal_plan_shares FOR SELECT
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "Users can create shares"
  ON meal_plan_shares FOR INSERT
  WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "Users can update shares they own"
  ON meal_plan_shares FOR UPDATE
  USING (auth.uid()::text = owner_id);

CREATE POLICY "Invited users can accept shares"
  ON meal_plan_shares FOR UPDATE
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR auth.uid()::text = invited_user_id
  );

CREATE POLICY "Users can delete shares they own"
  ON meal_plan_shares FOR DELETE
  USING (auth.uid()::text = owner_id);

-- RLS Policies for week_history
CREATE POLICY "Users can view their own history"
  ON week_history FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own history"
  ON week_history FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grocery_items_updated_at BEFORE UPDATE ON grocery_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
