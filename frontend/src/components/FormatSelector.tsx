import { VIDEO_FORMATS, AUDIO_FORMATS, type MediaFormat } from "../types/media";
import { FormField } from "./FormField";

interface FormatSelectorProps {
  value: MediaFormat;
  onChange: (format: MediaFormat) => void;
  availableFormats?: MediaFormat[];
  disabled?: boolean;
}

const ALL_FORMATS: MediaFormat[] = [...VIDEO_FORMATS, ...AUDIO_FORMATS];

export function FormatSelector({ value, onChange, availableFormats, disabled }: FormatSelectorProps) {
  return (
    <FormField
      number="03"
      label="Output format"
      htmlFor="output-format-group"
      hint="Video formats keep picture and sound; audio formats extract sound only."
    >
      <div className="chip-group" role="radiogroup" id="output-format-group" aria-label="Output format">
        {ALL_FORMATS.map((format) => {
          const isAvailable = !availableFormats || availableFormats.includes(format);
          return (
            <label key={format} className={`chip ${value === format ? "chip--selected" : ""}`}>
              <input
                type="radio"
                name="output-format"
                value={format}
                checked={value === format}
                onChange={() => onChange(format)}
                disabled={disabled || !isAvailable}
              />
              {format}
            </label>
          );
        })}
      </div>
    </FormField>
  );
}