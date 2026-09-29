// Piano Professor — flash the LED module's firmware over Bluetooth.
//
// Reached automatically when pairing finds a board in RECOVERY mode (running
// the factory image, advertising only the OTA service), and manually from
// Settings. The transfer itself lives in src/ble/ota.ts; this screen is the
// picker, the progress and the plain-language failure messages.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Device } from 'react-native-ble-plx';
import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import ScrollFit from '../ui/ScrollFit';
import { ProgressBar } from '../ui/atoms';
import { base64ToBytes } from '../ble/base64';
import { OtaSession, OtaProgress, OTA_PHASE_LABEL, OtaError } from '../ble/ota';
import { useHardware } from '../state/HardwareProvider';

const fmtKb = (n: number) => `${Math.round(n / 1024)} KB`;

export default function FirmwareUpdate() {
  const { colors } = useAppTheme();
  const { params, back, go, toast } = useRouter();
  // Prefer the provider's live handle. A Device passed through route params is
  // only as good as whoever owned it — which is exactly how this screen used to
  // receive an already-cancelled connection.
  const { bleDevice } = useHardware();
  const device = bleDevice ?? (params.device as Device | undefined) ?? undefined;

  const [image, setImage] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState<OtaProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<OtaSession | null>(null);
  const busy = progress != null
    && !['done', 'failed', 'idle'].includes(progress.phase);

  // Never leave a half-finished transfer running behind the user's back.
  useEffect(() => () => { sessionRef.current?.cancel(); }, []);

  const pick = useCallback(async () => {
    setError(null);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*', copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      const b64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setImage(base64ToBytes(b64));
      setFileName(asset.name ?? 'firmware.bin');
    } catch {
      setError("Couldn't read that file. Try copying it somewhere local first.");
    }
  }, []);

  const flash = useCallback(async () => {
    if (!device || !image) return;
    setError(null);
    const session = new OtaSession(device);
    sessionRef.current = session;
    try {
      // `run` resolves false when the user cancelled — congratulating them on an
      // update they just stopped is worse than saying nothing.
      if (await session.run(image, setProgress)) toast('Module updated 🎉');
    } catch (e) {
      setError(e instanceof OtaError ? e.message : String(e));
    }
  }, [device, image, toast]);

  // The transfer hides every other way off this screen, so this is the only
  // escape from a module that has stopped acking. Without it a stalled update
  // meant force-quitting the app.
  const cancel = useCallback(() => { sessionRef.current?.cancel(); }, []);

  // ── no board handed in ──
  if (!device) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
          <Icon name="close" size={26} color={colors.inkSoft} />
        </Pressable>
        <ScrollFit pad={28} style={{ gap: 12 }}>
          <Icon name="bluetooth" size={40} color={colors.inkFaint} />
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 22, color: colors.ink }}>
            Connect your module first
          </Text>
          <PPButton label="Find my module" size="md" variant="sky" onPress={() => go('pair')} />
        </ScrollFit>
      </View>
    );
  }

  const done = progress?.phase === 'done';
  const pct = progress && progress.totalBytes
    ? Math.round((progress.bytesSent / progress.totalBytes) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {!busy && (
        <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
          <Icon name="close" size={26} color={colors.inkSoft} />
        </Pressable>
      )}

      <ScrollFit pad={24} style={{ gap: 12 }}>
        <Maestro
          mood={done ? 'trophy' : error ? 'confused' : 'teach'}
          size={90} bg={colors.surface2} float={!busy}
        />
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: colors.ink }}>
          {done ? 'Module updated!' : 'Update your module'}
        </Text>

        {!busy && !done && (
          <Text style={{
            fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkSoft,
            textAlign: 'center', maxWidth: 520,
          }}>
            Pick the <Text style={{ color: colors.ink }}>firmware.bin</Text> built from
            {' '}<Text style={{ color: colors.ink }}>firmware/controller</Text> — it lives in
            {' '}.pio/build/controller_v2/ after running <Text style={{ color: colors.ink }}>pio run</Text>.
          </Text>
        )}

        {/* chosen file */}
        {image && !done && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14,
            backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.line,
          }}>
            <Icon name="check" size={18} color={colors.green} />
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.ink }}>
              {fileName} · {fmtKb(image.length)}
            </Text>
          </View>
        )}

        {/* progress */}
        {progress && !done && (
          <View style={{ width: 460, maxWidth: '100%', gap: 6 }}>
            <ProgressBar value={pct} height={12} color={colors.sky} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkSoft }}>
                {OTA_PHASE_LABEL[progress.phase]}
              </Text>
              <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkFaint }}>
                {progress.phase === 'transferring'
                  ? `${pct}%${progress.etaSeconds != null ? ` · ${progress.etaSeconds}s left` : ''}`
                  : ''}
              </Text>
            </View>
          </View>
        )}

        {busy && (
          <>
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkFaint, textAlign: 'center' }}>
              Keep the phone close and leave the module powered.
            </Text>
            <PPButton label="Cancel update" size="sm" variant="ghost" onPress={cancel} />
          </>
        )}

        {error && (
          <Text style={{
            fontFamily: Fonts.family.bold, fontSize: 14, color: colors.error,
            textAlign: 'center', maxWidth: 520,
          }}>
            {error}
          </Text>
        )}

        {/* actions */}
        {!busy && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            {done ? (
              <PPButton label="Done" size="md" variant="green" onPress={() => go('pair')} />
            ) : (
              <>
                <PPButton
                  label={image ? 'Choose another' : 'Choose firmware'}
                  size="md" variant={image ? 'ghost' : 'sky'} onPress={pick}
                />
                {image && (
                  <PPButton label="Flash module" size="md" variant="green" onPress={flash} />
                )}
              </>
            )}
          </View>
        )}
      </ScrollFit>
    </View>
  );
}
