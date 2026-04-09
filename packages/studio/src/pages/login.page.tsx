import { Github, Mail, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  PageShell,
} from "@/components";
import { Input } from "@/components/ui";
import { getGitHubOAuthUrl, sendMagicLink } from "@/lib/auth";

export function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      email: searchParams.get("email") ?? "",
    },
  });

  useEffect(() => {
    document.title = "Sign in — Declarative Forms Studio";
  }, []);

  if (searchParams.get("sent") === "1" && !searchParams.get("error")) {
    return (
      <PageShell className="items-center justify-center bg-muted/30">
        <div className="flex w-full max-w-sm flex-col items-center rounded-3xl bg-background/80 px-6 py-8 text-center shadow-sm ring-1 ring-border/70 backdrop-blur-sm">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-6 text-primary" />
          </div>

          <div className="mt-4 space-y-0.5">
            <h1 className="text-xl font-semibold text-foreground">
              Check your email
            </h1>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            We sent a sign-in link to{" "}
            <span className="font-medium text-foreground">
              {searchParams.get("email") ?? ""}
            </span>
            . Click the link in the email to sign in.
          </p>

          <div className="mt-4 w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-background shadow-sm hover:bg-background"
              onClick={() => {
                reset({ email: "" });
                setSearchParams({});
              }}
            >
              <ArrowLeft />
              Back to sign in
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="items-center justify-center bg-muted/30">
      <div className="flex w-full max-w-sm flex-col items-center rounded-3xl bg-background/80 px-6 py-8 text-center shadow-sm ring-1 ring-border/70 backdrop-blur-sm">
        <img
          src="/android-chrome-192x192.png"
          alt="Declarative Forms"
          className="size-12"
        />

        <div className="mt-4 space-y-0.5">
          <h1 className="text-xl font-semibold text-foreground">
            Declarative Forms
          </h1>
          <p className="text-sm font-medium text-muted-foreground">Studio</p>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with GitHub to manage forms, submissions, and completion
          flows from one place.
        </p>

        <div className="mt-4 w-full">
          <Button
            type="button"
            className="w-full shadow-sm"
            onClick={() => {
              window.location.href = getGitHubOAuthUrl();
            }}
          >
            <Github />
            Continue with GitHub
          </Button>
        </div>

        <div className="mt-4 flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form
          className="mt-4 w-full"
          onSubmit={handleSubmit(async ({ email }) => {
            clearErrors("root");

            const redirectUrl = `${window.location.origin}/auth/callback`;
            const result = await sendMagicLink(email, redirectUrl);

            if (!result) {
              setError("root", {
                message: "Unable to send sign-in link. Please try again.",
              });

              return;
            }

            reset({ email });
            setSearchParams({
              email,
              sent: "1",
            });
          })}
        >
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <FieldDescription>
                Use email if you prefer a passwordless sign-in link.
              </FieldDescription>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="bg-background shadow-sm"
                {...register("email", {
                  required: "Email is required.",
                  onChange: () => clearErrors("root"),
                })}
              />
            </Field>

            <Button
              type="submit"
              variant="outline"
              className="w-full bg-background shadow-sm hover:bg-background"
              disabled={isSubmitting}
            >
              <Mail />
              Continue with Email
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-3 text-xs text-muted-foreground">
          By continuing, you agree to our terms of service.
        </p>
      </div>
    </PageShell>
  );
}
