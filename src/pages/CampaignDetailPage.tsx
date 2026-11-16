import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Campaign } from '../types';
import { formatBRL, formatDateBR, statusTextStyle } from '../lib/format';
import { ResilientImage } from '../components/ResilientImage';

export function CampaignDetailPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setCampaign(d);
        if (d) document.title = `${d.title} – Quatro Patas`;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-[#786D65]">
        Carregando campanha...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Campanha não encontrada</h1>
        <Link to="/campanhas" className="text-sm font-semibold text-[#C2410C] underline">
          Voltar para campanhas
        </Link>
      </div>
    );
  }

  const pct = Math.min(
    100,
    Math.round((campaign.raised_cents / Math.max(1, campaign.goal_cents)) * 100)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/campanhas"
        className="inline-flex items-center gap-1.5 text-sm text-[#524942] hover:text-[#1F1B18] mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Voltar para campanhas</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-[16/10] rounded-3xl overflow-hidden bg-[#EFE8DC] border border-[#E7DFD3]">
            <ResilientImage
              src={campaign.image_url}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs text-[#786D65] mb-2">
              {campaign.category} · <span className={statusTextStyle(campaign.status)}>{campaign.status}</span>
            </p>
            <h1 className="text-3xl font-bold text-[#1F1B18] mb-4">{campaign.title}</h1>
            <div className="text-base text-[#524942] leading-relaxed whitespace-pre-line">
              {campaign.description}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5 bg-white rounded-3xl border border-[#E7DFD3] p-6 sm:p-7 space-y-6">
          <div>
            <p className="text-xs text-[#786D65] mb-1">Arrecadado (pagamentos confirmados)</p>
            <p className="text-3xl font-bold font-display text-[#1F1B18] tabular-nums">
              {formatBRL(campaign.raised_cents)}
            </p>
            <p className="text-xs text-[#786D65] mt-1 tabular-nums">
              de {formatBRL(campaign.goal_cents)} ({pct}% da meta)
            </p>
            <div className="h-2.5 rounded-full bg-[#EFE8DC] overflow-hidden mt-3">
              <div className="h-full rounded-full bg-[#15803D]" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="flex justify-between text-sm border-y border-[#F0EAE0] py-3 tabular-nums">
            <span className="text-[#524942]">Apoiadores confirmados</span>
            <span className="font-bold text-[#1F1B18]">{campaign.supporters_count}</span>
          </div>

          <Link
            to={`/doar?campanha=${campaign.id}`}
            className="block w-full text-center py-3.5 px-6 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors"
          >
            Contribuir para esta campanha
          </Link>

          <div className="pt-2">
            <h2 className="text-sm font-bold text-[#1F1B18] mb-3">
              Contribuições confirmadas recentes
            </h2>
            {!campaign.recentDonations || campaign.recentDonations.length === 0 ? (
              <p className="text-xs text-[#786D65]">
                Nenhuma contribuição confirmada registrada até o momento.
              </p>
            ) : (
              <ul className="space-y-2.5 text-xs">
                {campaign.recentDonations.map((d) => (
                  <li key={d.id} className="flex justify-between border-b border-[#F3EDE3] pb-2">
                    <div>
                      <p className="font-semibold text-[#1F1B18]">{d.donor_name}</p>
                      <p className="text-[#786D65]">{formatDateBR(d.confirmed_at)}</p>
                    </div>
                    <span className="font-bold text-[#15803D] tabular-nums">
                      {formatBRL(d.amount_cents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
