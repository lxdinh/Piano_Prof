import 'package:flutter_test/flutter_test.dart';
import 'package:piano_professor/ble/piano_professor_gatt.dart';

// Pure-Dart tests for the BLE wire protocol — no device or plugins required.
// Run: flutter test
void main() {
  group('LED command frames', () {
    test('setLed builds [op, index, r, g, b]', () {
      expect(PianoProfessorGatt.setLed(5, 88, 204, 2),
          [PianoProfessorGatt.opSetLed, 5, 88, 204, 2]);
    });

    test('setMany packs count + tuples', () {
      final frame = PianoProfessorGatt.setMany([
        (index: 0, r: 255, g: 0, b: 0),
        (index: 1, r: 0, g: 255, b: 0),
      ]);
      expect(frame, [PianoProfessorGatt.opSetMany, 2, 0, 255, 0, 0, 1, 0, 255, 0]);
    });

    test('clearAll / setBrightness', () {
      expect(PianoProfessorGatt.clearAll(), [PianoProfessorGatt.opClearAll]);
      expect(PianoProfessorGatt.setBrightness(300),
          [PianoProfessorGatt.opSetBrightness, 255]); // clamped
    });
  });

  group('Note-Event parsing', () {
    test('parses a Note On from USB', () {
      final e = PianoProfessorGatt.parseNoteEvent([1, 60, 100, 0])!;
      expect(e.on, isTrue);
      expect(e.midiNote, 60);
      expect(e.velocity, 100);
      expect(e.source, MidiSource.usb);
    });

    test('parses a Note Off from TRS', () {
      final e = PianoProfessorGatt.parseNoteEvent([0, 64, 0, 1])!;
      expect(e.on, isFalse);
      expect(e.source, MidiSource.trs);
    });

    test('returns null on short frame', () {
      expect(PianoProfessorGatt.parseNoteEvent([1, 60]), isNull);
    });
  });

  group('Device-Status parsing', () {
    test('reads led count + firmware', () {
      final s = PianoProfessorGatt.parseDeviceStatus([60, 0, 1, 0]);
      expect(s.ledCount, 60);
      expect(s.firmware, '0.1');
      expect(s.activeSource, MidiSource.usb);
    });

    test('falls back to default LED count when zero', () {
      final s = PianoProfessorGatt.parseDeviceStatus([0, 1, 2, 1]);
      expect(s.ledCount, PianoProfessorGatt.defaultLedCount);
    });
  });
}
