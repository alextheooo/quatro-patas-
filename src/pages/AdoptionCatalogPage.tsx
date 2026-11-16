import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Dog } from '../types';
import { statusTextStyle } from '../lib/format';
import { ResilientImage } from '../components/ResilientImage';

export function AdoptionCatalogPage() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);

  const [ageCategory, setAgeCategory] = useState('');
  const [size, setSize] = useState('');
  const [sex, setSex] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = 'Adoção de Cães – Quatro Patas';
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (ageCategory) params.set('age_category', ageCategory);
    if (size) params.set('size', size);
    if (sex) params.set('sex', sex);
    if (locationFilter) params.set('location', locationFilter);
    if (query) params.set('q', query);

    fetch(`/api/dogs?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setDogs(Array.isArray(d) ? d : []))
      .catch(() => setDogs([]))
      .finally(() => setLoading(false));
  }, [ageCategory, size, sex, locationFilter, query]);

  const resetFilters = () => {
    setAgeCategory('');
    setSize('');
    setSex('');
    setLocationFilter('');
    setQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="max-w-2xl mb-8">
        <p className="text-xs font-semibold text-[#15803D] uppercase tracking-wider mb-2">
          Adoção Responsável
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1B18] [text-wrap:balance] mb-3">
          Conheça os cães da Quatro Patas
        </h1>
        <p className="text-base text-[#524942]">
          Filtre por idade, porte, sexo ou localização para encontrar o companheiro compatível com
          sua rotina e moradia.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E7DFD3] p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#786D65] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome ou perfil..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
          />
        </div>
        <select
          value={ageCategory}
          onChange={(e) => setAgeCategory(e.target.value)}
          aria-label="Filtrar por idade"
          className="px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
        >
          <option value="">Todas as idades</option>
          <option value="Filhote">Filhote</option>
          <option value="Adulto">Adulto</option>
          <option value="Idoso">Idoso</option>
        </select>
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          aria-label="Filtrar por porte"
          className="px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
        >
          <option value="">Todos os portes</option>
          <option value="Pequeno">Pequeno</option>
          <option value="Médio">Médio</option>
          <option value="Grande">Grande</option>
        </select>
        <select
          value={sex}
          onChange={(e) => setSex(e.target.value)}
          aria-label="Filtrar por sexo"
          className="px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
        >
          <option value="">Todos os sexos</option>
          <option value="Macho">Macho</option>
          <option value="Fêmea">Fêmea</option>
        </select>
        <input
          type="text"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          placeholder="Cidade / UF..."
          aria-label="Filtrar por localização"
          className="px-3.5 py-2.5 rounded-xl border border-[#D6CBB9] bg-[#FBF8F3] text-sm focus:outline-none focus:border-[#EA580C]"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-80 rounded-2xl bg-[#EFE8DC] animate-pulse" />
          ))}
        </div>
      ) : dogs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E7DFD3] p-12 text-center space-y-3">
          <p className="text-lg font-semibold text-[#1F1B18]">Nenhum cão encontrado com esses filtros</p>
          <p className="text-sm text-[#524942]">Tente ampliar os critérios de busca.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-full bg-[#EA580C] text-white text-sm font-semibold"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dogs.map((dog) => (
            <article
              key={dog.id}
              className="bg-white rounded-2xl border border-[#E7DFD3] overflow-hidden flex flex-col hover:border-[#EA580C]/60 transition-colors"
            >
              <Link to={`/adocao/${dog.id}`} className="aspect-[4/3] bg-[#EFE8DC] overflow-hidden block">
                <ResilientImage
                  src={dog.image_url}
                  alt={`Fotografia de ${dog.name}`}
                  className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
                />
              </Link>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h2 className="text-xl font-bold text-[#1F1B18]">{dog.name}</h2>
                  <span className={`text-xs shrink-0 ${statusTextStyle(dog.status)}`}>{dog.status}</span>
                </div>
                <p className="text-xs text-[#786D65] mb-3">
                  {dog.age_label} · Porte {dog.size} · {dog.sex} · {dog.location}
                </p>
                <p className="text-sm text-[#524942] line-clamp-2 mb-4 flex-1">{dog.personality}</p>
                <div className="text-xs text-[#786D65] border-t border-[#F3EDE3] pt-3 mb-4 space-y-1">
                  <p>Saúde: {dog.health_status}</p>
                  <p>Vacinação: {dog.vaccination}</p>
                </div>
                <Link
                  to={`/adocao/${dog.id}`}
                  className="w-full text-center py-2.5 px-4 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors"
                >
                  Conhecer e adotar
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
