import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, RADIUS, SHADOW } from '@/constants/theme';
import { StatusBadge } from './ui/StatusBadge';

export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  originCity: string;
  destinationCity: string;
  originAddress: string;
  destinationAddress: string;
  pickupDate: string;
  weight?: number;
  cargoDescription?: string;
  agreedPrice?: number | null;
  clientBudget?: number | null;
  requiredTruckType?: string;
  client?: { nameAr?: string };
  carrier?: { nameAr?: string };
  mode?: string;
};

type Props = { order: Order; href: string };

export function OrderCard({ order, href }: Props) {
  const router = useRouter();
  const price = order.agreedPrice ?? order.clientBudget;

  const handlePress = async () => {
    await Haptics.selectionAsync();
    router.push(href as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.header}>
        <Text style={styles.orderNum}>{order.orderNumber}</Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.route}>
        <View style={styles.routePoint}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.city}>{order.originCity}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.city}>{order.destinationCity}</Text>
        </View>
      </View>

      {order.cargoDescription && (
        <Text style={styles.cargo} numberOfLines={1}>{order.cargoDescription}</Text>
      )}

      <View style={styles.footer}>
        {price ? (
          <Text style={styles.price}>{price.toLocaleString('en-US')} <Text style={styles.currency}>ر.س</Text></Text>
        ) : <View />}
        <Text style={styles.date}>
          {new Date(order.pickupDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    ...SHADOW.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.textSecondary, letterSpacing: 0.3 },

  route: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { flex: 1, height: 1, backgroundColor: COLORS.border, marginHorizontal: 2 },
  city: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text },

  cargo: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  price: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.primary },
  currency: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted },
  date: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted },
});
