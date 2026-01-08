import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { SelectField, SelectOption } from './SelectField';

type FormSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  options: SelectOption[];
};

export const FormSelect = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
}: FormSelectProps<T>) => (
  <Controller
    control={control}
    name={name}
    render={({ field: { onChange, value }, fieldState: { error } }) => (
      <SelectField
        label={label}
        value={value as string}
        onChange={onChange}
        placeholder={placeholder}
        options={options}
        error={error?.message}
      />
    )}
  />
);
