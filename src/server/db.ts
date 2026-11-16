import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'quatropatas.db');
export const db = new DatabaseSync(DB_PATH);

export function initDatabase() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'collaborator')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      sponsorship_active INTEGER NOT NULL DEFAULT 0,
      sponsorship_needs TEXT DEFAULT '',
      sponsorship_amount_cents INTEGER DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sponsorship_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      author_name TEXT NOT NULL,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      goal_cents INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Ativa', 'Concluída', 'Pausada')),
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      protocol TEXT NOT NULL UNIQUE,
      donor_name TEXT NOT NULL,
      donor_email TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
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
      lgpd_consent INTEGER NOT NULL DEFAULT 1,
      confirmed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS adoption_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dog_id INTEGER NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
      applicant_name TEXT NOT NULL,
      applicant_email TEXT NOT NULL,
      applicant_phone TEXT NOT NULL,
      city TEXT NOT NULL,
      housing_type TEXT NOT NULL,
      has_fence_or_screens INTEGER NOT NULL DEFAULT 0,
      other_pets TEXT DEFAULT '',
      has_children INTEGER NOT NULL DEFAULT 0,
      experience TEXT DEFAULT '',
      motivation TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em análise', 'Aprovado', 'Recusado')),
      lgpd_consent INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS volunteers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      city TEXT NOT NULL,
      modality TEXT NOT NULL CHECK (modality IN ('Presencial', 'Remoto', 'Ambos')),
      areas TEXT NOT NULL,
      availability TEXT NOT NULL,
      experience TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Ativo', 'Inativo')),
      lgpd_consent INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT NOT NULL,
      author_name TEXT NOT NULL,
      published_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS story_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      author_email TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adopter_name TEXT NOT NULL,
      dog_name TEXT NOT NULL,
      city TEXT NOT NULL,
      quote TEXT NOT NULL,
      adopted_year TEXT NOT NULL,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL CHECK (category IN ('Veterinário', 'Alimentação', 'Medicamentos', 'Resgates', 'Infraestrutura')),
      description TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      expense_date TEXT NOT NULL,
      receipt_url TEXT DEFAULT '',
      verified INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS financial_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      period TEXT NOT NULL,
      summary TEXT NOT NULL,
      document_url TEXT NOT NULL,
      published_at TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT DEFAULT '',
      lgpd_consent INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Novo' CHECK (status IN ('Novo', 'Respondido')),
      lgpd_consent INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // 1. Seed initial admin user only if users table is empty
  const userCountRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCountRow.count === 0) {
    const adminEmail = process.env.ADMIN_INITIAL_EMAIL || 'admin@quatropatas.org';
    const adminPass = process.env.ADMIN_INITIAL_PASSWORD || 'QuatroPatas@2026';
    const hash = bcrypt.hashSync(adminPass, 10);
    db.prepare(
      'INSERT INTO users (name, email, password_hash, role, active) VALUES (?, ?, ?, ?, 1)'
    ).run('Coordenação Quatro Patas', adminEmail, hash, 'admin');
  }

  // 2. Default site settings
  const defaultSettings: Record<string, string> = {
    whatsapp_number: '5511999999999',
    whatsapp_enabled: '1',
    whatsapp_message: 'Olá! Gostaria de saber mais sobre como ajudar a Quatro Patas.',
    instagram_url: 'https://instagram.com/quatropatas',
    facebook_url: 'https://facebook.com/quatropatas',
    youtube_url: 'https://youtube.com/@quatropatas',
    contact_email: 'contato@quatropatas.org',
    city_label: 'São Paulo, SP (Conteúdo demonstrativo)',
    about_mission:
      'Resgatar cães em situação de abandono ou maus-tratos, oferecer atendimento veterinário completo e conectá-los a famílias responsáveis com total transparência.',
    about_history:
      'Este espaço é destinado à história real da instituição. Utilize o painel administrativo para cadastrar o ano de fundação, marcos de resgate, endereço do abrigo e equipe responsável.',
    about_values:
      'Respeito à vida, adoção criteriosa, prestação de contas aberta à comunidade e educação sobre guarda responsável.',
    about_is_demo: '1',
  };

  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)'
  );
  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }

  // 3. Demonstrative dogs (clearly flagged is_demo = 1, zero fabricated real stats)
  const dogCountRow = db.prepare('SELECT COUNT(*) as count FROM dogs').get() as { count: number };
  if (dogCountRow.count === 0) {
    const insertDog = db.prepare(`
      INSERT INTO dogs (
        name, age_category, age_label, size, sex, personality,
        rescue_history, health_status, vaccination, location, status,
        image_url, sponsorship_active, sponsorship_needs, sponsorship_amount_cents, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const dog1 = insertDog.run(
      'Caramelo (Exemplo)',
      'Adulto',
      '3 anos',
      'Médio',
      'Macho',
      'Calmo, sociável com outros cães e muito carinhoso após ganhar confiança.',
      'Cadastro demonstrativo de resgate em via pública com triagem veterinária inicial e reabilitação nutricional.',
      'Saudável, castrado e vermifugado.',
      'V10 e Antirrábica em dia',
      'São Paulo, SP',
      'Disponível',
      '/src/assets/images/dog_caramelo_portrait_1794855381606.jpg',
      1,
      'Ração super premium, check-up semestral e prevenção contra parasitas.',
      5000
    );

    const dog2 = insertDog.run(
      'Amora (Exemplo)',
      'Adulto',
      '4 anos',
      'Médio',
      'Fêmea',
      'Tranquila, observadora e ideal para lares serenos com rotina acolhedora.',
      'Cadastro demonstrativo de resgate após abandono; recuperou peso e confiança em lar temporário.',
      'Em acompanhamento preventivo leve, castrada e microchipada.',
      'V10, Gripe e Antirrábica em dia',
      'Campinas, SP',
      'Disponível',
      '/src/assets/images/dog_black_tan_portrait_1794855382793.jpg',
      1,
      'Suplementação articular, banhos terapêuticos e ração balanceada.',
      7500
    );

    const dog3 = insertDog.run(
      'Pipoca (Exemplo)',
      'Filhote',
      '10 meses',
      'Pequeno',
      'Macho',
      'Curioso, brincalhão e cheio de energia para passeios diários.',
      'Cadastro demonstrativo de filhote acolhido com segurança para socialização e protocolo vacinal completo.',
      'Saudável, castrado e muito ativo.',
      'Protocolo completo de filhote em dia',
      'São Paulo, SP',
      'Disponível',
      '/src/assets/images/dog_white_spotted_portrait_1794855383478.jpg',
      0,
      '',
      0
    );

    const dog4 = insertDog.run(
      'Bento (Exemplo)',
      'Idoso',
      '8 anos',
      'Médio',
      'Macho',
      'Dócil, paciente e extremamente grato por qualquer gesto de carinho.',
      'Cadastro demonstrativo de cão em tratamento clínico contínuo aguardando recuperação para adoção.',
      'Em tratamento veterinário assistido.',
      'Vacinação atualizada conforme liberação clínica',
      'Guarulhos, SP',
      'Em tratamento',
      '/src/assets/images/campaign_shelter_care_1794855384779.jpg',
      1,
      'Medicação de suporte diária, exames laboratoriais e alimentação úmida especial.',
      10000
    );

    db.prepare(`
      INSERT INTO sponsorship_updates (dog_id, title, content, image_url, author_name, is_demo)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(
      Number(dog4.lastInsertRowid),
      'Atualização demonstrativa de acompanhamento veterinário',
      'Exemplo de diário de apadrinhamento: o cão respondeu bem aos exames da semana e segue recebendo alimentação fracionada e caminhadas curtas supervisionadas.',
      '/src/assets/images/campaign_shelter_care_1794855384779.jpg',
      'Equipe Veterinária (Exemplo)'
    );

    db.prepare(`
      INSERT INTO sponsorship_updates (dog_id, title, content, image_url, author_name, is_demo)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(
      Number(dog1.lastInsertRowid),
      'Rotina de socialização e passeios (Exemplo)',
      'Exemplo de atualização para padrinhos: passeios matinais ajudaram na confiança com coleira e convivência em grupo.',
      '/src/assets/images/dog_caramelo_portrait_1794855381606.jpg',
      'Voluntariado (Exemplo)'
    );
  }

  // 4. Demonstrative campaigns (0 raised by default — only real confirmed donations count)
  const campaignCountRow = db.prepare('SELECT COUNT(*) as count FROM campaigns').get() as { count: number };
  if (campaignCountRow.count === 0) {
    const insertCampaign = db.prepare(`
      INSERT INTO campaigns (title, category, summary, description, goal_cents, image_url, status, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertCampaign.run(
      'Fundo de Alimentação e Ração (Exemplo)',
      'Alimentação',
      'Campanha demonstrativa para manutenção mensal de ração adulta, filhote e dietas terapêuticas.',
      'Este é um modelo demonstrativo de campanha. Os valores arrecadados e o número de apoiadores exibidos aqui são calculados automaticamente a partir de doações reais confirmadas pelo gateway de pagamento ou validadas pela administração.',
      300000,
      '/src/assets/images/dog_caramelo_portrait_1794855381606.jpg',
      'Ativa'
    );

    insertCampaign.run(
      'Atendimento Veterinário e Medicamentos (Exemplo)',
      'Tratamento Veterinário',
      'Campanha demonstrativa para exames, cirurgias de emergência, vacinas e protocolos de medicação.',
      'Este é um modelo demonstrativo de campanha veterinária. Cada contribuição confirmada entra diretamente na prestação de contas e atualiza esta barra de progresso em tempo real.',
      500000,
      '/src/assets/images/campaign_shelter_care_1794855384779.jpg',
      'Ativa'
    );

    insertCampaign.run(
      'Estrutura e Ampliação do Abrigo (Exemplo)',
      'Construção de Abrigo',
      'Campanha demonstrativa para melhorias de canis, áreas cobertas e espaço de recuperação pós-operatória.',
      'Modelo demonstrativo para obras e infraestrutura do abrigo. Edite metas, textos e fotografias reais através do Painel Administrativo.',
      800000,
      '/src/assets/images/hero_rescued_dog_1794855382581.jpg',
      'Ativa'
    );
  }

  // 5. Demonstrative stories
  const storyCountRow = db.prepare('SELECT COUNT(*) as count FROM stories').get() as { count: number };
  if (storyCountRow.count === 0) {
    const insertStory = db.prepare(`
      INSERT INTO stories (title, category, excerpt, content, image_url, author_name, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    insertStory.run(
      'Do resgate silencioso à primeira manhã ao sol (História Demonstrativa)',
      'Resgate',
      'Um relato demonstrativo mostrando como a triagem médica, paciência e cuidado contínuo preparam um cão assustado para confiar novamente.',
      'Esta publicação é um conteúdo demonstrativo para ilustrar a estrutura do blog de histórias da plataforma Quatro Patas.\n\nNo trabalho real de proteção animal, cada resgate começa com acolhimento seguro, avaliação clínica completa, controle de dor e respeito ao tempo emocional do cão.\n\nCom o apoio de voluntários e doadores transparentes, o animal sai da vulnerabilidade e conquista o direito a um lar definitivo. Utilize o painel administrativo para publicar os relatos reais do seu abrigo.',
      '/src/assets/images/hero_rescued_dog_1794855382581.jpg',
      'Redação Quatro Patas (Exemplo)'
    );

    insertStory.run(
      'Por que a adaptação gradual transforma a adoção responsável (Demonstrativo)',
      'Adoção',
      'Orientações práticas e demonstrativas sobre os primeiros 30 dias de um cão adotado em seu novo lar.',
      'Conteúdo editorial demonstrativo.\n\nReceber um cão resgatado exige previsibilidade, passeios calmos e respeito ao ritmo de adaptação da família e do animal. Ao preencher nosso formulário de adoção, nossa equipe avalia o perfil do ambiente para garantir encontros duradouros e livres de devoluções.',
      '/src/assets/images/dog_black_tan_portrait_1794855382793.jpg',
      'Equipe de Adoção (Exemplo)'
    );
  }

  // 6. Demonstrative testimonials (clearly marked)
  const testCountRow = db.prepare('SELECT COUNT(*) as count FROM testimonials').get() as { count: number };
  if (testCountRow.count === 0) {
    const insertTest = db.prepare(`
      INSERT INTO testimonials (adopter_name, dog_name, city, quote, adopted_year, is_demo)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    insertTest.run(
      'Mariana S. (Depoimento Demonstrativo)',
      'Caramelo',
      'São Paulo, SP',
      'Exemplo de relato de adotante: todo o processo de entrevista e adaptação foi acompanhado de perto, trazendo segurança para toda a família.',
      '2025'
    );

    insertTest.run(
      'Rafael T. (Depoimento Demonstrativo)',
      'Amora',
      'Campinas, SP',
      'Exemplo de relato de adotante: a transparência sobre o histórico médico e comportamental fez toda a diferença na escolha consciente.',
      '2025'
    );
  }
}
