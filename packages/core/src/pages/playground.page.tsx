import { useEffect, useState } from "react";
import { Code, Eye } from "lucide-react";
import { YamlEditor } from "@/components/yaml-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return isMobile;
}

function DesktopLayout() {
  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 min-w-0 border-r border-border">
        <div className="flex items-center gap-2 px-4 h-12 border-b border-border bg-muted/50 shrink-0">
          <Code className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            YAML Editor
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <YamlEditor />
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 px-4 h-12 border-b border-border bg-muted/50 shrink-0">
          <Eye className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Preview</span>
        </div>
        <div className="flex-1 min-h-0" />
      </div>
    </div>
  );
}

function MobileLayout() {
  return (
    <Tabs defaultValue="editor" className="flex flex-col h-full">
      <div className="px-2 pt-2 shrink-0 bg-background border-b border-border">
        <TabsList className="w-full">
          <TabsTrigger value="editor" className="gap-1.5">
            <Code className="size-4" />
            YAML
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1.5">
            <Eye className="size-4" />
            Preview
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="editor" className="min-h-0">
        <YamlEditor />
      </TabsContent>

      <TabsContent value="preview" className="min-h-0" />
    </Tabs>
  );
}

export function PlaygroundPage() {
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = "Playground — Declarative Forms";
  }, []);

  return (
    <div className="h-dvh w-full flex flex-col bg-background">
      <header className="flex items-center justify-between px-4 h-12 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-foreground">Playground</h1>
        </div>
        <a
          href="https://docs.declarativeforms.com"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Docs
        </a>
      </header>

      <div className="flex-1 min-h-0">
        {isMobile ? <MobileLayout /> : <DesktopLayout />}
      </div>
    </div>
  );
}
