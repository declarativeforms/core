import { Mail, ArrowLeft } from "lucide-react";

function Github(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1em"
      height="1em"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.99 3.23 9.21 7.71 10.71.56.1.76-.24.76-.54 0-.27-.01-1.16-.02-2.1-3.14.68-3.8-1.34-3.8-1.34-.51-1.29-1.25-1.63-1.25-1.63-1.02-.7.08-.69.08-.69 1.12.08 1.71 1.15 1.71 1.15 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.14-1.25-5.14-5.58 0-1.23.44-2.24 1.15-3.03-.12-.28-.5-1.43.11-2.98 0 0 .94-.3 3.07 1.16.89-.25 1.85-.37 2.8-.38.95.01 1.91.13 2.8.38 2.13-1.46 3.07-1.16 3.07-1.16.61 1.55.23 2.7.11 2.98.72.79 1.15 1.8 1.15 3.03 0 4.34-2.65 5.29-5.16 5.57.4.35.76 1.03.76 2.08 0 1.5-.01 2.71-.01 3.08 0 .3.2.65.77.54 4.48-1.5 7.7-5.72 7.7-10.71C23.25 5.48 18.27.5 12 .5z" />
    </svg>
  );
}

import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

import { Button, Field, FieldGroup, FieldLabel, PageShell } from "@/components";
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
          Define forms in YAML. The platform renders the experience.
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
