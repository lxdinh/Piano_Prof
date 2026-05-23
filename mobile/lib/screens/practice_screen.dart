import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../input/note_input_service.dart';
import '../theme/app_theme.dart';
import '../widgets/chunky_button.dart';
import '../widgets/pp_card.dart';
import 'ble_connect_screen.dart';

/// Practice-input hub. The paired LED module reads your piano's USB/TRS MIDI
/// and streams the notes here — that feed powers lessons' "Listen & Wait".
/// Microphone pitch-detection is the experimental fallback.
class PracticeScreen extends StatelessWidget {
  const PracticeScreen({super.key});

  static String _noteName(int midi) {
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    final octave = (midi ~/ 12) - 1;
    return '${names[midi % 12]}$octave';
  }

  @override
  Widget build(BuildContext context) {
    final input = context.watch<NoteInputService>();
    return Scaffold(
      backgroundColor: AppColors.cream50,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          children: [
            Text('PRACTICE · INPUT', style: AppTheme.eyebrow),
            const SizedBox(height: 2),
            Text('Connect your piano', style: AppTheme.h2),
            const SizedBox(height: 4),
            Text('We check the notes you actually play, so lessons can wait for you.',
                style: AppTheme.subtitle),
            const SizedBox(height: 14),

            // Note feed via the LED module (reads piano MIDI -> BLE)
            PpCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.piano,
                          color: input.hasInput ? AppColors.brand : AppColors.ink300),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Piano note feed',
                                style: TextStyle(
                                    fontWeight: FontWeight.w900, fontSize: 14)),
                            Text(
                                input.hasInput
                                    ? 'via ${input.sourceName}'
                                    : 'Pair the Piano Lights to read your piano',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: input.hasInput
                                        ? AppColors.brand
                                        : AppColors.ink500)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                      'The LED module reads your piano over USB-MIDI or TRS-MIDI '
                      'and streams the notes to the app.',
                      style: AppTheme.subtitle.copyWith(fontSize: 12)),
                  const SizedBox(height: 10),
                  ChunkyButton(
                    label: input.hasInput ? 'Manage Piano Lights' : 'Pair Piano Lights',
                    expand: true,
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(builder: (_) => const BleConnectScreen()),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.cream100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      input.lastNote == null
                          ? 'Play a key — the note appears here.'
                          : 'Last note: ${_noteName(input.lastNote!.midi)}'
                              '${input.lastNote!.on ? '' : ' (off)'}',
                      style: const TextStyle(
                          fontWeight: FontWeight.w900, color: AppColors.ink700),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Mic (experimental)
            PpCard(
              child: Row(
                children: [
                  Icon(Icons.mic,
                      color: input.micEnabled ? AppColors.brand : AppColors.ink300),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Microphone (experimental)',
                            style: TextStyle(
                                fontWeight: FontWeight.w900, fontSize: 14)),
                        Text('Pitch-detection fallback when no LED module.',
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.ink500)),
                      ],
                    ),
                  ),
                  Switch(
                    value: input.micEnabled,
                    activeColor: AppColors.brand,
                    onChanged: (v) => v ? input.enableMic() : null,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Tip: once connected, "find-the-key" lesson steps auto-advance when '
              'you play the right note (Listen & Wait).',
              style: AppTheme.subtitle.copyWith(fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
