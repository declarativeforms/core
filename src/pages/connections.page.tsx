import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components";

export function ConnectionsPage() {
  const [searchParams] = useSearchParams();

  const id = searchParams.get("id");

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (id) {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!id) {
    return null;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 md:py-16">
      <Card className="w-full bg-white border-neutral-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-6 border-b border-neutral-100/50">
          <CardTitle className="text-xl font-bold tracking-tight text-neutral-900">
            Success!
          </CardTitle>
          <CardDescription className="mt-2 text-base text-neutral-500 leading-normal">
            Your connection has been successfully created. Use the ID below in
            your YAML configuration.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-700">
              Connection ID
            </label>
            <div className="flex items-center gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-lg group">
              <code className="flex-1 font-mono text-sm text-neutral-800 break-all">
                {id}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyToClipboard}
                className="h-8 w-8 text-neutral-500 hover:text-neutral-900"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-neutral-400">
            This ID connects your form to Airtable, GitHub, or Google Sheets.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
