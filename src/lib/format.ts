export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents || 0) / 100);
}

export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function statusTextStyle(status: string): string {
  switch (status) {
    case 'Disponível':
    case 'Ativa':
    case 'confirmed':
    case 'approved':
    case 'Aprovado':
    case 'Ativo':
      return 'text-[#15803D] font-semibold';
    case 'Em tratamento':
    case 'Em processo':
    case 'Em análise':
    case 'pending':
    case 'Pendente':
    case 'awaiting_gateway_config':
      return 'text-[#B45309] font-semibold';
    case 'Adotado':
    case 'Concluída':
      return 'text-[#1F1B18] font-semibold';
    default:
      return 'text-[#6B625B] font-medium';
  }
}

export function translateDonationStatus(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'pending':
      return 'Aguardando pagamento';
    case 'awaiting_gateway_config':
      return 'Aguardando configuração do gateway';
    case 'cancelled':
      return 'Cancelada';
    case 'failed':
      return 'Não concluída';
    default:
      return status;
  }
}
