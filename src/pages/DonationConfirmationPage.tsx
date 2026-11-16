import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { formatBRL, formatDateBR, translateDonationStatus } from '../lib/format';

interface DonationProtocolDetail {
  protocol: string;
  donor_name: string;
  amount_cents: number;
  frequency: string;
  payment_method: string;
  status: string;
  pix_qr_code?: string;
  pix_qr_base64?: string;
  checkout_url?: string;
  campaign_title?: string | null;
  dog_name?: string | null;
  created_at: string;
  confirmed_at?: string | null;
  gatewayConfigured: boolean;
}

export function DonationConfirmationPage() {
  const [searchParams] = useSearchParams();
  const protocol = searchParams.get('protocol') || '';
  const [detail, setDetail] = useState<DonationProtocolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = 'Confirmação de Doação – Quatro Patas';
    if (!protocol) {
      setLoading(false);
      return;
    }
    fetch(`/api/donations/protocol/${encodeURIComponent(protocol)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDetail(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [protocol]);

  const copyPix = async () => {
    if (!detail?.pix_qr_code) return;
    await navigator.clipboard.writeText(detail.pix_qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-sm text-[#786D65]">
        Consultando protocolo da doação...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#1F1B18]">Protocolo não encontrado</h1>
        <p className="text-sm text-[#524942]">
          Verifique o código informado ou inicie uma nova doação.
        </p>
        <Link
          to="/doar"
          className="inline-block px-6 py-3 rounded-full bg-[#EA580C] text-white text-sm font-semibold"
        >
          Voltar para Doações
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-3xl border border-[#E7DFD3] p-8 space-y-6">
        <div className="flex items-start gap-3">
          {detail.status === 'confirmed' ? (
            <CheckCircle2 className="w-7 h-7 text-[#15803D] shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-7 h-7 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div>
            <p className="text-xs font-mono text-[#786D65] mb-1">Protocolo {detail.protocol}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1B18]">
              {detail.status === 'confirmed'
                ? 'Doação confirmada! Muito obrigado.'
                : 'Solicitação de doação registrada'}
            </h1>
          </div>
        </div>

        <div className="border-y border-[#F0EAE0] py-5 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[#786D65]">Doador</span>
            <span className="font-semibold text-[#1F1B18]">{detail.donor_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#786D65]">Valor</span>
            <span className="font-bold text-[#1F1B18] tabular-nums">
              {formatBRL(detail.amount_cents)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#786D65]">Modalidade / Meio</span>
            <span className="capitalize text-[#1F1B18]">
              {detail.frequency} · {detail.payment_method.toUpperCase()}
            </span>
          </div>
          {detail.campaign_title && (
            <div className="flex justify-between">
              <span className="text-[#786D65]">Campanha</span>
              <span className="text-[#1F1B18] font-medium">{detail.campaign_title}</span>
            </div>
          )}
          {detail.dog_name && (
            <div className="flex justify-between">
              <span className="text-[#786D65]">Apadrinhamento</span>
              <span className="text-[#1F1B18] font-medium">{detail.dog_name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#786D65]">Status atual</span>
            <span className="font-semibold text-[#C2410C]">
              {translateDonationStatus(detail.status)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#786D65]">Data de registro</span>
            <span className="text-[#1F1B18]">{formatDateBR(detail.created_at)}</span>
          </div>
        </div>

        {/* Gateway Real PIX / Checkout Pro OR Honest Unconfigured Notice */}
        {detail.status === 'awaiting_gateway_config' && (
          <div className="rounded-2xl bg-[#FBF8F3] border border-[#E7DFD3] p-5 text-sm text-[#524942] space-y-2">
            <p className="font-semibold text-[#1F1B18]">
              Integração de pagamento aguardando credenciais
            </p>
            <p className="leading-relaxed">
              Esta plataforma não simula cobranças aprovadas. Assim que a chave{' '}
              <code className="font-mono text-xs">MERCADOPAGO_ACCESS_TOKEN</code> for configurada
              no servidor, o QR Code PIX ou link oficial de cartão será gerado automaticamente nesta
              etapa e confirmado por webhook oficial.
            </p>
          </div>
        )}

        {detail.pix_qr_code && (
          <div className="rounded-2xl bg-[#FBF8F3] border border-[#E7DFD3] p-5 space-y-4">
            <p className="text-sm font-semibold text-[#1F1B18]">Pague via PIX Copia e Cola</p>
            {detail.pix_qr_base64 && (
              <img
                src={`data:image/png;base64,${detail.pix_qr_base64}`}
                alt="QR Code PIX"
                className="w-48 h-48 mx-auto rounded-xl border border-[#E7DFD3]"
              />
            )}
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={detail.pix_qr_code}
                className="flex-1 px-3 py-2 rounded-xl border border-[#D6CBB9] bg-white text-xs font-mono"
              />
              <button
                type="button"
                onClick={copyPix}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EA580C] text-white text-xs font-semibold"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        )}

        {detail.checkout_url && detail.status === 'pending' && (
          <a
            href={detail.checkout_url}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors"
          >
            <span>Abrir ambiente seguro de pagamento</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/transparencia"
            className="px-5 py-2.5 rounded-full border border-[#D6CBB9] text-sm font-medium text-[#1F1B18] hover:bg-[#F3EDE3]"
          >
            Ver Transparência Financeira
          </Link>
          <Link
            to="/adocao"
            className="px-5 py-2.5 rounded-full bg-[#1F1B18] text-white text-sm font-semibold hover:bg-[#3A332E]"
          >
            Conhecer nossos cães
          </Link>
        </div>
      </div>
    </div>
  );
}
