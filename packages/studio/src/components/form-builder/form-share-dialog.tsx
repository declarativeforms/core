import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  ItemTitle,
} from "@/components";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FormShareDialog({
  collaborators,
  currentEmail,
  isSaving,
  onOpenChange,
  onSave,
  open,
}: {
  collaborators: string[];
  currentEmail: string | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (nextCollaborators: string[]) => Promise<void> | void;
  open: boolean;
}) {
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const owner = collaborators[0] ?? currentEmail ?? "";

  const handleAdd = async () => {
    const email = pendingEmail.trim().toLowerCase();

    if (!email) {
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (collaborators.includes(email)) {
      setError("This email already has access.");
      return;
    }

    setError(null);
    setPendingEmail("");
    await onSave([...collaborators, email]);
  };

  const handleRemove = async (email: string) => {
    if (email === owner) {
      return;
    }

    await onSave(collaborators.filter((entry) => entry !== email));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(80vh,40rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share form</DialogTitle>
          <DialogDescription>
            Invite collaborators by email. They will see this form in their
            dashboard and can edit it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="share-email">Add collaborator</FieldLabel>
              <FieldDescription>
                Enter an email address to grant edit access.
              </FieldDescription>
              <div className="flex gap-2">
                <Input
                  id="share-email"
                  type="email"
                  placeholder="teammate@example.com"
                  value={pendingEmail}
                  onChange={(event) => {
                    setPendingEmail(event.target.value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleAdd();
                    }
                  }}
                  disabled={isSaving}
                  className="bg-background shadow-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => void handleAdd()}
                  disabled={isSaving || !pendingEmail.trim()}
                  aria-label="Add collaborator"
                  title="Add collaborator"
                >
                  <Plus />
                </Button>
              </div>
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : null}
            </Field>
          </FieldGroup>

          <ItemGroup className="gap-2">
            {collaborators.map((email) => {
              const isOwner = email === owner;
              const isSelf = currentEmail !== null && email === currentEmail;

              return (
                <Item key={email} variant="outline">
                  <ItemContent>
                    <ItemTitle>
                      {email}
                      {isSelf ? " (you)" : ""}
                    </ItemTitle>
                    <ItemDescription>
                      {isOwner ? "Owner" : "Editor"}
                    </ItemDescription>
                  </ItemContent>
                  {isOwner ? null : (
                    <ItemActions>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => void handleRemove(email)}
                        disabled={isSaving}
                        aria-label={`Remove ${email}`}
                        title={`Remove ${email}`}
                      >
                        <Trash2 />
                      </Button>
                    </ItemActions>
                  )}
                </Item>
              );
            })}
          </ItemGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
