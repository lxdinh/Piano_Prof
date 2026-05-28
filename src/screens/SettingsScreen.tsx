import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import { useBLEContext } from '../ble/BLEContext';
import { useUser } from '../gamification/UserProvider';
import { useReminders } from '../notifications/useReminders';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function Row({ icon, label, value, onPress, right }: {
  icon: string; label: string; value?: string; onPress?: () => void; right?: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && onPress && { opacity: 0.7 }]}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {right}
        {onPress ? <Text style={styles.chevron}>›</Text> : null}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const nav = useNavigation<Nav>();
  const ble = useBLEContext();
  const { profile } = useUser();
  const { enabled, toggle } = useReminders();

  const bleStatus =
    ble.phase === 'CONNECTED' ? `Connected · ${ble.activeDevice?.name ?? ''}` :
    ble.phase === 'IDLE' ? 'Not connected' : ble.phase.toLowerCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.screenTitle}>Settings</Text>

        <Text style={styles.sectionTitle}>Hardware</Text>
        <View style={styles.group}>
          <Row icon="🎹" label="LED strip" value={bleStatus} onPress={() => nav.navigate('BLEPairing')} />
        </View>

        <Text style={styles.sectionTitle}>Lessons</Text>
        <View style={styles.group}>
          <Row icon="🗣️" label="Instructor voice" onPress={() => nav.navigate('VoiceSettings')} />
          <Row
            icon="🔔"
            label="Practice reminder"
            right={<Switch value={enabled} onValueChange={toggle} trackColor={{ true: Colors.brand }} />}
          />
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.group}>
          <Row icon="⭐" label="Go Premium" onPress={() => nav.navigate('Paywall')} />
          <Row icon="🆔" label="User ID" value={(profile?.uid ?? '').slice(0, 14)} />
        </View>

        <Text style={styles.footer}>Piano Professor v{require('../../app.json').expo.version}</Text>
        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  screenTitle: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: Spacing.md },
  group: { backgroundColor: '#FFFFFF', borderRadius: Radii.lg, borderWidth: 2, borderColor: Colors.inkLine, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.inkLine },
  rowIcon: { fontSize: Fonts.lg },
  rowLabel: { flex: 1, fontSize: Fonts.md, fontWeight: Fonts.weight.bold, color: Colors.ink900 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowValue: { fontSize: Fonts.base, color: Colors.ink500 },
  chevron: { fontSize: Fonts.xl, color: Colors.ink300 },
  footer: { textAlign: 'center', color: Colors.ink300, fontSize: Fonts.sm, marginTop: Spacing.xl },
});
