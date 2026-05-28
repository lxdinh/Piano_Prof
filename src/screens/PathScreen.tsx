import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Spacing } from '../theme/tokens';
import TopStatsBar from '../components/TopStatsBar';
import { listGrades } from '../lessons/loader';
import { useUser } from '../gamification/UserProvider';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type NodeState = 'locked' | 'available' | 'completed';

export default function PathScreen() {
  const nav = useNavigation<Nav>();
  const { lessonProgress } = useUser();
  const grades = useMemo(() => listGrades(), []);

  // flatten lessons into a single ordered path
  const nodes = useMemo(() => {
    const flat: { gradeId: number; lessonId: string; title: string }[] = [];
    for (const g of grades) {
      for (const l of g.lessons) flat.push({ gradeId: g.id, lessonId: l.id, title: l.title });
    }
    return flat;
  }, [grades]);

  // a node is available if it's the first incomplete one
  const firstIncompleteIdx = nodes.findIndex((n) => lessonProgress[n.lessonId]?.status !== 'completed');

  const stateFor = (idx: number, lessonId: string): NodeState => {
    if (lessonProgress[lessonId]?.status === 'completed') return 'completed';
    if (idx === firstIncompleteIdx) return 'available';
    return 'locked';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopStatsBar title="Path" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {nodes.map((n, idx) => {
          const st = stateFor(idx, n.lessonId);
          const stars = lessonProgress[n.lessonId]?.stars ?? 0;
          const offset = Math.sin(idx * 0.9) * 60; // zig-zag like Duolingo path
          return (
            <View key={n.lessonId} style={[styles.nodeWrap, { transform: [{ translateX: offset }] }]}>
              <Pressable
                disabled={st === 'locked'}
                onPress={() => nav.navigate('Lesson', { gradeId: n.gradeId, lessonId: n.lessonId })}
                style={({ pressed }) => [
                  styles.node,
                  st === 'completed' && { backgroundColor: Colors.brand, borderBottomColor: Colors.brandDark },
                  st === 'available' && { backgroundColor: Colors.sky, borderBottomColor: Colors.skyDark },
                  st === 'locked' && { backgroundColor: Colors.cream100, borderBottomColor: Colors.inkLine },
                  pressed && { transform: [{ translateY: 2 }] },
                ]}
              >
                <Text style={styles.nodeIcon}>
                  {st === 'completed' ? '★' : st === 'available' ? '▶' : '🔒'}
                </Text>
              </Pressable>
              <Text style={styles.nodeLabel}>{n.title}</Text>
              {st === 'completed' && (
                <Text style={styles.stars}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
              )}
            </View>
          );
        })}
        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  scroll: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.xl },
  nodeWrap: { alignItems: 'center', gap: Spacing.xs },
  node: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 5,
  },
  nodeIcon: { fontSize: 30, color: '#FFFFFF' },
  nodeLabel: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink700, maxWidth: 140, textAlign: 'center' },
  stars: { fontSize: Fonts.base, color: Colors.butter },
});
