import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Campaign } from '../types';
import { formatBRL, statusTextStyle } from '../lib/format';
import { ResilientImage } from '../components/ResilientImage';

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    document.title = 'Campanhas de Arrecadação – Quatro Patas';
    fetch('/api/campaigns')
      .then((r) => r.json())
      .then((d) => setCampaigns(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(campaigns.map((c) => c.category)));
  const filtered = categoryFilter
    ? campaigns.filter((c) => c.category === categoryFilter)
    : campaigns;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="max-w-2xl mb-8">
        <p className="text-xs font-semibold text-[#15803D] uppercase tracking-wider mb-2">
          Frentes de Atuação
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1B18] [text-wrap:balance] mb-3">
          Campanhas de arrecadação
        </h1>
        <p className="text-base text-[#524942]">
          Cada campanha exibe apenas os valores provenientes de pagamentos reais confirmados e o
          número efetivo de apoiadores.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => setCategoryFilter('')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              categoryFilter === ''
                ? 'bg-[#1F1B18] text-white'
                : 'bg-white border border-[#D6CBB9] text-[#524942] hover:text-[#1F1B18]'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#1F1B18] text-white'
                  : 'bg-white border border-[#D6CBB9] text-[#524942] hover:text-[#1F1B18]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-[#EFE8DC] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => {
            const pct = Math.min(100, Math.round((c.raised_cents / Math.max(1, c.goal_cents)) * 100));
            return (
              <article
                key={c.id}
                className="bg-white rounded-2xl border border-[#E7DFD3] overflow-hidden flex flex-col"
              >
                <Link to={`/campanhas/${c.id}`} className="aspect-[16/10] bg-[#EFE8DC] block overflow-hidden">
                  <ResilientImage src={c.image_url} alt={c.title} className="w-full h-full object-cover" />
                </Link>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 text-xs mb-2">
                    <span className="text-[#786D65]">{c.category}</span>
                    <span className={statusTextStyle(c.status)}>{c.status}</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#1F1B18] mb-2">{c.title}</h2>
                  <p className="text-sm text-[#524942] mb-6 flex-1">{c.summary}</p>

                  <div className="mb-5">
                    <div className="flex justify-between text-xs mb-1.5 tabular-nums">
                      <span className="font-bold text-[#1F1B18]">{formatBRL(c.raised_cents)}</span>
                      <span className="text-[#786D65]">Meta {formatBRL(c.goal_cents)} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EFE8DC] overflow-hidden">
                      <div className="h-full rounded-full bg-[#15803D]" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-[#786D65] mt-2 tabular-nums">
                      {c.supporters_count} apoiadores confirmados
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      to={`/doar?campanha=${c.id}`}
                      className="flex-1 text-center py-2.5 px-4 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors"
                    >
                      Contribuir
                    </Link>
                    <Link
                      to={`/campanhas/${c.id}`}
                      className="py-2.5 px-4 rounded-full border border-[#D6CBB9] text-sm font-medium hover:bg-[#F3EDE3]"
                    >
                      Ver mais
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
