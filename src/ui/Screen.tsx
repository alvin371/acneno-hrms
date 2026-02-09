import { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@/config/tokens';
import { cn } from '@/utils/cn';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  safeAreaClassName?: string;
  safeAreaStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export const Screen = ({
  children,
  scroll,
  className,
  style,
  refreshing,
  onRefresh,
  safeAreaClassName,
  safeAreaStyle,
  contentContainerStyle,
}: ScreenProps) => {
  if (scroll) {
    return (
      <SafeAreaView
        className={cn('flex-1 bg-slate-50', safeAreaClassName)}
        style={safeAreaStyle}
      >
        <ScrollView
          contentContainerStyle={[
            { padding: tokens.spacing.page },
            contentContainerStyle,
          ]}
          className={cn('flex-1', className)}
          style={style}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing ?? false}
                onRefresh={onRefresh}
                colors={['#2454db']}
                tintColor="#2454db"
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View
        className={cn('flex-1', className)}
        style={[{ padding: tokens.spacing.page }, style]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};
