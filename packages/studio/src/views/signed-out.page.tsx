import { LogIn } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { ErrorState } from '@/components/feedback';

export function SignedOut(props: {
  errorMessage: string | null;
  onSignIn: () => void;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-medium">Declarative Forms Studio</h1>
            <p className="text-sm text-muted-foreground">
              Describe a form in plain language. Studio writes the schema,
              validates it, saves it, and gives you a link to share.
            </p>
          </div>
          {props.errorMessage ? (
            <ErrorState message={props.errorMessage} />
          ) : null}
          <Button onClick={props.onSignIn}>
            <LogIn className="size-4" />
            Continue with GitHub
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
