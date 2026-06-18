import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Share, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { getAttendanceReport } from '@/features/attendance/api';
import { getErrorMessage } from '@/api/error';
import { showToast } from '@/utils/toast';
import { tokens } from '@/config/tokens';
import {
  buildAttendanceCsv,
  formatMonthLabel,
  formatTime,
  shiftMonthKey,
  toMonthKey,
} from '@/features/attendance/utils';

type DayStatusStyle = { label: string; bg: string; text: string };

const DAY_STATUS_STYLES: Record<string, DayStatusStyle> = {
  present:        { label: 'Present',   bg: '#D1FAE5', text: '#047857' },
  late:           { label: 'Late',      bg: '#FEF3C7', text: '#B45309' },
  absent:         { label: 'Absent',    bg: '#FFE4E6', text: '#BE123C' },
  leave:          { label: 'Leave',     bg: '#DBEAFE', text: '#1D4ED8' },
  holiday:        { label: 'Holiday',   bg: '#F3F4F6', text: '#374151' },
  early_checkout: { label: 'Early out', bg: '#FEF3C7', text: '#B45309' },
};

const getDayStyle = (status: string): DayStatusStyle =>
  DAY_STATUS_STYLES[status.toLowerCase()] ??
  { label: status, bg: '#F5F5F5', text: '#6B7280' };

const parseDayLabel = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
    day: String(day).padStart(2, '0'),
  };
};

type StatCellProps = {
  label: string;
  value: number;
  bg: string;
  textColor: string;
};

const StatCell = ({ label, value, bg, textColor }: StatCellProps) => (
  <View
    style={{
      flex: 1,
      backgroundColor: bg,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'center',
    }}
  >
    <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, lineHeight: 28 }}>
      {value}
    </Text>
    <Text style={{ fontSize: 11, fontWeight: '600', color: textColor, marginTop: 2, opacity: 0.8 }}>
      {label}
    </Text>
  </View>
);

const CardSkeleton = () => (
  <View style={{ gap: 16 }}>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{ flex: 1, height: 64, borderRadius: 12, backgroundColor: tokens.colors.borderWarm }}
        />
      ))}
    </View>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2].map((i) => (
        <View
          key={i}
          style={{ flex: 1, height: 64, borderRadius: 12, backgroundColor: tokens.colors.borderWarm }}
        />
      ))}
      <View style={{ flex: 1 }} />
    </View>
    <View style={{ height: 1, backgroundColor: tokens.colors.borderWarm, marginVertical: 4 }} />
    {[1, 2, 3, 4, 5].map((i) => (
      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 36, gap: 4 }}>
            <View style={{ height: 10, width: 28, borderRadius: 4, backgroundColor: tokens.colors.borderWarm }} />
            <View style={{ height: 18, width: 24, borderRadius: 4, backgroundColor: tokens.colors.borderWarm }} />
          </View>
          <View style={{ height: 20, width: 64, borderRadius: 10, backgroundColor: tokens.colors.borderWarm }} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{ height: 12, width: 40, borderRadius: 4, backgroundColor: tokens.colors.borderWarm }} />
          <View style={{ height: 12, width: 40, borderRadius: 4, backgroundColor: tokens.colors.borderWarm }} />
        </View>
      </View>
    ))}
  </View>
);

export const AttendanceMonthlyDetailScreen = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthKey(new Date()));
  const [isDownloading, setIsDownloading] = useState(false);

  const currentMonth = toMonthKey(new Date());

  const attendanceReportQuery = useQuery({
    queryKey: ['attendance-report', selectedMonth],
    queryFn: () => getAttendanceReport(selectedMonth),
  });

  useEffect(() => {
    if (attendanceReportQuery.error) {
      showToast('error', getErrorMessage(attendanceReportQuery.error));
    }
  }, [attendanceReportQuery.error]);

  const handleDownloadReport = useCallback(async () => {
    setIsDownloading(true);
    try {
      const report =
        attendanceReportQuery.data ??
        (await attendanceReportQuery.refetch()).data;
      if (!report) {
        showToast('error', 'Report is not available yet.');
        return;
      }
      const csv = buildAttendanceCsv(report);
      await Share.share({
        title: `Attendance report ${report.summary.month}`,
        message: csv,
      });
    } catch (error) {
      showToast('error', getErrorMessage(error));
    } finally {
      setIsDownloading(false);
    }
  }, [attendanceReportQuery]);

  const summary = attendanceReportQuery.data?.summary;

  return (
    <Screen scroll>
      <View className="gap-6">
        <View>
          <Text className="text-2xl font-bold text-textink">Monthly attendance</Text>
          <Text className="text-base text-textsub">
            Check-in and check-out details for the month.
          </Text>
        </View>

        <Card className="gap-4">
          {/* Header: month + share + navigation */}
          <View className="flex-row items-center justify-between">
            <View style={{ flex: 1 }}>
              <Text className="text-base font-semibold text-textink">
                {formatMonthLabel(selectedMonth)}
              </Text>
              {summary && (
                <Text className="text-xs text-textsub">
                  {summary.start_time} – {summary.end_time}
                </Text>
              )}
            </View>
            <View className="flex-row items-center gap-1">
              {attendanceReportQuery.data && (
                <Pressable
                  onPress={handleDownloadReport}
                  disabled={isDownloading}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(107,26,43,0.08)',
                    marginRight: 4,
                  }}
                  accessibilityLabel="Share attendance report"
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color={tokens.colors.maroon} />
                  ) : (
                    <Ionicons name="share-outline" size={18} color={tokens.colors.maroon} />
                  )}
                </Pressable>
              )}
              <Button
                label="Prev"
                variant="ghost"
                className="px-3 py-2"
                onPress={() => setSelectedMonth((m) => shiftMonthKey(m, -1))}
              />
              <Button
                label="Next"
                variant="ghost"
                className="px-3 py-2"
                onPress={() => setSelectedMonth((m) => shiftMonthKey(m, 1))}
                disabled={selectedMonth >= currentMonth}
              />
            </View>
          </View>

          {/* Content */}
          {attendanceReportQuery.isLoading ? (
            <CardSkeleton />
          ) : attendanceReportQuery.data ? (
            <View style={{ gap: 20 }}>
              {/* Summary stat grid */}
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <StatCell
                    label="Present"
                    value={attendanceReportQuery.data.summary.present_days}
                    bg="#D1FAE5"
                    textColor="#047857"
                  />
                  <StatCell
                    label="Late"
                    value={attendanceReportQuery.data.summary.late_count}
                    bg="#FEF3C7"
                    textColor="#B45309"
                  />
                  <StatCell
                    label="Early out"
                    value={attendanceReportQuery.data.summary.early_checkout_count}
                    bg="#FEF3C7"
                    textColor="#B45309"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <StatCell
                    label="Absent"
                    value={attendanceReportQuery.data.summary.absent_count}
                    bg="#FFE4E6"
                    textColor="#BE123C"
                  />
                  <StatCell
                    label="Leave"
                    value={attendanceReportQuery.data.summary.leave_days}
                    bg="#DBEAFE"
                    textColor="#1D4ED8"
                  />
                  <View style={{ flex: 1 }} />
                </View>
              </View>

              {/* Section separator */}
              <View style={{ gap: 12 }}>
                <View style={{ height: 1, backgroundColor: tokens.colors.borderWarm }} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: tokens.colors.textSub,
                    letterSpacing: 0.6,
                  }}
                >
                  DAILY BREAKDOWN
                </Text>
              </View>

              {/* Daily rows */}
              <View style={{ gap: 14 }}>
                {attendanceReportQuery.data.daily.map((day) => {
                  const { weekday, day: dayNum } = parseDayLabel(day.date);
                  const style = getDayStyle(day.status);
                  return (
                    <View
                      key={day.date}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {/* Day number */}
                        <View style={{ width: 32, alignItems: 'center' }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: tokens.colors.textSub }}>
                            {weekday}
                          </Text>
                          <Text style={{ fontSize: 17, fontWeight: '700', color: tokens.colors.ink, lineHeight: 22 }}>
                            {dayNum}
                          </Text>
                        </View>
                        {/* Status chip + annotations */}
                        <View style={{ gap: 4 }}>
                          <View
                            style={{
                              backgroundColor: style.bg,
                              borderRadius: 999,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              alignSelf: 'flex-start',
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '600', color: style.text }}>
                              {style.label}
                              {day.holiday_name ? ` · ${day.holiday_name}` : ''}
                            </Text>
                          </View>
                          {(day.late || day.early_checkout) && (
                            <Text style={{ fontSize: 11, color: '#B45309' }}>
                              {[
                                day.late && 'Late in',
                                day.early_checkout && 'Left early',
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </Text>
                          )}
                        </View>
                      </View>
                      {/* Times */}
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: tokens.colors.ink }}>
                          {formatTime(day.first_in)}
                        </Text>
                        <Text style={{ fontSize: 13, color: tokens.colors.textSub }}>
                          {formatTime(day.last_out)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: tokens.colors.ink }}>
                No data for {formatMonthLabel(selectedMonth)}
              </Text>
              <Text style={{ fontSize: 13, color: tokens.colors.textSub, textAlign: 'center' }}>
                Attendance report for this month isn't available yet.
              </Text>
            </View>
          )}
        </Card>
      </View>
    </Screen>
  );
};
