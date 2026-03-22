import { useEffect, useRef, useState } from "react";
import { Check, Loader2, XCircle } from "lucide-react";

import type { DeclarativeFieldComponentProps } from "../view-support/field-support";
import { FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useFormI18n } from "../view-support/use-form-i18n";
import { cn } from "@/lib/utils";
import { getPaymentStatus, initiatePayment } from "./payment/api";

const POLL_INTERVAL_MS = 3_000;
const DEFAULT_CURRENCY = "USD";

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `${currency} ${(amount / 100).toFixed(2)}`;
  }
}

function getReturnedPaymentId(fieldId: string): string | null {
  const params = new URLSearchParams(window.location.search);

  if (params.get("payment_field_id") === fieldId) {
    return params.get("payment_id");
  }

  return null;
}

type PaymentState =
  | { status: "idle" }
  | { status: "initiating" }
  | { status: "polling" }
  | { status: "succeeded"; paymentId: string }
  | { status: "failed"; message: string };

export function PaymentField({
  field,
  controllerField,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();

  const provider =
    field.type === "payment" ? (field.provider ?? "stripe") : "stripe";
  const connectionId =
    field.type === "payment" ? (field.connection_id ?? "") : "";
  const amount = field.type === "payment" ? (field.amount ?? 0) : 0;
  const currency =
    field.type === "payment"
      ? (field.currency ?? DEFAULT_CURRENCY)
      : DEFAULT_CURRENCY;
  const description =
    field.type === "payment" ? (field.description ?? "") : "";

  // If the field already has a value (e.g. navigated back then forward),
  // treat it as a completed payment.
  const initialValue =
    typeof controllerField.value === "string" ? controllerField.value : "";

  const [state, setState] = useState<PaymentState>(() =>
    initialValue ? { status: "succeeded", paymentId: initialValue } : { status: "idle" },
  );

  // Poll for payment status after returning from provider redirect.
  // This runs once on mount — redirect causes a full page reload so
  // there's no risk of stale closures.
  const hasPolledRef = useRef(false);

  useEffect(() => {
    if (hasPolledRef.current) return;
    if (initialValue) return; // already resolved from a previous visit

    const paymentId = getReturnedPaymentId(field.id);
    if (!paymentId) return;

    hasPolledRef.current = true;
    let cancelled = false;
    const returnedPaymentId = paymentId;

    async function poll() {
      setState({ status: "polling" });

      try {
        const result = await getPaymentStatus(returnedPaymentId);

        if (cancelled) return;

        if (result.status === "succeeded") {
          controllerField.onChange(returnedPaymentId);
          setState({ status: "succeeded", paymentId: returnedPaymentId });
          return;
        }

        if (result.status === "failed" || result.status === "cancelled") {
          setState({ status: "failed", message: t("payment.failed") });
          return;
        }

        // Still pending — poll again
        setTimeout(() => {
          if (!cancelled) void poll();
        }, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) {
          setState({
            status: "failed",
            message: t("payment.status_check_failed"),
          });
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;
    };
  }, [field.id, initialValue, controllerField, t]);

  const handleInitiatePayment = async () => {
    setState({ status: "initiating" });

    try {
      // Extract form ID from the URL path (e.g. /:formId?...)
      const pathSegments = window.location.pathname.split("/").filter(Boolean);
      const formId = pathSegments[0] || "";

      if (!formId) {
        setState({ status: "failed", message: t("payment.initiate_failed") });
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const submissionId = params.get("submission_id") || "";

      // Build return URL that preserves existing params
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set("payment_field_id", field.id);

      const result = await initiatePayment({
        formId,
        submissionId,
        fieldId: field.id,
        connectionId,
        provider,
        amount,
        currency,
        description,
        returnUrl: returnUrl.toString(),
      });

      // Redirect to payment provider
      window.location.href = result.redirectUrl;
    } catch {
      setState({ status: "failed", message: t("payment.initiate_failed") });
    }
  };

  // --- Render based on state ---

  if (state.status === "succeeded") {
    return (
      <FormControl>
        <div
          className={cn(
            "border rounded-md p-4",
            "border-green-200 bg-green-50",
          )}
        >
          <div className="flex items-center gap-2">
            <Check
              className="h-5 w-5 text-green-600 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-green-800">
                {t("payment.succeeded")}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {formatAmount(amount, currency)}
              </p>
            </div>
          </div>
        </div>
      </FormControl>
    );
  }

  if (state.status === "polling") {
    return (
      <FormControl>
        <div
          className={cn(
            "border border-dashed rounded-md p-4",
            "border-border bg-muted/40",
            "flex items-center justify-center gap-2",
          )}
        >
          <Loader2
            className="h-5 w-5 text-muted-foreground animate-spin"
            aria-hidden="true"
          />
          <span className="text-sm text-muted-foreground">
            {t("payment.confirming")}
          </span>
        </div>
      </FormControl>
    );
  }

  if (state.status === "failed") {
    return (
      <FormControl>
        <div className="space-y-3">
          <div
            className={cn(
              "border rounded-md p-4",
              "border-red-200 bg-red-50",
            )}
          >
            <div className="flex items-center gap-2">
              <XCircle
                className="h-5 w-5 text-red-500 shrink-0"
                aria-hidden="true"
              />
              <p className="text-sm text-red-700">{state.message}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setState({ status: "idle" })}
          >
            {t("payment.retry")}
          </Button>
        </div>
      </FormControl>
    );
  }

  // Default: idle or initiating
  return (
    <FormControl>
      <div className="space-y-3">
        <div
          className={cn("border rounded-md p-4", "border-border bg-muted/40")}
        >
          <div className="space-y-1">
            {description ? (
              <p className="text-sm text-foreground">{description}</p>
            ) : null}
            <p className="text-lg font-semibold text-foreground">
              {formatAmount(amount, currency)}
            </p>
          </div>
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={state.status === "initiating"}
          onClick={() => {
            void handleInitiatePayment();
          }}
        >
          {state.status === "initiating" ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              {t("payment.processing")}
            </>
          ) : (
            t("payment.pay_now")
          )}
        </Button>
      </div>
    </FormControl>
  );
}
