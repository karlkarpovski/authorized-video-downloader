import { FormField } from "./FormField";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
}

export function UrlInput({ value, onChange, hasError }: UrlInputProps) {
  return (
    <FormField
      number="01"
      label="Source URL"
      htmlFor="source-url"
      hint="Paste the link to a video you own, or one you're authorized to download."
    >
      <input
        id="source-url"
        name="source-url"
        type="url"
        inputMode="url"
        placeholder="https://example.com/watch?v=..."
        className="text-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        aria-invalid={hasError}
      />
    </FormField>
  );
}