import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import { uploadFile } from '@/api/upload';
import { useAuthStore } from '@/store/authStore';
import {
  updateProfile,
  type ProfileUpdatePayload,
} from '@/features/auth/api';
import { showToast } from '@/utils/toast';
import { resolveMediaUrl } from '@/utils/media';
import { getFriendlyUploadErrorMessage } from '@/utils/uploadError';

const WINE = '#8B1F2F';
const WINE_DARK = '#5A0F1A';

type PickerAsset = Pick<Asset, 'uri' | 'fileName' | 'type'>;

function IconField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  hint,
  editable = true,
}: {
  icon: string;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  hint?: string;
  editable?: boolean;
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View
        style={[
          s.fieldRow,
          multiline && s.fieldRowMulti,
          value.length > 0 && editable && s.fieldRowActive,
          !editable && s.fieldRowDisabled,
        ]}
      >
        <Text style={[s.fieldIcon, multiline && { paddingTop: 2 }]}>{icon}</Text>
        {multiline ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#bbb"
            multiline
            editable={editable}
            autoCapitalize="none"
            style={[s.fieldInputMulti, !editable && s.fieldInputDisabledText]}
          />
        ) : (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#bbb"
            keyboardType={keyboardType}
            editable={editable}
            autoCapitalize="none"
            style={[s.fieldInput, !editable && s.fieldInputDisabledText]}
          />
        )}
        {!editable ? <Text style={s.lockIcon}>🔒</Text> : null}
      </View>
      {hint ? <Text style={s.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export const ProfileEditScreen = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone_number ?? '');
  const [keterangan, setKeterangan] = useState(user?.keterangan ?? '');
  const [selectedPhoto, setSelectedPhoto] = useState<PickerAsset | null>(null);

  const currentPhotoUrl = useMemo(
    () => resolveMediaUrl(user?.profilePicture),
    [user?.profilePicture]
  );
  const previewUri = selectedPhoto?.uri ?? currentPhotoUrl;

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: ProfileUpdatePayload = {};
      if (name.trim()) payload.name = name.trim();
      if (email.trim()) payload.email = email.trim();
      if (keterangan.trim()) payload.keterangan = keterangan.trim();
      if (phone.trim()) payload.phone_number = phone.trim();

      if (selectedPhoto?.uri) {
        let uploaded;
        try {
          uploaded = await uploadFile({
            uri: selectedPhoto.uri,
            name: selectedPhoto.fileName ?? 'profile-photo.jpg',
            type: selectedPhoto.type ?? 'image/jpeg',
            uploadType: 'profile',
          });
        } catch (error) {
          throw new Error(getFriendlyUploadErrorMessage(error, 'profilePhoto'));
        }
        payload.profilePicture = uploaded.path;
      }

      return updateProfile(payload);
    },
    onSuccess: (updated) => {
      updateUser(updated).catch(() => {});
      showToast('success', 'Profil berhasil diperbarui.');
      navigation.goBack();
    },
    onError: (err) => {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Profil belum berhasil diperbarui.');
    },
  });

  const hasChanges =
    name !== (user?.name ?? '') ||
    email !== (user?.email ?? '') ||
    phone !== (user?.phone_number ?? '') ||
    keterangan !== (user?.keterangan ?? '') ||
    selectedPhoto !== null;

  const handlePickedPhoto = (asset?: Asset) => {
    if (!asset?.uri) {
      showToast('error', 'Foto tidak tersedia. Coba lagi.');
      return;
    }
    setSelectedPhoto({
      uri: asset.uri,
      fileName: asset.fileName ?? 'profile-photo.jpg',
      type: asset.type ?? 'image/jpeg',
    });
  };

  const handleCameraPress = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'front',
      saveToPhotos: false,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      const message =
        result.errorMessage ||
        (result.errorCode === 'permission'
          ? 'Izin kamera dibutuhkan untuk mengambil foto profil.'
          : 'Gagal mengambil foto profil.');
      if (result.errorCode === 'permission') {
        Alert.alert('Izin Kamera', message);
      } else {
        showToast('error', message);
      }
      return;
    }
    handlePickedPhoto(result.assets?.[0]);
  };

  const handleLibraryPress = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      const message =
        result.errorMessage ||
        (result.errorCode === 'permission'
          ? 'Izin galeri dibutuhkan untuk memilih foto profil.'
          : 'Gagal memilih foto profil.');
      Alert.alert('Akses Foto', message);
      return;
    }
    handlePickedPhoto(result.assets?.[0]);
  };

  const handlePhotoPress = () => {
    Alert.alert('Foto Profil', 'Pilih sumber foto', [
      { text: '📷 Ambil Foto', onPress: () => void handleCameraPress() },
      { text: '🖼️ Dari Galeri', onPress: () => void handleLibraryPress() },
      ...(selectedPhoto
        ? [
            {
              text: 'Batalkan Foto Baru',
              style: 'destructive' as const,
              onPress: () => setSelectedPhoto(null),
            },
          ]
        : []),
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const initials = (name || user?.name || 'P')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={[StyleSheet.absoluteFillObject, s.headerBg]} />
        <View style={s.headerBlob} />

        <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Profil</Text>
        </Pressable>

        <View style={s.avatarContainer}>
          <Pressable onPress={handlePhotoPress} style={s.avatarWrap}>
            <View style={s.avatarCircle}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={s.avatarImage} />
              ) : (
                <Text style={s.avatarInitials}>{initials}</Text>
              )}
            </View>
            <View style={s.cameraOverlay}>
              <Text style={{ fontSize: 14 }}>📷</Text>
            </View>
          </Pressable>
          <Pressable onPress={handlePhotoPress} style={s.photoBtn}>
            <Text style={s.photoBtnText}>
              {selectedPhoto ? '✓ Foto baru dipilih' : '📷 Ganti Foto'}
            </Text>
          </Pressable>
          {selectedPhoto ? (
            <Text style={s.photoHint}>Foto baru akan diunggah saat Anda menyimpan profil.</Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.content,
          {
            flexGrow: 1,
            paddingBottom: tabBarHeight + insets.bottom + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.section}>
          <Text style={s.sectionLabel}>Informasi Pribadi</Text>
          <IconField
            icon="👤"
            label="Nama Lengkap"
            value={name}
            onChangeText={setName}
            placeholder="Nama lengkap Anda"
          />
          <IconField
            icon="📧"
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="email@acneno.com"
            keyboardType="email-address"
            hint="⚠️ Perubahan email membutuhkan verifikasi ulang"
          />
          <IconField
            icon="📱"
            label="Nomor HP"
            value={phone}
            onChangeText={setPhone}
            placeholder="+62 812 xxxx xxxx"
            keyboardType="phone-pad"
          />
          <IconField
            icon="✏️"
            label="Keterangan / Bio"
            value={keterangan}
            onChangeText={setKeterangan}
            placeholder="Tulis sedikit tentang diri Anda..."
            multiline
          />
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>
            Informasi Kerja{' '}
            <Text style={s.sectionLabelSub}>(hanya dapat diubah HR)</Text>
          </Text>
          <IconField
            icon="🏢"
            label="Departemen"
            value={user?.role_name ?? '—'}
            onChangeText={() => {}}
            placeholder=""
            editable={false}
          />
          <IconField
            icon="📍"
            label="Jabatan"
            value={user?.position_name ?? '—'}
            onChangeText={() => {}}
            placeholder=""
            editable={false}
          />
        </View>

        <Pressable
          onPress={() => mutation.mutate()}
          disabled={!hasChanges || mutation.isPending}
          style={[s.saveBtn, (!hasChanges || mutation.isPending) && s.saveBtnDisabled]}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[s.saveBtnText, !hasChanges && s.saveBtnTextDisabled]}>
              {hasChanges ? 'Simpan Perubahan' : 'Tidak Ada Perubahan'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    overflow: 'hidden',
    alignItems: 'center',
  },
  headerBg: { backgroundColor: WINE_DARK },
  headerBlob: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 16,
  },
  backBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  avatarContainer: { alignItems: 'center', gap: 10 },
  avatarWrap: { position: 'relative' },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: WINE,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: WINE_DARK,
    borderWidth: 2.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  photoBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  photoHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 240,
  },
  scroll: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { flexGrow: 1, padding: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 14,
  },
  sectionLabelSub: {
    fontSize: 10,
    fontWeight: '400',
    color: '#bbb',
    textTransform: 'none',
    letterSpacing: 0,
  },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#444', marginBottom: 6 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  fieldRowMulti: { alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 },
  fieldRowActive: { borderColor: 'rgba(139,31,47,0.3)' },
  fieldRowDisabled: { backgroundColor: '#fafafa' },
  fieldIcon: { fontSize: 16, paddingHorizontal: 12, color: '#ccc' },
  fieldInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 13.5,
    color: '#1a1a1a',
  },
  fieldInputMulti: {
    flex: 1,
    fontSize: 13.5,
    color: '#1a1a1a',
    minHeight: 72,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  fieldInputDisabledText: { color: '#888' },
  lockIcon: { paddingHorizontal: 12, fontSize: 14, color: '#ddd' },
  fieldHint: { fontSize: 11, color: '#aaa', marginTop: 4, paddingLeft: 4 },
  saveBtn: {
    backgroundColor: WINE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: WINE,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnDisabled: { backgroundColor: '#e8e8e8', shadowOpacity: 0, elevation: 0 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  saveBtnTextDisabled: { color: '#bbb' },
});
