import { FormField } from "./FormField";

interface PermissionCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function PermissionCheckbox({ checked, onChange }: PermissionCheckboxProps) {
  return (
    <FormField
      number="02"
      label="Permission to download"
      htmlFor="permission-confirm"
      hint="Required before analysis or download can start."
    >
      <div className="checkbox-row">
        <input
          id="permission-confirm"
          name="permission-confirm"
          type="checkbox"
          className="checkbox-input"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <label htmlFor="permission-confirm" className="checkbox-label">
          I own this content, or I have the rights holder's permission,
          or this content is public domain / permissively licensed for
          download.
        </label>
      </div>
    </FormField>
  );
}