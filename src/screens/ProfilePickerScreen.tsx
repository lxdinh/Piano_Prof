import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing, Elevation } from '../theme/tokens';
import MascotImage from '../components/MascotImage';
import ChunkyButton from '../components/ChunkyButton';
import { useProfiles } from '../gamification/ProfilesProvider';
import { AVATAR_OPTIONS, moodForAvatar } from '../gamification/avatars';
import { ProfileSummary } from '../services/types';
import * as haptics from '../feedback/haptics';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ProfilePicker'>;

const MAX_PROFILES = 5; // family plan: up to 5 profiles

export default function ProfilePickerScreen() {
  const nav = useNavigation<Nav>();
  const { profiles, switchProfile, removeProfile } = useProfiles();
  // First run (no profiles yet) drops straight into the create form.
  const [adding, setAdding] = useState(() => profiles.length === 0);
  const [manage, setManage] = useState(false);

  const onSelect = async (p: ProfileSummary) => {
    haptics.press();
    await switchProfile(p.uid);
    nav.replace('MainTabs');
  };

  const onDelete = (p: ProfileSummary) => {
    haptics.warning();
    Alert.alert(
      `Remove ${p.displayName}?`,
      'This permanently deletes this profile and its progress on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeProfile(p.uid) },
      ],
    );
  };

  if (adding) {
    return <AddProfileForm onCancel={() => setAdding(false)} onCreated={() => nav.replace('Placement')} />;
  }

  const canAdd = profiles.length < MAX_PROFILES;

  return (
    <View style={styles.bg}>
      <LinearGradient colors={['#1B1230', '#231a3d', '#120c22']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Text style={styles.title}>Who's playing?</Text>
        <Text style={styles.subtitle}>Each pianist keeps their own streak & progress</Text>

        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {profiles.map((p) => (
            <View key={p.uid} style={styles.tileWrap}>
              <Pressable
                onPress={() => (manage ? onDelete(p) : onSelect(p))}
                style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.96 }] }]}
              >
                <MascotImage mood={moodForAvatar(p.avatarId)} size={92} static />
                {manage && (
                  <View style={styles.removeBadge}><Text style={styles.removeBadgeText}>✕</Text></View>
                )}
              </Pressable>
              <Text style={styles.tileName} numberOfLines={1}>{p.displayName}</Text>
            </View>
          ))}

          {canAdd && !manage && (
            <View style={styles.tileWrap}>
              <Pressable
                onPress={() => { haptics.tap(); setAdding(true); }}
                style={({ pressed }) => [styles.tile, styles.addTile, pressed && { transform: [{ scale: 0.96 }] }]}
              >
                <Text style={styles.addPlus}>＋</Text>
              </Pressable>
              <Text style={styles.tileName}>Add profile</Text>
            </View>
          )}
        </ScrollView>

        {profiles.length > 0 && (
          <Pressable onPress={() => { haptics.tap(); setManage((m) => !m); }} hitSlop={12} style={styles.manageBtn}>
            <Text style={styles.manageText}>{manage ? 'Done' : 'Manage profiles'}</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  );
}

// ── Add-profile form (name + avatar) ─────────────────────────────
function AddProfileForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const { addProfile } = useProfiles();
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState(AVATAR_OPTIONS[0].id);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    const display = name.trim() || 'Pianist';
    setBusy(true);
    await addProfile(display, avatarId);
    onCreated();
  };

  return (
    <View style={styles.bg}>
      <LinearGradient colors={['#1B1230', '#231a3d', '#120c22']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>New profile</Text>

          <View style={styles.previewWrap}>
            <MascotImage mood={moodForAvatar(avatarId)} size={120} />
          </View>

          <Text style={styles.fieldLabel}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Emma"
            placeholderTextColor={Colors.ink500}
            style={styles.input}
            maxLength={20}
            autoFocus
          />

          <Text style={styles.fieldLabel}>PICK AN AVATAR</Text>
          <View style={styles.avatarRow}>
            {AVATAR_OPTIONS.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => { haptics.tap(); setAvatarId(a.id); }}
                style={[styles.avatarChoice, avatarId === a.id && styles.avatarChoiceActive]}
              >
                <MascotImage mood={a.mood} size={56} static />
              </Pressable>
            ))}
          </View>

          <View style={styles.formButtons}>
            <ChunkyButton label="Create & place me" onPress={create} loading={busy} fullWidth haptic="bump" />
            <ChunkyButton label="Cancel" variant="ghost" onPress={onCancel} fullWidth haptic="tap" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#120c22' },
  safe: { flex: 1, paddingHorizontal: Spacing.xl },
  title: {
    fontSize: Fonts['3xl'], fontWeight: Fonts.weight.black, color: '#FFFFFF',
    textAlign: 'center', marginTop: Spacing.xl,
  },
  subtitle: {
    fontSize: Fonts.md, color: 'rgba(255,255,255,0.7)', textAlign: 'center',
    marginTop: Spacing.xs, fontWeight: Fonts.weight.heavy,
  },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: Spacing.xl, paddingVertical: Spacing['2xl'],
  },
  tileWrap: { alignItems: 'center', gap: Spacing.sm, width: 120 },
  tile: {
    width: 120, height: 120, borderRadius: Radii.xl,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    ...Elevation.md,
  },
  addTile: { borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.35)' },
  addPlus: { fontSize: 56, color: 'rgba(255,255,255,0.6)', fontWeight: Fonts.weight.black },
  tileName: { fontSize: Fonts.md, color: '#FFFFFF', fontWeight: Fonts.weight.bold },
  removeBadge: {
    position: 'absolute', top: -6, right: -6,
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center', ...Elevation.sm,
  },
  removeBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: Fonts.weight.black },

  manageBtn: { alignSelf: 'center', paddingVertical: Spacing.md, marginBottom: Spacing.sm },
  manageText: {
    color: 'rgba(255,255,255,0.7)', fontSize: Fonts.md, fontWeight: Fonts.weight.bold,
    letterSpacing: 1, textTransform: 'uppercase',
  },

  // Add form
  formScroll: { paddingVertical: Spacing.xl, gap: Spacing.md },
  previewWrap: { alignItems: 'center', marginVertical: Spacing.lg },
  fieldLabel: {
    fontSize: Fonts.sm, fontWeight: Fonts.weight.black, color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2, marginTop: Spacing.md,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radii.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    color: '#FFFFFF', fontSize: Fonts.lg, fontWeight: Fonts.weight.bold,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'center' },
  avatarChoice: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 2, borderColor: 'transparent',
  },
  avatarChoiceActive: { borderColor: Colors.brand, backgroundColor: 'rgba(88,204,2,0.18)' },
  formButtons: { marginTop: Spacing.xl, gap: Spacing.sm },
});
