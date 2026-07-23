// Piano Professor — language picker (compact port of ds-core LangDropdown).
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useAppTheme } from '../theme/AppTheme';
import { Fonts } from '../theme/tokens';
import Icon from './Icon';
import { LANGS, langByCode } from '../i18n';

export default function LangDropdown({ value, onChange }: {
  value: string; onChange: (code: string) => void;
}) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const cur = langByCode(value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 11, paddingHorizontal: 16,
          borderRadius: 13, borderWidth: 2.5, borderColor: colors.line, backgroundColor: colors.surface,
        }}
      >
        <Text style={{ fontSize: 20 }}>{cur.flag}</Text>
        <Text style={{ flex: 1, fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 16, color: colors.ink }}>{cur.native}</Text>
        <Icon name="chevronDown" size={18} color={colors.inkFaint} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: '#0007', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <View style={{ width: 320, maxHeight: '80%', backgroundColor: colors.surface, borderRadius: 18, borderWidth: 2, borderColor: colors.line, padding: 8 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {LANGS.map((l) => {
                const on = l.code === value;
                return (
                  <Pressable
                    key={l.code}
                    onPress={() => { onChange(l.code); setOpen(false); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, backgroundColor: on ? colors.selSky : 'transparent' }}
                  >
                    <Text style={{ fontSize: 19 }}>{l.flag}</Text>
                    <Text style={{ flex: 1, fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 15, color: colors.ink }}>{l.native}</Text>
                    {on && <Icon name="check" size={16} color={colors.skyDeep} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
