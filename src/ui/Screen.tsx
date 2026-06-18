import { ReactNode, useContext } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
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
  const bottomTabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const bottomSpacing =
    tokens.spacing.page + bottomTabBarHeight + (bottomTabBarHeight > 0 ? 16 : 0);

  if (scroll) {
    return (
      <SafeAreaView
        className={cn('flex-1 bg-warm', safeAreaClassName)}
        style={safeAreaStyle}
      >
        <ScrollView
          contentContainerStyle={[
            {
              flexGrow: 1,
              padding: tokens.spacing.page,
              paddingBottom: bottomSpacing,
            },
            contentContainerStyle,
          ]}
          className={cn('flex-1', className)}
          style={style}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing ?? false}
                onRefresh={onRefresh}
                colors={[tokens.colors.maroon]}
                tintColor={tokens.colors.maroon}
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
    <SafeAreaView className="flex-1 bg-warm">
      <View
        className={cn('flex-1', className)}
        style={[
          {
            padding: tokens.spacing.page,
            paddingBottom: bottomSpacing,
          },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};
