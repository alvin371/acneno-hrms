import type { ComponentProps } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { InputField } from './InputField';

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  placeholderTextColor?: string;
  multiline?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  containerStyle?: ComponentProps<typeof InputField>['containerStyle'];
  labelStyle?: ComponentProps<typeof InputField>['labelStyle'];
  inputStyle?: ComponentProps<typeof InputField>['inputStyle'];
  errorStyle?: ComponentProps<typeof InputField>['errorStyle'];
};

export const FormInput = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  secureTextEntry,
  keyboardType,
  placeholderTextColor,
  multiline,
  containerClassName,
  labelClassName,
  inputClassName,
  errorClassName,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
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
        placeholderTextColor={placeholderTextColor}
        multiline={multiline}
        error={error?.message}
        containerClassName={containerClassName}
        labelClassName={labelClassName}
        inputClassName={inputClassName}
        errorClassName={errorClassName}
        containerStyle={containerStyle}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        errorStyle={errorStyle}
      />
    )}
  />
);
