-- =============================================================================
-- QUATRO PATAS — Schema PostgreSQL / Supabase de Produção
-- Compatível com PostgreSQL 15+ e Supabase (incluindo políticas RLS sugeridas)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Usuários Administrativos e Colaboradores (RBAC)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'collaborator')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Catálogo de Cães Resgatados e Apadrinhamento
CREATE TABLE IF NOT EXISTS dogs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  age_category TEXT NOT NULL CHECK (age_category IN ('Filhote', 'Adulto', 'Idoso')),
  age_label TEXT NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('Pequeno', 'Médio', 'Grande')),
  sex TEXT NOT NULL CHECK (sex IN ('Macho', 'Fêmea')),
  personality TEXT NOT NULL,
  rescue_history TEXT NOT NULL,
  health_status TEXT NOT NULL,
  vaccination TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Disponível', 'Em processo', 'Em tratamento', 'Adotado')),
  image_url TEXT NOT NULL,
  sponsorship_active BOOLEAN NOT NULL DEFAULT FALSE,
  sponsorship_needs TEXT DEFAULT '',
  sponsorship_amount_cents INTEGER DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Atualizações de Apadrinhamento
CREATE TABLE IF NOT EXISTS sponsorship_updates (
  id SERIAL PRIMARY KEY,
  dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  author_name TEXT NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Campanhas de Arrecadação
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_cents INTEGER NOT NULL CHECK (goal_cents > 0),
  image_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Ativa', 'Concluída', 'Pausada')),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Doações (valores arrecadados vêm exclusivamente de status = 'confirmed')
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  protocol TEXT NOT NULL UNIQUE,
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('unica', 'mensal', 'recorrente')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'cartao')),
  message TEXT DEFAULT '',
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  dog_id INTEGER REFERENCES dogs(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('awaiting_gateway_config', 'pending', 'confirmed', 'cancelled', 'failed')),
  gateway_provider TEXT DEFAULT 'mercadopago',
  gateway_payment_id TEXT DEFAULT '',
  pix_qr_code TEXT DEFAULT '',
  pix_qr_base64 TEXT DEFAULT '',
  checkout_url TEXT DEFAULT '',
  receipt_note TEXT DEFAULT '',
  lgpd_consent BOOLEAN NOT NULL DEFAULT TRUE,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Solicitações de Adoção
CREATE TABLE IF NOT EXISTS adoption_inquiries (
  id SERIAL PRIMARY KEY,
  dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  city TEXT NOT NULL,
  housing_type TEXT NOT NULL,
  has_fence_or_screens BOOLEAN NOT NULL DEFAULT FALSE,
  other_pets TEXT DEFAULT '',
  has_children BOOLEAN NOT NULL DEFAULT FALSE,
  experience TEXT DEFAULT '',
  motivation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em análise', 'Aprovado', 'Recusado')),
  lgpd_consent BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Voluntariado
CREATE TABLE IF NOT EXISTS volunteers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('Presencial', 'Remoto', 'Ambos')),
  areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  availability TEXT NOT NULL,
  experience TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Ativo', 'Inativo')),
  lgpd_consent BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Histórias de Resgate e Adoção
CREATE TABLE IF NOT EXISTS stories (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT NOT NULL,
  author_name TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Comentários Moderados em Histórias
CREATE TABLE IF NOT EXISTS story_comments (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Depoimentos de Adotantes
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  adopter_name TEXT NOT NULL,
  dog_name TEXT NOT NULL,
  city TEXT NOT NULL,
  quote TEXT NOT NULL,
  adopted_year TEXT NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Despesas Verificadas (Transparência Financeira)
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('Veterinário', 'Alimentação', 'Medicamentos', 'Resgates', 'Infraestrutura')),
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  expense_date DATE NOT NULL,
  receipt_url TEXT DEFAULT '',
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Relatórios Financeiros Anexados
CREATE TABLE IF NOT EXISTS financial_reports (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  period TEXT NOT NULL,
  summary TEXT NOT NULL,
  document_url TEXT NOT NULL,
  published_at DATE NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Newsletter e Mensagens de Contato
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT '',
  lgpd_consent BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Novo' CHECK (status IN ('Novo', 'Respondido')),
  lgpd_consent BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Configurações Institucionais
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
