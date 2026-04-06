import { Copy, QrCode } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@/components";

function buildShareUrl(formId: string) {
  return `https://frms.dev/${formId}`;
}

function buildEmbedCode(formId: string) {
  return `<iframe src="${buildShareUrl(formId)}?embed=true" width="100%" height="600" frameborder="0"></iframe>`;
}

export function SharePanel({ formId }: { formId: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  const shareUrl = buildShareUrl(formId);
  const embedCode = buildEmbedCode(formId);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="gap-1 px-4 pb-4 sm:px-6">
          <CardTitle className="text-base font-semibold">Share link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 sm:px-6">
          <p className="text-sm text-muted-foreground">
            Use this link to send respondents directly to your form.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input readOnly value={shareUrl} className="font-mono text-sm" />
            <Button type="button" variant="outline" onClick={handleCopy} className="sm:w-28">
              <Copy />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="gap-1 px-4 pb-4 sm:px-6">
            <CardTitle className="text-base font-semibold">Embed code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            <p className="text-sm text-muted-foreground">
              Paste this snippet into your site to embed the form directly.
            </p>
            <Textarea
              readOnly
              value={embedCode}
              className="min-h-36 resize-none font-mono text-sm [field-sizing:fixed]"
            />
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="gap-1 px-4 pb-4 sm:px-6">
            <CardTitle className="text-base font-semibold">QR code</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <QrCode className="size-6" />
                <span>QR Code</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
