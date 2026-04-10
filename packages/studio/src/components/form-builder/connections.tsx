import { Mail, Trash2, Webhook } from "lucide-react";

import {
  Button,
  Checkbox,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle,
  Textarea,
} from "@/components";
import type {
  IDeclarativeForm,
  IDeclarativeFormRawEmailConnection,
  IDeclarativeFormRawWebhookConnection,
  ILocalizedText,
} from "@declarativeforms/types";

type ConnectionsValue = IDeclarativeForm["connections"];

type ParsedWebhookConnection = {
  type: "webhook";
  url: string;
  when: string;
};

type ParsedEmailConnection = {
  type: "email";
  to: string;
  subject: string;
  body: string;
  includeResponses: boolean;
  when: string;
};

type ParsedConnection = ParsedWebhookConnection | ParsedEmailConnection;

function readText(value: ILocalizedText | undefined) {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  return (
    Object.values(value).find(
      (entry): entry is string => typeof entry === "string",
    ) ?? ""
  );
}

function parseConnection(
  connection: NonNullable<ConnectionsValue>[number],
): ParsedConnection | null {
  if (connection.type === "webhook") {
    const c = connection as IDeclarativeFormRawWebhookConnection;
    return {
      type: "webhook",
      url: c.url ?? "",
      when: c.when ?? "",
    };
  }

  if (connection.type === "email") {
    const c = connection as IDeclarativeFormRawEmailConnection;
    return {
      type: "email",
      to: c.to ?? "",
      subject: readText(c.subject),
      body: readText(c.body),
      includeResponses: c.include_responses ?? false,
      when: c.when ?? "",
    };
  }

  return null;
}

function parseConnections(connections: ConnectionsValue): ParsedConnection[] {
  if (!connections) {
    return [];
  }

  return connections
    .map(parseConnection)
    .filter((c): c is ParsedConnection => c !== null);
}

function buildConnection(
  parsed: ParsedConnection,
): NonNullable<ConnectionsValue>[number] {
  if (parsed.type === "webhook") {
    const result: IDeclarativeFormRawWebhookConnection = { type: "webhook" };

    if (parsed.url.trim()) {
      result.url = parsed.url;
    }

    if (parsed.when.trim()) {
      result.when = parsed.when;
    }

    return result;
  }

  const result: IDeclarativeFormRawEmailConnection = { type: "email" };

  if (parsed.to.trim()) {
    result.to = parsed.to;
  }

  if (parsed.subject.trim()) {
    result.subject = parsed.subject;
  }

  if (parsed.body.trim()) {
    result.body = parsed.body;
  }

  if (parsed.includeResponses) {
    result.include_responses = true;
  }

  if (parsed.when.trim()) {
    result.when = parsed.when;
  }

  return result;
}

function buildConnections(
  parsed: ParsedConnection[],
): ConnectionsValue {
  if (parsed.length === 0) {
    return undefined;
  }

  return parsed.map(buildConnection);
}

function getConnectionSummary(connection: ParsedConnection) {
  if (connection.type === "webhook") {
    return connection.url || "No URL configured";
  }

  return connection.to || "No recipient configured";
}

function WebhookFields({
  connection,
  onChange,
}: {
  connection: ParsedWebhookConnection;
  onChange: (next: ParsedWebhookConnection) => void;
}) {
  return (
    <>
      <Field>
        <FieldLabel>URL</FieldLabel>
        <FieldDescription>
          The endpoint that receives a POST request with the submission data as
          JSON.
        </FieldDescription>
        <Input
          className="bg-background shadow-sm"
          value={connection.url}
          placeholder="https://example.com/webhook"
          onChange={(event) =>
            onChange({ ...connection, url: event.target.value })
          }
        />
      </Field>

      <Field>
        <FieldLabel>Condition</FieldLabel>
        <FieldDescription>
          A JavaScript expression evaluated against the submission data. Leave
          empty to always trigger.
        </FieldDescription>
        <Input
          className="bg-background font-mono text-xs shadow-sm"
          value={connection.when}
          placeholder="data.email !== ''"
          onChange={(event) =>
            onChange({ ...connection, when: event.target.value })
          }
        />
      </Field>
    </>
  );
}

function EmailFields({
  connection,
  onChange,
}: {
  connection: ParsedEmailConnection;
  onChange: (next: ParsedEmailConnection) => void;
}) {
  return (
    <>
      <Field>
        <FieldLabel>To</FieldLabel>
        <FieldDescription>
          The recipient email address. Use {"{{data.field_id}}"} to insert a
          value from the submission.
        </FieldDescription>
        <Input
          className="bg-background shadow-sm"
          value={connection.to}
          placeholder="recipient@example.com"
          onChange={(event) =>
            onChange({ ...connection, to: event.target.value })
          }
        />
      </Field>

      <Field>
        <FieldLabel>Subject</FieldLabel>
        <Input
          className="bg-background shadow-sm"
          value={connection.subject}
          placeholder="New form submission"
          onChange={(event) =>
            onChange({ ...connection, subject: event.target.value })
          }
        />
      </Field>

      <Field>
        <FieldLabel>Body</FieldLabel>
        <FieldDescription>
          The email body. Use {"{{data.field_id}}"} to insert submission values.
        </FieldDescription>
        <Textarea
          rows={6}
          className="min-h-24 resize-none bg-background shadow-sm"
          value={connection.body}
          placeholder="Thank you for your submission."
          onChange={(event) =>
            onChange({ ...connection, body: event.target.value })
          }
        />
      </Field>

      <Item variant="outline" className="bg-white">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={connection.includeResponses}
            onCheckedChange={(checked) =>
              onChange({
                ...connection,
                includeResponses: checked === true,
              })
            }
          />
          <p className="text-sm font-medium text-foreground">
            Include form responses
          </p>
        </div>
      </Item>

      <Field>
        <FieldLabel>Condition</FieldLabel>
        <FieldDescription>
          A JavaScript expression evaluated against the submission data. Leave
          empty to always trigger.
        </FieldDescription>
        <Input
          className="bg-background font-mono text-xs shadow-sm"
          value={connection.when}
          placeholder="data.email !== ''"
          onChange={(event) =>
            onChange({ ...connection, when: event.target.value })
          }
        />
      </Field>
    </>
  );
}

export function Connections({
  connections,
  onChange,
}: {
  connections: ConnectionsValue;
  onChange: (next: ConnectionsValue) => void;
}) {
  const parsed = parseConnections(connections);

  const handleUpdate = (index: number, next: ParsedConnection) => {
    onChange(
      buildConnections(
        parsed.map((connection, i) => (i === index ? next : connection)),
      ),
    );
  };

  const handleRemove = (index: number) => {
    onChange(
      buildConnections(parsed.filter((_, i) => i !== index)),
    );
  };

  const handleAddWebhook = () => {
    onChange(
      buildConnections([
        ...parsed,
        { type: "webhook", url: "", when: "" },
      ]),
    );
  };

  const handleAddEmail = () => {
    onChange(
      buildConnections([
        ...parsed,
        {
          type: "email",
          to: "",
          subject: "",
          body: "",
          includeResponses: false,
          when: "",
        },
      ]),
    );
  };

  if (parsed.length === 0) {
    return (
      <div className="space-y-3">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Webhook />
            </EmptyMedia>
            <EmptyTitle>No Connections Yet</EmptyTitle>
            <EmptyDescription>
              Add a webhook or email connection to send data when a form is
              submitted.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleAddWebhook}>
                <Webhook />
                Add Webhook
              </Button>
              <Button type="button" variant="outline" onClick={handleAddEmail}>
                <Mail />
                Add Email
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ItemGroup className="gap-3">
        {parsed.map((connection, index) => (
          <Item
            key={`connection-${index}`}
            variant="outline"
            className="bg-white"
          >
            <ItemHeader>
              <ItemContent>
                <ItemTitle>
                  {connection.type === "webhook" ? "Webhook" : "Email"}
                </ItemTitle>
                <ItemDescription>
                  {getConnectionSummary(connection)}
                </ItemDescription>
              </ItemContent>

              <ItemActions>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 />
                </Button>
              </ItemActions>
            </ItemHeader>

            <div className="basis-full border-t border-border pt-4">
              <FieldGroup>
                {connection.type === "webhook" ? (
                  <WebhookFields
                    connection={connection}
                    onChange={(next) => handleUpdate(index, next)}
                  />
                ) : (
                  <EmailFields
                    connection={connection}
                    onChange={(next) => handleUpdate(index, next)}
                  />
                )}
              </FieldGroup>
            </div>
          </Item>
        ))}
      </ItemGroup>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 justify-start bg-background shadow-sm hover:bg-background"
          onClick={handleAddWebhook}
        >
          <Webhook />
          Add Webhook
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 justify-start bg-background shadow-sm hover:bg-background"
          onClick={handleAddEmail}
        >
          <Mail />
          Add Email
        </Button>
      </div>
    </div>
  );
}
