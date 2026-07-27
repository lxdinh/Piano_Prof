// Piano Professor — push firmware to the module over BLE.
//
// Reached two ways: automatically from pairing when a module comes up in
// recovery mode (a factory-fresh board, which can do nothing else until it has
// real firmware), and from Settings to update a working module.

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';

import { useBLEContext } from '../ble/BLEContext';
import { base64ToBytes } from '../ble/base64';
import { OTA_PHASE_LABEL, OtaPhase, OtaProgress } from '../ble/ota';
import { otaSlotName } from '../ble/protocol';
import ChunkyButton from '../components/ChunkyButton';
import PpCard from '../components/PpCard';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';

const BUSY: OtaPhase[] = ['handshaking', 'preparing', 'transferring', 'verifying', 'rebooting'];

function fmtBytes(b: number): string {
  return b >= 1024 * 1024
    ? `${(b / 1024 / 1024).toFixed(2)} MB`
    : `${Math.round(b / 1024)} KB`;
}

export default function FirmwareUpdateScreen() {
  const ble = useBLEContext();
  const navigation = useNavigation();

  const [image, setImage] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [progress, setProgress] = useState<OtaProgress | null>(null);

  const phase = progress?.phase ?? 'idle';
  const busy = BUSY.includes(phase);

  const pick = useCallback(async () => {
    setPickError(null);
    try {
      // Accept anything: iOS maps extensions to UTIs and has none for .bin, so
      // a type filter would hide the file entirely. The header is validated
      // before we send a byte.
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;

      const asset = res.assets[0];
      const b64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setImage(base64ToBytes(b64));
      setFileName(asset.name);
    } catch (e) {
      setPickError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const install = useCallback(async () => {
    if (!image) return;
    try {
      await ble.updateFirmware(image, setProgress);
    } catch (e) {
      // updateFirmware already reported the failure through onProgress; this
      // just stops the rejection from becoming an unhandled one.
      const msg = e instanceof Error ? e.message : String(e);
      setProgress((p) => (p ? { ...p, phase: 'failed', error: msg } : p));
    }
  }, [ble, image]);

  const confirmCancel = useCallback(() => {
    Alert.alert(
      'Stop the update?',
      'The module will keep its current firmware, and you can start again.',
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => ble.cancelFirmwareUpdate() },
      ],
    );
  }, [ble]);

  // ── Not connected / no OTA service ──────────────────────────
  if (ble.phase !== 'CONNECTED' && ble.phase !== 'CALIBRATING') {
    return (
      <View style={styles.root}>
        <PpCard style={styles.card}>
          <Text style={styles.title}>No module connected</Text>
          <Text style={styles.body}>
            Connect to your Piano Professor module first, then come back here.
          </Text>
        </PpCard>
      </View>
    );
  }

  if (!ble.otaAvailable) {
    return (
      <View style={styles.root}>
        <PpCard style={styles.card}>
          <Text style={styles.title}>Updates not supported</Text>
          <Text style={styles.body}>
            This module runs firmware without the update service. Connect it by
            USB-C to flash it.
          </Text>
        </PpCard>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {ble.isRecovery && (
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>🛠️</Text>
          <Text style={styles.bannerText}>
            <Text style={styles.bannerBold}>Fresh module. </Text>
            It is running the built-in recovery firmware and needs its first
            real firmware before the lights work.
          </Text>
        </View>
      )}

      <PpCard style={styles.card}>
        <Text style={styles.deviceName}>{ble.activeDevice?.name ?? 'Piano Professor'}</Text>
        <Text style={styles.deviceMeta}>
          {ble.isRecovery
            ? 'Recovery mode · no firmware installed yet'
            : `Firmware ${ble.firmware}`}
          {progress?.runningSlot != null && ` · slot ${otaSlotName(progress.runningSlot)}`}
        </Text>
      </PpCard>

      {busy ? (
        <PpCard style={styles.card}>
          <View style={styles.row}>
            <ActivityIndicator color={Colors.sky} />
            <Text style={styles.phaseLabel}>{OTA_PHASE_LABEL[phase]}</Text>
            {phase === 'transferring' && progress && (
              <Text style={styles.pct}>
                {Math.round((progress.bytesSent / Math.max(1, progress.totalBytes)) * 100)}%
              </Text>
            )}
          </View>

          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${
                    progress && progress.totalBytes
                      ? Math.round((progress.bytesSent / progress.totalBytes) * 100)
                      : 0
                  }%`,
                },
              ]}
            />
          </View>

          {phase === 'transferring' && progress && (
            <>
              <Text style={styles.stats}>
                {fmtBytes(progress.bytesSent)} of {fmtBytes(progress.totalBytes)}
                {progress.bytesPerSecond != null &&
                  ` · ${Math.round(progress.bytesPerSecond / 1024)} KB/s`}
                {progress.etaSeconds != null && progress.etaSeconds > 0 &&
                  ` · ${progress.etaSeconds}s left`}
              </Text>
              <ChunkyButton
                label="STOP"
                variant="ghost"
                fullWidth
                style={styles.btn}
                onPress={confirmCancel}
              />
            </>
          )}

          {(phase === 'verifying' || phase === 'rebooting') && (
            <Text style={styles.stats}>Almost there — don’t unplug the module.</Text>
          )}
        </PpCard>
      ) : phase === 'done' ? (
        <PpCard style={styles.card}>
          <Text style={styles.title}>Firmware installed 🎉</Text>
          <Text style={styles.body}>
            The module is restarting with the new firmware. It will reappear in
            a few seconds — pair with it again to use your lights.
          </Text>
          <ChunkyButton
            label="DONE"
            fullWidth
            style={styles.btn}
            onPress={() => navigation.goBack()}
          />
        </PpCard>
      ) : (
        <>
          {phase === 'failed' && progress?.error && (
            <PpCard style={[styles.card, styles.errorCard]}>
              <Text style={styles.title}>Update failed</Text>
              <Text style={styles.body}>{progress.error}</Text>
            </PpCard>
          )}

          <PpCard style={styles.card}>
            <Text style={styles.title}>Firmware file</Text>
            <Text style={[styles.body, fileName ? styles.bodyPicked : null]}>
              {fileName
                ? `${fileName} · ${fmtBytes(image?.length ?? 0)}`
                : 'Pick the firmware.bin built for your module.'}
            </Text>
            {pickError && <Text style={styles.errorText}>{pickError}</Text>}
            <ChunkyButton
              label={fileName ? 'CHOOSE A DIFFERENT FILE' : 'CHOOSE FILE'}
              variant="ghost"
              fullWidth
              style={styles.btn}
              onPress={pick}
            />
          </PpCard>

          <ChunkyButton
            label={phase === 'failed' ? 'TRY AGAIN' : 'INSTALL'}
            fullWidth
            disabled={!image}
            style={styles.btn}
            onPress={install}
          />
          <Text style={styles.hint}>
            Keep the phone next to the module and the app open until this
            finishes. A full image takes roughly 15–30 seconds.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.cream50 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  card:    { marginBottom: Spacing.md },
  errorCard: { borderColor: '#E63A3A' },
  row:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title:   { fontSize: Fonts.md, fontWeight: Fonts.weight.black, color: Colors.ink900, marginBottom: 4 },
  body:    { fontSize: Fonts.base, fontWeight: Fonts.weight.heavy, color: Colors.ink500, lineHeight: 19 },
  bodyPicked: { color: Colors.brandDark },
  deviceName: { fontSize: Fonts.base, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  deviceMeta: { fontSize: Fonts.sm, fontWeight: Fonts.weight.heavy, color: Colors.ink500, marginTop: 2 },
  phaseLabel: { flex: 1, fontSize: Fonts.base, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  pct:     { fontSize: Fonts.base, fontWeight: Fonts.weight.black, color: Colors.brandDark },
  track:   {
    height: 12, borderRadius: Radii.pill, backgroundColor: '#ECDDB4',
    marginTop: Spacing.md, overflow: 'hidden',
  },
  fill:    { height: '100%', backgroundColor: Colors.brand, borderRadius: Radii.pill },
  stats:   {
    fontSize: Fonts.sm, fontWeight: Fonts.weight.heavy, color: Colors.ink500,
    textAlign: 'center', marginTop: Spacing.sm,
  },
  errorText: { fontSize: Fonts.sm, fontWeight: Fonts.weight.heavy, color: '#E63A3A', marginTop: 6 },
  btn:     { marginTop: Spacing.md },
  hint:    {
    fontSize: Fonts.sm, fontWeight: Fonts.weight.heavy, color: Colors.ink500,
    textAlign: 'center', marginTop: Spacing.md, lineHeight: 18,
  },
  banner:  {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.butterBg, borderRadius: Radii.lg,
    borderWidth: 1.5, borderColor: Colors.butterDark,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  bannerEmoji: { fontSize: Fonts.lg },
  bannerText:  {
    flex: 1, fontSize: Fonts.sm, fontWeight: Fonts.weight.heavy,
    color: Colors.ink700, lineHeight: 18,
  },
  bannerBold:  { fontWeight: Fonts.weight.black },
});
