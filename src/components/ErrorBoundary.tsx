import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { hasError: boolean }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Unhandled UI error:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-display text-2xl text-foreground">Something went wrong</h1>
          <p className="font-body text-sm text-muted-foreground">
            This page could not be displayed. Your memories are safe — please try again.
          </p>
          <Button variant="hero" onClick={() => window.location.reload()}>Reload the page</Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
