import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Campaign, Dog, Story, Testimonial } from '../types';
import { formatBRL, formatDateBR, statusTextStyle } from '../lib/format';
import { ResilientImage } from '../components/ResilientImage';

interface OverviewResponse {
  metrics: {
    totalDogs: number;
    availableDogs: number;
    adoptedDogs: number;
    treatmentDogs: number;
    confirmedDonationsCents: number;
    confirmedDonationsCount: number;
    hasDemoDogs: boolean;
  };
  featuredDogs: Dog[];
  campaigns: Campaign[];
  stories: Story[];
  testimonials: Testimonial[];
  gatewayConfigured: boolean;
}

export function HomePage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [nlEmail, setNlEmail] = useState('');
  const [nlName, setNlName] = useState('');
  const [nlConsent, setNlConsent] = useState(false);
  const [nlStatus, setNlStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [nlSubmitting, setNlSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Quatro Patas – Resgate, Adoção e Proteção de Cães';
    fetch('/api/overview')
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleNewsletter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNlStatus(null);
    setNlSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: nlEmail,
          name: nlName,
          lgpd_consent: nlConsent,
          hp_field: form.get('hp_field') || '',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Não foi possível concluir a inscrição.');
      setNlStatus({ type: 'ok', msg: json.message });
      setNlEmail('');
      setNlName('');
      setNlConsent(false);
    } catch (err) {
      setNlStatus({
        type: 'err',
        msg: err instanceof Error ? err.message : 'Erro ao inscrever.',
      });
    } finally {
      setNlSubmitting(false);
    }
  };

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12 lg:pt-12 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center py-2">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#15803D] mb-4">
              Quatro Patas · Proteção e Adoção Responsável
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.08] tracking-tight text-[#1F1B18] [text-wrap:balance] mb-6">
              Um pequeno gesto pode mudar uma vida.
            </h1>
            <p className="text-base sm:text-lg text-[#524942] leading-relaxed max-w-xl mb-4">
              Resgatamos cães em situação de vulnerabilidade, garantimos atendimento veterinário
              completo e conectamos cada animal a um lar definitivo com total prestação de contas.
            </p>
            <p className="text-sm font-medium text-[#786D65] italic mb-8">
              “Cada vida importa. Cada gesto transforma.”
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/doar"
                className="px-7 py-3.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Faça uma doação
              </Link>
              <Link
                to="/adocao"
                className="px-7 py-3.5 rounded-full border border-[#D6CBB9] bg-white hover:bg-[#F3EDE3] text-[#1F1B18] text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Conheça nossos cães
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-72 sm:h-96 lg:h-full min-h-[380px] rounded-3xl overflow-hidden bg-[#EFE8DC]">
              <ResilientImage
                src="/src/assets/images/hero_rescued_dog_1794855382581.jpg"
                alt="Cão caramelo resgatado em jardim ensolarado do abrigo Quatro Patas"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs text-white/85">
                  Acolhimento, reabilitação clínica e adoção consciente
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Real-Time Metrics Strip (Strictly sourced from DB) */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-b border-[#E7DFD3] py-6">
          <div>
            <p className="text-xs text-[#786D65] mb-1">Cães cadastrados</p>
            <p className="text-2xl sm:text-3xl font-bold font-display text-[#1F1B18] tabular-nums">
              {loading ? '—' : data?.metrics.totalDogs ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#786D65] mb-1">Disponíveis para adoção</p>
            <p className="text-2xl sm:text-3xl font-bold font-display text-[#15803D] tabular-nums">
              {loading ? '—' : data?.metrics.availableDogs ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#786D65] mb-1">Adoções concluídas</p>
            <p className="text-2xl sm:text-3xl font-bold font-display text-[#1F1B18] tabular-nums">
              {loading ? '—' : data?.metrics.adoptedDogs ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#786D65] mb-1">Doações confirmadas</p>
            <p className="text-2xl sm:text-3xl font-bold font-display text-[#C2410C] tabular-nums">
              {loading ? '—' : formatBRL(data?.metrics.confirmedDonationsCents ?? 0)}
            </p>
          </div>
        </div>
        {data?.metrics.hasDemoDogs && (
          <p className="mt-2.5 text-xs text-[#786D65]">
            Os registros marcados como “(Exemplo)” são conteúdos demonstrativos iniciais e podem ser substituídos ou removidos pelo Painel Administrativo.
          </p>
        )}
      </section>

      {/* 2. CÃES DISPONÍVEIS PARA ADOÇÃO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-[#C2410C] uppercase tracking-wider mb-1.5">
              Adoção Responsável
            </p>
            <h2 className="text-3xl font-bold text-[#1F1B18] [text-wrap:balance]">
              Cães esperando por um lar
            </h2>
          </div>
          <Link
            to="/adocao"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C2410C] hover:text-[#9A3412] whitespace-nowrap"
          >
            <span>Ver catálogo completo</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(data?.featuredDogs || []).map((dog) => (
            <Link
              key={dog.id}
              to={`/adocao/${dog.id}`}
              className="group bg-white rounded-2xl border border-[#E7DFD3] overflow-hidden flex flex-col hover:border-[#C2410C]/50 transition-colors"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#EFE8DC]">
                <ResilientImage
                  src={dog.image_url}
                  alt={`Fotografia de ${dog.name}`}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h3 className="text-lg font-bold text-[#1F1B18] truncate">{dog.name}</h3>
                  <span className={`text-xs shrink-0 ${statusTextStyle(dog.status)}`}>{dog.status}</span>
                </div>
                <p className="text-xs text-[#786D65] mb-3">
                  {dog.age_label} · {dog.size} · {dog.sex}
                </p>
                <p className="text-sm text-[#524942] line-clamp-2 flex-1">{dog.personality}</p>
                <p className="text-xs text-[#786D65] mt-4 pt-3 border-t border-[#F3EDE3]">
                  {dog.location}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. CAMPANHAS DE ARRECADAÇÃO */}
      <section className="bg-[#F3EDE3]/65 border-y border-[#E7DFD3] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#15803D] uppercase tracking-wider mb-1.5">
                Apoio Direto
              </p>
              <h2 className="text-3xl font-bold text-[#1F1B18] [text-wrap:balance]">
                Campanhas de arrecadação
              </h2>
              <p className="text-sm text-[#524942] mt-1">
                Valores calculados exclusivamente a partir de pagamentos confirmados.
              </p>
            </div>
            <Link
              to="/campanhas"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C2410C] hover:text-[#9A3412] whitespace-nowrap"
            >
              <span>Todas as campanhas</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(data?.campaigns || []).map((c) => {
              const pct = Math.min(100, Math.round((c.raised_cents / Math.max(1, c.goal_cents)) * 100));
              return (
                <article
                  key={c.id}
                  className="bg-white rounded-2xl border border-[#E7DFD3] overflow-hidden flex flex-col"
                >
                  <div className="aspect-[16/10] bg-[#EFE8DC] overflow-hidden">
                    <ResilientImage
                      src={c.image_url}
                      alt={c.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-xs font-medium text-[#786D65] mb-1.5">
                      {c.category} · {c.supporters_count} apoiadores confirmados
                    </p>
                    <h3 className="text-xl font-bold text-[#1F1B18] mb-2">{c.title}</h3>
                    <p className="text-sm text-[#524942] line-clamp-3 mb-5 flex-1">{c.summary}</p>

                    <div className="mb-5">
                      <div className="flex justify-between text-xs mb-1.5 tabular-nums">
                        <span className="font-semibold text-[#1F1B18]">
                          {formatBRL(c.raised_cents)} arrecadados
                        </span>
                        <span className="text-[#786D65]">Meta: {formatBRL(c.goal_cents)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#EFE8DC] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#15803D] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        to={`/doar?campanha=${c.id}`}
                        className="flex-1 text-center py-2.5 px-4 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors"
                      >
                        Contribuir
                      </Link>
                      <Link
                        to={`/campanhas/${c.id}`}
                        className="py-2.5 px-4 rounded-full border border-[#D6CBB9] text-sm font-medium text-[#1F1B18] hover:bg-[#F3EDE3] transition-colors"
                      >
                        Detalhes
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. COMO AJUDAR (Editorial Numbered Pillars) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold text-[#C2410C] uppercase tracking-wider mb-1.5">
            Formas de Participação
          </p>
          <h2 className="text-3xl font-bold text-[#1F1B18] [text-wrap:balance]">
            Como você pode transformar uma história hoje
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 border-t border-[#E7DFD3] pt-8">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-[#1F1B18]">01. Doação transparente</h3>
            <p className="text-sm text-[#524942] leading-relaxed">
              Contribua de forma única ou mensal via PIX ou cartão para custear ração, vacinas e cirurgias.
            </p>
            <Link to="/doar" className="inline-block text-sm font-semibold text-[#C2410C] hover:underline">
              Doar agora →
            </Link>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-[#1F1B18]">02. Adoção consciente</h3>
            <p className="text-sm text-[#524942] leading-relaxed">
              Conheça o perfil de cada cão, passe pela entrevista de compatibilidade e ofereça um lar seguro.
            </p>
            <Link to="/adocao" className="inline-block text-sm font-semibold text-[#C2410C] hover:underline">
              Ver cães →
            </Link>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-[#1F1B18]">03. Apadrinhamento</h3>
            <p className="text-sm text-[#524942] leading-relaxed">
              Apoie mensalmente um cão específico em tratamento ou aguardando adoção e receba notícias reais.
            </p>
            <Link to="/apadrinhar" className="inline-block text-sm font-semibold text-[#C2410C] hover:underline">
              Apadrinhar →
            </Link>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-[#1F1B18]">04. Voluntariado</h3>
            <p className="text-sm text-[#524942] leading-relaxed">
              Doe seu tempo em passeios, banhos, transporte solidário, eventos ou divulgação remota.
            </p>
            <Link to="/voluntariado" className="inline-block text-sm font-semibold text-[#C2410C] hover:underline">
              Inscrever-se →
            </Link>
          </div>
        </div>
      </section>

      {/* 5. HISTÓRIAS DE TRANSFORMAÇÃO & DEPOIMENTOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-[#E7DFD3]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold text-[#15803D] uppercase tracking-wider mb-1">
                  Diário de Resgates
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1F1B18]">
                  Histórias de transformação
                </h2>
              </div>
              <Link to="/historias" className="text-sm font-semibold text-[#C2410C] hover:underline whitespace-nowrap">
                Ler todas →
              </Link>
            </div>

            <div className="space-y-6">
              {(data?.stories || []).map((story) => (
                <Link
                  key={story.id}
                  to={`/historias/${story.id}`}
                  className="group grid grid-cols-1 sm:grid-cols-12 gap-5 bg-white rounded-2xl border border-[#E7DFD3] p-4 hover:border-[#C2410C]/50 transition-colors"
                >
                  <div className="sm:col-span-4 aspect-[4/3] rounded-xl overflow-hidden bg-[#EFE8DC]">
                    <ResilientImage
                      src={story.image_url}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="sm:col-span-8 flex flex-col justify-center">
                    <p className="text-xs text-[#786D65] mb-1">
                      {story.category} · {formatDateBR(story.published_at)}
                    </p>
                    <h3 className="text-lg font-bold text-[#1F1B18] group-hover:text-[#C2410C] transition-colors mb-2">
                      {story.title}
                    </h3>
                    <p className="text-sm text-[#524942] line-clamp-2">{story.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <p className="text-xs font-semibold text-[#786D65] uppercase tracking-wider mb-1">
              Comunidade
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1F1B18] mb-6">
              Depoimentos de adotantes
            </h2>
            <div className="space-y-5">
              {(data?.testimonials || []).map((t) => (
                <blockquote
                  key={t.id}
                  className="bg-white rounded-2xl border border-[#E7DFD3] p-6"
                >
                  <p className="text-sm text-[#1F1B18] leading-relaxed mb-4">“{t.quote}”</p>
                  <footer className="text-xs text-[#786D65]">
                    <strong className="text-[#1F1B18] font-semibold">{t.adopter_name}</strong> · Adotou{' '}
                    {t.dog_name} · {t.city} ({t.adopted_year})
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. VOLUNTARIADO CTA + NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 bg-[#15803D] text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-2">
                Voluntariado Quatro Patas
              </p>
              <h2 className="text-3xl font-bold mb-4 [text-wrap:balance]">
                Doe horas do seu tempo presencialmente ou à distância
              </h2>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed mb-8">
                Precisamos de pessoas comprometidas para passeios, cuidados no abrigo, transporte
                veterinário, eventos de adoção e divulgação de campanhas.
              </p>
            </div>
            <div>
              <Link
                to="/voluntariado"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#15803D] text-sm font-semibold hover:bg-[#F3EDE3] transition-colors"
              >
                <span>Quero ser voluntário</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white border border-[#E7DFD3] rounded-3xl p-8 sm:p-10 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-[#1F1B18] mb-2">
              Receba atualizações dos resgates
            </h2>
            <p className="text-sm text-[#524942] mb-6">
              Acompanhe novos cães disponíveis, feiras de adoção e relatórios financeiros mensais.
            </p>
            <form onSubmit={handleNewsletter} className="space-y-4">
              <input
                type="text"
                name="hp_field"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={nlName}
                  onChange={(e) => setNlName(e.target.value)}
                  placeholder="Seu nome"
                  className="px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
                />
                <input
                  type="email"
                  required
                  value={nlEmail}
                  onChange={(e) => setNlEmail(e.target.value)}
                  placeholder="Seu melhor e-mail *"
                  className="px-4 py-3 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
                />
              </div>
              <label className="flex items-start gap-2.5 text-xs text-[#524942] cursor-pointer">
                <input
                  type="checkbox"
                  checked={nlConsent}
                  onChange={(e) => setNlConsent(e.target.checked)}
                  className="mt-0.5 accent-[#EA580C]"
                />
                <span>
                  Concordo em receber comunicações da Quatro Patas conforme a{' '}
                  <Link to="/privacidade" className="underline text-[#C2410C]">
                    Política de Privacidade (LGPD)
                  </Link>
                  .
                </span>
              </label>

              {nlStatus && (
                <p
                  className={`text-sm flex items-center gap-1.5 ${
                    nlStatus.type === 'ok' ? 'text-[#15803D]' : 'text-[#DC2626]'
                  }`}
                >
                  {nlStatus.type === 'ok' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{nlStatus.msg}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={nlSubmitting}
                className="px-6 py-3 rounded-full bg-[#1F1B18] hover:bg-[#3A332E] text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {nlSubmitting ? 'Inscrevendo...' : 'Inscrever na newsletter'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
