import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const OPPORTUNITIES = [
  {
    title: '01. Passeios com cães',
    desc: 'Caminhadas supervisionadas para socialização, gasto de energia e bem-estar físico e emocional.',
    mode: 'Presencial',
  },
  {
    title: '02. Banhos e cuidados',
    desc: 'Apoio na higienização, escovação, limpeza de orelhas e manutenção dos espaços de descanso.',
    mode: 'Presencial',
  },
  {
    title: '03. Transporte de animais',
    desc: 'Deslocamento solidário para consultas veterinárias, exames e feiras de adoção.',
    mode: 'Presencial',
  },
  {
    title: '04. Divulgação de campanhas',
    desc: 'Fotografia, produção de textos e compartilhamento responsável nas redes sociais.',
    mode: 'Remoto',
  },
  {
    title: '05. Ajuda administrativa',
    desc: 'Organização de planilhas, conferência de documentos, triagem inicial de contatos e relatórios.',
    mode: 'Remoto',
  },
  {
    title: '06. Eventos de adoção',
    desc: 'Apoio na montagem, recepção de famílias interessadas e orientações sobre guarda responsável.',
    mode: 'Presencial',
  },
];

export function VolunteerPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [modality, setModality] = useState<'Presencial' | 'Remoto' | 'Ambos'>('Presencial');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [availability, setAvailability] = useState('');
  const [experience, setExperience] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    document.title = 'Voluntariado – Quatro Patas';
  }, []);

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (selectedAreas.length === 0) {
      setError('Selecione pelo menos uma área de interesse.');
      return;
    }
    if (!lgpdConsent) {
      setError('Aceite a Política de Privacidade (LGPD) para concluir a inscrição.');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          city,
          modality,
          areas: selectedAreas,
          availability,
          experience,
          lgpd_consent: lgpdConsent,
          hp_field: form.get('hp_field') || '',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Não foi possível concluir o cadastro.');
      setSuccessMsg(json.message);
      setName('');
      setEmail('');
      setPhone('');
      setCity('');
      setSelectedAreas([]);
      setAvailability('');
      setExperience('');
      setLgpdConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar inscrição.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold text-[#15803D] uppercase tracking-wider mb-2">
          Comunidade Ativa
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1B18] [text-wrap:balance] mb-3">
          Seja voluntário na Quatro Patas
        </h1>
        <p className="text-base text-[#524942] leading-relaxed">
          Você pode atuar presencialmente junto aos cães ou contribuir remotamente com divulgação e
          gestão administrativa.
        </p>
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {OPPORTUNITIES.map((op) => (
          <div key={op.title} className="bg-white rounded-2xl border border-[#E7DFD3] p-6">
            <p className="text-xs font-medium text-[#15803D] mb-1.5">{op.mode}</p>
            <h2 className="text-lg font-bold text-[#1F1B18] mb-2">{op.title}</h2>
            <p className="text-sm text-[#524942] leading-relaxed">{op.desc}</p>
          </div>
        ))}
      </div>

      {/* Registration Form */}
      <div className="max-w-3xl bg-white rounded-3xl border border-[#E7DFD3] p-6 sm:p-10">
        <h2 className="text-2xl font-bold text-[#1F1B18] mb-2">Formulário de inscrição</h2>
        <p className="text-sm text-[#524942] mb-6">
          Nossa coordenação entra em contato conforme a demanda e sua disponibilidade.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="text" name="hp_field" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo *"
              className="px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail *"
              className="px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="WhatsApp / Telefone *"
              className="px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
            />
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Cidade / UF *"
              className="px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
            />
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value as 'Presencial' | 'Remoto' | 'Ambos')}
              className="px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
            >
              <option value="Presencial">Presencial</option>
              <option value="Remoto">Remoto</option>
              <option value="Ambos">Presencial e Remoto</option>
            </select>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#1F1B18] mb-2">
              Áreas em que deseja atuar *
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
              {[
                'Passeios com cães',
                'Banhos e cuidados',
                'Transporte de animais',
                'Divulgação de campanhas',
                'Ajuda administrativa',
                'Eventos de adoção',
              ].map((area) => (
                <label
                  key={area}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E7DFD3] bg-[#FBF8F3] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(area)}
                    onChange={() => toggleArea(area)}
                    className="accent-[#EA580C]"
                  />
                  <span>{area}</span>
                </label>
              ))}
            </div>
          </div>

          <input
            type="text"
            required
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="Disponibilidade (ex: Sábados pela manhã / 4h por semana) *"
            className="w-full px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
          />

          <textarea
            rows={3}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Conte brevemente sobre sua experiência ou habilidades (opcional)"
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
              Concordo com o tratamento dos meus dados para organização do voluntariado conforme a{' '}
              <Link to="/privacidade" className="underline text-[#C2410C]">
                LGPD
              </Link>
              .
            </span>
          </label>

          {error && <p className="text-sm text-[#DC2626]">{error}</p>}
          {successMsg && (
            <p className="text-sm text-[#15803D] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-7 py-3.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {submitting ? 'Enviando...' : 'Enviar inscrição de voluntariado'}
          </button>
        </form>
      </div>
    </div>
  );
}
