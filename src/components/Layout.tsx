import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  MessageCircle,
  PawPrint,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AuthContext';

interface SearchResults {
  dogs: Array<{ id: number; name: string; age_label: string; location: string; status: string }>;
  campaigns: Array<{ id: number; title: string; category: string }>;
  stories: Array<{ id: number; title: string; category: string }>;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { settings, user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [lgpdAccepted, setLgpdAccepted] = useState(() => {
    try {
      return localStorage.getItem('qp_lgpd_consent') === 'accepted';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!searchOpen || !searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          setSearchResults(await res.json());
        }
      } catch {
        // ignore transient search errors
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  const acceptLgpd = () => {
    try {
      localStorage.setItem('qp_lgpd_consent', 'accepted');
    } catch {
      // ignore storage failure
    }
    setLgpdAccepted(true);
  };

  const whatsappEnabled = settings.whatsapp_enabled !== '0';
  const whatsappNumber = (settings.whatsapp_number || '5511999999999').replace(/\D/g, '');
  const whatsappText = encodeURIComponent(
    settings.whatsapp_message || 'Olá! Gostaria de saber mais sobre como ajudar a Quatro Patas.'
  );

  const navLinks = [
    { to: '/adocao', label: 'Adoção' },
    { to: '/campanhas', label: 'Campanhas' },
    { to: '/apadrinhar', label: 'Apadrinhar' },
    { to: '/historias', label: 'Histórias' },
    { to: '/transparencia', label: 'Transparência' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F3] text-[#1F1B18]">
      {/* Header: strict 3-zone single-row contract */}
      <header className="sticky top-0 z-40 bg-[#FBF8F3]/95 backdrop-blur-sm border-b border-[#E7DFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#1F1B18] whitespace-nowrap shrink-0 font-display"
          >
            <span className="w-8 h-8 rounded-full bg-[#EA580C] text-white flex items-center justify-center shrink-0">
              <PawPrint className="w-4 h-4" aria-hidden="true" />
            </span>
            <span>Quatro Patas</span>
          </Link>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#524942]" aria-label="Navegação principal">
            {navLinks.map((item) => {
              const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 ${
                    active
                      ? 'text-[#C2410C] border-[#EA580C]'
                      : 'border-transparent hover:text-[#1F1B18] hover:border-[#D6CBB9]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Search + Mobile toggle + 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Pesquisar no site"
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#524942] hover:bg-[#EFE8DC] hover:text-[#1F1B18] transition-colors"
            >
              {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            <Link
              to="/doar"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Quero ajudar
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Abrir menu de navegação"
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-[#1F1B18] hover:bg-[#EFE8DC] transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Global Search Bar Panel */}
        {searchOpen && (
          <div className="border-t border-[#E7DFD3] bg-white px-4 sm:px-6 py-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <Search className="w-4 h-4 text-[#786D65] absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cães por nome ou cidade, campanhas ou histórias..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-full border border-[#D6CBB9] bg-[#FBF8F3] text-sm text-[#1F1B18] focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              {searchResults && (
                <div className="mt-3 pt-3 border-t border-[#F0EAE0] grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-[#786D65] mb-1.5">Cães ({searchResults.dogs.length})</p>
                    {searchResults.dogs.length === 0 ? (
                      <p className="text-xs text-[#8C7B6E]">Nenhum cão encontrado.</p>
                    ) : (
                      <ul className="space-y-1">
                        {searchResults.dogs.map((d) => (
                          <li key={d.id}>
                            <button
                              type="button"
                              onClick={() => navigate(`/adocao/${d.id}`)}
                              className="text-left hover:text-[#C2410C] font-medium block w-full truncate"
                            >
                              {d.name} · {d.location}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#786D65] mb-1.5">Campanhas ({searchResults.campaigns.length})</p>
                    {searchResults.campaigns.length === 0 ? (
                      <p className="text-xs text-[#8C7B6E]">Nenhuma campanha.</p>
                    ) : (
                      <ul className="space-y-1">
                        {searchResults.campaigns.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => navigate(`/campanhas/${c.id}`)}
                              className="text-left hover:text-[#C2410C] font-medium block w-full truncate"
                            >
                              {c.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#786D65] mb-1.5">Histórias ({searchResults.stories.length})</p>
                    {searchResults.stories.length === 0 ? (
                      <p className="text-xs text-[#8C7B6E]">Nenhuma história.</p>
                    ) : (
                      <ul className="space-y-1">
                        {searchResults.stories.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => navigate(`/historias/${s.id}`)}
                              className="text-left hover:text-[#C2410C] font-medium block w-full truncate"
                            >
                              {s.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Responsive Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#E7DFD3] bg-[#FBF8F3] px-4 py-5 space-y-2">
            {[
              { to: '/', label: 'Início' },
              { to: '/adocao', label: 'Adoção' },
              { to: '/campanhas', label: 'Campanhas' },
              { to: '/apadrinhar', label: 'Apadrinhar' },
              { to: '/voluntariado', label: 'Voluntariado' },
              { to: '/historias', label: 'Histórias' },
              { to: '/sobre', label: 'Sobre nós' },
              { to: '/transparencia', label: 'Transparência Financeira' },
              { to: '/contato', label: 'Contato' },
              { to: user ? '/admin' : '/login', label: user ? 'Painel Administrativo' : 'Área da Equipe' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block py-2.5 px-3 rounded-lg text-sm font-medium text-[#1F1B18] hover:bg-[#EFE8DC]"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2">
              <Link
                to="/doar"
                className="block w-full text-center py-3 rounded-full bg-[#EA580C] text-white text-sm font-semibold"
              >
                Quero ajudar — Fazer doação
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Complete Editorial Footer */}
      <footer className="bg-[#1F1B18] text-[#F5EFE6] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-white/10">
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#EA580C] text-white flex items-center justify-center">
                <PawPrint className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="text-xl font-bold font-display text-white">Quatro Patas</span>
            </div>
            <p className="text-sm text-[#D6CBB9] leading-relaxed">
              Cada vida importa. Cada gesto transforma.
            </p>
            <p className="text-xs text-[#A89B8F]">
              {settings.city_label || 'São Paulo, SP'} · {settings.contact_email || 'contato@quatropatas.org'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4 font-sans">Apoie a Causa</h3>
            <ul className="space-y-2.5 text-sm text-[#D6CBB9]">
              <li><Link to="/doar" className="hover:text-white transition-colors">Fazer uma doação</Link></li>
              <li><Link to="/adocao" className="hover:text-white transition-colors">Adotar um cão</Link></li>
              <li><Link to="/campanhas" className="hover:text-white transition-colors">Campanhas ativas</Link></li>
              <li><Link to="/apadrinhar" className="hover:text-white transition-colors">Apadrinhamento</Link></li>
              <li><Link to="/voluntariado" className="hover:text-white transition-colors">Voluntariado</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4 font-sans">Institucional</h3>
            <ul className="space-y-2.5 text-sm text-[#D6CBB9]">
              <li><Link to="/sobre" className="hover:text-white transition-colors">Sobre nós</Link></li>
              <li><Link to="/transparencia" className="hover:text-white transition-colors">Transparência Financeira</Link></li>
              <li><Link to="/historias" className="hover:text-white transition-colors">Histórias de transformação</Link></li>
              <li><Link to="/contato" className="hover:text-white transition-colors">Contato</Link></li>
              <li><Link to="/privacidade" className="hover:text-white transition-colors">Privacidade e LGPD</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4 font-sans">Comunidade & Gestão</h3>
            <ul className="space-y-2.5 text-sm text-[#D6CBB9]">
              {settings.instagram_url && (
                <li>
                  <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    Instagram
                  </a>
                </li>
              )}
              {settings.facebook_url && (
                <li>
                  <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    Facebook
                  </a>
                </li>
              )}
              {settings.youtube_url && (
                <li>
                  <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    YouTube
                  </a>
                </li>
              )}
              <li className="pt-2 border-t border-white/10">
                <Link
                  to={user ? '/admin' : '/login'}
                  className="inline-flex items-center gap-1.5 text-[#FDBA74] hover:text-white transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>{user ? 'Painel Administrativo' : 'Acesso Administrativo'}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A89B8F]">
          <p>© {new Date().getFullYear()} Quatro Patas · Proteção e Adoção Responsável.</p>
          <p>
            Proteção de dados em conformidade com a LGPD ·{' '}
            <Link to="/privacidade" className="underline hover:text-white">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </footer>

      {/* Configurable Floating WhatsApp Button (compact, non-intrusive) */}
      {whatsappEnabled && whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Falar pelo WhatsApp"
          className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold shadow-lg transition-transform hover:scale-[1.03]"
        >
          <MessageCircle className="w-5 h-5" aria-hidden="true" />
          <span className="hidden sm:inline whitespace-nowrap">WhatsApp</span>
        </a>
      )}

      {/* Discreet LGPD Consent Banner */}
      {!lgpdAccepted && (
        <div className="fixed bottom-4 left-4 right-20 sm:right-auto sm:max-w-md z-30 bg-white border border-[#D6CBB9] rounded-2xl p-4 shadow-lg text-xs text-[#524942]">
          <p className="leading-relaxed mb-3">
            Utilizamos apenas cookies essenciais para segurança e funcionamento da plataforma, em conformidade com a{' '}
            <Link to="/privacidade" className="underline text-[#C2410C] font-medium">
              LGPD
            </Link>
            .
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={acceptLgpd}
              className="px-4 py-1.5 rounded-full bg-[#EA580C] text-white font-semibold hover:bg-[#C2410C] transition-colors"
            >
              Aceitar e continuar
            </button>
            <Link
              to="/privacidade"
              className="px-3 py-1.5 rounded-full border border-[#D6CBB9] text-[#524942] hover:text-[#1F1B18]"
            >
              Saiba mais
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
