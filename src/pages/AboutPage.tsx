import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AuthContext';
import { ResilientImage } from '../components/ResilientImage';

export function AboutPage() {
  const { settings } = useApp();

  useEffect(() => {
    document.title = 'Sobre Nós – Quatro Patas';
  }, []);

  const isDemo = settings.about_is_demo !== '0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-4">
          <p className="text-xs font-semibold text-[#C2410C] uppercase tracking-wider">
            Sobre a Quatro Patas
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1B18] [text-wrap:balance]">
            Cuidado veterinário, proteção e responsabilidade em cada resgate
          </h1>
          <p className="text-base text-[#524942] leading-relaxed">
            {settings.about_mission ||
              'Resgatar cães em situação de abandono ou maus-tratos, oferecer atendimento veterinário completo e conectá-los a famílias responsáveis com total transparência.'}
          </p>
          {isDemo && (
            <p className="text-xs text-[#786D65] bg-[#F3EDE3] rounded-xl px-4 py-3">
              Conteúdo institucional demonstrativo. Personalize missão, história, valores e equipe
              real no Painel Administrativo quando os dados definitivos estiverem cadastrados.
            </p>
          )}
        </div>
        <div className="lg:col-span-6 aspect-[16/10] rounded-3xl overflow-hidden bg-[#EFE8DC] border border-[#E7DFD3]">
          <ResilientImage
            src="/src/assets/images/campaign_shelter_care_1794855384779.jpg"
            alt="Atendimento veterinário e cuidado com cães resgatados"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* História & Valores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[#E7DFD3] pt-12">
        <div className="bg-white rounded-3xl border border-[#E7DFD3] p-8 space-y-3">
          <h2 className="text-2xl font-bold text-[#1F1B18]">Nossa história</h2>
          <p className="text-sm text-[#524942] leading-relaxed">
            {settings.about_history ||
              'Espaço destinado à trajetória real da instituição, data de fundação e marcos de atuação.'}
          </p>
        </div>
        <div className="bg-white rounded-3xl border border-[#E7DFD3] p-8 space-y-3">
          <h2 className="text-2xl font-bold text-[#1F1B18]">Nossos valores</h2>
          <p className="text-sm text-[#524942] leading-relaxed">
            {settings.about_values ||
              'Respeito à vida, adoção criteriosa, prestação de contas aberta à comunidade e guarda responsável.'}
          </p>
        </div>
      </div>

      {/* Como funciona o trabalho de resgate */}
      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1F1B18]">
          Como funciona nosso protocolo de resgate
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01. Acolhimento',
              text: 'Resgate planejado com segurança e transporte adequado para evitar estresse ou lesões.',
            },
            {
              step: '02. Triagem Clínica',
              text: 'Exames laboratoriais, controle de dor, vacinação, vermifugação e castração.',
            },
            {
              step: '03. Reabilitação',
              text: 'Socialização paciente com equipe e voluntários para recuperar a confiança humana.',
            },
            {
              step: '04. Lar Definitivo',
              text: 'Entrevista detalhada, avaliação do ambiente da família e acompanhamento pós-adoção.',
            },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-2xl border border-[#E7DFD3] p-6">
              <h3 className="text-base font-bold text-[#1F1B18] mb-2">{item.step}</h3>
              <p className="text-sm text-[#524942] leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Uso dos recursos + Equipe e Parceiros */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-[#E7DFD3] pt-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#1F1B18]">Como os recursos são utilizados</h2>
          <p className="text-sm text-[#524942] leading-relaxed">
            Todas as contribuições confirmadas são direcionadas para consultas, exames, medicamentos,
            alimentação adequada e manutenção do espaço de acolhimento. Cada lançamento aprovado
            fica disponível para consulta pública.
          </p>
          <Link
            to="/transparencia"
            className="inline-block px-6 py-3 rounded-full bg-[#15803D] text-white text-sm font-semibold hover:bg-[#166534] transition-colors"
          >
            Acessar Transparência Financeira
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-[#E7DFD3] p-8 space-y-4">
          <h2 className="text-2xl font-bold text-[#1F1B18]">Equipe e parceiros</h2>
          <p className="text-sm text-[#524942] leading-relaxed">
            Área reservada para apresentação nominal da diretoria, médicos-veterinários responsáveis
            (CRMV), voluntários coordenadores e clínicas/empresas parceiras reais.
          </p>
          <p className="text-xs text-[#786D65]">
            Status atual: Cadastro institucional demonstrativo · Nenhum nome fictício ou parceria
            inventada é exibida como real.
          </p>
        </div>
      </section>
    </div>
  );
}
