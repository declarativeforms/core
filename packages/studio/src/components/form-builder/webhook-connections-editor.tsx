import { Plus, Trash2, Webhook } from "lucide-react";

import type { IConnection, IWebhookConnection } from "@/lib/declarative-form-types";
import { Button, Input, Label } from "@/components/ui";

import { BuilderInset, BuilderSectionTitle } from "./panel-shell";

type WebhookConnectionsEditorProps = {
  connections: IConnection[] | undefined;
  onChange: (nextConnections: IConnection[] | undefined) => void;
};

function isWebhookConnection(
  connection: IConnection | undefined,
): connection is IWebhookConnection {
  return connection?.type === "webhook";
}

function normalizeWebhookConnection(connection: IWebhookConnection): IWebhookConnection {
  return {
    type: "webhook",
    url: connection.url ?? "",
    ...(connection.when?.trim()
      ? {
          when: connection.when,
        }
      : {}),
  };
}

function mergeWebhookConnections(
  existingConnections: IConnection[] | undefined,
  nextWebhookConnections: IWebhookConnection[],
) {
  const merged: IConnection[] = [];
  let webhookIndex = 0;

  for (const connection of existingConnections ?? []) {
    if (isWebhookConnection(connection)) {
      if (webhookIndex < nextWebhookConnections.length) {
        merged.push(normalizeWebhookConnection(nextWebhookConnections[webhookIndex]));
        webhookIndex += 1;
      }

      continue;
    }

    merged.push(connection);
  }

  while (webhookIndex < nextWebhookConnections.length) {
    merged.push(normalizeWebhookConnection(nextWebhookConnections[webhookIndex]));
    webhookIndex += 1;
  }

  return merged.length > 0 ? merged : undefined;
}

export function WebhookConnectionsEditor({
  connections,
  onChange,
}: WebhookConnectionsEditorProps) {
  const webhookConnections = (connections ?? []).filter(isWebhookConnection);
  const unsupportedConnections = (connections ?? []).filter(
    (connection) => !isWebhookConnection(connection),
  );

  const handleUpdateWebhookConnections = (nextWebhookConnections: IWebhookConnection[]) => {
    onChange(mergeWebhookConnections(connections, nextWebhookConnections));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <BuilderSectionTitle>Connections</BuilderSectionTitle>
        <p className="text-sm text-muted-foreground">
          Send completed submissions to external systems. Studio currently supports
          webhook connections only.
        </p>
      </div>

      {unsupportedConnections.length > 0 ? (
        <BuilderInset variant="dashed" className="px-4">
          {unsupportedConnections.length} existing non-webhook connection
          {unsupportedConnections.length === 1 ? "" : "s"} {unsupportedConnections.length === 1 ? "is" : "are"} preserved but cannot be edited in Studio yet.
        </BuilderInset>
      ) : null}

      {webhookConnections.length > 0 ? (
        <div className="space-y-3">
          {webhookConnections.map((connection, index) => (
            <BuilderInset
              key={`webhook-connection-${index}`}
              className="space-y-3 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
                    <Webhook className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Webhook</p>
                    <p className="text-xs text-muted-foreground">
                      POST submission data to an external URL.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove webhook connection"
                  onClick={() => {
                    handleUpdateWebhookConnections(
                      webhookConnections.filter((_, connectionIndex) => connectionIndex !== index),
                    );
                  }}
                >
                  <Trash2 />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Webhook URL</Label>
                  <Input
                    value={connection.url ?? ""}
                    onChange={(event) => {
                      handleUpdateWebhookConnections(
                        webhookConnections.map((currentConnection, connectionIndex) =>
                          connectionIndex === index
                            ? {
                                ...currentConnection,
                                type: "webhook",
                                url: event.target.value,
                              }
                            : currentConnection,
                        ),
                      );
                    }}
                    placeholder="https://example.com/webhook"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>When</Label>
                  <Input
                    value={connection.when ?? ""}
                    onChange={(event) => {
                      handleUpdateWebhookConnections(
                        webhookConnections.map((currentConnection, connectionIndex) =>
                          connectionIndex === index
                            ? {
                                ...currentConnection,
                                type: "webhook",
                                when: event.target.value,
                              }
                            : currentConnection,
                        ),
                      );
                    }}
                    placeholder="Optional expression"
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to run this webhook for every completed submission.
                  </p>
                </div>
              </div>
            </BuilderInset>
          ))}
        </div>
      ) : (
        <BuilderInset variant="dashed" className="px-4 py-6">
          No webhook connections yet.
        </BuilderInset>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={() => {
          handleUpdateWebhookConnections([
            ...webhookConnections,
            { type: "webhook", url: "" },
          ]);
        }}
      >
        <Plus />
        Add Webhook Connection
      </Button>
    </div>
  );
}
