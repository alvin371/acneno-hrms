import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { changePassword, type PasswordChangePayload } from '@/features/auth/api';
import { getErrorMessage } from '@/api/error';
import { showToast } from '@/utils/toast';

const WINE = '#8B1F2F';
const WINE_DARK = '#5A0F1A';
const GREEN = '#16A34A';

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '#e0e0e0' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: 'Lemah', color: '#DC2626' },
    { label: 'Cukup', color: '#D97706' },
    { label: 'Baik', color: '#65A30D' },
    { label: 'Kuat', color: '#16A34A' },
  ];
  return { score, ...levels[Math.max(0, score - 1)] };
}

function ReqCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={s.reqRow}>
      <View style={[s.reqDot, ok && s.reqDotOk]}>
        {ok ? <Text style={s.reqCheckMark}>✓</Text> : null}
      </View>
      <Text style={[s.reqLabel, ok && s.reqLabelOk]}>{label}</Text>
    </View>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.fieldRow, value.length > 0 && s.fieldRowActive]}>
        <Text style={s.fieldIcon}>🔒</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#bbb"
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          style={s.fieldInput}
        />
        <Pressable onPress={onToggle} style={s.eyeBtn}>
          <Text style={s.eyeIcon}>{show ? '🙈' : '👁️'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const EditPasswordScreen = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();

  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (payload: PasswordChangePayload) => changePassword(payload),
    onSuccess: () => {
      showToast('success', 'Password berhasil diubah.');
      navigation.goBack();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const strength = passwordStrength(newPw);
  const reqs = [
    { ok: newPw.length >= 8, label: 'Minimal 8 karakter' },
    { ok: /[A-Z]/.test(newPw), label: 'Satu huruf kapital' },
    { ok: /[0-9]/.test(newPw), label: 'Satu angka' },
    { ok: /[^A-Za-z0-9]/.test(newPw), label: 'Satu karakter spesial (!@#...)' },
  ];
  const allReqsMet = reqs.every((r) => r.ok);
  const pwMatch = newPw.length > 0 && newPw === confirm;
  const canSave = current.length > 0 && allReqsMet && pwMatch && !mutation.isPending;

  const handleSave = () => {
    if (newPw === current) {
      setError('Password baru tidak boleh sama dengan password lama.');
      return;
    }
    setError('');
    mutation.mutate({ oldPassword: current, newPassword: newPw, passwordConfirmation: confirm });
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={[StyleSheet.absoluteFillObject, s.headerBg]} />
        <View style={s.headerBlob} />
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Kembali</Text>
        </Pressable>
        <View style={s.headerTitleRow}>
          <View style={s.shieldBadge}>
            <Text style={{ fontSize: 18 }}>🛡️</Text>
          </View>
          <View>
            <Text style={s.headerTitle}>Ubah Password</Text>
            <Text style={s.headerSub}>Perbarui kata sandi akun Anda</Text>
          </View>
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
        {/* Info banner */}
        <View style={s.infoBanner}>
          <Text style={s.infoIcon}>ℹ️</Text>
          <Text style={s.infoText}>
            Gunakan kombinasi huruf, angka, dan simbol untuk password yang kuat. Jangan gunakan
            tanggal lahir atau nama.
          </Text>
        </View>

        {/* Password fields card */}
        <View style={s.card}>
          <PasswordField
            label="Password Saat Ini"
            value={current}
            onChange={setCurrent}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            placeholder="Masukkan password lama"
          />
          <View style={s.divider} />
          <PasswordField
            label="Password Baru"
            value={newPw}
            onChange={(v) => { setNewPw(v); setError(''); }}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            placeholder="Buat password baru"
          />

          {newPw.length > 0 ? (
            <View style={s.strengthWrap}>
              <View style={s.strengthBars}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[s.strengthBar, { backgroundColor: i < strength.score ? strength.color : '#eee' }]}
                  />
                ))}
              </View>
              <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          ) : null}

          <PasswordField
            label="Konfirmasi Password Baru"
            value={confirm}
            onChange={(v) => { setConfirm(v); setError(''); }}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            placeholder="Ulangi password baru"
          />

          {confirm.length > 0 && pwMatch ? (
            <Text style={s.matchOk}>✓ Password cocok</Text>
          ) : null}
          {confirm.length > 0 && !pwMatch ? (
            <Text style={s.matchFail}>✕ Password tidak cocok</Text>
          ) : null}
        </View>

        {/* Requirements */}
        {newPw.length > 0 ? (
          <View style={s.card}>
            <Text style={s.reqTitle}>Persyaratan</Text>
            {reqs.map((r, i) => (
              <ReqCheck key={i} ok={r.ok} label={r.label} />
            ))}
          </View>
        ) : null}

        {/* Error banner */}
        {error ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* Submit */}
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={[s.submitBtn, !canSave && s.submitBtnDisabled]}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={{ fontSize: 16 }}>🛡️</Text>
              <Text style={[s.submitBtnText, !canSave && s.submitBtnTextDisabled]}>
                Simpan Password Baru
              </Text>
            </>
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
    paddingBottom: 20,
    overflow: 'hidden',
  },
  headerBg: { backgroundColor: WINE_DARK },
  headerBlob: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  backBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shieldBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scroll: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { flexGrow: 1, padding: 16 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(29,78,216,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(29,78,216,0.15)',
    padding: 12,
    marginBottom: 14,
  },
  infoIcon: { fontSize: 15 },
  infoText: { flex: 1, fontSize: 12, color: '#555', lineHeight: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  divider: { height: 1, backgroundColor: '#f5f5f5', marginBottom: 16 },
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
  fieldRowActive: { borderColor: 'rgba(139,31,47,0.3)' },
  fieldIcon: { fontSize: 16, paddingHorizontal: 12, color: '#ccc' },
  fieldInput: { flex: 1, paddingVertical: 13, fontSize: 14, color: '#1a1a1a' },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 13 },
  eyeIcon: { fontSize: 14, color: '#bbb' },
  strengthWrap: { marginTop: -8, marginBottom: 14 },
  strengthBars: { flexDirection: 'row', gap: 3, marginBottom: 4 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700' },
  matchOk: { fontSize: 11, color: GREEN, marginTop: -8, marginBottom: 8, fontWeight: '600' },
  matchFail: { fontSize: 11, color: '#DC2626', marginTop: -8, marginBottom: 8 },
  reqTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  reqDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqDotOk: { backgroundColor: 'rgba(22,163,74,0.12)' },
  reqCheckMark: { fontSize: 11, color: GREEN, fontWeight: '700' },
  reqLabel: { fontSize: 12, color: '#aaa' },
  reqLabelOk: { color: GREEN },
  errorBanner: {
    backgroundColor: 'rgba(220,38,38,0.07)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.2)',
    padding: 12,
    marginBottom: 14,
  },
  errorText: { fontSize: 12, color: '#DC2626' },
  submitBtn: {
    backgroundColor: WINE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: WINE,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#e8e8e8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  submitBtnTextDisabled: { color: '#bbb' },
});
