import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { Campaign, Dog } from '../types';
import { formatBRL } from '../lib/format';

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000];

export function DonatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialCampaign = searchParams.get('campanha') || '';
  const initialDog = searchParams.get('cao') || '';
  const initialAmount = Number(searchParams.get('valor') || 0);

  const [amountCents, setAmountCents] = useState<number>(initialAmount >= 500 ? initialAmount : 5000);
  const [customAmount, setCustomAmount] = useState<string>(
    initialAmount >= 500 && !PRESET_AMOUNTS.includes(initialAmount)
      ? String(initialAmount / 100)
      : ''
  );
  const [isCustom, setIsCustom] = useState(
    initialAmount >= 500 && !PRESET_AMOUNTS.includes(initialAmount)
  );
  const [frequency, setFrequency] = useState<'unica' | 'mensal' | 'recorrente'>(
    initialDog ? 'mensal' : 'unica'
  );
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao'>('pix');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [campaignId, setCampaignId] = useState(initialCampaign);
  const [dogId, setDogId] = useState(initialDog);
  const [lgpdConsent, setLgpdConsent] = useState(false);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [gatewayConfigured, setGatewayConfigured] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Doações – Quatro Patas';
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setGatewayConfigured(Boolean(d.gatewayConfigured)))
      .catch(() => {});
    fetch('/api/campaigns')
      .then((r) => r.json())
      .then((d) => setCampaigns(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch('/api/dogs?sponsorship=1')
      .then((r) => r.json())
      .then((d) => setDogs(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const handleSelectPreset = (cents: number) => {
    setIsCustom(false);
    setCustomAmount('');
    setAmountCents(cents);
  };

  const handleCustomChange = (val: string) => {
    setIsCustom(true);
    setCustomAmount(val);
    const num = Number(val.replace(',', '.'));
    if (Number.isFinite(num)) {
      setAmountCents(Math.round(num * 100));
    } else {
      setAmountCents(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (amountCents < 500) {
      setError('O valor mínimo da doação é R$ 5,00.');
      return;
    }
    if (!lgpdConsent) {
      setError('Confirme o aceite da Política de Privacidade (LGPD).');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch('/api/donations/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name: donorName,
          donor_email: donorEmail,
          amount_cents: amountCents,
          frequency,
          payment_method: paymentMethod,
          message,
          campaign_id: campaignId ? Number(campaignId) : null,
          dog_id: dogId ? Number(dogId) : null,
          lgpd_consent: lgpdConsent,
          hp_field: form.get('hp_field') || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao iniciar doação.');
      navigate(`/doar/confirmacao?protocol=${encodeURIComponent(data.protocol)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível registrar a doação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="max-w-2xl mb-10">
        <p className="text-xs font-semibold text-[#C2410C] uppercase tracking-wider mb-2">
          Apoio Financeiro Transparente
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1B18] [text-wrap:balance] mb-3">
          Faça uma doação para a Quatro Patas
        </h1>
        <p className="text-base text-[#524942] leading-relaxed">
          Cada contribuição ajuda a manter alimentação, cuidados veterinários e resgates com
          prestação de contas pública.
        </p>
      </div>

      {gatewayConfigured === false && (
        <div className="mb-8 rounded-2xl border border-[#F59E0B]/40 bg-[#FEF3C7]/60 p-4 flex items-start gap-3 text-sm text-[#78350F]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">Gateway de pagamento aguardando credenciais</p>
            <p className="text-xs mt-1 leading-relaxed">
              Este ambiente ainda não possui o token do Mercado Pago configurado (<code className="font-mono">MERCADOPAGO_ACCESS_TOKEN</code>).
              Você pode registrar a intenção de doação e visualizar o fluxo completo, mas nenhum pagamento real será cobrado nem simulado até a configuração das chaves.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 bg-white rounded-3xl border border-[#E7DFD3] p-6 sm:p-8 space-y-7"
        >
          <input type="text" name="hp_field" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          {/* Modalidade */}
          <div>
            <label className="block text-sm font-semibold text-[#1F1B18] mb-3">
              1. Escolha a modalidade
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#F3EDE3]">
              {[
                { id: 'unica', label: 'Doação única' },
                { id: 'mensal', label: 'Doação mensal' },
                { id: 'recorrente', label: 'Recorrente' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFrequency(m.id as 'unica' | 'mensal' | 'recorrente')}
                  className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                    frequency === m.id
                      ? 'bg-white text-[#1F1B18] shadow-sm'
                      : 'text-[#524942] hover:text-[#1F1B18]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Valores */}
          <div>
            <label className="block text-sm font-semibold text-[#1F1B18] mb-3">
              2. Escolha o valor da contribuição
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {PRESET_AMOUNTS.map((cents) => {
                const selected = !isCustom && amountCents === cents;
                return (
                  <button
                    key={cents}
                    type="button"
                    onClick={() => handleSelectPreset(cents)}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold tabular-nums transition-colors ${
                      selected
                        ? 'border-[#EA580C] bg-[#EA580C] text-white'
                        : 'border-[#D6CBB9] bg-[#FBF8F3] text-[#1F1B18] hover:border-[#EA580C]'
                    }`}
                  >
                    {formatBRL(cents)}
                  </button>
                );
              })}
            </div>
            <div>
              <label className="block text-xs text-[#786D65] mb-1">Outro valor (R$)</label>
              <input
                type="number"
                min="5"
                step="1"
                value={customAmount}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder="Ex: 75"
                className="w-full px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm tabular-nums focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          {/* Destinação opcional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#524942] mb-1.5">
                Vincular a uma campanha (opcional)
              </label>
              <select
                value={campaignId}
                onChange={(e) => {
                  setCampaignId(e.target.value);
                  if (e.target.value) setDogId('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
              >
                <option value="">Fundo geral da Quatro Patas</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#524942] mb-1.5">
                Apadrinhar cão específico (opcional)
              </label>
              <select
                value={dogId}
                onChange={(e) => {
                  setDogId(e.target.value);
                  if (e.target.value) setCampaignId('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
              >
                <option value="">Nenhum cão específico</option>
                {dogs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({formatBRL(d.sponsorship_amount_cents || 5000)}/mês sugerido)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dados do doador */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#1F1B18]">3. Seus dados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#524942] mb-1">Nome completo *</label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#524942] mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#524942] mb-1">
                Mensagem opcional de apoio
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Deixe uma palavra de incentivo para nossa equipe e os cães..."
                className="w-full px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          {/* Forma de pagamento */}
          <div>
            <label className="block text-sm font-semibold text-[#1F1B18] mb-3">
              4. Forma de pagamento
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-4 rounded-2xl border text-left transition-colors ${
                  paymentMethod === 'pix'
                    ? 'border-[#EA580C] bg-[#EA580C]/5'
                    : 'border-[#D6CBB9] bg-[#FBF8F3]'
                }`}
              >
                <p className="text-sm font-bold text-[#1F1B18]">PIX</p>
                <p className="text-xs text-[#524942] mt-0.5">
                  QR Code e código copia-e-cola via gateway seguro
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cartao')}
                className={`p-4 rounded-2xl border text-left transition-colors ${
                  paymentMethod === 'cartao'
                    ? 'border-[#EA580C] bg-[#EA580C]/5'
                    : 'border-[#D6CBB9] bg-[#FBF8F3]'
                }`}
              >
                <p className="text-sm font-bold text-[#1F1B18]">Cartão de Crédito</p>
                <p className="text-xs text-[#524942] mt-0.5">
                  Ambiente externo criptografado Mercado Pago (Checkout Pro)
                </p>
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-xs text-[#524942] cursor-pointer">
            <input
              type="checkbox"
              checked={lgpdConsent}
              onChange={(e) => setLgpdConsent(e.target.checked)}
              className="mt-0.5 accent-[#EA580C]"
            />
            <span>
              Concordo com o tratamento dos meus dados exclusivamente para registro da doação e
              emissão de recibo, conforme a{' '}
              <Link to="/privacidade" className="underline text-[#C2410C]">
                Política de Privacidade (LGPD)
              </Link>
              .
            </span>
          </label>

          {error && <p className="text-sm text-[#DC2626] font-medium">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {submitting
              ? 'Processando solicitação...'
              : `Continuar com doação de ${formatBRL(amountCents)}`}
          </button>
        </form>

        {/* Summary Sidebar */}
        <aside className="lg:col-span-4 bg-white rounded-3xl border border-[#E7DFD3] p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#15803D]">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            <span>Transparência e Segurança</span>
          </div>
          <div className="border-t border-[#F0EAE0] pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#786D65]">Valor selecionado</span>
              <span className="font-bold text-[#1F1B18] tabular-nums">{formatBRL(amountCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#786D65]">Modalidade</span>
              <span className="font-medium capitalize text-[#1F1B18]">{frequency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#786D65]">Pagamento</span>
              <span className="font-medium uppercase text-[#1F1B18]">{paymentMethod}</span>
            </div>
          </div>
          <div className="border-t border-[#F0EAE0] pt-4 text-xs text-[#524942] space-y-2 leading-relaxed">
            <p className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-[#786D65] shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Nunca armazenamos números de cartão de crédito em nossos servidores.
              </span>
            </p>
            <p>
              Somente pagamentos confirmados por webhook oficial do gateway ou conferidos pela
              administração compõem os relatórios públicos de{' '}
              <Link to="/transparencia" className="underline text-[#C2410C]">
                Transparência Financeira
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
