import * as crypto from 'node:crypto';
import { findConnection } from '../../repositories';
import {
  findPayment,
  findPaymentByProviderSessionId,
  insertPayment,
  updatePaymentStatus,
} from '../../repositories/payments';
import type { IPaymentRecord } from '../../types/payment';
import { createPayfastSession, parsePayfastWebhookEvent } from './payfast';
import { createPaystackSession, parsePaystackWebhookEvent } from './paystack';
import { createStripeSession, parseStripeWebhookEvent } from './stripe';
import type { CreateSessionResult, PaymentProvider } from './types';

export type InitiatePaymentInput = {
  formId: string;
  submissionId: string;
  fieldId: string;
  connectionId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  description?: string;
  returnUrl: string;
};

export type InitiatePaymentResult = {
  paymentId: string;
  redirectUrl: string;
};

export async function initiatePayment(
  input: InitiatePaymentInput,
): Promise<InitiatePaymentResult> {
  // Look up connection to get the provider's secret key
  const connection = await findConnection(input.connectionId);

  if (!connection?.access_token) {
    throw new Error('Payment connection not found or missing credentials.');
  }

  const paymentId = crypto.randomBytes(6).toString('hex');

  // Build the return URL with payment_id for the frontend to poll status
  const returnUrl = new URL(input.returnUrl);
  returnUrl.searchParams.set('payment_id', paymentId);
  const returnUrlString = returnUrl.toString();

  const cancelUrl = returnUrlString;

  const sessionInput = {
    provider: input.provider,
    secretKey: connection.access_token,
    amount: input.amount,
    currency: input.currency,
    description: input.description,
    returnUrl: returnUrlString,
    cancelUrl,
    metadata: {
      payment_id: paymentId,
      form_id: input.formId,
      submission_id: input.submissionId,
      field_id: input.fieldId,
    },
  };

  let session: CreateSessionResult;

  switch (input.provider) {
    case 'stripe':
      session = await createStripeSession(sessionInput);
      break;
    case 'paystack':
      session = await createPaystackSession(sessionInput);
      break;
    case 'payfast':
      session = await createPayfastSession(sessionInput);
      break;
    default:
      throw new Error(`Unsupported payment provider: ${input.provider}`);
  }

  // Persist payment record
  const now = new Date().toISOString();
  const record: IPaymentRecord = {
    id: paymentId,
    form_id: input.formId,
    submission_id: input.submissionId,
    field_id: input.fieldId,
    connection_id: input.connectionId,
    provider: input.provider,
    provider_session_id: session.providerSessionId,
    amount: input.amount,
    currency: input.currency,
    status: 'pending',
    created_at: now,
    updated_at: now,
  };

  await insertPayment(record);

  return {
    paymentId,
    redirectUrl: session.redirectUrl,
  };
}

export async function getPaymentStatus(
  paymentId: string,
): Promise<{ paymentId: string; status: string } | null> {
  const payment = await findPayment(paymentId);

  if (!payment) {
    return null;
  }

  return {
    paymentId: payment.id,
    status: payment.status,
  };
}

export async function handlePaymentWebhook(
  provider: PaymentProvider,
  payload: string,
): Promise<void> {
  let event: {
    providerSessionId: string;
    status: 'succeeded' | 'failed';
  } | null = null;

  switch (provider) {
    case 'stripe':
      event = parseStripeWebhookEvent(payload);
      break;
    case 'paystack':
      event = parsePaystackWebhookEvent(payload);
      break;
    case 'payfast':
      event = parsePayfastWebhookEvent(payload);
      break;
  }

  if (!event) {
    return;
  }

  // Verify the payment record exists before updating
  const payment = await findPaymentByProviderSessionId(
    event.providerSessionId,
  );

  if (!payment) {
    return;
  }

  await updatePaymentStatus(
    event.providerSessionId,
    event.status,
  );
}
