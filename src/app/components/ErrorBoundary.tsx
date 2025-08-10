"use client";

import React, { Component, ReactNode } from "react";
import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi";
import styles from "./ErrorBoundary.module.css";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to monitoring service (if available)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "exception", {
        description: error.message,
        fatal: false,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>
              <FiAlertTriangle size={48} />
            </div>
            
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            
            <p className={styles.errorMessage}>
              We encountered an unexpected error. This has been logged and we'll look into it.
            </p>

            <div className={styles.errorActions}>
              <button 
                onClick={this.handleRetry}
                className={styles.retryButton}
              >
                <FiRefreshCw size={16} />
                Try Again
              </button>
              
              <button 
                onClick={this.handleGoHome}
                className={styles.homeButton}
              >
                <FiHome size={16} />
                Go Home
              </button>
            </div>

            {/* Error details in development */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className={styles.errorDetails}>
                <summary className={styles.errorDetailsSummary}>
                  Error Details (Development Only)
                </summary>
                <div className={styles.errorDetailsContent}>
                  <h4>Error Message:</h4>
                  <pre>{this.state.error.message}</pre>
                  
                  <h4>Stack Trace:</h4>
                  <pre>{this.state.error.stack}</pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook-based error handling for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = () => setError(null);

  const handleError = (error: Error) => {
    console.error("Error:", error);
    setError(error);
  };

  return { error, resetError, handleError };
}

// Error display component
interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, className }: ErrorDisplayProps) {
  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <div className={`${styles.errorContainer} ${className || ""}`}>
      <div className={styles.errorIcon}>
        <FiAlertTriangle size={24} />
      </div>
      <h3 className={styles.errorTitle}>Error</h3>
      <p className={styles.errorMessage}>{errorMessage}</p>
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          <FiRefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
}
