import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Spacing, Gradients, Elevation, Motion } from '../theme/tokens';
import TopStatsBar from '../components/TopStatsBar';
import { listGrades } from '../../../../core/contract';
import { useUser } from '../../../../core/contract';
import { useBreathing, usePulse } from '../theme/motion';
import { haptics } from '../../../../core/contract';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type NodeState = 'locked' | 'available' | 'completed';

const SCREEN_W = Dimensions.get('window').width;
const NODE_SIZE = 78;
const ROW_HEIGHT = 130;
const SECTION_GAP = 28;

interface PathNode {
  gradeId: number;
  gradeTitle: string;
  lessonId: string;
  title: string;
  state: NodeState;
  stars: number;
  /** Index within its grade section (0..n-1) */
  sectionIdx: number;
  /** Whether this is the last node in its section (for connector cutoffs) */
  lastInSection: boolean;
}

// A horizontal zig-zag with three lanes — gives the path that wandering
// Duolingo feel without breaking responsive layout on narrow phones.
const LANES = [-1, -0.5, 0.5, 1, 0.5, -0.5];
const LANE_WIDTH = (SCREEN_W - 200) / 2;

function nodeX(idx: number): number {
  const offset = LANES[idx % LANES.length] * LANE_WIDTH;
  return SCREEN_W / 2 + offset - NODE_SIZE / 2;
}

// ── Single node ──────────────────────────────────────────────────
function PathNodeView({
  node, onPress,
}: { node: PathNode; onPress: () => void }) {
  const breath = useBreathing(0.95, 1.05, 2400);
  const pulse = usePulse(0.0, 0.55, 1600);
  const press = React.useRef(new Animated.Value(0)).current;
  const animatePress = (to: number) =>
    Animated.spring(press, { toValue: to, ...Motion.spring.press, useNativeDriver: true }).start();
  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });

  const isActive = node.state === 'available';
  const isComplete = node.state === 'completed';
  const isLocked = node.state === 'locked';

  const gradient: readonly [string, string] =
    isComplete ? [Gradients.butter[0], Gradients.butter[1]] :
    isActive   ? [Gradients.brand[0], Gradients.brand[1]] :
                 ['#F0E5C8', '#D8C39B'];

  const shadow =
    isComplete ? '#C99300' :
    isActive   ? '#2E7000' :
                 '#A78F60';

  const icon = isComplete ? '★' : isActive ? '▶' : '🔒';

  return (
    <View style={[styles.nodeWrap, { left: nodeX(node.sectionIdx) }]}>
      {/* Pulse halo for the active node */}
      {isActive && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.halo,
            {
              opacity: pulse,
              transform: [{ scale: breath }],
              backgroundColor: Colors.brand,
            },
          ]}
        />
      )}

      {/* Floating "START" tag above the active node */}
      {isActive && (
        <View style={styles.startTag}>
          <Text style={styles.startTagText}>START</Text>
          <View style={styles.startTagArrow} />
        </View>
      )}

      <Pressable
        onPress={() => {
          if (isLocked) {
            haptics.warning();
            return;
          }
          haptics.bump();
          onPress();
        }}
        onPressIn={() => !isLocked && animatePress(1)}
        onPressOut={() => animatePress(0)}
      >
        <Animated.View style={{ transform: [{ scale: isActive ? breath : 1 }, { translateY }] }}>
          <View style={[styles.shadowPlate, { backgroundColor: shadow }]} />
          <LinearGradient
            colors={[gradient[0], gradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.node, isLocked && { opacity: 0.7 }]}
          >
            <Text style={[styles.nodeIcon, isLocked && { fontSize: 26 }]}>{icon}</Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>

      <Text style={styles.nodeLabel} numberOfLines={2}>{node.title}</Text>
      {isComplete && (
        <Text style={styles.nodeStars}>
          {'★'.repeat(node.stars)}{'☆'.repeat(Math.max(0, 3 - node.stars))}
        </Text>
      )}
    </View>
  );
}

// ── Section header (Grade N) ────────────────────────────────────
function SectionHeader({ gradeId, gradeTitle }: { gradeId: number; gradeTitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLineWrap}>
        <View style={styles.sectionLine} />
      </View>
      <View style={styles.sectionPill}>
        <Text style={styles.sectionGrade}>Grade {gradeId}</Text>
        <Text style={styles.sectionTitle}>{gradeTitle}</Text>
      </View>
      <View style={styles.sectionLineWrap}>
        <View style={styles.sectionLine} />
      </View>
    </View>
  );
}

// ── Connector curve between two nodes ───────────────────────────
function Connector({ from, to, dashed }: { from: { x: number; y: number }; to: { x: number; y: number }; dashed: boolean }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx1 = from.x + dx * 0.3;
  const cy1 = from.y + dy * 0.6;
  const cx2 = from.x + dx * 0.7;
  const cy2 = from.y + dy * 0.4;
  const d = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
  return (
    <Path
      d={d}
      stroke={Colors.inkLine}
      strokeWidth={5}
      strokeLinecap="round"
      strokeDasharray={dashed ? '6 8' : undefined}
      fill="none"
    />
  );
}

// ── Screen ──────────────────────────────────────────────────────
export default function PathScreen() {
  const nav = useNavigation<Nav>();
  const { lessonProgress } = useUser();
  const grades = useMemo(() => listGrades(), []);

  // Flatten with section/lesson metadata.
  const sections: { gradeId: number; gradeTitle: string; nodes: PathNode[] }[] = useMemo(() => {
    let runningIdx = 0;
    const firstIncompleteId = (() => {
      for (const g of grades) for (const l of g.lessons) {
        if (lessonProgress[l.id]?.status !== 'completed') return l.id;
      }
      return null;
    })();

    return grades.map((g) => {
      const nodes: PathNode[] = g.lessons.map((l, i) => {
        const completed = lessonProgress[l.id]?.status === 'completed';
        const state: NodeState = completed
          ? 'completed'
          : l.id === firstIncompleteId
            ? 'available'
            : 'locked';
        const node: PathNode = {
          gradeId: g.id,
          gradeTitle: g.title,
          lessonId: l.id,
          title: l.title,
          state,
          stars: lessonProgress[l.id]?.stars ?? 0,
          sectionIdx: i,
          lastInSection: i === g.lessons.length - 1,
        };
        runningIdx++;
        return node;
      });
      return { gradeId: g.id, gradeTitle: g.title, nodes };
    });
  }, [grades, lessonProgress]);

  return (
    <View style={styles.bg}>
      <LinearGradient
        colors={[Gradients.paper[0], Gradients.paper[1]]}
        style={styles.headerBg}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TopStatsBar title="Path" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, sIdx) => {
            if (section.nodes.length === 0) {
              return (
                <View key={`empty-${section.gradeId}`} style={styles.emptySection}>
                  <SectionHeader gradeId={section.gradeId} gradeTitle={section.gradeTitle} />
                  <View style={styles.lockedPill}>
                    <Text style={styles.lockedPillText}>🔒  Unlocks soon</Text>
                  </View>
                </View>
              );
            }
            const totalH = section.nodes.length * ROW_HEIGHT;
            return (
              <View key={section.gradeId} style={{ marginBottom: SECTION_GAP }}>
                <SectionHeader gradeId={section.gradeId} gradeTitle={section.gradeTitle} />
                <View style={{ width: SCREEN_W, height: totalH, marginLeft: -Spacing.lg }}>
                  {/* Connectors layer */}
                  <Svg
                    width={SCREEN_W}
                    height={totalH}
                    style={StyleSheet.absoluteFill}
                  >
                    {section.nodes.slice(0, -1).map((n, i) => {
                      const next = section.nodes[i + 1];
                      const from = {
                        x: nodeX(n.sectionIdx) + NODE_SIZE / 2,
                        y: i * ROW_HEIGHT + NODE_SIZE / 2 + 30, // +30 for label space
                      };
                      const to = {
                        x: nodeX(next.sectionIdx) + NODE_SIZE / 2,
                        y: (i + 1) * ROW_HEIGHT + NODE_SIZE / 2 + 30,
                      };
                      const dashed =
                        n.state === 'locked' || next.state === 'locked';
                      return (
                        <Connector
                          key={`c${i}`}
                          from={from}
                          to={to}
                          dashed={dashed}
                        />
                      );
                    })}
                  </Svg>

                  {/* Nodes layer */}
                  {section.nodes.map((n, i) => (
                    <View
                      key={n.lessonId}
                      style={{ position: 'absolute', top: i * ROW_HEIGHT, width: SCREEN_W }}
                    >
                      <PathNodeView
                        node={n}
                        onPress={() => nav.navigate('Lesson', { gradeId: n.gradeId, lessonId: n.lessonId })}
                      />
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
          <View style={{ height: Spacing['2xl'] * 2 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.cream50 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  sectionLineWrap: { flex: 1 },
  sectionLine: { height: 2, backgroundColor: Colors.inkLine, borderRadius: 1 },
  sectionPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    ...Elevation.sm,
  },
  sectionGrade: {
    fontSize: Fonts.xs,
    fontWeight: Fonts.weight.bold,
    color: Colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: Fonts.base,
    fontWeight: Fonts.weight.black,
    color: Colors.ink900,
  },

  // Node
  nodeWrap: {
    position: 'absolute',
    top: 0,
    width: NODE_SIZE,
    alignItems: 'center',
    gap: 4,
  },
  shadowPlate: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 5,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.md,
  },
  nodeIcon: { fontSize: 32, color: '#FFFFFF', fontWeight: '900' },
  nodeLabel: {
    fontSize: Fonts.xs,
    fontWeight: Fonts.weight.bold,
    color: Colors.ink700,
    textAlign: 'center',
    maxWidth: 120,
    marginTop: 6,
  },
  nodeStars: {
    fontSize: Fonts.sm,
    color: Colors.butter,
    fontWeight: Fonts.weight.black,
    letterSpacing: 2,
  },

  // Active node halo
  halo: {
    position: 'absolute',
    width: NODE_SIZE + 30,
    height: NODE_SIZE + 30,
    borderRadius: (NODE_SIZE + 30) / 2,
    top: -15,
    left: -15,
  },

  // "START" tag
  startTag: {
    position: 'absolute',
    top: -42,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: Colors.brand,
    borderRadius: 999,
    alignItems: 'center',
    zIndex: 2,
    ...Elevation.sm,
  },
  startTagText: { color: '#FFFFFF', fontSize: Fonts.xs, fontWeight: Fonts.weight.black, letterSpacing: 1.5 },
  startTagArrow: {
    position: 'absolute',
    bottom: -5,
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 5,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: Colors.brand,
  },

  // Empty section (no lessons yet)
  emptySection: { marginBottom: SECTION_GAP },
  lockedPill: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 999,
    backgroundColor: Colors.cream100,
    marginTop: Spacing.md,
  },
  lockedPillText: { color: Colors.ink500, fontSize: Fonts.base, fontWeight: Fonts.weight.bold },
});
