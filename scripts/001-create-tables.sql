-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create freight_requests table
CREATE TABLE IF NOT EXISTS freight_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  phone_number VARCHAR(15) NOT NULL,
  source_address TEXT NOT NULL,
  source_lat DECIMAL(10, 8) NOT NULL,
  source_lng DECIMAL(11, 8) NOT NULL,
  destination_address TEXT NOT NULL,
  destination_lat DECIMAL(10, 8) NOT NULL,
  destination_lng DECIMAL(11, 8) NOT NULL,
  distance_km DECIMAL(8, 2) NOT NULL,
  weight_kg DECIMAL(8, 2) NOT NULL,
  calculated_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (username: admin, password: admin123)
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', '$2b$10$rQZ9QzKQqQZ9QzKQqQZ9QeJ9QzKQqQZ9QzKQqQZ9QzKQqQZ9QzKQ')
ON CONFLICT (username) DO NOTHING;
