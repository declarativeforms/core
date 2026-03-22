import { useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { Check, Loader2, XCircle } from "lucide-react";

import type { DeclarativeFieldComponentProps } from "../view-support/field-support";
import { FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useFormI18n } from "../view-support/use-form-i18n";
import { cn } from "@/lib/utils";
import {
  getPaymentStatus,
  initiatePayment,
  type PaymentStatusResponse,
} from "./payment/api";

function getPaymentFieldNames(fieldId: string) {
  return {
    paymentId: `${fieldId}__payment_id`,
    paymentStatus: `${fieldId}__payment_status`,
  } as const;
}

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

function usePaymentReturnParams(fieldId: string) {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedPaymentId = params.get("payment_id");
    const returnedFieldId = params.get("payment_field_id");

    if (returnedPaymentId && returnedFieldId === fieldId) {
      return { paymentId: returnedPaymentId };
    }

    return null;
  }, [fieldId]);
}

export function PaymentField({
  field,
  controllerField,
  form,
}: DeclarativeFieldComponentProps) {
  const { t } = useFormI18n();
  const paymentFieldNames = useMemo(
    () => getPaymentFieldNames(field.id),
    [field.id],
  );

  const provider =
    field.type === "payment" ? (field.provider ?? "stripe") : "stripe";
  const connectionId =
    field.type === "payment" ? (field.connection_id ?? "") : "";
  const amount = field.type === "payment" ? (field.amount ?? 0) : 0;
  const currency = field.type === "payment" ? (field.currency ?? "USD") : "USD";
  const description =
    field.type === "payment" ? (field.description ?? "") : "";

  const [isInitiating, setIsInitiating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Register hidden fields for payment metadata
  useEffect(() => {
    form.register(paymentFieldNames.paymentId);
    form.register(paymentFieldNames.paymentStatus);

    const options = {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    } as const;

    if (form.getValues(paymentFieldNames.paymentId) === undefined) {
      form.setValue(paymentFieldNames.paymentId, "", options);
    }

    if (form.getValues(paymentFieldNames.paymentStatus) === undefined) {
      form.setValue(paymentFieldNames.paymentStatus, "", options);
    }
  }, [form, paymentFieldNames]);

  const watchedPaymentStatus = useWatch({
    control: form.control,
    name: paymentFieldNames.paymentStatus,
  });

  const paymentStatus =
    typeof watchedPaymentStatus === "string" ? watchedPaymentStatus : "";
  const isSucceeded = paymentStatus === "succeeded";
  const isFailed = paymentStatus === "failed" || paymentStatus === "cancelled";

  // Handle return from payment provider redirect
  const returnParams = usePaymentReturnParams(field.id);

  useEffect(() => {
    if (!returnParams?.paymentId) {
      return;
    }

    // Already resolved
    if (isSucceeded || (isFailed && !isPolling)) {
      return;
    }

    const paymentId = returnParams.paymentId;

    const setFieldValues = (status: PaymentStatusResponse) => {
      const options = {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: true,
      } as const;

      form.setValue(paymentFieldNames.paymentId, status.paymentId, options);
      form.setValue(paymentFieldNames.paymentStatus, status.status, options);
      controllerField.onChange(status.paymentId);
    };

    let cancelled = false;

    async function pollStatus() {
      setIsPolling(true);
      setErrorMessage(null);

      try {
        const status = await getPaymentStatus(paymentId);

        if (cancelled) return;

        if (status.status === "succeeded") {
          setFieldValues(status);
          setIsPolling(false);
          return;
        }

        if (status.status === "failed" || status.status === "cancelled") {
          setFieldValues(status);
          setIsPolling(false);
          setErrorMessage(t("payment.failed"));
          return;
        }

        // Still pending — poll again after a delay
        setTimeout(() => {
          if (!cancelled) {
            void pollStatus();
          }
        }, 3000);
      } catch {
        if (!cancelled) {
          setIsPolling(false);
          setErrorMessage(t("payment.status_check_failed"));
        }
      }
    }

    void pollStatus();

    return () => {
      cancelled = true;
    };
  }, [
    returnParams,
    isSucceeded,
    isFailed,
    isPolling,
    form,
    paymentFieldNames,
    controllerField,
    t,
  ]);

  const handleInitiatePayment = async () => {
    setIsInitiating(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams(window.location.search);
      const formId = params.get("form_id") || window.location.pathname.split("/")[1] || "";
      const submissionId = params.get("submission_id") || "";

      // Build return URL that preserves existing params
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set("payment_field_id", field.id);
      // payment_id will be appended by the backend before redirecting

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
      setIsInitiating(false);
      setErrorMessage(t("payment.initiate_failed"));
    }
  };

  const handleRetryPayment = () => {
    const options = {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    } as const;

    form.setValue(paymentFieldNames.paymentId, "", options);
    form.setValue(paymentFieldNames.paymentStatus, "", options);
    controllerField.onChange("");
    setErrorMessage(null);
  };

  // Payment succeeded
  if (isSucceeded) {
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

  // Polling for status after return
  if (isPolling) {
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

  // Payment failed — allow retry
  if (isFailed) {
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
              <p className="text-sm text-red-700">
                {errorMessage || t("payment.failed")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleRetryPayment}
          >
            {t("payment.retry")}
          </Button>
        </div>
      </FormControl>
    );
  }

  // Default state — show payment details and pay button
  return (
    <FormControl>
      <div className="space-y-3">
        <div
          className={cn(
            "border rounded-md p-4",
            "border-border bg-muted/40",
          )}
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

        {errorMessage ? (
          <p className="text-sm text-destructive" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}

        <Button
          type="button"
          className="w-full"
          disabled={isInitiating}
          onClick={() => {
            void handleInitiatePayment();
          }}
        >
          {isInitiating ? (
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
