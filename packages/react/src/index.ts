import './styles.css';

export * from './components/declarative-form';
export * from './components/ui';
export * from './i18n';
export { configureRenderer } from './lib/api';
export type { RendererOptions } from './lib/api';
export type { DeclarativeFieldComponentProps } from './components/declarative-form/supporting/field-support';
export type {
  DeclarativeFieldComponentProps as FieldComponentProps,
} from './components/declarative-form/supporting/field-support';
export { HtmlText } from './components/declarative-form/supporting/html-text';
export { buildThemeStyle } from './lib/theme';
