import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase } from './src/server/db.ts';
import {
  AuthRequest,
  antiSpam,
  requireAuth,
  requireRole,
  signAuthToken,
} from './src/server/auth.ts';
import {
  createMercadoPagoCheckout,
  fetchMercadoPagoPaymentStatus,
  isMercadoPagoConfigured,
  verifyWebhookSignature,
} from './src/server/payments.ts';

initDatabase();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

// File uploads directory (for admin dog photos, campaign covers, financial receipts)
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato não permitido. Envie JPG, PNG, WEBP ou PDF.'));
    }
  },
});

function getSettingsMap(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM site_settings').all() as Array<{
    key: string;
    value: string;
  }>;
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

function getCampaignWithStats(whereClause = '', params: unknown[] = []) {
  return db
    .prepare(
      `
      SELECT
        c.*,
        COALESCE((SELECT SUM(d.amount_cents) FROM donations d WHERE d.campaign_id = c.id AND d.status = 'confirmed'), 0) AS raised_cents,
        COALESCE((SELECT COUNT(*) FROM donations d WHERE d.campaign_id = c.id AND d.status = 'confirmed'), 0) AS supporters_count
      FROM campaigns c
      ${whereClause}
      ORDER BY c.created_at DESC
    `
    )
    .all(...params);
}

// ============================================================================
// PUBLIC API ROUTES
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', gatewayConfigured: isMercadoPagoConfigured() });
});

app.get('/api/settings', (_req, res) => {
  res.json(getSettingsMap());
});

app.get('/api/overview', (_req, res) => {
  const dogsAvailable = db
    .prepare("SELECT COUNT(*) as c FROM dogs WHERE status = 'Disponível'")
    .get() as { c: number };
  const dogsAdopted = db
    .prepare("SELECT COUNT(*) as c FROM dogs WHERE status = 'Adotado'")
    .get() as { c: number };
  const dogsTreatment = db
    .prepare("SELECT COUNT(*) as c FROM dogs WHERE status = 'Em tratamento'")
    .get() as { c: number };
  const dogsTotal = db.prepare('SELECT COUNT(*) as c FROM dogs').get() as { c: number };
  const dogsDemoCount = db
    .prepare('SELECT COUNT(*) as c FROM dogs WHERE is_demo = 1')
    .get() as { c: number };

  const confirmedDonations = db
    .prepare(
      "SELECT COALESCE(SUM(amount_cents), 0) as total_cents, COUNT(*) as total_count FROM donations WHERE status = 'confirmed'"
    )
    .get() as { total_cents: number; total_count: number };

  const featuredDogs = db
    .prepare("SELECT * FROM dogs WHERE status != 'Adotado' ORDER BY created_at DESC LIMIT 4")
    .all();

  const campaigns = getCampaignWithStats("WHERE c.status = 'Ativa'").slice(0, 3);
  const stories = db.prepare('SELECT * FROM stories ORDER BY published_at DESC LIMIT 3').all();
  const testimonials = db.prepare('SELECT * FROM testimonials ORDER BY created_at DESC LIMIT 4').all();

  res.json({
    metrics: {
      totalDogs: dogsTotal.c,
      availableDogs: dogsAvailable.c,
      adoptedDogs: dogsAdopted.c,
      treatmentDogs: dogsTreatment.c,
      confirmedDonationsCents: confirmedDonations.total_cents,
      confirmedDonationsCount: confirmedDonations.total_count,
      hasDemoDogs: dogsDemoCount.c > 0,
    },
    featuredDogs,
    campaigns,
    stories,
    testimonials,
    settings: getSettingsMap(),
    gatewayConfigured: isMercadoPagoConfigured(),
  });
});

app.get('/api/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.json({ dogs: [], campaigns: [], stories: [] });
  }
  const like = `%${q}%`;
  const dogs = db
    .prepare(
      'SELECT id, name, age_label, size, location, status, image_url FROM dogs WHERE name LIKE ? OR personality LIKE ? OR location LIKE ? LIMIT 8'
    )
    .all(like, like, like);
  const campaigns = db
    .prepare(
      'SELECT id, title, category, summary, image_url, status FROM campaigns WHERE title LIKE ? OR summary LIKE ? OR category LIKE ? LIMIT 6'
    )
    .all(like, like, like);
  const stories = db
    .prepare(
      'SELECT id, title, category, excerpt, image_url, published_at FROM stories WHERE title LIKE ? OR excerpt LIKE ? LIMIT 6'
    )
    .all(like, like);
  res.json({ dogs, campaigns, stories });
});

// Dogs
app.get('/api/dogs', (req, res) => {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (req.query.age_category) {
    conditions.push('age_category = ?');
    params.push(String(req.query.age_category));
  }
  if (req.query.size) {
    conditions.push('size = ?');
    params.push(String(req.query.size));
  }
  if (req.query.sex) {
    conditions.push('sex = ?');
    params.push(String(req.query.sex));
  }
  if (req.query.location) {
    conditions.push('location LIKE ?');
    params.push(`%${String(req.query.location)}%`);
  }
  if (req.query.status) {
    conditions.push('status = ?');
    params.push(String(req.query.status));
  }
  if (req.query.sponsorship === '1') {
    conditions.push('sponsorship_active = 1');
  }
  if (req.query.q) {
    const like = `%${String(req.query.q)}%`;
    conditions.push('(name LIKE ? OR personality LIKE ? OR location LIKE ?)');
    params.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const dogs = db.prepare(`SELECT * FROM dogs ${where} ORDER BY created_at DESC`).all(...params);
  res.json(dogs);
});

app.get('/api/dogs/:id', (req, res) => {
  const id = Number(req.params.id);
  const dog = db.prepare('SELECT * FROM dogs WHERE id = ?').get(id);
  if (!dog) return res.status(404).json({ error: 'Cão não encontrado.' });

  const updates = db
    .prepare('SELECT * FROM sponsorship_updates WHERE dog_id = ? ORDER BY created_at DESC')
    .all(id);

  res.json({ ...dog, updates });
});

app.get('/api/sponsorships', (_req, res) => {
  const dogs = db
    .prepare('SELECT * FROM dogs WHERE sponsorship_active = 1 ORDER BY created_at DESC')
    .all();
  const updates = db
    .prepare(
      `
      SELECT su.*, d.name as dog_name, d.image_url as dog_image
      FROM sponsorship_updates su
      JOIN dogs d ON d.id = su.dog_id
      ORDER BY su.created_at DESC
      LIMIT 12
    `
    )
    .all();
  res.json({ dogs, updates });
});

// Campaigns
app.get('/api/campaigns', (_req, res) => {
  res.json(getCampaignWithStats());
});

app.get('/api/campaigns/:id', (req, res) => {
  const id = Number(req.params.id);
  const list = getCampaignWithStats('WHERE c.id = ?', [id]);
  if (!list.length) return res.status(404).json({ error: 'Campanha não encontrada.' });

  const recentDonations = db
    .prepare(
      `
      SELECT id, donor_name, amount_cents, message, confirmed_at, created_at
      FROM donations
      WHERE campaign_id = ? AND status = 'confirmed'
      ORDER BY confirmed_at DESC
      LIMIT 15
    `
    )
    .all(id)
    .map((d: Record<string, unknown>) => ({
      ...d,
      donor_name: String(d.donor_name || 'Apoiador').split(' ')[0], // Anonimização LGPD
    }));

  res.json({ ...list[0], recentDonations });
});

// Donations & Payment Gateway
app.post('/api/donations/checkout', antiSpam(10, 60_000), async (req, res) => {
  try {
    const {
      donor_name,
      donor_email,
      amount_cents,
      frequency,
      payment_method,
      message,
      campaign_id,
      dog_id,
      lgpd_consent,
    } = req.body;

    if (!donor_name || String(donor_name).trim().length < 2) {
      return res.status(400).json({ error: 'Informe seu nome completo.' });
    }
    if (!donor_email || !String(donor_email).includes('@')) {
      return res.status(400).json({ error: 'Informe um e-mail válido.' });
    }
    const parsedAmount = Number(amount_cents);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 500) {
      return res.status(400).json({ error: 'O valor mínimo para doação é R$ 5,00.' });
    }
    if (!['unica', 'mensal', 'recorrente'].includes(frequency)) {
      return res.status(400).json({ error: 'Modalidade de doação inválida.' });
    }
    if (!['pix', 'cartao'].includes(payment_method)) {
      return res.status(400).json({ error: 'Forma de pagamento inválida.' });
    }
    if (!lgpd_consent) {
      return res.status(400).json({ error: 'É necessário aceitar a política de privacidade (LGPD).' });
    }

    const protocol = `QP-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

    const description = campaign_id
      ? `Quatro Patas - Apoio à Campanha #${campaign_id}`
      : dog_id
      ? `Quatro Patas - Apadrinhamento Cão #${dog_id}`
      : 'Quatro Patas - Doação para Resgate e Cuidado Animal';

    const gatewayResult = await createMercadoPagoCheckout({
      protocol,
      amountCents: parsedAmount,
      donorName: String(donor_name).trim(),
      donorEmail: String(donor_email).trim(),
      paymentMethod: payment_method,
      frequency,
      description,
      appUrl,
    });

    db.prepare(
      `
      INSERT INTO donations (
        protocol, donor_name, donor_email, amount_cents, frequency,
        payment_method, message, campaign_id, dog_id, status,
        gateway_provider, gateway_payment_id, pix_qr_code, pix_qr_base64, checkout_url, lgpd_consent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mercadopago', ?, ?, ?, ?, 1)
    `
    ).run(
      protocol,
      String(donor_name).trim(),
      String(donor_email).trim(),
      parsedAmount,
      frequency,
      payment_method,
      String(message || '').trim().slice(0, 400),
      campaign_id ? Number(campaign_id) : null,
      dog_id ? Number(dog_id) : null,
      gatewayResult.status,
      gatewayResult.gatewayPaymentId || '',
      gatewayResult.pixQrCode || '',
      gatewayResult.pixQrBase64 || '',
      gatewayResult.checkoutUrl || ''
    );

    res.status(201).json({
      protocol,
      ...gatewayResult,
    });
  } catch (error) {
    console.error('Erro no checkout de doação:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao processar solicitação de doação.',
    });
  }
});

app.get('/api/donations/protocol/:protocol', (req, res) => {
  const row = db
    .prepare(
      `
      SELECT d.id, d.protocol, d.donor_name, d.amount_cents, d.frequency, d.payment_method,
             d.status, d.pix_qr_code, d.pix_qr_base64, d.checkout_url, d.created_at, d.confirmed_at,
             c.title as campaign_title, dg.name as dog_name
      FROM donations d
      LEFT JOIN campaigns c ON c.id = d.campaign_id
      LEFT JOIN dogs dg ON dg.id = d.dog_id
      WHERE d.protocol = ?
    `
    )
    .get(req.params.protocol);
  if (!row) return res.status(404).json({ error: 'Protocolo de doação não encontrado.' });
  res.json({ ...row, gatewayConfigured: isMercadoPagoConfigured() });
});

// Real Mercado Pago Webhook
app.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    const topic = req.body?.type || req.query.topic;
    const dataId = String(req.body?.data?.id || req.query.id || '');
    if (topic !== 'payment' || !dataId) {
      return res.status(200).json({ received: true });
    }

    const validSig = verifyWebhookSignature(
      req.header('x-signature'),
      req.header('x-request-id'),
      dataId
    );
    if (!validSig) {
      return res.status(401).json({ error: 'Assinatura de webhook inválida.' });
    }

    const mpPayment = await fetchMercadoPagoPaymentStatus(dataId);
    if (!mpPayment) {
      return res.status(200).json({ received: true });
    }

    if (mpPayment.status === 'approved' && mpPayment.externalReference) {
      db.prepare(
        `
        UPDATE donations
        SET status = 'confirmed', gateway_payment_id = ?, confirmed_at = datetime('now')
        WHERE protocol = ?
      `
      ).run(dataId, mpPayment.externalReference);
    } else if (['cancelled', 'rejected'].includes(mpPayment.status) && mpPayment.externalReference) {
      db.prepare("UPDATE donations SET status = 'failed' WHERE protocol = ?").run(
        mpPayment.externalReference
      );
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook Mercado Pago erro:', err);
    res.status(500).json({ error: 'Erro ao processar webhook.' });
  }
});

// Adoption Inquiries
app.post('/api/adoptions', antiSpam(8, 60_000), (req, res) => {
  const {
    dog_id,
    applicant_name,
    applicant_email,
    applicant_phone,
    city,
    housing_type,
    has_fence_or_screens,
    other_pets,
    has_children,
    experience,
    motivation,
    lgpd_consent,
  } = req.body;

  if (!dog_id || !applicant_name || !applicant_email || !applicant_phone || !city || !housing_type || !motivation) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }
  if (!lgpd_consent) {
    return res.status(400).json({ error: 'É necessário aceitar os termos de privacidade (LGPD).' });
  }
  const dog = db.prepare('SELECT id FROM dogs WHERE id = ?').get(Number(dog_id));
  if (!dog) return res.status(404).json({ error: 'Cão não encontrado.' });

  const result = db
    .prepare(
      `
      INSERT INTO adoption_inquiries (
        dog_id, applicant_name, applicant_email, applicant_phone, city,
        housing_type, has_fence_or_screens, other_pets, has_children,
        experience, motivation, lgpd_consent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `
    )
    .run(
      Number(dog_id),
      String(applicant_name).trim(),
      String(applicant_email).trim(),
      String(applicant_phone).trim(),
      String(city).trim(),
      String(housing_type).trim(),
      has_fence_or_screens ? 1 : 0,
      String(other_pets || '').trim(),
      has_children ? 1 : 0,
      String(experience || '').trim(),
      String(motivation).trim()
    );

  res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Solicitação de adoção registrada!' });
});

// Volunteers
app.post('/api/volunteers', antiSpam(8, 60_000), (req, res) => {
  const { name, email, phone, city, modality, areas, availability, experience, lgpd_consent } = req.body;
  if (!name || !email || !phone || !city || !modality || !Array.isArray(areas) || areas.length === 0 || !availability) {
    return res.status(400).json({ error: 'Preencha todos os campos e selecione pelo menos uma área.' });
  }
  if (!lgpd_consent) {
    return res.status(400).json({ error: 'É necessário concordar com a política de privacidade (LGPD).' });
  }

  const result = db
    .prepare(
      `
      INSERT INTO volunteers (name, email, phone, city, modality, areas, availability, experience, lgpd_consent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `
    )
    .run(
      String(name).trim(),
      String(email).trim(),
      String(phone).trim(),
      String(city).trim(),
      String(modality),
      JSON.stringify(areas),
      String(availability).trim(),
      String(experience || '').trim()
    );

  res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Cadastro de voluntariado recebido!' });
});

// Stories & Moderated Comments
app.get('/api/stories', (_req, res) => {
  const stories = db
    .prepare(
      `
      SELECT s.*,
        (SELECT COUNT(*) FROM story_comments sc WHERE sc.story_id = s.id AND sc.status = 'approved') as comments_count
      FROM stories s
      ORDER BY s.published_at DESC
    `
    )
    .all();
  res.json(stories);
});

app.get('/api/stories/:id', (req, res) => {
  const id = Number(req.params.id);
  const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(id);
  if (!story) return res.status(404).json({ error: 'História não encontrada.' });
  const comments = db
    .prepare(
      "SELECT id, author_name, content, created_at FROM story_comments WHERE story_id = ? AND status = 'approved' ORDER BY created_at DESC"
    )
    .all(id);
  res.json({ ...story, comments });
});

app.post('/api/stories/:id/comments', antiSpam(6, 60_000), (req, res) => {
  const id = Number(req.params.id);
  const { author_name, author_email, content } = req.body;
  if (!author_name || !author_email || !content || String(content).trim().length < 5) {
    return res.status(400).json({ error: 'Informe nome, e-mail e um comentário válido.' });
  }
  const story = db.prepare('SELECT id FROM stories WHERE id = ?').get(id);
  if (!story) return res.status(404).json({ error: 'História não encontrada.' });

  db.prepare(
    "INSERT INTO story_comments (story_id, author_name, author_email, content, status) VALUES (?, ?, ?, ?, 'pending')"
  ).run(id, String(author_name).trim(), String(author_email).trim(), String(content).trim());

  res.status(201).json({
    message: 'Comentário enviado! Ele será exibido após moderação da nossa equipe.',
  });
});

// Transparency (STRICTLY real verified records only)
app.get('/api/transparency', (_req, res) => {
  const donationsTotal = db
    .prepare(
      "SELECT COALESCE(SUM(amount_cents), 0) as total_cents, COUNT(*) as count FROM donations WHERE status = 'confirmed'"
    )
    .get() as { total_cents: number; count: number };

  const expenseSums = db
    .prepare(
      `
      SELECT category, COALESCE(SUM(amount_cents), 0) as total_cents
      FROM expenses
      WHERE verified = 1
      GROUP BY category
    `
    )
    .all() as Array<{ category: string; total_cents: number }>;

  const expenses = db
    .prepare('SELECT * FROM expenses WHERE verified = 1 ORDER BY expense_date DESC, created_at DESC')
    .all();

  const reports = db
    .prepare('SELECT * FROM financial_reports ORDER BY published_at DESC, created_at DESC')
    .all();

  const completedCampaigns = getCampaignWithStats("WHERE c.status = 'Concluída'");

  const confirmedDonations = db
    .prepare(
      `
      SELECT d.id, d.protocol, d.donor_name, d.amount_cents, d.payment_method, d.frequency, d.confirmed_at, c.title as campaign_title
      FROM donations d
      LEFT JOIN campaigns c ON c.id = d.campaign_id
      WHERE d.status = 'confirmed'
      ORDER BY d.confirmed_at DESC
      LIMIT 30
    `
    )
    .all()
    .map((d: Record<string, unknown>) => ({
      ...d,
      donor_name: String(d.donor_name || 'Apoiador').split(' ')[0],
    }));

  res.json({
    totalDonationsCents: donationsTotal.total_cents,
    totalDonationsCount: donationsTotal.count,
    expensesByCategory: expenseSums,
    expenses,
    reports,
    completedCampaigns,
    confirmedDonations,
  });
});

// Newsletter & Contact
app.post('/api/newsletter', antiSpam(6, 60_000), (req, res) => {
  const { email, name, lgpd_consent } = req.body;
  if (!email || !String(email).includes('@')) {
    return res.status(400).json({ error: 'Informe um e-mail válido.' });
  }
  if (!lgpd_consent) {
    return res.status(400).json({ error: 'Confirme o consentimento LGPD para receber atualizações.' });
  }
  db.prepare(
    'INSERT OR IGNORE INTO newsletter_subscribers (email, name, lgpd_consent) VALUES (?, ?, 1)'
  ).run(String(email).trim().toLowerCase(), String(name || '').trim());

  res.status(201).json({ message: 'Inscrição realizada com sucesso!' });
});

app.post('/api/contact', antiSpam(6, 60_000), (req, res) => {
  const { name, email, subject, message, lgpd_consent } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Preencha todos os campos da mensagem.' });
  }
  if (!lgpd_consent) {
    return res.status(400).json({ error: 'É necessário aceitar o tratamento de dados conforme a LGPD.' });
  }
  db.prepare(
    'INSERT INTO contact_messages (name, email, subject, message, lgpd_consent) VALUES (?, ?, ?, ?, 1)'
  ).run(String(name).trim(), String(email).trim(), String(subject).trim(), String(message).trim());

  res.status(201).json({ message: 'Mensagem enviada com sucesso! Responderemos em breve.' });
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

app.post('/api/auth/login', antiSpam(15, 60_000), (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  const user = db
    .prepare('SELECT id, name, email, password_hash, role, active FROM users WHERE email = ?')
    .get(String(email).trim().toLowerCase()) as
    | { id: number; name: string; email: string; password_hash: string; role: 'admin' | 'collaborator'; active: number }
    | undefined;

  if (!user || user.active !== 1 || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const authUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = signAuthToken(authUser);

  res.cookie('qp_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ user: authUser, token });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('qp_token');
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// ============================================================================
// PROTECTED ADMIN & COLLABORATOR ROUTES
// ============================================================================

app.post('/api/upload', requireAuth, upload.single('file'), (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

app.get('/api/admin/dashboard', requireAuth, (_req: AuthRequest, res) => {
  const dogs = db.prepare('SELECT * FROM dogs ORDER BY created_at DESC').all();
  const campaigns = getCampaignWithStats();
  const donations = db
    .prepare(
      `
      SELECT d.*, c.title as campaign_title, dg.name as dog_name
      FROM donations d
      LEFT JOIN campaigns c ON c.id = d.campaign_id
      LEFT JOIN dogs dg ON dg.id = d.dog_id
      ORDER BY d.created_at DESC
    `
    )
    .all();
  const inquiries = db
    .prepare(
      `
      SELECT ai.*, d.name as dog_name
      FROM adoption_inquiries ai
      JOIN dogs d ON d.id = ai.dog_id
      ORDER BY ai.created_at DESC
    `
    )
    .all();
  const volunteers = db.prepare('SELECT * FROM volunteers ORDER BY created_at DESC').all();
  const stories = db.prepare('SELECT * FROM stories ORDER BY published_at DESC').all();
  const comments = db
    .prepare(
      `
      SELECT sc.*, s.title as story_title
      FROM story_comments sc
      JOIN stories s ON s.id = sc.story_id
      ORDER BY sc.created_at DESC
    `
    )
    .all();
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY expense_date DESC').all();
  const reports = db.prepare('SELECT * FROM financial_reports ORDER BY published_at DESC').all();
  const contacts = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  const newsletter = db.prepare('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC').all();
  const users = db
    .prepare('SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC')
    .all();
  const settings = getSettingsMap();

  res.json({
    dogs,
    campaigns,
    donations,
    inquiries,
    volunteers,
    stories,
    comments,
    expenses,
    reports,
    contacts,
    newsletter,
    users,
    settings,
    gatewayConfigured: isMercadoPagoConfigured(),
  });
});

// Dogs CRUD (Admin & Collaborator can create/edit; only Admin can delete)
app.post('/api/dogs', requireAuth, (req: AuthRequest, res) => {
  const {
    name,
    age_category,
    age_label,
    size,
    sex,
    personality,
    rescue_history,
    health_status,
    vaccination,
    location,
    status,
    image_url,
    sponsorship_active,
    sponsorship_needs,
    sponsorship_amount_cents,
  } = req.body;

  if (!name || !age_category || !age_label || !size || !sex || !location || !status) {
    return res.status(400).json({ error: 'Campos obrigatórios do cão ausentes.' });
  }

  const result = db
    .prepare(
      `
      INSERT INTO dogs (
        name, age_category, age_label, size, sex, personality,
        rescue_history, health_status, vaccination, location, status,
        image_url, sponsorship_active, sponsorship_needs, sponsorship_amount_cents, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `
    )
    .run(
      String(name).trim(),
      age_category,
      String(age_label).trim(),
      size,
      sex,
      String(personality || '').trim(),
      String(rescue_history || '').trim(),
      String(health_status || '').trim(),
      String(vaccination || '').trim(),
      String(location).trim(),
      status,
      String(image_url || '/src/assets/images/dog_caramelo_portrait_1794855381606.jpg'),
      sponsorship_active ? 1 : 0,
      String(sponsorship_needs || '').trim(),
      Number(sponsorship_amount_cents || 0)
    );

  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

app.put('/api/dogs/:id', requireAuth, (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const {
    name,
    age_category,
    age_label,
    size,
    sex,
    personality,
    rescue_history,
    health_status,
    vaccination,
    location,
    status,
    image_url,
    sponsorship_active,
    sponsorship_needs,
    sponsorship_amount_cents,
  } = req.body;

  db.prepare(
    `
    UPDATE dogs SET
      name = ?, age_category = ?, age_label = ?, size = ?, sex = ?, personality = ?,
      rescue_history = ?, health_status = ?, vaccination = ?, location = ?, status = ?,
      image_url = ?, sponsorship_active = ?, sponsorship_needs = ?, sponsorship_amount_cents = ?,
      is_demo = 0, updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(
    String(name).trim(),
    age_category,
    String(age_label).trim(),
    size,
    sex,
    String(personality || '').trim(),
    String(rescue_history || '').trim(),
    String(health_status || '').trim(),
    String(vaccination || '').trim(),
    String(location).trim(),
    status,
    String(image_url),
    sponsorship_active ? 1 : 0,
    String(sponsorship_needs || '').trim(),
    Number(sponsorship_amount_cents || 0),
    id
  );
  res.json({ ok: true });
});

app.delete('/api/dogs/:id', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  db.prepare('DELETE FROM dogs WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

app.post('/api/dogs/:id/updates', requireAuth, (req: AuthRequest, res) => {
  const dogId = Number(req.params.id);
  const { title, content, image_url } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Informe título e conteúdo da atualização.' });
  }
  db.prepare(
    'INSERT INTO sponsorship_updates (dog_id, title, content, image_url, author_name, is_demo) VALUES (?, ?, ?, ?, ?, 0)'
  ).run(dogId, String(title).trim(), String(content).trim(), String(image_url || ''), req.user!.name);
  res.status(201).json({ ok: true });
});

// Campaigns CRUD
app.post('/api/campaigns', requireAuth, (req: AuthRequest, res) => {
  const { title, category, summary, description, goal_cents, image_url, status } = req.body;
  if (!title || !category || !goal_cents) {
    return res.status(400).json({ error: 'Informe título, categoria e meta financeira.' });
  }
  const result = db
    .prepare(
      `
      INSERT INTO campaigns (title, category, summary, description, goal_cents, image_url, status, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `
    )
    .run(
      String(title).trim(),
      String(category).trim(),
      String(summary || '').trim(),
      String(description || '').trim(),
      Number(goal_cents),
      String(image_url || '/src/assets/images/campaign_shelter_care_1794855384779.jpg'),
      status || 'Ativa'
    );
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

app.put('/api/campaigns/:id', requireAuth, (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { title, category, summary, description, goal_cents, image_url, status } = req.body;
  db.prepare(
    `
    UPDATE campaigns SET
      title = ?, category = ?, summary = ?, description = ?, goal_cents = ?,
      image_url = ?, status = ?, is_demo = 0, updated_at = datetime('now')
    WHERE id = ?
  `
  ).run(
    String(title).trim(),
    String(category).trim(),
    String(summary || '').trim(),
    String(description || '').trim(),
    Number(goal_cents),
    String(image_url),
    status,
    id
  );
  res.json({ ok: true });
});

app.delete('/api/campaigns/:id', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// Stories & Comments Moderation
app.post('/api/stories', requireAuth, (req: AuthRequest, res) => {
  const { title, category, excerpt, content, image_url } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Informe título e texto da história.' });
  const result = db
    .prepare(
      `
      INSERT INTO stories (title, category, excerpt, content, image_url, author_name, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `
    )
    .run(
      String(title).trim(),
      String(category || 'Resgate'),
      String(excerpt || String(content).slice(0, 180)).trim(),
      String(content).trim(),
      String(image_url || '/src/assets/images/hero_rescued_dog_1794855382581.jpg'),
      req.user!.name
    );
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

app.delete('/api/stories/:id', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  db.prepare('DELETE FROM stories WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

app.patch('/api/admin/comments/:id', requireAuth, (req: AuthRequest, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status de moderação inválido.' });
  }
  db.prepare('UPDATE story_comments SET status = ? WHERE id = ?').run(status, Number(req.params.id));
  res.json({ ok: true });
});

// Adoption Inquiries & Volunteers & Contacts Management
app.patch('/api/admin/adoptions/:id', requireAuth, (req: AuthRequest, res) => {
  const { status } = req.body;
  if (!['Pendente', 'Em análise', 'Aprovado', 'Recusado'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }
  db.prepare('UPDATE adoption_inquiries SET status = ? WHERE id = ?').run(status, Number(req.params.id));
  res.json({ ok: true });
});

app.patch('/api/admin/volunteers/:id', requireAuth, (req: AuthRequest, res) => {
  const { status } = req.body;
  if (!['Pendente', 'Ativo', 'Inativo'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }
  db.prepare('UPDATE volunteers SET status = ? WHERE id = ?').run(status, Number(req.params.id));
  res.json({ ok: true });
});

app.patch('/api/admin/contacts/:id', requireAuth, (req: AuthRequest, res) => {
  const { status } = req.body;
  if (!['Novo', 'Respondido'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }
  db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, Number(req.params.id));
  res.json({ ok: true });
});

// Financial Verification, Expenses, Reports (Admin Only)
app.patch('/api/admin/donations/:id/confirm', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  const { receipt_note } = req.body;
  db.prepare(
    `
    UPDATE donations
    SET status = 'confirmed', receipt_note = ?, confirmed_at = datetime('now')
    WHERE id = ?
  `
  ).run(String(receipt_note || 'Conferido pela administração').trim(), Number(req.params.id));
  res.json({ ok: true });
});

app.post('/api/admin/expenses', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  const { category, description, amount_cents, expense_date, receipt_url } = req.body;
  if (!category || !description || !amount_cents || !expense_date) {
    return res.status(400).json({ error: 'Preencha todos os dados da despesa.' });
  }
  const result = db
    .prepare(
      `
      INSERT INTO expenses (category, description, amount_cents, expense_date, receipt_url, verified, created_by)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `
    )
    .run(
      category,
      String(description).trim(),
      Number(amount_cents),
      String(expense_date),
      String(receipt_url || ''),
      req.user!.id
    );
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

app.delete('/api/admin/expenses/:id', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

app.post('/api/admin/reports', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  const { title, period, summary, document_url, published_at } = req.body;
  if (!title || !period || !document_url) {
    return res.status(400).json({ error: 'Informe título, período e arquivo/link do relatório.' });
  }
  const result = db
    .prepare(
      `
      INSERT INTO financial_reports (title, period, summary, document_url, published_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      String(title).trim(),
      String(period).trim(),
      String(summary || '').trim(),
      String(document_url).trim(),
      String(published_at || new Date().toISOString().slice(0, 10)),
      req.user!.id
    );
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

app.delete('/api/admin/reports/:id', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  db.prepare('DELETE FROM financial_reports WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// Team Users & RBAC (Admin Only)
app.post('/api/admin/users', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !['admin', 'collaborator'].includes(role)) {
    return res.status(400).json({ error: 'Informe nome, e-mail, senha e nível de acesso válido.' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (exists) {
    return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
  }
  const hash = bcrypt.hashSync(String(password), 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role, active) VALUES (?, ?, ?, ?, 1)')
    .run(String(name).trim(), normalizedEmail, hash, role);
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

app.patch('/api/admin/users/:id', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (id === req.user!.id) {
    return res.status(400).json({ error: 'Você não pode desativar sua própria conta.' });
  }
  const { active, role } = req.body;
  if (typeof active === 'boolean') {
    db.prepare('UPDATE users SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
  }
  if (role && ['admin', 'collaborator'].includes(role)) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  }
  res.json({ ok: true });
});

// Settings & Demo Data Cleanup (Admin Only)
app.put('/api/admin/settings', requireAuth, requireRole('admin'), (req: AuthRequest, res) => {
  const updates = req.body as Record<string, string>;
  const upsert = db.prepare(
    `
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `
  );
  for (const [key, value] of Object.entries(updates)) {
    upsert.run(key, String(value));
  }
  res.json({ ok: true, settings: getSettingsMap() });
});

app.post('/api/admin/clear-demo', requireAuth, requireRole('admin'), (_req: AuthRequest, res) => {
  db.exec(`
    DELETE FROM sponsorship_updates WHERE is_demo = 1;
    DELETE FROM dogs WHERE is_demo = 1;
    DELETE FROM campaigns WHERE is_demo = 1;
    DELETE FROM stories WHERE is_demo = 1;
    DELETE FROM testimonials WHERE is_demo = 1;
  `);
  db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES ('about_is_demo', '0')").run();
  res.json({ ok: true });
});

// ============================================================================
// VITE DEV MIDDLEWARE / PRODUCTION STATIC HOSTING
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quatro Patas servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
