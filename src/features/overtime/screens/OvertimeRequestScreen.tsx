import { FlatList, Pressable, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { FormInput } from '@/ui/FormInput';
import { FormDatePicker } from '@/ui/FormDatePicker';
import { FormTimePicker } from '@/ui/FormTimePicker';
import { FormSelect } from '@/ui/FormSelect';
import { FormFilePicker } from '@/ui/FormFilePicker';
import { Card } from '@/ui/Card';
import { StatusChip } from '@/ui/StatusChip';
import { WifiValidationCard } from '@/ui/WifiValidationCard';
import { EmptyState } from '@/ui/EmptyState';
import { LoadingSkeleton } from '@/ui/LoadingSkeleton';
import {
  createOvertime,
  getOvertimes,
  getOvertimeTypes,
  uploadOvertimeAttachment,
} from '@/features/overtime/api';
import { statusToVariant, formatDurationHours } from '@/features/overtime/utils';
import { showToast } from '@/utils/toast';
import { showErrorModal } from '@/utils/errorModal';
import { getErrorMessage } from '@/api/error';
import { queryClient } from '@/lib/queryClient';
import { env } from '@/config/env';
import { openSettings } from 'react-native-permissions';
import { useWifiValidation } from '@/hooks/useWifiValidation';
import type { OvertimeStackParamList } from '@/navigation/types';
import { tokens } from '@/config/tokens';

const formatDateUTC = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayInJakarta = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return formatDateUTC(new Date());
  }
};

const schema = z.object({
  overtimeTypeId: z.string().min(1, 'Jenis lembur wajib dipilih'),
  overtimeDate: z.string().min(1, 'Tanggal wajib dipilih'),
  startTime: z.string().min(1, 'Jam mulai wajib diisi'),
  endTime: z.string().min(1, 'Jam selesai wajib diisi'),
  reason: z.string().min(1, 'Alasan wajib diisi'),
  attachmentPath: z.string().min(1, 'Lampiran wajib diunggah'),
});

type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<OvertimeStackParamList, 'OvertimeRequest'>;

const palette = {
  maroon: tokens.colors.maroon,
  ink: tokens.colors.ink,
  textSub: tokens.colors.textSub,
  warm: tokens.colors.warmSurface,
  sand: '#F2F0ED',
  maroonTint: '#F0E8EA',
  white: '#FFFFFF',
};

const ClockIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
    <Path
      d="M12 7v5l3 3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BackArrow = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return { hours: 0, minutes: 0 };

  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  let durationMinutes = endTotalMinutes - startTotalMinutes;
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }

  return {
    hours: Math.floor(durationMinutes / 60),
    minutes: durationMinutes % 60,
  };
};

export const OvertimeRequestScreen = ({ navigation }: Props) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const insets = useSafeAreaInsets();
  const todayInJakarta = useMemo(() => getTodayInJakarta(), []);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      overtimeTypeId: '',
      overtimeDate: '',
      startTime: '',
      endTime: '',
      reason: '',
      attachmentPath: '',
    },
  });

  const startTime = useWatch({ control, name: 'startTime' });
  const endTime = useWatch({ control, name: 'endTime' });

  const duration = useMemo(
    () => calculateDuration(startTime, endTime),
    [startTime, endTime]
  );

  const { data: overtimeTypes } = useQuery({
    queryKey: ['overtime-types'],
    queryFn: getOvertimeTypes,
  });

  const overtimeTypeOptions = useMemo(() => {
    if (!overtimeTypes) return [];
    return overtimeTypes.map((type) => ({
      label: type.name,
      value: String(type.id),
    }));
  }, [overtimeTypes]);

  const { data: overtimes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['overtime'],
    queryFn: () => getOvertimes(),
  });

  const {
    isValidating,
    wifiProofOk,
    wifiProofError,
    wifiSsid,
    errorCode,
    refreshValidation,
  } = useWifiValidation();

  useEffect(() => {
    if (activeTab === 'new') {
      refreshValidation();
    }
  }, [activeTab, refreshValidation]);

  const mutation = useMutation({
    mutationFn: createOvertime,
    onSuccess: () => {
      showToast('success', 'Pengajuan lembur berhasil dikirim.');
      queryClient.invalidateQueries({ queryKey: ['overtime'] });
      reset();
      setActiveTab('history');
    },
    onError: (error) => showErrorModal(getErrorMessage(error)),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadOvertimeAttachment,
    onError: (error) => showErrorModal(getErrorMessage(error)),
  });

  const resolveAttachmentPath = (value: string) => {
    if (!value) return value;
    if (/^https?:\/\//i.test(value)) return value;
    const baseOrigin = new URL(env.API_BASE_URL).origin;
    const normalizedPath = value.startsWith('/') ? value.slice(1) : value;
    return `${baseOrigin}/${normalizedPath}`;
  };

  const handleAttachmentPick = async (
    file: { uri: string; name?: string | null; type?: string | null; size?: number | null }
  ) => {
    try {
      const maxSizeBytes = 2 * 1024 * 1024;
      if (file.size && file.size > maxSizeBytes) {
        showErrorModal('Ukuran file maksimal 2MB.');
        return undefined;
      }

      const lowerName = (file.name || '').toLowerCase();
      const isAllowedType =
        file.type === 'application/pdf' ||
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        lowerName.endsWith('.pdf') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.png');

      if (!isAllowedType) {
        showErrorModal('Hanya file PDF, JPG, JPEG, atau PNG yang diperbolehkan.');
        return undefined;
      }

      const uploaded = await uploadMutation.mutateAsync({
        uri: file.uri,
        name: file.name,
        type: file.type,
      });

      return { value: uploaded.path, fileName: uploaded.originalName };
    } catch {
      return undefined;
    }
  };

  const isWifiChecking = isValidating || wifiProofOk === null;

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      overtimeTypeId: Number(values.overtimeTypeId),
      overtimeDate: values.overtimeDate,
      startTime: values.startTime,
      endTime: values.endTime,
      reason: values.reason,
      attachment: resolveAttachmentPath(values.attachmentPath.trim()),
    });
  };

  const renderHistoryItem = ({ item }: { item: NonNullable<typeof overtimes>[number] }) => (
    <Pressable
      onPress={() => navigation.navigate('OvertimeDetail', { id: item.id })}
    >
      <Card className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-semibold text-ink-700">
              {item.overtimeTypeName}
            </Text>
            <Text className="mt-1 text-sm text-ink-500">
              {item.overtimeDate}
            </Text>
          </View>
          <StatusChip label={item.status} variant={statusToVariant(item.status)} />
        </View>
        <View
          className="rounded-2xl px-3 py-2"
          style={{ backgroundColor: palette.sand }}
        >
          <Text className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Durasi
          </Text>
          <Text className="mt-1 text-sm font-medium text-ink-700">
            {formatDurationHours(item.durationHours)} • {item.startTime} - {item.endTime}
          </Text>
        </View>
        <Text className="text-sm text-ink-500" numberOfLines={2}>
          {item.reason}
        </Text>
      </Card>
    </Pressable>
  );

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: palette.warm, paddingTop: insets.top }}
    >
      <View className="px-4 pb-4 pt-3" style={{ backgroundColor: palette.maroon }}>
        <View className="flex-row items-center">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-4 rounded-full p-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
          >
            <BackArrow color={palette.white} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Lembur
            </Text>
            <Text className="text-2xl font-bold text-white">
              Pengajuan lembur
            </Text>
            <Text className="mt-1 text-sm text-white/80">
              Ajukan kerja tambahan dan pantau status persetujuannya.
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4 pb-4 pt-4">
        <View
          className="flex-row rounded-full p-1"
          style={{ backgroundColor: palette.sand }}
        >
          {([
            ['new', 'Ajukan'],
            ['history', 'Riwayat'],
          ] as const).map(([tabId, label]) => {
            const active = activeTab === tabId;
            return (
              <Pressable
                key={tabId}
                onPress={() => setActiveTab(tabId)}
                className="flex-1 rounded-full px-4 py-3"
                style={{
                  backgroundColor: active ? palette.white : 'transparent',
                }}
              >
                <Text
                  className="text-center text-sm font-semibold"
                  style={{ color: active ? palette.maroon : palette.textSub }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {activeTab === 'new' ? (
        <Screen scroll>
          <View className="gap-5">
            <WifiValidationCard
              isValidating={isValidating}
              wifiProofOk={wifiProofOk}
              wifiProofError={wifiProofError}
              wifiSsid={wifiSsid}
              onRefresh={refreshValidation}
              variant="compact"
              errorCode={errorCode}
              onOpenSettings={() => openSettings()}
            />

            <Card className="gap-4">
              <View>
                <Text className="text-lg font-semibold text-ink-700">
                  Detail lembur
                </Text>
                <Text className="mt-1 text-sm text-ink-500">
                  Isi data dasar agar pengajuan bisa diproses lebih cepat.
                </Text>
              </View>

              <FormSelect
                control={control}
                name="overtimeTypeId"
                label="Jenis lembur"
                placeholder="Pilih jenis lembur"
                options={overtimeTypeOptions}
              />

              <FormDatePicker
                control={control}
                name="overtimeDate"
                label="Tanggal lembur"
                placeholder="YYYY-MM-DD"
                minimumDate={todayInJakarta}
              />

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <FormTimePicker
                    control={control}
                    name="startTime"
                    label="Jam mulai"
                    placeholder="Pilih waktu"
                  />
                </View>
                <View className="flex-1">
                  <FormTimePicker
                    control={control}
                    name="endTime"
                    label="Jam selesai"
                    placeholder="Pilih waktu"
                  />
                </View>
              </View>

              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: palette.sand }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: palette.maroonTint }}
                  >
                    <ClockIcon color={palette.maroon} />
                  </View>
                  <View>
                    <Text className="text-xs font-medium uppercase text-ink-500">
                      Estimasi durasi
                    </Text>
                    <Text className="mt-1 text-lg font-bold text-ink-700">
                      {duration.hours} jam {duration.minutes} menit
                    </Text>
                  </View>
                </View>
              </View>
            </Card>

            <FormInput
              control={control}
              name="reason"
              label="Alasan lembur"
              placeholder="Jelaskan kebutuhan lembur Anda..."
              multiline
            />

            <FormFilePicker
              control={control}
              name="attachmentPath"
              label="Lampiran"
              helperText="PDF, JPG, JPEG, atau PNG. Maksimal 2MB."
              loading={uploadMutation.isPending}
              onPick={handleAttachmentPick}
            />

            <Button
              label={
                uploadMutation.isPending
                  ? 'Mengunggah...'
                  : mutation.isPending
                    ? 'Mengirim...'
                    : isWifiChecking
                      ? 'Memeriksa Wi-Fi...'
                      : wifiProofOk === false
                        ? 'Sambungkan Wi-Fi kantor'
                        : 'Kirim pengajuan'
              }
              onPress={handleSubmit(onSubmit)}
              loading={mutation.isPending || uploadMutation.isPending}
              disabled={isWifiChecking || wifiProofOk !== true}
              className="mt-1"
            />
          </View>
        </Screen>
      ) : (
        <View className="flex-1">
          {isLoading ? (
            <View className="px-4 pt-1">
              <LoadingSkeleton count={3} />
            </View>
          ) : overtimes && overtimes.length > 0 ? (
            <FlatList
              data={overtimes}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderHistoryItem}
              contentContainerStyle={{
                padding: 16,
                gap: 12,
                paddingBottom: insets.bottom + 24,
              }}
              refreshing={isRefetching}
              onRefresh={refetch}
            />
          ) : (
            <View className="px-4 pt-1">
              <EmptyState
                icon="time-outline"
                title="Belum ada pengajuan lembur"
                description="Pengajuan yang sudah dibuat akan muncul di sini agar mudah dipantau."
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
};
