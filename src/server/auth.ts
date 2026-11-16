import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'quatro-patas-dev-secret-change-in-prod';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'collaborator';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function signAuthToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('qp_token=')) {
        return decodeURIComponent(cookie.slice('qp_token='.length));
      }
    }
  }
  return null;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const dbUser = db
      .prepare('SELECT id, name, email, role, active FROM users WHERE id = ?')
      .get(decoded.id) as { id: number; name: string; email: string; role: 'admin' | 'collaborator'; active: number } | undefined;

    if (!dbUser || dbUser.active !== 1) {
      return res.status(401).json({ error: 'Sessão inválida ou usuário desativado.' });
    }
    req.user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }
}

export function requireRole(...roles: Array<'admin' | 'collaborator'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acesso negado. Esta ação exige nível de Administrador.',
      });
    }
    next();
  };
}

// Simple in-memory rate limiter + honeypot protection against form spam
const rateHits = new Map<string, { count: number; resetAt: number }>();

export function antiSpam(maxPerWindow = 12, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Honeypot check: bots fill hidden 'website' or 'hp_field'
    if (req.body && (req.body.website || req.body.hp_field)) {
      return res.status(400).json({ error: 'Submissão bloqueada pela proteção anti-spam.' });
    }

    // 2. IP Rate limit
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateHits.get(key);

    if (!record || record.resetAt < now) {
      rateHits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxPerWindow) {
      return res.status(429).json({
        error: 'Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.',
      });
    }

    record.count += 1;
    next();
  };
}
