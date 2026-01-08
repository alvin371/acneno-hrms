import { Text, View } from 'react-native';
import { Screen } from '@/ui/Screen';

export const ProfileEditScreen = () => (
  <Screen scroll className="bg-slate-50">
    <View className="gap-4">
      <Text className="text-2xl font-bold text-ink-700">Edit Profile</Text>
      <Text className="text-base text-ink-500">
        This is a preview of the edit flow. Hook up your form fields and
        validation here.
      </Text>
    </View>
  </Screen>
);
