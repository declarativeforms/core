import { Card, CardContent } from '@/components/ui';

const EXAMPLES: Array<string> = [
  'A customer feedback form with a 1 to 5 rating and an optional comment',
  'An event registration form: name, email, dietary requirements, number of guests',
  'A bug report form with severity, steps to reproduce and a screenshot upload',
  'A job application form with a CV upload and a work-authorisation question',
];

export function ExamplePrompts(props: { onPick: (prompt: string) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {EXAMPLES.map((example) => (
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/60"
          key={example}
          onClick={() => {
            props.onPick(example);
          }}
        >
          <CardContent className="px-3 py-2">
            <p className="text-sm text-muted-foreground">{example}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
