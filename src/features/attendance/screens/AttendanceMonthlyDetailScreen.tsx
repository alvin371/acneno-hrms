import { useCallback, useEffect, useState } from 'react';
import { Share, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { getAttendanceReport } from '@/features/attendance/api';
import { getErrorMessage } from '@/api/error';
import { showToast } from '@/utils/toast';
import {
  buildAttendanceCsv,
  formatMonthLabel,
  formatTime,
  shiftMonthKey,
  toMonthKey,
} from '@/features/attendance/utils';

export const AttendanceMonthlyDetailScreen = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthKey(new Date()));
  const [isDownloading, setIsDownloading] = useState(false);

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

  return (
    <Screen scroll>
      <View className="gap-6">
        <View>
          <Text className="text-2xl font-bold text-ink-700">
            Monthly attendance
          </Text>
          <Text className="text-base text-ink-500">
            Review your check-in and check-out details for the month.
          </Text>
        </View>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-semibold text-ink-700">
                {formatMonthLabel(selectedMonth)}
              </Text>
              <Text className="text-sm text-ink-500">
                Summary and daily detail
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Button
                label="Prev"
                variant="ghost"
                className="px-3 py-2"
                onPress={() =>
                  setSelectedMonth((current) => shiftMonthKey(current, -1))
                }
              />
              <Button
                label="Next"
                variant="ghost"
                className="px-3 py-2"
                onPress={() =>
                  setSelectedMonth((current) => shiftMonthKey(current, 1))
                }
              />
            </View>
          </View>

          {attendanceReportQuery.isLoading ? (
            <Text className="text-sm text-ink-500">
              Loading monthly report...
            </Text>
          ) : attendanceReportQuery.data ? (
            <View className="gap-3">
              <View className="gap-1">
                <Text className="text-sm text-ink-600">
                  Present: {attendanceReportQuery.data.summary.present_days}
                </Text>
                <Text className="text-sm text-ink-600">
                  Late: {attendanceReportQuery.data.summary.late_count}
                </Text>
                <Text className="text-sm text-ink-600">
                  Early checkout:{' '}
                  {attendanceReportQuery.data.summary.early_checkout_count}
                </Text>
                <Text className="text-sm text-ink-600">
                  Absent: {attendanceReportQuery.data.summary.absent_count}
                </Text>
                <Text className="text-sm text-ink-600">
                  Leave: {attendanceReportQuery.data.summary.leave_days}
                </Text>
              </View>
              <View className="gap-3">
                {attendanceReportQuery.data.daily.map((day) => (
                  <View
                    key={day.date}
                    className="flex-row items-start justify-between"
                  >
                    <View>
                      <Text className="text-sm font-semibold text-ink-700">
                        {day.date}
                      </Text>
                      <Text className="text-xs text-ink-500">
                        {day.status}
                        {day.holiday_name ? ` - ${day.holiday_name}` : ''}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-ink-500">
                        In: {formatTime(day.first_in)}
                      </Text>
                      <Text className="text-xs text-ink-500">
                        Out: {formatTime(day.last_out)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <Button
                label={isDownloading ? 'Preparing report...' : 'Download report'}
                variant="secondary"
                onPress={handleDownloadReport}
                loading={isDownloading}
              />
            </View>
          ) : (
            <Text className="text-sm text-ink-500">
              No monthly report available yet.
            </Text>
          )}
        </Card>
      </View>
    </Screen>
  );
};
