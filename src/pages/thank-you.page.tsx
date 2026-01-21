export function ThankYouPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Thank You!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your submission has been received.
        </p>
      </div>
      <div className="absolute bottom-4 text-center w-full">
        <p className="text-sm text-muted-foreground">
          Powered by{" "}
          <a href="/" className="font-semibold text-primary">
            Declarative Forms
          </a>
        </p>
      </div>
    </div>
  );
}
