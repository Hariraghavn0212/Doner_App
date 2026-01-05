-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  role TEXT CHECK (role IN ('donor', 'receiver')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food Posts Table
CREATE TABLE IF NOT EXISTS food_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  food_type TEXT CHECK (food_type IN ('Vegetarian', 'Non-Vegetarian')),
  food_items JSONB NOT NULL,
  quantity TEXT NOT NULL,
  cooked_time TIMESTAMP WITH TIME ZONE NOT NULL,
  expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Claimed', 'Expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resource Posts Table
CREATE TABLE IF NOT EXISTS resource_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('Clothes', 'Toys', 'Books', 'Others')),
  item_name TEXT NOT NULL,
  description TEXT,
  quantity TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  location TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Claimed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requests Table
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  food_post_id UUID REFERENCES food_posts(id) ON DELETE SET NULL,
  resource_post_id UUID REFERENCES resource_posts(id) ON DELETE SET NULL,
  selected_items JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_food_posts_donor ON food_posts(donor_id);
CREATE INDEX IF NOT EXISTS idx_resource_posts_donor ON resource_posts(donor_id);
CREATE INDEX IF NOT EXISTS idx_requests_receiver ON requests(receiver_id);
