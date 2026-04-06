import { Github, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button, PageShell } from "@/components";
import { Input } from "@/components/ui";
import { getGitHubOAuthUrl, sendMagicLink } from "@/lib/auth";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkError = searchParams.get("error");

  useEffect(() => {
    document.title = "Sign in — Declarative Forms Studio";
  }, []);

  const handleSendMagicLink = async () => {
    if (!email) return;

    setIsSending(true);
    setError(null);

    const redirectUrl = `${window.location.origin}/auth/callback`;
    const result = await sendMagicLink(email, redirectUrl);

    setIsSending(false);

    if (!result) {
      setError("Unable to send sign-in link. Please try again.");
      return;
    }

    setIsSent(true);
  };

  if (isSent) {
    return (
      <PageShell className="items-center justify-center bg-muted/30">
        <div className="flex w-full max-w-sm flex-col items-center text-center">
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
            <span className="font-medium text-foreground">{email}</span>.
            Click the link in the email to sign in.
          </p>

          <div className="mt-4 w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSent(false);
                setEmail("");
              }}
            >
              <ArrowLeft className="size-4" />
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
      <div className="flex w-full max-w-sm flex-col items-center text-center">
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
          Sign in with GitHub to get started.
        </p>

        <div className="mt-4 w-full">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              window.location.href = getGitHubOAuthUrl();
            }}
          >
            <Github className="size-4" />
            Continue with GitHub
          </Button>
        </div>

        <div className="mt-4 flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form
          className="mt-4 w-full space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMagicLink();
          }}
        >
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            required
          />
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={isSending || !email}
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            {isSending ? "Sending..." : "Continue with Email"}
          </Button>
        </form>

        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}

        {linkError === "invalid_link" && !error && (
          <p className="mt-2 text-xs text-destructive">
            That sign-in link is invalid or has expired. Please try again.
          </p>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          By continuing, you agree to our terms of service.
        </p>
      </div>
    </PageShell>
  );
}
