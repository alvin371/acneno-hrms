import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Calendar, type DateData } from 'react-native-calendars';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { FormFilePicker } from '@/ui/FormFilePicker';
import {
  createLeave,
  getHolidays,
  getLeaveTypes,
  uploadLeaveAttachment,
} from '@/features/leave/api';
import { showToast } from '@/utils/toast';
import { showErrorModal } from '@/utils/errorModal';
import { getErrorMessage } from '@/api/error';
import { queryClient } from '@/lib/queryClient';
import {
  CRIMSON,
  STATUS_COLOR,
  getLeaveMeta,
} from '@/features/leave/meta';
import { COPY } from '@/features/leave/copy';
import {
  daysBetween,
  fmtDate,
  fmtDowFull,
} from '@/features/leave/utils/date';
import type { Holiday, LeaveTypeWithQuotaItem } from '@/api/types';
import type { LeaveStackParamList } from '@/navigation/types';
import { env } from '@/config/env';

const MIN_REASON = 30;
const MAX_REASON = 500;
const JAKARTA_TZ = 'Asia/Jakarta';

const formatDateUTC = (date: Date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isDateString = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

const getTodayJakarta = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: JAKARTA_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return formatDateUTC(new Date());
  }
};

const addDaysUTC = (s: string, n: number) => {
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + n);
  return formatDateUTC(date);
};

const monthRange = (s: string) => {
  const [y, m] = s.split('-').map(Number);
  return {
    start: formatDateUTC(new Date(Date.UTC(y, m - 1, 1))),
    end: formatDateUTC(new Date(Date.UTC(y, m, 0))),
  };
};

const schema = z
  .object({
    leaveTypeId: z.string().min(1, 'Pilih tipe cuti'),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
    endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
    reason: z.string().min(MIN_REASON, `Alasan minimal ${MIN_REASON} karakter`).max(MAX_REASON),
    attachmentPath: z.string(),
  })
  .superRefine((v, ctx) => {
    const today = getTodayJakarta();
    if (isDateString(v.startDate) && v.startDate.localeCompare(today) < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal mulai tidak boleh di masa lalu',
        path: ['startDate'],
      });
    }
    if (
      isDateString(v.startDate) &&
      isDateString(v.endDate) &&
      v.endDate.localeCompare(v.startDate) < 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal selesai harus setelah tanggal mulai',
        path: ['endDate'],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<LeaveStackParamList, 'LeaveCreate'>;

export const LeaveCreateScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const {
    control,
    handleSubmit,
    setValue,
    clearErrors,
    setError,
    formState,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      reason: '',
      attachmentPath: '',
    },
  });

  const leaveTypeId = useWatch({ control, name: 'leaveTypeId' });
  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });
  const reason = useWatch({ control, name: 'reason' });
  const attachmentPath = useWatch({ control, name: 'attachmentPath' });

  const today = useMemo(() => getTodayJakarta(), []);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [calendarMode, setCalendarMode] = useState<'start' | 'end' | null>(null);
  const [success, setSuccess] = useState(false);

  const popAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const submitScale = useRef(new Animated.Value(1)).current;

  const leaveTypesQuery = useQuery({
    queryKey: ['leave-types'],
    queryFn: getLeaveTypes,
  });

  const activeTypes = useMemo(
    () => (leaveTypesQuery.data ?? []).filter((t) => t.isActive),
    [leaveTypesQuery.data]
  );

  const selectedType = useMemo<LeaveTypeWithQuotaItem | undefined>(
    () => activeTypes.find((t) => String(t.id) === leaveTypeId),
    [activeTypes, leaveTypeId]
  );

  const holidayMap = useMemo(() => {
    const m: Record<string, { name?: string }> = {};
    holidays.forEach((h) => {
      if (h.isHoliday) m[h.date] = { name: h.name };
    });
    return m;
  }, [holidays]);

  const fetchHolidays = async (s: string, e: string) => {
    try {
      const data = await getHolidays(s, e);
      setHolidays(data);
      return data;
    } catch (err) {
      showToast('error', getErrorMessage(err));
      return [];
    }
  };

  useEffect(() => {
    const r = monthRange(today);
    void fetchHolidays(r.start, r.end);
  }, [today]);

  const mutation = useMutation({
    mutationFn: createLeave,
    onSuccess: () => {
      setSuccess(true);
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(popAnim, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.poly(4)),
          useNativeDriver: true,
        }),
      ]).start();
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['leave-quota'] });
      setTimeout(() => {
        navigation.goBack();
        showToast('success', COPY.toasts.submitted);
      }, 900);
    },
    onError: (err) => showErrorModal(getErrorMessage(err)),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadLeaveAttachment,
    onError: (err) => showErrorModal(getErrorMessage(err)),
  });

  const resolveAttachmentPath = (v: string) => {
    if (!v) return v;
    if (/^https?:\/\//i.test(v)) return v;
    const baseOrigin = new URL(env.API_BASE_URL).origin;
    const normalized = v.startsWith('/') ? v.slice(1) : v;
    return `${baseOrigin}/${normalized}`;
  };

  const onSubmit = (values: FormValues) => {
    if (selectedType?.requiresAttachment && !values.attachmentPath.trim()) {
      setError('attachmentPath', {
        type: 'custom',
        message: 'Lampiran wajib diunggah',
      });
      return;
    }
    mutation.mutate({
      leaveTypeId: Number(values.leaveTypeId),
      startDate: values.startDate,
      endDate: values.endDate,
      reason: values.reason,
      attachment: resolveAttachmentPath(values.attachmentPath.trim()),
    });
  };

  const handleAttachmentPick = async (file: {
    uri: string;
    name?: string | null;
    type?: string | null;
    size?: number | null;
  }) => {
    try {
      if (file.size && file.size > 5 * 1024 * 1024) {
        showErrorModal('Ukuran file maksimal 5MB.');
        return undefined;
      }
      const lower = (file.name || '').toLowerCase();
      const allowed =
        file.type === 'application/pdf' ||
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        lower.endsWith('.pdf') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png');
      if (!allowed) {
        showErrorModal('Hanya file PDF, JPG, JPEG, atau PNG.');
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

  const markedDates = useMemo(() => {
    const marks: Record<string, {
      startingDay?: boolean;
      endingDay?: boolean;
      color?: string;
      disabled?: boolean;
      disableTouchEvent?: boolean;
    }> = {};
    if (startDate) {
      if (endDate) {
        let cursor = startDate;
        while (cursor <= endDate) {
          const isStart = cursor === startDate;
          const isEnd = cursor === endDate;
          marks[cursor] = {
            startingDay: isStart,
            endingDay: isEnd,
            color: isStart || isEnd ? CRIMSON.cr : '#F0E8EA',
          };
          cursor = addDaysUTC(cursor, 1);
        }
      } else {
        marks[startDate] = {
          startingDay: true,
          endingDay: true,
          color: CRIMSON.cr,
        };
      }
    }
    Object.keys(holidayMap).forEach((d) => {
      marks[d] = {
        ...(marks[d] ?? {}),
        disabled: true,
        disableTouchEvent: true,
      };
    });
    return marks;
  }, [startDate, endDate, holidayMap]);

  const handleDayPress = async (day: DateData) => {
    const sel = day.dateString;
    if (sel < today || holidayMap[sel]) return;

    if (calendarMode === 'start') {
      setValue('startDate', sel, { shouldValidate: true });
      if (endDate && endDate < sel) {
        setValue('endDate', '', { shouldValidate: true });
      }
      clearErrors(['startDate', 'endDate']);
      const r = monthRange(sel);
      void fetchHolidays(r.start, r.end);
      setCalendarMode(null);
      return;
    }
    if (calendarMode === 'end') {
      if (!startDate) {
        setValue('startDate', sel, { shouldValidate: true });
        clearErrors(['startDate']);
        return;
      }
      if (sel < startDate) {
        setValue('startDate', sel, { shouldValidate: true });
        setValue('endDate', '', { shouldValidate: true });
        clearErrors(['startDate', 'endDate']);
        const r = monthRange(sel);
        void fetchHolidays(r.start, r.end);
        return;
      }
      const inRange = await fetchHolidays(startDate, sel);
      if (inRange.length > 0) {
        showToast('error', 'Rentang berisi hari libur.');
        return;
      }
      setValue('endDate', sel, { shouldValidate: true });
      clearErrors(['startDate', 'endDate']);
      setCalendarMode(null);
    }
  };

  const handleMonthChange = (month: DateData) => {
    const r = monthRange(month.dateString);
    void fetchHolidays(r.start, r.end);
  };

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return daysBetween(startDate, endDate);
  }, [startDate, endDate]);

  const reasonLen = (reason ?? '').length;
  const reasonValid = reasonLen >= MIN_REASON;
  const remainingChars = Math.max(0, MIN_REASON - reasonLen);

  const requiresDoc = selectedType?.requiresAttachment ?? false;
  const attachmentValid = !requiresDoc || Boolean(attachmentPath);
  const canSubmit =
    Boolean(leaveTypeId) &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    reasonValid &&
    attachmentValid &&
    !mutation.isPending &&
    !uploadMutation.isPending;

  const popScale = popAnim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FAFAFA' }} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: tabBarHeight + insets.bottom + 120,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={s.backBtn}
              hitSlop={8}
            >
              <Text style={s.backIcon}>←</Text>
            </Pressable>
            <Text style={s.headerTitle}>{COPY.applyTitle}</Text>
          </View>
        </View>

        {/* Step 1: Type */}
        <FormSection number={1} title={COPY.steps.type} hint={COPY.steps.typeHint}>
          {leaveTypesQuery.isLoading ? (
            <Text style={s.loadingText}>Memuat tipe cuti...</Text>
          ) : (
            <Controller
              control={control}
              name="leaveTypeId"
              render={({ field: { onChange } }) => (
                <View style={s.typeGrid}>
                  {activeTypes.map((t) => {
                    const meta = getLeaveMeta(t.code);
                    const active = leaveTypeId === String(t.id);
                    return (
                      <AnimatedTypeCell
                        key={t.id}
                        t={t}
                        meta={meta}
                        active={active}
                        onChange={onChange}
                      />
                    );
                  })}
                </View>
              )}
            />
          )}

          {selectedType ? (
            <FadeIn key={selectedType.id}>
              <View style={s.quotaHint}>
                <Text style={s.quotaHintLabel}>Sisa kuota {selectedType.name}</Text>
                <Text style={s.quotaHintValue}>
                  {selectedType.quotaRemainingDays}
                  <Text style={s.quotaHintTotal}> / {selectedType.quotaTotalDays} hari</Text>
                </Text>
              </View>
            </FadeIn>
          ) : null}

          {formState.errors.leaveTypeId ? (
            <Text style={s.errorText}>{formState.errors.leaveTypeId.message}</Text>
          ) : null}
        </FormSection>

        {/* Step 2: Dates */}
        <FormSection number={2} title={COPY.steps.dates} hint={COPY.steps.datesHint}>
          <View style={s.dateRow}>
            <DateField
              label={COPY.fields.startDate}
              value={startDate}
              onPress={() => setCalendarMode('start')}
            />
            <DateField
              label={COPY.fields.endDate}
              value={endDate}
              onPress={() => setCalendarMode('end')}
            />
          </View>

          {startDate && endDate ? (
            <FadeIn key={`${startDate}-${endDate}`}>
              <View style={s.durationCard}>
                <View>
                  <Text style={s.durationLabel}>{COPY.fields.totalDuration}</Text>
                  <Text style={s.durationDays}>
                    {totalDays} <Text style={s.durationDaysUnit}>hari</Text>
                  </Text>
                </View>
                <View style={s.durationChips}>
                  <View style={s.durationChip}>
                    <Text style={s.durationChipText}>{fmtDowFull(startDate)}</Text>
                  </View>
                  <Text style={s.durationArrow}>→</Text>
                  <View style={s.durationChip}>
                    <Text style={s.durationChipText}>{fmtDowFull(endDate)}</Text>
                  </View>
                </View>
              </View>
            </FadeIn>
          ) : null}

          {formState.errors.startDate ? (
            <Text style={s.errorText}>{formState.errors.startDate.message}</Text>
          ) : null}
          {formState.errors.endDate ? (
            <Text style={s.errorText}>{formState.errors.endDate.message}</Text>
          ) : null}
        </FormSection>

        {/* Step 3: Reason */}
        <FormSection number={3} title={COPY.steps.reason} hint={COPY.steps.reasonHint}>
          <Controller
            control={control}
            name="reason"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={COPY.fields.reasonPlaceholder}
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={MAX_REASON}
                style={[
                  s.textarea,
                  reasonValid && { borderColor: STATUS_COLOR.green },
                ]}
              />
            )}
          />
          <View style={s.reasonFooter}>
            <Text
              style={[
                s.reasonHint,
                reasonValid && { color: STATUS_COLOR.green },
              ]}
            >
              {reasonValid ? '✓ Alasan cukup' : COPY.fields.minReasonHint(remainingChars)}
            </Text>
            <Text style={s.reasonCount}>
              {reasonLen} / {MAX_REASON}
            </Text>
          </View>
          {formState.errors.reason ? (
            <Text style={s.errorText}>{formState.errors.reason.message}</Text>
          ) : null}
        </FormSection>

        {/* Step 4: Attachment */}
        <FormSection
          number={4}
          title={COPY.steps.attachment}
          hint={
            requiresDoc
              ? COPY.fields.attachmentRequired
              : COPY.fields.attachmentOptional
          }
        >
          {attachmentPath ? (
            <FadeIn key="attachment-success">
              <View style={s.attachmentSuccess}>
                <View style={s.attachmentSuccessIcon}>
                  <Text style={{ fontSize: 18 }}>📎</Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                  <Text style={s.attachmentSuccessTitle} numberOfLines={1}>
                    {COPY.fields.uploaded}
                  </Text>
                  <Text style={s.attachmentSuccessName} numberOfLines={1}>
                    {attachmentPath.split('/').pop()}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setValue('attachmentPath', '', { shouldValidate: true })}
                  hitSlop={8}
                >
                  <Text style={s.attachmentRemove}>{COPY.fields.removeFile}</Text>
                </Pressable>
              </View>
            </FadeIn>
          ) : (
            <FormFilePicker
              control={control}
              name="attachmentPath"
              label=""
              buttonLabel={COPY.fields.chooseFile}
              placeholder={COPY.fields.attachmentTypes}
              helperText={COPY.fields.attachmentTypes}
              loading={uploadMutation.isPending}
              onPick={handleAttachmentPick}
            />
          )}
          {formState.errors.attachmentPath ? (
            <Text style={s.errorText}>
              {formState.errors.attachmentPath.message}
            </Text>
          ) : null}
        </FormSection>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Sticky submit */}
      <View
        style={[
          s.stickyBar,
          { paddingBottom: insets.bottom + 12 },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: submitScale }] }}>
          <Pressable
            onPress={handleSubmit(onSubmit)}
            onPressIn={() => {
              if (!canSubmit) return;
              Animated.timing(submitScale, {
                toValue: 0.97,
                duration: 80,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }).start();
            }}
            onPressOut={() => {
              Animated.timing(submitScale, {
                toValue: 1,
                duration: 200,
                easing: Easing.out(Easing.poly(4)),
                useNativeDriver: true,
              }).start();
            }}
            disabled={!canSubmit}
            style={[
              s.submitBtn,
              !canSubmit && { backgroundColor: '#D6CACC' },
            ]}
          >
            <Text style={s.submitBtnText}>
              {mutation.isPending
                ? COPY.submitting
                : uploadMutation.isPending
                  ? COPY.uploading
                  : COPY.submit}
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Calendar sheet */}
      <Modal
        visible={calendarMode !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setCalendarMode(null)}
      >
        <Pressable style={s.sheetBackdrop} onPress={() => setCalendarMode(null)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>
            {calendarMode === 'start' ? 'Pilih Tanggal Mulai' : 'Pilih Tanggal Selesai'}
          </Text>
          <Calendar
            markingType="period"
            minDate={today}
            markedDates={markedDates}
            onMonthChange={handleMonthChange}
            onDayPress={handleDayPress}
            theme={{
              todayTextColor: CRIMSON.cr,
              arrowColor: CRIMSON.cr,
              textMonthFontWeight: '700',
            }}
          />
          <Pressable
            onPress={() => setCalendarMode(null)}
            style={s.sheetClose}
          >
            <Text style={s.sheetCloseText}>Tutup</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Success overlay */}
      {success ? (
        <Animated.View style={[s.successOverlay, { opacity: overlayAnim }]}>
          <Animated.View
            style={[s.successCard, { transform: [{ scale: popScale }] }]}
          >
            <Text style={s.successIcon}>✅</Text>
            <Text style={s.successTitle}>Berhasil!</Text>
            <Text style={s.successSubtitle}>
              Pengajuan cuti Anda telah dikirim.
            </Text>
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
};

function FormSection({
  number,
  title,
  hint,
  children,
}: {
  number: number;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      delay: (number - 1) * 40,
      easing: Easing.out(Easing.poly(4)),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View style={[s.section, { opacity: anim, transform: [{ translateY }] }]}>
      <View style={s.sectionHeader}>
        <View style={s.sectionNumber}>
          <Text style={s.sectionNumberText}>{number}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>{title}</Text>
          <Text style={s.sectionHint}>{hint}</Text>
        </View>
      </View>
      <View style={s.sectionBody}>{children}</View>
    </Animated.View>
  );
}

function AnimatedTypeCell({
  t,
  meta,
  active,
  onChange,
}: {
  t: LeaveTypeWithQuotaItem;
  meta: ReturnType<typeof getLeaveMeta>;
  active: boolean;
  onChange: (val: string) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ width: '48%', transform: [{ scale }] }}>
      <Pressable
        onPress={() => onChange(String(t.id))}
        onPressIn={() => {
          Animated.timing(scale, {
            toValue: 0.95,
            duration: 80,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.timing(scale, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.poly(4)),
            useNativeDriver: true,
          }).start();
        }}
        style={[
          s.typeCell,
          { width: '100%', borderColor: active ? meta.color : '#E8E0E2' },
          active && { backgroundColor: meta.bg },
        ]}
      >
        <View
          style={[
            s.typeCellIcon,
            { backgroundColor: meta.bg, borderColor: meta.border },
          ]}
        >
          <Text style={{ fontSize: 22 }}>{meta.icon}</Text>
        </View>
        <Text
          style={[s.typeCellName, active && { color: meta.color }]}
          numberOfLines={1}
        >
          {t.name}
        </Text>
        <Text style={s.typeCellMeta}>
          {t.requiresAttachment ? '📎 Wajib lampiran' : 'Tanpa lampiran'}
        </Text>
        {active ? (
          <View style={[s.typeCheckBadge, { backgroundColor: meta.color }]}>
            <Text style={s.typeCheckText}>✓</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function FadeIn({ children }: { children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function DateField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.dateField}>
      <Text style={s.dateFieldLabel}>{label}</Text>
      <Text style={[s.dateFieldValue, !value && { color: '#9CA3AF' }]}>
        {value ? fmtDate(value) : COPY.fields.selectDate}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0E2',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F2F0ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F2EDEE',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFEF',
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CRIMSON.cr,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionNumberText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionHint: {
    fontSize: 11.5,
    color: '#9CA3AF',
    marginTop: 2,
  },
  sectionBody: {
    padding: 14,
    gap: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCell: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    minHeight: 110,
  },
  typeCellIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeCellName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  typeCellMeta: {
    fontSize: 10.5,
    color: '#6B7280',
    marginTop: 2,
  },
  typeCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCheckText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  quotaHint: {
    backgroundColor: '#F0E8EA',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quotaHintLabel: {
    fontSize: 12,
    color: CRIMSON.cr3,
    fontWeight: '600',
  },
  quotaHintValue: {
    fontSize: 18,
    color: CRIMSON.cr,
    fontWeight: '800',
  },
  quotaHintTotal: {
    fontSize: 12,
    color: CRIMSON.cr3,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0E2',
    padding: 12,
  },
  dateFieldLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateFieldValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  durationCard: {
    backgroundColor: '#F0E8EA',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: CRIMSON.cr3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  durationDays: {
    fontSize: 28,
    fontWeight: '800',
    color: CRIMSON.cr,
    marginTop: 4,
  },
  durationDaysUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: CRIMSON.cr3,
  },
  durationChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationChip: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  durationChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: CRIMSON.cr3,
  },
  durationArrow: {
    color: CRIMSON.cr,
    fontWeight: '800',
  },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E0E2',
    padding: 12,
    minHeight: 110,
    fontSize: 14,
    color: '#1A1A1A',
    textAlignVertical: 'top',
  },
  reasonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasonHint: {
    fontSize: 11.5,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  reasonCount: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  attachmentSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.25)',
  },
  attachmentSuccessIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(22,163,74,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentSuccessTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: STATUS_COLOR.green,
  },
  attachmentSuccessName: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  attachmentRemove: {
    fontSize: 12,
    fontWeight: '700',
    color: STATUS_COLOR.red,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 11.5,
    color: STATUS_COLOR.red,
    fontWeight: '600',
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F2EDEE',
  },
  submitBtn: {
    backgroundColor: CRIMSON.cr,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14.5,
    fontWeight: '800',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sheetClose: {
    marginTop: 12,
    backgroundColor: '#F2F0ED',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    minWidth: 240,
  },
  successIcon: { fontSize: 48 },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: STATUS_COLOR.green,
    marginTop: 8,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});
