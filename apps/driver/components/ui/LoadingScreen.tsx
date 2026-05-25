import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';

export function LoadingScreen({ label = 'جارٍ التحميل...' }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, gap: 12 },
  label: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textMuted },
});
