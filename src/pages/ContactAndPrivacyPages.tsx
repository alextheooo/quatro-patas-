import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AuthContext';

export function ContactPage() {
  const { settings } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    document.title = 'Contato – Quatro Patas';
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!lgpdConsent) {
      setStatusMsg({ type: 'err', text: 'Confirme o consentimento LGPD para enviar.' });
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          lgpd_consent: lgpdConsent,
          hp_field: form.get('hp_field') || '',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao enviar mensagem.');
      setStatusMsg({ type: 'ok', text: json.message });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setLgpdConsent(false);
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erro ao enviar.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="max-w-2xl mb-10">
        <p className="text-xs font-semibold text-[#C2410C] uppercase tracking-wider mb-2">
          Fale Conosco
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1B18] mb-3">Contato</h1>
        <p className="text-base text-[#524942]">
          Dúvidas sobre adoção, doações, parcerias ou imprensa? Envie sua mensagem para nossa
          equipe.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white rounded-3xl border border-[#E7DFD3] p-6 sm:p-8 space-y-4"
        >
          <input type="text" name="hp_field" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome *"
              className="px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail *"
              className="px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
            />
          </div>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Assunto *"
            className="w-full px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
          />
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Sua mensagem *"
            className="w-full px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
          />

          <label className="flex items-start gap-2.5 text-xs text-[#524942] cursor-pointer">
            <input
              type="checkbox"
              checked={lgpdConsent}
              onChange={(e) => setLgpdConsent(e.target.checked)}
              className="mt-0.5 accent-[#EA580C]"
            />
            <span>
              Concordo com o tratamento dos meus dados para retorno deste contato conforme a{' '}
              <Link to="/privacidade" className="underline text-[#C2410C]">
                Política de Privacidade (LGPD)
              </Link>
              .
            </span>
          </label>

          {statusMsg && (
            <p
              className={`text-sm flex items-center gap-1.5 ${
                statusMsg.type === 'ok' ? 'text-[#15803D]' : 'text-[#DC2626]'
              }`}
            >
              {statusMsg.type === 'ok' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-7 py-3.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {submitting ? 'Enviando...' : 'Enviar mensagem'}
          </button>
        </form>

        <aside className="lg:col-span-5 bg-white rounded-3xl border border-[#E7DFD3] p-6 sm:p-8 space-y-5 text-sm">
          <div>
            <h2 className="font-bold text-[#1F1B18] mb-1">E-mail institucional</h2>
            <p className="text-[#524942]">{settings.contact_email || 'contato@quatropatas.org'}</p>
          </div>
          <div className="border-t border-[#F0EAE0] pt-4">
            <h2 className="font-bold text-[#1F1B18] mb-1">Localidade</h2>
            <p className="text-[#524942]">{settings.city_label || 'São Paulo, SP'}</p>
          </div>
          <div className="border-t border-[#F0EAE0] pt-4">
            <h2 className="font-bold text-[#1F1B18] mb-2">Redes sociais</h2>
            <ul className="space-y-2 text-[#C2410C] font-medium">
              {settings.instagram_url && (
                <li>
                  <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="hover:underline">
                    Instagram
                  </a>
                </li>
              )}
              {settings.facebook_url && (
                <li>
                  <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="hover:underline">
                    Facebook
                  </a>
                </li>
              )}
              {settings.youtube_url && (
                <li>
                  <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="hover:underline">
                    YouTube
                  </a>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacidade e LGPD – Quatro Patas';
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1B18]">
        Política de Privacidade e Adequação à LGPD
      </h1>
      <p className="text-sm text-[#786D65]">Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</p>

      <div className="bg-white rounded-3xl border border-[#E7DFD3] p-7 sm:p-9 space-y-5 text-sm text-[#524942] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#1F1B18]">1. Finalidade da coleta de dados</h2>
          <p>
            Coletamos exclusivamente os dados necessários para processar doações, avaliar
            solicitações de adoção responsável, organizar voluntários, responder mensagens e
            enviar atualizações solicitadas via newsletter.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#1F1B18]">2. Segurança financeira</h2>
          <p>
            A Quatro Patas nunca solicita nem armazena números de cartão de crédito ou códigos de
            segurança em seu banco de dados. Toda transação financeira ocorre exclusivamente via
            ambiente criptografado do gateway de pagamento autorizado.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#1F1B18]">3. Transparência com anonimização</h2>
          <p>
            Nos relatórios públicos de prestação de contas, exibimos apenas o primeiro nome do
            apoiador, valor e data de confirmação, preservando e-mails e dados pessoais privados.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#1F1B18]">4. Direitos do titular</h2>
          <p>
            Você pode solicitar confirmação de tratamento, correção ou exclusão dos seus dados
            pessoais a qualquer momento através da nossa{' '}
            <Link to="/contato" className="underline text-[#C2410C] font-medium">
              página de contato
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
