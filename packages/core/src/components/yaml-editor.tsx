import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, indentOnInput, bracketMatching, foldGutter, foldKeymap } from "@codemirror/language";
import { yaml } from "@codemirror/lang-yaml";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";

import { cn } from "@/lib/utils";

const defaultYaml = `# Welcome to the YAML Playground
# Start editing your YAML here

title: My Form
description: A sample declarative form

sections:
  - title: Personal Information
    fields:
      - name: first_name
        type: text
        label: First Name
        placeholder: Enter your first name

      - name: last_name
        type: text
        label: Last Name
        placeholder: Enter your last name

      - name: email
        type: email
        label: Email Address
        placeholder: you@example.com
`;

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  },
  ".cm-gutters": {
    backgroundColor: "oklch(0.97 0 0)",
    borderRight: "1px solid oklch(0.922 0 0)",
    color: "oklch(0.556 0 0)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "oklch(0.95 0 0)",
  },
  ".cm-activeLine": {
    backgroundColor: "oklch(0.97 0 0 / 50%)",
  },
  ".cm-selectionBackground": {
    backgroundColor: "oklch(0.85 0.05 250 / 40%) !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "oklch(0.85 0.05 250 / 40%) !important",
  },
  ".cm-cursor": {
    borderLeftColor: "oklch(0.205 0 0)",
  },
  ".cm-content": {
    padding: "8px 0",
  },
});

export function YamlEditor({ className }: { className?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const state = EditorState.create({
      doc: defaultYaml,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
        yaml(),
        editorTheme,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  return (
    <div
      ref={editorRef}
      className={cn("h-full w-full overflow-hidden", className)}
    />
  );
}
