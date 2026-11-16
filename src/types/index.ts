export interface Dog {
  id: number;
  name: string;
  age_category: 'Filhote' | 'Adulto' | 'Idoso';
  age_label: string;
  size: 'Pequeno' | 'Médio' | 'Grande';
  sex: 'Macho' | 'Fêmea';
  personality: string;
  rescue_history: string;
  health_status: string;
  vaccination: string;
  location: string;
  status: 'Disponível' | 'Em processo' | 'Em tratamento' | 'Adotado';
  image_url: string;
  sponsorship_active: number;
  sponsorship_needs: string;
  sponsorship_amount_cents: number;
  is_demo: number;
  created_at: string;
  updates?: SponsorshipUpdate[];
}

export interface SponsorshipUpdate {
  id: number;
  dog_id: number;
  dog_name?: string;
  dog_image?: string;
  title: string;
  content: string;
  image_url: string;
  author_name: string;
  is_demo: number;
  created_at: string;
}

export interface Campaign {
  id: number;
  title: string;
  category: string;
  summary: string;
  description: string;
  goal_cents: number;
  raised_cents: number;
  supporters_count: number;
  image_url: string;
  status: 'Ativa' | 'Concluída' | 'Pausada';
  is_demo: number;
  created_at: string;
  recentDonations?: Array<{
    id: number;
    donor_name: string;
    amount_cents: number;
    message: string;
    confirmed_at: string;
  }>;
}

export interface Story {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image_url: string;
  author_name: string;
  published_at: string;
  is_demo: number;
  comments_count?: number;
  comments?: StoryComment[];
}

export interface StoryComment {
  id: number;
  story_id: number;
  story_title?: string;
  author_name: string;
  author_email?: string;
  content: string;
  status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Testimonial {
  id: number;
  adopter_name: string;
  dog_name: string;
  city: string;
  quote: string;
  adopted_year: string;
  is_demo: number;
}

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount_cents: number;
  expense_date: string;
  receipt_url: string;
  verified: number;
}

export interface FinancialReport {
  id: number;
  title: string;
  period: string;
  summary: string;
  document_url: string;
  published_at: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'collaborator';
}

export type SiteSettings = Record<string, string>;
