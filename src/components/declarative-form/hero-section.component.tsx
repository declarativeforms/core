import { Button } from "@/components";

export function HeroSection(props: {
  title: string;
  description?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-[480px] mx-auto text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
          {props.title}
        </h1>

        {props.description ? (
          <p className="text-base text-gray-500 leading-relaxed mb-10">
            {props.description}
          </p>
        ) : null}

        {props.onAction ? (
          <Button
            className="w-full h-14 text-base font-semibold"
            onClick={() => props.onAction?.()}
          >
            Continue
          </Button>
        ) : null}
      </div>

      <div className="absolute bottom-8 text-center w-full px-4">
        <p className="text-xs text-gray-500">
          Powered by{" "}
          <a
            href="/"
            className="font-medium text-gray-900 hover:underline underline-offset-4"
          >
            Declarative Forms
          </a>
        </p>
      </div>
    </div>
  );
}
