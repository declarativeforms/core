import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { load as parseYaml } from "js-yaml"
import { RotateCcw } from "lucide-react"

import { DeclarativeForm, type IDeclarativeForm } from "@/components"
import { HtmlText } from "@/components/declarative-form/supporting/html-text"
import { interpolateTemplate, resolveLocalizedText } from "@declarativeforms/common"
import { compile, type FormEffect } from "@declarativeforms/runtime"
import { useI18n } from "@/i18n"
import { buildThemeStyle } from "@/lib/theme"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"

function parseForm(yamlStr: string): IDeclarativeForm | null {
  try {
    const parsed = parseYaml(yamlStr)
    if (parsed && typeof parsed === "object" && "sections" in parsed) {
      return parsed as IDeclarativeForm
    }
    return null
  } catch {
    return null
  }
}

type PreviewState =
  | { view: "form" }
  | { view: "complete"; data: Record<string, unknown> }
  | { view: "redirect"; data: Record<string, unknown>; url: string }

export function FormPreview({ yaml }: { yaml: string }) {
  const { locale, t } = useI18n()
  const [previewState, setPreviewState] = useState<PreviewState>({ view: "form" })
  const [formKey, setFormKey] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const form = useMemo(() => parseForm(yaml), [yaml])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      setPreviewState({ view: "form" })
      setFormKey((k) => k + 1)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [yaml])

  const handleReset = useCallback(() => {
    setPreviewState({ view: "form" })
    setFormKey((k) => k + 1)
  }, [])

  const handleEffect = useCallback(
    (effect: FormEffect, state: { data: Record<string, unknown> }) => {
      switch (effect.type) {
        case "submit":
          break
        case "complete":
          setPreviewState({ view: "complete", data: state.data })
          break
        case "redirect":
          setPreviewState({ view: "redirect", data: state.data, url: effect.url })
          break
      }
    },
    [],
  )

  if (!form) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <p className="text-sm text-muted-foreground">
          {t("preview.invalid_yaml")}
        </p>
      </div>
    )
  }

  const themeStyle = buildThemeStyle(form.theme)

  if (previewState.view === "complete" || previewState.view === "redirect") {
    const submissionData = previewState.data
    const completion = compile(form, locale, submissionData, "").completion

    const title = completion?.title
      ? interpolateTemplate(completion.title, submissionData)
      : t("thank_you.default_title")
    const description = completion?.message
      ? interpolateTemplate(completion.message, submissionData)
      : t("thank_you.default_description")

    const buttonLabel = completion?.button?.label
    const buttonUrl = previewState.view === "redirect"
      ? previewState.url
      : completion?.button?.url
        ? interpolateTemplate(completion.button.url, submissionData)
        : undefined

    return (
      <div className="flex flex-col h-full" style={themeStyle}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
            <div className="w-full max-w-md mx-auto text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                <HtmlText html={title} />
              </h2>
              {description ? (
                <p className="text-sm text-gray-500 mb-8">
                  <HtmlText html={description} />
                </p>
              ) : null}
              {buttonUrl ? (
                <span className="inline-flex items-center justify-center w-full h-10 px-6 text-sm font-medium rounded-md bg-primary text-primary-foreground cursor-default">
                  {buttonLabel ? <HtmlText html={buttonLabel} /> : t("hero.continue")}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-border bg-muted/50 px-4 py-2 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw className="size-3.5" />
            {t("preview.restart")}
          </Button>
        </div>
      </div>
    )
  }

  const title = resolveLocalizedText(form.title, locale) ?? ""
  const description = form.description
    ? resolveLocalizedText(form.description, locale)
    : undefined

  return (
    <div className="h-full overflow-y-auto" style={themeStyle}>
      <div className="max-w-lg mx-auto px-4 py-12 md:py-16">
        <Card className="mb-10 w-full bg-white border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="px-6 !pb-0 border-b border-gray-200">
            <CardTitle className="text-2xl/7.5 font-semibold">
              <HtmlText html={title} />
            </CardTitle>
            {description ? (
              <CardDescription className="mb-3 mt-2 text-sm text-gray-500">
                <HtmlText html={description} />
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="px-6">
            <DeclarativeForm
              key={formKey}
              form={form}
              locale={locale}
              initialData={{}}
              onEffect={handleEffect}
            />
          </CardContent>
        </Card>
        <div className="text-center text-gray-500 text-xs tracking-wide">
          {t("base.powered_by")}{" "}
          <a
            href="https://docs.declarativeforms.com"
            className="font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline transition-colors"
          >
            Declarative Forms
          </a>
        </div>
      </div>
    </div>
  )
}
