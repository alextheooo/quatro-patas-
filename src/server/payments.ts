import crypto from 'crypto';

export interface CheckoutInput {
  protocol: string;
  amountCents: number;
  donorName: string;
  donorEmail: string;
  paymentMethod: 'pix' | 'cartao';
  frequency: 'unica' | 'mensal' | 'recorrente';
  description: string;
  appUrl: string;
}

export interface CheckoutResult {
  gatewayConfigured: boolean;
  status: 'awaiting_gateway_config' | 'pending';
  gatewayPaymentId?: string;
  pixQrCode?: string;
  pixQrBase64?: string;
  checkoutUrl?: string;
  message: string;
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_ACCESS_TOKEN.trim().length > 10);
}

export async function createMercadoPagoCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

  if (!token) {
    return {
      gatewayConfigured: false,
      status: 'awaiting_gateway_config',
      message:
        'Gateway de pagamento não configurado neste ambiente. Nenhuma cobrança foi realizada ou simulada.',
    };
  }

  const amountBrl = Number((input.amountCents / 100).toFixed(2));
  const notificationUrl = `${input.appUrl.replace(/\/$/, '')}/api/webhooks/mercadopago`;

  if (input.paymentMethod === 'pix') {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': input.protocol,
      },
      body: JSON.stringify({
        transaction_amount: amountBrl,
        description: input.description,
        payment_method_id: 'pix',
        external_reference: input.protocol,
        notification_url: notificationUrl,
        payer: {
          email: input.donorEmail,
          first_name: input.donorName.split(' ')[0] || input.donorName,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Erro ao gerar cobrança PIX no Mercado Pago: ${response.status} ${errBody}`);
    }

    const data = (await response.json()) as {
      id: number | string;
      point_of_interaction?: {
        transaction_data?: {
          qr_code?: string;
          qr_code_base64?: string;
          ticket_url?: string;
        };
      };
    };

    const txData = data.point_of_interaction?.transaction_data;
    return {
      gatewayConfigured: true,
      status: 'pending',
      gatewayPaymentId: String(data.id),
      pixQrCode: txData?.qr_code || '',
      pixQrBase64: txData?.qr_code_base64 || '',
      checkoutUrl: txData?.ticket_url || '',
      message: 'Cobrança PIX gerada via Mercado Pago. Aguardando confirmação do pagamento.',
    };
  }

  // Cartão de crédito via Mercado Pago Checkout Pro (nenhum dado de cartão passa pelo servidor)
  const prefResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          id: input.protocol,
          title: input.description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amountBrl,
        },
      ],
      payer: {
        name: input.donorName,
        email: input.donorEmail,
      },
      external_reference: input.protocol,
      notification_url: notificationUrl,
      back_urls: {
        success: `${input.appUrl.replace(/\/$/, '')}/doar/confirmacao?protocol=${input.protocol}`,
        pending: `${input.appUrl.replace(/\/$/, '')}/doar/confirmacao?protocol=${input.protocol}`,
        failure: `${input.appUrl.replace(/\/$/, '')}/doar/confirmacao?protocol=${input.protocol}`,
      },
      auto_return: 'approved',
    }),
  });

  if (!prefResponse.ok) {
    const errBody = await prefResponse.text();
    throw new Error(`Erro ao criar checkout no Mercado Pago: ${prefResponse.status} ${errBody}`);
  }

  const prefData = (await prefResponse.json()) as { id: string; init_point?: string };
  return {
    gatewayConfigured: true,
    status: 'pending',
    gatewayPaymentId: prefData.id,
    checkoutUrl: prefData.init_point || '',
    message: 'Checkout seguro gerado. Redirecione para concluir o pagamento.',
  };
}

export function verifyWebhookSignature(
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return true; // Allow verification via API fetch when webhook secret is not configured
  }
  if (!xSignature || !xRequestId) {
    return false;
  }
  const parts = Object.fromEntries(
    xSignature.split(',').map((part) => {
      const [k, v] = part.trim().split('=');
      return [k, v];
    })
  );
  if (!parts.ts || !parts.v1) {
    return false;
  }
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`;
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return hmac === parts.v1;
}

export async function fetchMercadoPagoPaymentStatus(paymentId: string): Promise<{
  status: string;
  externalReference: string;
} | null> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) return null;

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { status: string; external_reference?: string };
  return {
    status: data.status,
    externalReference: data.external_reference || '',
  };
}
