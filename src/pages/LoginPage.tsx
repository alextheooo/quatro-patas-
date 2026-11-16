import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useApp } from '../context/AuthContext';

export function LoginPage() {
  const { user, authLoading, login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Acesso Administrativo – Quatro Patas';
  }, []);

  if (!authLoading && user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciais inválidas.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-[#E7DFD3] p-8 space-y-6">
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#EA580C]/10 text-[#C2410C] flex items-center justify-center">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F1B18]">Acesso da Equipe</h1>
          <p className="text-sm text-[#524942]">
            Entre com sua conta de Administrador ou Colaborador para gerenciar cães, campanhas e
            solicitações.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#524942] mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@quatropatas.org"
              className="w-full px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#524942] mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          {error && <p className="text-sm text-[#DC2626] font-medium">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {submitting ? 'Validando...' : 'Entrar no painel'}
          </button>
        </form>

        <div className="border-t border-[#F0EAE0] pt-4 text-xs text-[#786D65] space-y-1">
          <p className="font-semibold text-[#524942]">Primeiro acesso inicial:</p>
          <p>
            E-mail: <code className="font-mono">admin@quatropatas.org</code> · Senha padrão:{' '}
            <code className="font-mono">QuatroPatas@2026</code>
          </p>
          <p>Altere ou crie novos usuários em Equipe após acessar.</p>
        </div>
      </div>
    </div>
  );
}
