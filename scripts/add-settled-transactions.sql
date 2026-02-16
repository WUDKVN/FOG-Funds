-- Create a settled transactions archive table
CREATE TABLE IF NOT EXISTS fm_settled_records (
  fm_settled_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fm_settled_person_name VARCHAR(255) NOT NULL,
  fm_settled_person_id UUID,
  fm_settled_total_amount NUMERIC NOT NULL,
  fm_settled_currency VARCHAR(10) DEFAULT 'FCFA',
  fm_settled_type VARCHAR(50) NOT NULL, -- 'they-owe-me' or 'i-owe-them'
  fm_settled_by_user_id UUID,
  fm_settled_by_user_name VARCHAR(255),
  fm_settled_transactions JSONB, -- store snapshot of all transactions at settle time
  fm_settled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fm_settled_notes TEXT
);
