// Piano Professor — Practice tab: Chords / Circle / Free play.
import React, { useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Shell from '../nav/Shell';
import { Segmented } from '../ui/atoms';
import Piano from '../ui/Piano';
import ChordLibraryView from './practice/ChordLibraryView';
import CircleTrainer from './practice/CircleTrainer';
import * as pianoEngine from '../audio/pianoEngine';

// Free play: the keyboard fills the available body height (never clips/scrolls).
function FreePlay() {
  const [h, setH] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setH(e.nativeEvent.layout.height);
  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }} onLayout={onLayout}>
      {h > 0 && (
        <Piano low={48} high={84} height={Math.min(h, 360)} onPlay={(m) => pianoEngine.playMidi(m).catch(() => {})} />
      )}
    </View>
  );
}

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
        {tab === 'free' && <FreePlay />}
      </View>
    </Shell>
  );
}
