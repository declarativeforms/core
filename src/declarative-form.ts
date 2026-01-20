export type DeclarativeFormField = {
  id: string;
  type: string;
  title: string;
};

export type DeclarativeFormSection = {
  id: string;
  title: string;
  fields: Array<DeclarativeFormField>;
  next:
    | string
    | Array<
        | {
            when: string;
            go: string;
          }
        | { else: string }
      >;
};

export type DeclarativeForm = {
  version: number;
  title: string;

  sections: Array<DeclarativeFormSection>;
};

export function evaluateNext(
  declarativeForm: DeclarativeForm,
  state: Record<string, string>
) {

}
