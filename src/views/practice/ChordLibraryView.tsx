// Piano Professor — Chord Library (Practice tab): family tree + chord detail.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { Fonts } from '../../theme/tokens';
import Icon from '../../ui/Icon';
import PPButton from '../../ui/PPButton';
import Piano from '../../ui/Piano';
import StaffChord from '../../ui/StaffChord';
import {
  CHORD_FAMILIES, CHORD_ROOTS, chordTypeById, buildChord, spellChord,
} from '../../data/theory';
import * as pianoEngine from '../../audio/pianoEngine';

export default function ChordLibraryView() {
  const { colors } = useAppTheme();
  const [familyId, setFamilyId] = useState('triads');
  const [typeId, setTypeId] = useState('major');
  const [rootIdx, setRootIdx] = useState(0);

  const root = CHORD_ROOTS[rootIdx];
  const chord = buildChord(typeId, root);
  const spelled = spellChord(chord);
  const lit: Record<number, string> = {};
  chord.notes.forEach((n) => { lit[n] = chord.type.color; });

  const play = () => { pianoEngine.playChord(chord.notes, 70).catch(() => {}); };

  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: 16 }}>
      {/* family tree */}
      <ScrollView style={{ width: 200, flexGrow: 0 }} showsVerticalScrollIndicator={false}>
        {CHORD_FAMILIES.map((fam) => (
          <View key={fam.id} style={{ marginBottom: 10 }}>
            <Pressable onPress={() => setFamilyId(fam.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: familyId === fam.id ? colors.selGreen : colors.surface, borderWidth: 2, borderColor: colors.line }}>
              <Text style={{ fontSize: 16 }}>{fam.icon}</Text>
              <Text style={{ fontFamily: Fonts.family.black, fontSize: 15, color: colors.ink }}>{fam.name}</Text>
            </Pressable>
            {familyId === fam.id && fam.types.map((tid) => {
              const ct = chordTypeById(tid);
              const on = typeId === tid;
              return (
                <Pressable key={tid} onPress={() => setTypeId(tid)}
                  style={{ marginLeft: 14, marginTop: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: on ? ct.color : 'transparent' }}>
                  <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: on ? '#fff' : colors.inkSoft }}>{ct.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* detail */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
        {/* root selector */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {CHORD_ROOTS.map((r, i) => (
            <Pressable key={r.name} onPress={() => setRootIdx(i)}
              style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: i === rootIdx ? chord.type.color : colors.surface, borderWidth: 2, borderColor: i === rootIdx ? chord.type.deep : colors.line }}>
              <Text style={{ fontFamily: Fonts.family.black, fontSize: 18, color: i === rootIdx ? '#fff' : colors.ink }}>{r.name}</Text>
            </Pressable>
          ))}
        </View>

        {/* name + punch */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 40, color: colors.ink }}>{chord.name}</Text>
          <View style={{ backgroundColor: chord.type.color, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 14 }}>
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 15, color: '#fff' }}>{chord.type.punch}</Text>
          </View>
          <PPButton label="Play" size="sm" variant="green" icon={<Icon name="play" size={14} color="#fff" />} onPress={play} />
        </View>
        <Text style={{ fontFamily: Fonts.family.bold, fontSize: 15, color: colors.inkSoft }}>{chord.type.line}</Text>

        <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
          {/* recipe + spelling */}
          <View style={{ flex: 1, minWidth: 240, gap: 10 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 2, borderColor: colors.line, padding: 14, gap: 6 }}>
              <Text style={{ fontFamily: Fonts.family.black, fontSize: 12, color: colors.inkFaint, textTransform: 'uppercase' }}>Recipe</Text>
              <Text style={{ fontFamily: Fonts.family.bold, fontSize: 15, color: colors.ink }}>{chord.type.steps}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                {spelled.map((n, i) => (
                  <View key={i} style={{ alignItems: 'center', gap: 2 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: chord.type.color, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: Fonts.family.black, fontSize: 16, color: '#fff' }}>{n.name}</Text>
                    </View>
                    <Text style={{ fontFamily: Fonts.family.bold, fontSize: 12, color: colors.inkFaint }}>{chord.type.degrees[i]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          {/* staff */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 2, borderColor: colors.line, padding: 8 }}>
            <StaffChord chord={chord} />
          </View>
        </View>

        {/* piano preview */}
        <Piano low={59} high={76} lit={lit} height={150} onPlay={(m) => pianoEngine.playMidi(m).catch(() => {})} />
      </ScrollView>
    </View>
  );
}
