import { getBackendUrl } from "@/lib/api";

export type InitiatePaymentRequest = {
  formId: string;
  submissionId: string;
  fieldId: string;
  connectionId: string;
  provider: string;
  amount: number;
  currency: string;
  description?: string;
  returnUrl: string;
};

export type InitiatePaymentResponse = {
  paymentId: string;
  redirectUrl: string;
};

export type PaymentStatusResponse = {
  paymentId: string;
  status: "pending" | "succeeded" | "failed" | "cancelled";
};

export async function initiatePayment(
  request: InitiatePaymentRequest,
): Promise<InitiatePaymentResponse> {
  const url = getBackendUrl("payments/initiate");

  const response = await fetch(url, {
    body: JSON.stringify(request),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to initiate payment.");
  }

  return (await response.json()) as InitiatePaymentResponse;
}

export async function getPaymentStatus(
  paymentId: string,
): Promise<PaymentStatusResponse> {
  const url = getBackendUrl(`payments/${encodeURIComponent(paymentId)}/status`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to retrieve payment status.");
  }

  return (await response.json()) as PaymentStatusResponse;
}
