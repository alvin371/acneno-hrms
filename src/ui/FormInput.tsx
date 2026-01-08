import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { InputField } from './InputField';

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  multiline?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
};

export const FormInput = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  containerClassName,
  labelClassName,
  inputClassName,
  errorClassName,
}: FormInputProps<T>) => (
  <Controller
    control={control}
    name={name}
    render={({ field: { onChange, value }, fieldState: { error } }) => (
      <InputField
        label={label}
        placeholder={placeholder}
        value={value === undefined || value === null ? '' : String(value)}
        onChangeText={onChange}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        error={error?.message}
        containerClassName={containerClassName}
        labelClassName={labelClassName}
        inputClassName={inputClassName}
        errorClassName={errorClassName}
      />
    )}
  />
);
