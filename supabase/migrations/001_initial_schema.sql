-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE field_type AS ENUM (
  'text',
  'textarea',
  'select',
  'image',
  'color',
  'url',
  'email',
  'phone'
);

CREATE TYPE customization_status AS ENUM ('draft', 'published');

CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create template_fields table
CREATE TABLE template_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_type field_type NOT NULL DEFAULT 'text',
  label TEXT NOT NULL,
  placeholder TEXT,
  default_value TEXT,
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, field_key)
);

-- Create customizations table
CREATE TABLE customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status customization_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  published_url TEXT
);

-- Create field_values table
CREATE TABLE field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customization_id UUID NOT NULL REFERENCES customizations(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES template_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customization_id, field_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_template_fields_template_id ON template_fields(template_id);
CREATE INDEX idx_template_fields_display_order ON template_fields(template_id, display_order);
CREATE INDEX idx_customizations_user_id ON customizations(user_id);
CREATE INDEX idx_customizations_template_id ON customizations(template_id);
CREATE INDEX idx_customizations_status ON customizations(status);
CREATE INDEX idx_field_values_customization_id ON field_values(customization_id);
CREATE INDEX idx_field_values_field_id ON field_values(field_id);
CREATE INDEX idx_templates_is_active ON templates(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_fields_updated_at
  BEFORE UPDATE ON template_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customizations_updated_at
  BEFORE UPDATE ON customizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_values_updated_at
  BEFORE UPDATE ON field_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_values ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Templates policies (all authenticated users can view active templates)
CREATE POLICY "Anyone can view active templates"
  ON templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all templates"
  ON templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert templates"
  ON templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update templates"
  ON templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete templates"
  ON templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Template fields policies
CREATE POLICY "Anyone can view fields of active templates"
  ON template_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM templates WHERE id = template_id AND is_active = true
    )
  );

CREATE POLICY "Admins can view all template fields"
  ON template_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert template fields"
  ON template_fields FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update template fields"
  ON template_fields FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete template fields"
  ON template_fields FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customizations policies
CREATE POLICY "Users can view own customizations"
  ON customizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customizations"
  ON customizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customizations"
  ON customizations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customizations"
  ON customizations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all customizations"
  ON customizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Field values policies
CREATE POLICY "Users can view own field values"
  ON field_values FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customizations WHERE id = customization_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own field values"
  ON field_values FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customizations WHERE id = customization_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own field values"
  ON field_values FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customizations WHERE id = customization_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own field values"
  ON field_values FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM customizations WHERE id = customization_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all field values"
  ON field_values FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
