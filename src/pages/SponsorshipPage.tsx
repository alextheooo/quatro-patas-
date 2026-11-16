import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dog, SponsorshipUpdate } from '../types';
import { formatBRL, formatDateBR } from '../lib/format';
import { ResilientImage } from '../components/ResilientImage';

export function SponsorshipPage() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [updates, setUpdates] = useState<SponsorshipUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Apadrinhamento – Quatro Patas';
    fetch('/api/sponsorships')
      .then((r) => r.json())
      .then((d) => {
        setDogs(Array.isArray(d.dogs) ? d.dogs : []);
        setUpdates(Array.isArray(d.updates) ? d.updates : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold text-[#C2410C] uppercase tracking-wider mb-2">
          Apoio Contínuo
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1B18] [text-wrap:balance] mb-3">
          Apadrinhe um cão da Quatro Patas
        </h1>
        <p className="text-base text-[#524942] leading-relaxed">
          Nem sempre é possível adotar agora, mas você pode garantir alimentação, medicações e
          conforto mensal para um cão específico e acompanhar suas atualizações.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-[#EFE8DC] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dogs.map((dog) => (
            <article
              key={dog.id}
              className="bg-white rounded-2xl border border-[#E7DFD3] overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-[#EFE8DC] overflow-hidden">
                <ResilientImage src={dog.image_url} alt={dog.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-xs text-[#786D65] mb-1">
                  {dog.age_label} · {dog.status} · {dog.location}
                </p>
                <h2 className="text-xl font-bold text-[#1F1B18] mb-2">{dog.name}</h2>
                <p className="text-sm text-[#524942] line-clamp-3 mb-4">{dog.rescue_history}</p>

                <div className="bg-[#FBF8F3] rounded-xl border border-[#EFE8DC] p-4 mb-5 flex-1">
                  <p className="text-xs font-semibold text-[#1F1B18] mb-1">Necessidades mensais</p>
                  <p className="text-xs text-[#524942] leading-relaxed">
                    {dog.sponsorship_needs || 'Alimentação balanceada e acompanhamento preventivo.'}
                  </p>
                  <p className="text-sm font-bold text-[#15803D] mt-3 tabular-nums">
                    Sugestão mensal: {formatBRL(dog.sponsorship_amount_cents || 5000)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Link
                    to={`/doar?cao=${dog.id}&valor=${dog.sponsorship_amount_cents || 5000}`}
                    className="flex-1 text-center py-2.5 px-4 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors"
                  >
                    Apadrinhar mensalmente
                  </Link>
                  <Link
                    to={`/adocao/${dog.id}`}
                    className="py-2.5 px-4 rounded-full border border-[#D6CBB9] text-sm font-medium hover:bg-[#F3EDE3]"
                  >
                    Perfil
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Atualizações sobre os cães apadrinhados */}
      <section className="border-t border-[#E7DFD3] pt-12">
        <h2 className="text-2xl font-bold text-[#1F1B18] mb-6">
          Atualizações recentes dos cães apadrinhados
        </h2>
        {updates.length === 0 ? (
          <p className="text-sm text-[#786D65]">Nenhuma atualização publicada ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {updates.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-[#E7DFD3] p-6 space-y-2">
                <p className="text-xs text-[#786D65]">
                  {u.dog_name} · {formatDateBR(u.created_at)} · {u.author_name}
                </p>
                <h3 className="text-lg font-bold text-[#1F1B18]">{u.title}</h3>
                <p className="text-sm text-[#524942] leading-relaxed">{u.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
