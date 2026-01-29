import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components";
import { BasePage } from "./base.page";

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
    <BasePage
      title="Success"
      description=" Your connection has been successfully created. Use the ID below in your YAML configuration."
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-900">
          Connection ID
        </label>
        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg group">
          <code className="flex-1 font-mono text-sm text-gray-800 break-all">
            {id}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyToClipboard}
            className="h-10 w-10 text-gray-500 hover:text-gray-900"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        This ID connects your form to Airtable, GitHub, or Google Sheets.
      </p>
    </BasePage>
  );
}
