import { StyleSheet, Text, View } from 'react-native';
import { STATUS_COLOR, STATUS_LABEL, FONTS, RADIUS } from '@/constants/theme';

export function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? { bg: '#F1F5F9', text: '#94A3B8' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.label, { color: c.text }]}>{STATUS_LABEL[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
});
