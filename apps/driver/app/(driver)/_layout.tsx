import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  focused,
  activeIcon,
  inactiveIcon,
}: {
  focused: boolean;
  activeIcon: IoniconName;
  inactiveIcon: IoniconName;
}) {
  return (
    <Ionicons
      name={focused ? activeIcon : inactiveIcon}
      size={24}
      color={focused ? COLORS.primary : '#64748B'}
    />
  );
}

export default function DriverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'طلباتي',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} activeIcon="cube" inactiveIcon="cube-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="order/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} activeIcon="person-circle" inactiveIcon="person-circle-outline" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1E293B',
    borderTopColor: '#334155',
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 10,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 10,
  },
});
