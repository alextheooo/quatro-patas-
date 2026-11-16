import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types';
import { formatDateBR } from '../lib/format';
import { ResilientImage } from '../components/ResilientImage';

export function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Histórias – Quatro Patas';
    fetch('/api/stories')
      .then((r) => r.json())
      .then((d) => setStories(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="max-w-2xl mb-10">
        <p className="text-xs font-semibold text-[#15803D] uppercase tracking-wider mb-2">
          Diário Quatro Patas
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1B18] [text-wrap:balance] mb-3">
          Histórias de resgates e adoções
        </h1>
        <p className="text-base text-[#524942]">
          Relatos de superação, bastidores do cuidado veterinário e recomeços em novos lares.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-[#EFE8DC] animate-pulse" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <p className="text-sm text-[#786D65]">Nenhuma história publicada ainda.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stories.map((story) => (
            <Link
              key={story.id}
              to={`/historias/${story.id}`}
              className="group bg-white rounded-3xl border border-[#E7DFD3] overflow-hidden flex flex-col hover:border-[#C2410C]/50 transition-colors"
            >
              <div className="aspect-[16/10] bg-[#EFE8DC] overflow-hidden">
                <ResilientImage
                  src={story.image_url}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <div className="p-7 flex-1 flex flex-col">
                <p className="text-xs text-[#786D65] mb-2">
                  {story.category} · {formatDateBR(story.published_at)} · {story.author_name}
                </p>
                <h2 className="text-2xl font-bold text-[#1F1B18] group-hover:text-[#C2410C] transition-colors mb-3">
                  {story.title}
                </h2>
                <p className="text-sm text-[#524942] leading-relaxed flex-1 mb-4">{story.excerpt}</p>
                <span className="text-sm font-semibold text-[#C2410C]">Ler história completa →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
