import { FormField } from "./FormField";
import {
  VIDEO_QUALITIES,
  AUDIO_QUALITIES,
  isVideoFormat,
  type MediaFormat,
  type MediaQuality,
} from "../types/media";

interface QualitySelectorProps {
  format: MediaFormat;
  value: MediaQuality;
  onChange: (quality: MediaQuality) => void;
  availableQualities?: MediaQuality[];
  disabled?: boolean;
}

export function QualitySelector({
  format,
  value,
  onChange,
  availableQualities,
  disabled,
}: QualitySelectorProps) {
  const baseOptions = isVideoFormat(format) ? VIDEO_QUALITIES : AUDIO_QUALITIES;
  const filtered = availableQualities
    ? baseOptions.filter((q) => availableQualities.includes(q))
    : baseOptions;
  // Fall back to the full list if filtering would leave nothing selectable
  // (e.g. the source didn't expose enough detail to be sure).
  const options = filtered.length > 0 ? filtered : baseOptions;

  const hint = isVideoFormat(format)
    ? "Resolution options for video output."
    : "Bitrate options for audio output.";

  return (
    <FormField number="04" label="Quality" htmlFor="output-quality" hint={hint}>
      <select
        id="output-quality"
        name="output-quality"
        className="select-input"
        value={value}
        onChange={(event) => onChange(event.target.value as MediaQuality)}
        disabled={disabled}
      >
        {options.map((quality) => (
          <option key={quality} value={quality}>
            {quality}
          </option>
        ))}
      </select>
    </FormField>
  );
}