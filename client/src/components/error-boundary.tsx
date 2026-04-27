import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI ErrorBoundary", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="container py-10">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="mt-2 text-muted-foreground">Please reload the page and try again.</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Reload app
          </Button>
        </section>
      );
    }
    return this.props.children;
  }
}
