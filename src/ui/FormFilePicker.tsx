import { useState } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Platform, Pressable, Text, View } from 'react-native';
import { pick, types, type DocumentPickerResponse } from '@react-native-documents/picker';
import {
  check,
  checkMultiple,
  PERMISSIONS,
  request,
  requestMultiple,
  RESULTS,
} from 'react-native-permissions';
import { cn } from '@/utils/cn';
import { showErrorModal } from '@/utils/errorModal';

type FormFilePickerProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  buttonLabel?: string;
  placeholder?: string;
  helperText?: string;
  loading?: boolean;
  onPick?: (
    file: DocumentPickerResponse
  ) => Promise<{ value: string; fileName?: string } | string | void>;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
};

const getFileName = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const lastSlash = value.lastIndexOf('/');
  if (lastSlash >= 0 && lastSlash < value.length - 1) {
    return value.slice(lastSlash + 1);
  }
  return value;
};

const requestFilePermission = async () => {
  if (Platform.OS !== 'android') {
    return RESULTS.GRANTED;
  }

  if (Platform.Version >= 33) {
    const permissions = [
      PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
      PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
      PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
    ];
    let statuses = await checkMultiple(permissions);
    if (permissions.some((permission) => statuses[permission] === RESULTS.DENIED)) {
      statuses = await requestMultiple(permissions);
    }
    const granted = permissions.some(
      (permission) =>
        statuses[permission] === RESULTS.GRANTED ||
        statuses[permission] === RESULTS.LIMITED
    );
    return granted ? RESULTS.GRANTED : RESULTS.DENIED;
  }

  const permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
  let status = await check(permission);
  if (status === RESULTS.DENIED) {
    status = await request(permission);
  }
  return status;
};

export const FormFilePicker = <T extends FieldValues>({
  control,
  name,
  label,
  buttonLabel = 'Upload file',
  placeholder = 'No file selected',
  helperText,
  loading,
  onPick,
  containerClassName,
  labelClassName,
  inputClassName,
  errorClassName,
}: FormFilePickerProps<T>) => {
  const [fileName, setFileName] = useState('');

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const resolvedName = fileName || getFileName(value);
        return (
          <View className={cn('gap-2', containerClassName)}>
            <Text className={cn('text-sm font-medium text-ink-600', labelClassName)}>
              {label}
            </Text>
            <View
              className={cn(
                'flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3',
                inputClassName
              )}
            >
              <Text
                className={cn(
                  'flex-1 pr-3 text-base',
                  resolvedName ? 'text-ink-700' : 'text-slate-400'
                )}
                numberOfLines={1}
              >
                {resolvedName || placeholder}
              </Text>
              <Pressable
                className={cn(
                  'rounded-lg px-3 py-2',
                  loading ? 'bg-slate-300' : 'bg-brand-600'
                )}
                disabled={loading}
                onPress={async () => {
                  try {
                    const permissionStatus = await requestFilePermission();
                    if (permissionStatus !== RESULTS.GRANTED) {
                      showErrorModal('Storage permission is required to select files.');
                      return;
                    }
                    const results = await pick({
                      type: [types.pdf, types.images],
                    });
                    const result = results[0];
                    let nextValue = result.uri;
                    let nextName = result.name ?? '';
                    if (onPick) {
                      const pickResult = await onPick(result);
                      if (!pickResult) {
                        return;
                      }
                      if (typeof pickResult === 'string') {
                        nextValue = pickResult;
                      } else if (pickResult?.value) {
                        nextValue = pickResult.value;
                        if (pickResult.fileName) {
                          nextName = pickResult.fileName;
                        }
                      }
                    }
                    if (nextValue) {
                      onChange(nextValue);
                      if (nextName) {
                        setFileName(nextName);
                      }
                    }
                  } catch (pickerError) {
                    const err = pickerError as { code?: string };
                    if (err.code === 'OPERATION_CANCELED') {
                      return;
                    }
                    throw pickerError;
                  }
                }}
              >
                <Text className="text-xs font-semibold text-white">
                  {loading ? 'Uploading...' : buttonLabel}
                </Text>
              </Pressable>
            </View>
            {helperText ? (
              <Text className="text-xs text-ink-500">{helperText}</Text>
            ) : null}
            {error ? (
              <Text className={cn('text-xs text-red-600', errorClassName)}>
                {error.message}
              </Text>
            ) : null}
          </View>
        );
      }}
    />
  );
};
