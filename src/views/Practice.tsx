// Piano Professor — Practice tab: Chords / Circle / Free play.
import React, { useState } from 'react';
import { View } from 'react-native';
import Shell from '../nav/Shell';
import { Segmented } from '../ui/atoms';
import Piano from '../ui/Piano';
import ChordLibraryView from './practice/ChordLibraryView';
import CircleTrainer from './practice/CircleTrainer';
import * as pianoEngine from '../audio/pianoEngine';

export default function Practice() {
  const [tab, setTab] = useState('chords');

  return (
    <Shell active="practice" scroll={false}>
      <View style={{ flex: 1, padding: 18, gap: 16 }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'chords', label: 'Chords' },
            { value: 'circle', label: 'Circle' },
            { value: 'free', label: 'Free play' },
          ]}
        />
        {tab === 'chords' && <ChordLibraryView />}
        {tab === 'circle' && <CircleTrainer />}
        {tab === 'free' && (
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <Piano low={48} high={84} height={230} onPlay={(m) => pianoEngine.playMidi(m).catch(() => {})} />
          </View>
        )}
      </View>
    </Shell>
  );
}
