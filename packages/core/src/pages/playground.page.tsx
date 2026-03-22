import { useCallback, useEffect, useState } from "react"
import { Code, Eye } from "lucide-react"
import { YamlEditor, defaultYaml } from "@/components/yaml-editor"
import { FormPreview } from "@/components/form-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint - 1}px)`
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return isMobile
}

function DesktopLayout({ yaml, onYamlChange }: { yaml: string; onYamlChange: (value: string) => void }) {
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
          <YamlEditor onChange={onYamlChange} initialValue={yaml} />
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 px-4 h-12 border-b border-border bg-muted/50 shrink-0">
          <Eye className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Preview</span>
        </div>
        <div className="flex-1 min-h-0">
          <FormPreview yaml={yaml} />
        </div>
      </div>
    </div>
  )
}

function MobileLayout({ yaml, onYamlChange }: { yaml: string; onYamlChange: (value: string) => void }) {
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
        <YamlEditor onChange={onYamlChange} initialValue={yaml} />
      </TabsContent>

      <TabsContent value="preview" className="min-h-0">
        <FormPreview yaml={yaml} />
      </TabsContent>
    </Tabs>
  )
}

export function PlaygroundPage() {
  const isMobile = useIsMobile()
  const [yaml, setYaml] = useState(defaultYaml)

  const handleYamlChange = useCallback((value: string) => {
    setYaml(value)
  }, [])

  useEffect(() => {
    document.title = "Playground — Declarative Forms"
  }, [])

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
        {isMobile ? (
          <MobileLayout yaml={yaml} onYamlChange={handleYamlChange} />
        ) : (
          <DesktopLayout yaml={yaml} onYamlChange={handleYamlChange} />
        )}
      </div>
    </div>
  )
}
