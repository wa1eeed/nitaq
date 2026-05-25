import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View, Switch, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, apiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { COLORS, FONTS, RADIUS, SHADOW } from '@/constants/theme';

type Step = 1 | 2 | 3;

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — personal
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');

  // Step 2 — company
  const [companyNameAr, setCompanyNameAr] = useState('');
  const [city,          setCity]          = useState('');
  const [region,        setRegion]        = useState('');
  const [contactPhone,  setContactPhone]  = useState('');

  // Step 3 — legal
  const [terms,    setTerms]    = useState(false);
  const [privacy,  setPrivacy]  = useState(false);
  const [transport,setTransport]= useState(false);

  const nextStep = () => {
    if (step === 1) {
      if (!firstName || !lastName || !phone || password.length < 8) {
        Alert.alert('تنبيه', 'يرجى إكمال جميع الحقول وكلمة مرور لا تقل عن 8 أحرف');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!companyNameAr || !city || !region || !contactPhone) {
        Alert.alert('تنبيه', 'يرجى إكمال معلومات الشركة');
        return;
      }
      setStep(3);
    }
  };

  const handleRegister = async () => {
    if (!terms || !privacy || !transport) {
      Alert.alert('موافقة مطلوبة', 'يرجى الموافقة على جميع الشروط للمتابعة');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        phone: phone.trim(),
        password,
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        companyType: 'CARRIER',
        companyNameAr: companyNameAr.trim(),
        city: city.trim(),
        region: region.trim(),
        contactPhone: contactPhone.trim(),
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedTransport: true,
      });
      await login(phone.trim(), password);
    } catch (err) {
      Alert.alert('فشل التسجيل', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={styles.progress}>
          {([1, 2, 3] as Step[]).map((s) => (
            <View key={s} style={[styles.progressDot, step >= s && styles.progressActive]} />
          ))}
        </View>

        <View style={styles.card}>
          {step === 1 && (
            <>
              <Text style={styles.title}>معلوماتك الشخصية</Text>
              <Field label="الاسم الأول" value={firstName} onChange={setFirstName} placeholder="محمد" />
              <Field label="اسم العائلة" value={lastName}  onChange={setLastName}  placeholder="العتيبي" />
              <Field label="رقم الجوال"  value={phone}     onChange={setPhone}     placeholder="05xxxxxxxx" keyboard="phone-pad" />
              <Field label="كلمة المرور" value={password}  onChange={setPassword}  placeholder="••••••••"  secure />
              <Button label="التالي ←" onPress={nextStep} />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>معلومات شركة النقل</Text>
              <Field label="اسم الشركة (عربي)" value={companyNameAr} onChange={setCompanyNameAr} placeholder="شركة النقل السريع" />
              <Field label="المدينة"           value={city}          onChange={setCity}          placeholder="الرياض" />
              <Field label="المنطقة"           value={region}        onChange={setRegion}        placeholder="الرياض" />
              <Field label="جوال التواصل"      value={contactPhone}  onChange={setContactPhone}  placeholder="05xxxxxxxx" keyboard="phone-pad" />
              <View style={styles.row}>
                <Button label="→ رجوع" onPress={() => setStep(1)} variant="outline" style={{ flex: 1 }} />
                <Button label="التالي ←" onPress={nextStep} style={{ flex: 2 }} />
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.title}>الموافقة على الشروط</Text>
              <ConsentRow label="أوافق على شروط الاستخدام" value={terms}     onChange={setTerms} />
              <ConsentRow label="أوافق على سياسة الخصوصية" value={privacy}   onChange={setPrivacy} />
              <ConsentRow label="أوافق على شروط النقل"      value={transport} onChange={setTransport} />
              <View style={styles.row}>
                <Button label="→ رجوع"   onPress={() => setStep(2)} variant="outline" style={{ flex: 1 }} />
                <Button label="إنشاء الحساب" onPress={handleRegister} loading={loading} style={{ flex: 2 }} />
              </View>
            </>
          )}

          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>لديك حساب؟ <Text style={{ color: COLORS.primary }}>تسجيل الدخول</Text></Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, keyboard, secure }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboard?: any; secure?: boolean;
}) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={fStyles.label}>{label}</Text>
      <TextInput
        style={fStyles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboard ?? 'default'}
        secureTextEntry={secure}
        textAlign="right"
      />
    </View>
  );
}

function ConsentRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={fStyles.consent}>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: COLORS.primary }} />
      <Text style={fStyles.consentLabel}>{label}</Text>
    </Pressable>
  );
}

const fStyles = StyleSheet.create({
  label: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
  input: {
    height: 50, backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14, fontFamily: FONTS.regular, fontSize: 15, color: COLORS.text,
  },
  consent: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  consentLabel: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text, flex: 1 },
});

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: COLORS.bg, padding: 20, gap: 20 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 20 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.border },
  progressActive: { backgroundColor: COLORS.primary, width: 24 },
  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: 24, gap: 16, ...SHADOW.lg },
  title: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, textAlign: 'center', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10 },
  back: { alignItems: 'center', paddingTop: 4 },
  backText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted },
});
