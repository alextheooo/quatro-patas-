import { useEffect, useState } from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import { Campaign, Expense, FinancialReport } from '../types';
import { formatBRL, formatDateBR } from '../lib/format';

interface TransparencyData {
  totalDonationsCents: number;
  totalDonationsCount: number;
  expensesByCategory: Array<{ category: string; total_cents: number }>;
  expenses: Expense[];
  reports: FinancialReport[];
  completedCampaigns: Campaign[];
  confirmedDonations: Array<{
    id: number;
    protocol: string;
    donor_name: string;
    amount_cents: number;
    payment_method: string;
    frequency: string;
    confirmed_at: string;
    campaign_title?: string | null;
  }>;
}

export function TransparencyPage() {
  const [data, setData] = useState<TransparencyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Transparência Financeira – Quatro Patas';
    fetch('/api/transparency')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getCatTotal = (cat: string) =>
    data?.expensesByCategory.find((e) => e.category === cat)?.total_cents || 0;

  const totalExpenses = (data?.expensesByCategory || []).reduce(
    (sum, item) => sum + item.total_cents,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#15803D] uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          <span>Prestação de Contas Real</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1F1B18] [text-wrap:balance] mb-3">
          Transparência Financeira
        </h1>
        <p className="text-base text-[#524942] leading-relaxed">
          Apenas doações efetivamente confirmadas pelo gateway de pagamento (ou conferidas com
          comprovante pela administração) e despesas verificadas são exibidas nesta página.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-[#E7DFD3] p-6">
          <p className="text-xs text-[#786D65] mb-1">Total de doações confirmadas</p>
          <p className="text-3xl font-bold font-display text-[#15803D] tabular-nums">
            {loading ? '—' : formatBRL(data?.totalDonationsCents || 0)}
          </p>
          <p className="text-xs text-[#786D65] mt-1 tabular-nums">
            {data?.totalDonationsCount || 0} contribuições verificadas
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7DFD3] p-6">
          <p className="text-xs text-[#786D65] mb-1">Total de despesas verificadas</p>
          <p className="text-3xl font-bold font-display text-[#1F1B18] tabular-nums">
            {loading ? '—' : formatBRL(totalExpenses)}
          </p>
          <p className="text-xs text-[#786D65] mt-1 tabular-nums">
            {data?.expenses.length || 0} lançamentos auditados
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7DFD3] p-6">
          <p className="text-xs text-[#786D65] mb-1">Campanhas concluídas</p>
          <p className="text-3xl font-bold font-display text-[#C2410C] tabular-nums">
            {loading ? '—' : data?.completedCampaigns.length || 0}
          </p>
          <p className="text-xs text-[#786D65] mt-1">Com meta encerrada</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-[#E7DFD3] py-6">
        {['Veterinário', 'Alimentação', 'Medicamentos', 'Resgates'].map((cat) => (
          <div key={cat}>
            <p className="text-xs text-[#786D65] mb-1">Despesas · {cat}</p>
            <p className="text-xl font-bold text-[#1F1B18] tabular-nums">
              {loading ? '—' : formatBRL(getCatTotal(cat))}
            </p>
          </div>
        ))}
      </div>

      {/* Expenses & Receipts */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1F1B18]">Despesas e Comprovantes</h2>
        {!data || data.expenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E7DFD3] p-8 text-sm text-[#524942]">
            Nenhuma despesa verificada cadastrada até o momento. Lançamentos com comprovantes
            anexados pela administração aparecerão automaticamente nesta tabela.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E7DFD3] overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-[#E7DFD3] text-xs text-[#786D65]">
                <tr>
                  <th className="py-3.5 px-5 font-semibold">Data</th>
                  <th className="py-3.5 px-5 font-semibold">Categoria</th>
                  <th className="py-3.5 px-5 font-semibold">Descrição</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Valor</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EDE3]">
                {data.expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#FBF8F3]">
                    <td className="py-3.5 px-5 text-[#524942] whitespace-nowrap">
                      {formatDateBR(exp.expense_date)}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-[#1F1B18]">{exp.category}</td>
                    <td className="py-3.5 px-5 text-[#524942]">{exp.description}</td>
                    <td className="py-3.5 px-5 text-right font-semibold text-[#1F1B18] tabular-nums">
                      {formatBRL(exp.amount_cents)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {exp.receipt_url ? (
                        <a
                          href={exp.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#C2410C] underline"
                        >
                          Ver anexo
                        </a>
                      ) : (
                        <span className="text-xs text-[#8C7B6E]">Sem anexo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Confirmed Donations Ledger */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1F1B18]">Registro de Doações Confirmadas</h2>
        {!data || data.confirmedDonations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E7DFD3] p-8 text-sm text-[#524942]">
            Ainda não há doações confirmadas registradas no sistema.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E7DFD3] overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-[#E7DFD3] text-xs text-[#786D65]">
                <tr>
                  <th className="py-3.5 px-5 font-semibold">Protocolo</th>
                  <th className="py-3.5 px-5 font-semibold">Apoiador</th>
                  <th className="py-3.5 px-5 font-semibold">Destinação</th>
                  <th className="py-3.5 px-5 font-semibold">Data</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EDE3]">
                {data.confirmedDonations.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3.5 px-5 font-mono text-xs text-[#524942]">{d.protocol}</td>
                    <td className="py-3.5 px-5 font-medium text-[#1F1B18]">{d.donor_name}</td>
                    <td className="py-3.5 px-5 text-[#524942]">
                      {d.campaign_title || 'Fundo Geral'}
                    </td>
                    <td className="py-3.5 px-5 text-[#524942]">{formatDateBR(d.confirmed_at)}</td>
                    <td className="py-3.5 px-5 text-right font-semibold text-[#15803D] tabular-nums">
                      {formatBRL(d.amount_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Financial Reports */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1F1B18]">Relatórios Financeiros Publicados</h2>
        {!data || data.reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E7DFD3] p-8 text-sm text-[#524942]">
            Nenhum relatório financeiro mensal ou anual publicado ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-[#E7DFD3] p-6 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-xs text-[#786D65] mb-1">
                    {rep.period} · Publicado em {formatDateBR(rep.published_at)}
                  </p>
                  <h3 className="text-lg font-bold text-[#1F1B18] mb-1">{rep.title}</h3>
                  <p className="text-sm text-[#524942]">{rep.summary}</p>
                </div>
                <a
                  href={rep.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D6CBB9] text-xs font-semibold text-[#1F1B18] hover:bg-[#F3EDE3]"
                >
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  <span>Abrir</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
