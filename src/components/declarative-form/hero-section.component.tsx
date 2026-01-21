import { Button } from "@/components";

export function HeroSection(props: {
  title: string;
  description?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-[480px] mx-auto text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6">
          {props.title}
        </h1>

        {props.description ? (
          <p className="text-base text-muted-foreground leading-relaxed mb-12">
            {props.description}
          </p>
        ) : null}

        {props.onAction ? (
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={() => props.onAction?.()}
          >
            Continue
          </Button>
        ) : null}
      </div>

      <div className="absolute bottom-8 text-center w-full px-4">
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="/"
            className="font-medium text-primary hover:underline underline-offset-4"
          >
            Declarative Forms
          </a>
        </p>
      </div>
    </div>
  );
}
