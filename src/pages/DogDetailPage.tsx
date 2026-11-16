import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Dog } from '../types';
import { formatBRL, formatDateBR, statusTextStyle } from '../lib/format';
import { ResilientImage } from '../components/ResilientImage';

export function DogDetailPage() {
  const { id } = useParams();
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [city, setCity] = useState('');
  const [housingType, setHousingType] = useState('Casa com quintal');
  const [hasFence, setHasFence] = useState(true);
  const [otherPets, setOtherPets] = useState('');
  const [hasChildren, setHasChildren] = useState(false);
  const [experience, setExperience] = useState('');
  const [motivation, setMotivation] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dogs/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setDog(d);
        if (d) document.title = `${d.name} – Adoção Quatro Patas`;
      })
      .catch(() => setDog(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdoptionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!lgpdConsent) {
      setError('É obrigatório concordar com a Política de Privacidade (LGPD).');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch('/api/adoptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dog_id: Number(id),
          applicant_name: applicantName,
          applicant_email: applicantEmail,
          applicant_phone: applicantPhone,
          city,
          housing_type: housingType,
          has_fence_or_screens: hasFence,
          other_pets: otherPets,
          has_children: hasChildren,
          experience,
          motivation,
          lgpd_consent: lgpdConsent,
          hp_field: form.get('hp_field') || '',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao enviar solicitação.');
      setSuccessMsg(
        'Solicitação registrada com sucesso! Nossa equipe entrará em contato para a entrevista de adoção.'
      );
      setApplicantName('');
      setApplicantEmail('');
      setApplicantPhone('');
      setCity('');
      setMotivation('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-[#786D65]">
        Carregando perfil do cão...
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Cão não encontrado</h1>
        <Link to="/adocao" className="inline-block text-sm font-semibold text-[#C2410C] underline">
          Voltar para o catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/adocao"
        className="inline-flex items-center gap-1.5 text-sm text-[#524942] hover:text-[#1F1B18] mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Voltar para o catálogo</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-6 space-y-6">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-[#EFE8DC] border border-[#E7DFD3]">
            <ResilientImage
              src={dog.image_url}
              alt={dog.name}
              className="w-full h-full object-cover"
            />
          </div>

          {dog.updates && dog.updates.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#1F1B18]">Atualizações do acompanhamento</h2>
              <div className="space-y-4">
                {dog.updates.map((u) => (
                  <div key={u.id} className="border-t border-[#F3EDE3] pt-3 first:border-t-0 first:pt-0">
                    <p className="text-xs text-[#786D65] mb-1">
                      {formatDateBR(u.created_at)} · {u.author_name}
                    </p>
                    <h3 className="text-sm font-bold text-[#1F1B18]">{u.title}</h3>
                    <p className="text-sm text-[#524942] mt-1">{u.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div>
            <p className={`text-xs mb-2 ${statusTextStyle(dog.status)}`}>{dog.status}</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1B18] mb-2">{dog.name}</h1>
            <p className="text-sm text-[#786D65]">
              {dog.age_label} ({dog.age_category}) · Porte {dog.size} · {dog.sex} · {dog.location}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-4 text-sm">
            <div>
              <h2 className="font-semibold text-[#1F1B18] mb-1">Personalidade</h2>
              <p className="text-[#524942] leading-relaxed">{dog.personality}</p>
            </div>
            <div className="border-t border-[#F3EDE3] pt-4">
              <h2 className="font-semibold text-[#1F1B18] mb-1">Histórico de resgate</h2>
              <p className="text-[#524942] leading-relaxed">{dog.rescue_history}</p>
            </div>
            <div className="border-t border-[#F3EDE3] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h2 className="font-semibold text-[#1F1B18] mb-1">Estado de saúde</h2>
                <p className="text-[#524942]">{dog.health_status}</p>
              </div>
              <div>
                <h2 className="font-semibold text-[#1F1B18] mb-1">Vacinação</h2>
                <p className="text-[#524942]">{dog.vaccination}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {dog.status !== 'Adotado' && (
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="px-7 py-3.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors"
              >
                {showForm ? 'Ocultar formulário de adoção' : 'Quero adotar'}
              </button>
            )}
            {dog.sponsorship_active === 1 && (
              <Link
                to={`/doar?cao=${dog.id}&valor=${dog.sponsorship_amount_cents || 5000}`}
                className="px-6 py-3.5 rounded-full border border-[#15803D] text-[#15803D] hover:bg-[#15803D] hover:text-white text-sm font-semibold transition-colors"
              >
                Apadrinhar ({formatBRL(dog.sponsorship_amount_cents || 5000)}/mês)
              </Link>
            )}
          </div>

          {showForm && (
            <form
              onSubmit={handleAdoptionSubmit}
              className="bg-white rounded-3xl border border-[#E7DFD3] p-6 sm:p-7 space-y-4"
            >
              <input type="text" name="hp_field" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <h2 className="text-xl font-bold text-[#1F1B18]">
                Formulário de interesse em adoção — {dog.name}
              </h2>
              <p className="text-xs text-[#524942]">
                Responda com sinceridade sobre sua rotina e o ambiente onde o cão viverá.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Nome completo *"
                  className="px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
                />
                <input
                  type="email"
                  required
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="E-mail *"
                  className="px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="tel"
                  required
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="WhatsApp / Telefone *"
                  className="px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
                />
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade e Estado *"
                  className="px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#786D65] mb-1">Tipo de moradia *</label>
                  <select
                    value={housingType}
                    onChange={(e) => setHousingType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
                  >
                    <option value="Casa com quintal">Casa com quintal</option>
                    <option value="Casa sem quintal">Casa sem quintal</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Sítio/Chácara">Sítio / Chácara</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#786D65] mb-1">Outros animais em casa?</label>
                  <input
                    type="text"
                    value={otherPets}
                    onChange={(e) => setOtherPets(e.target.value)}
                    placeholder="Ex: 1 gata castrada / Não tenho"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-5 text-xs text-[#1F1B18]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasFence}
                    onChange={(e) => setHasFence(e.target.checked)}
                    className="accent-[#EA580C]"
                  />
                  <span>Muros fechados / telas de proteção</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasChildren}
                    onChange={(e) => setHasChildren(e.target.checked)}
                    className="accent-[#EA580C]"
                  />
                  <span>Há crianças na residência</span>
                </label>
              </div>

              <textarea
                rows={2}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Já teve cães antes? Quantas horas o animal ficará sozinho por dia?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
              />

              <textarea
                required
                rows={3}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder={`Por que deseja adotar ${dog.name}? *`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm"
              />

              <label className="flex items-start gap-2.5 text-xs text-[#524942] cursor-pointer">
                <input
                  type="checkbox"
                  checked={lgpdConsent}
                  onChange={(e) => setLgpdConsent(e.target.checked)}
                  className="mt-0.5 accent-[#EA580C]"
                />
                <span>
                  Autorizo o uso dos dados informados para avaliação do processo de adoção conforme a{' '}
                  <Link to="/privacidade" className="underline text-[#C2410C]">
                    LGPD
                  </Link>
                  .
                </span>
              </label>

              {error && <p className="text-sm text-[#DC2626]">{error}</p>}
              {successMsg && (
                <p className="text-sm text-[#15803D] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {submitting ? 'Enviando solicitação...' : 'Enviar interesse em adoção'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
