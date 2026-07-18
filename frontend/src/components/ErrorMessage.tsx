interface ErrorMessageProps {
  message?: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) {
    return <div className="error-message" role="alert" aria-live="polite" />;
  }

  return (
    <div className="error-message error-message--visible" role="alert" aria-live="polite">
      {message}
    </div>
  );
}