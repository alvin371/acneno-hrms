import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@/config/tokens';
import { cn } from '@/utils/cn';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  bottomInset?: number;
};

export const Screen = ({
  children,
  scroll,
  className,
  bottomInset = 96,
}: ScreenProps) => {
  if (scroll) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <ScrollView
          contentContainerStyle={{
            padding: tokens.spacing.page,
            paddingBottom: tokens.spacing.page + bottomInset,
          }}
          className={cn('flex-1', className)}
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
        style={{ padding: tokens.spacing.page }}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};
