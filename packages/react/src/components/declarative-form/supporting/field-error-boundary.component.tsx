import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fieldId?: string;
  onError?: (error: Error, fieldId?: string) => void;
}

interface State {
  hasError: boolean;
}

class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error, this.props.fieldId);
    console.warn(
      `[DeclarativeForms] Field "${this.props.fieldId}" failed to render:`,
      error,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="text-sm text-muted-foreground italic py-2">
          This field could not be displayed.
        </p>
      );
    }

    return this.props.children;
  }
}

export function FieldErrorBoundary({ children, fieldId, onError }: Props) {
  return (
    <ErrorBoundaryInner fieldId={fieldId} onError={onError}>
      {children}
    </ErrorBoundaryInner>
  );
}
