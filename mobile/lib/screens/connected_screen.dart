import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../ble/ble_controller.dart';
import '../ble/piano_professor_gatt.dart';
import '../theme/app_theme.dart';
import '../widgets/chunky_button.dart';
import '../widgets/led_strip_art.dart';

/// Step 3 of pairing — "Your piano just woke up." Dark celebratory screen.
/// Ports `ScreenHwConnected` from the design prototype.
class ConnectedScreen extends StatelessWidget {
  const ConnectedScreen({super.key});

  static String _sourceLabel(MidiSource? s) => switch (s) {
        MidiSource.usb => 'USB',
        MidiSource.trs => 'TRS',
        null => '—',
      };

  @override
  Widget build(BuildContext context) {
    final state = context.watch<BleController>().state;
    if (state is! BleConnected) {
      return _disconnected(context);
    }
    final p = state.peripheral;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0F1117), Color(0xFF1A1F2E), AppColors.cream50],
            stops: [0.0, 0.7, 1.0],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    child: const Text('‹ BACK',
                        style: TextStyle(
                            color: AppColors.sky,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1)),
                  ),
                ),
                const SizedBox(height: 8),
                _statusChip(p.status.ledCount),
                const SizedBox(height: 14),
                const Text('Your piano just woke up.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        height: 1.1)),
                const SizedBox(height: 8),
                Text('${p.name} is online. Every lesson now lights up the keys '
                    'above your hand.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white.withOpacity(0.7),
                        height: 1.5)),
                const SizedBox(height: 20),
                const LedStripArt(width: 320, height: 200),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _DarkStat(value: '${p.status.ledCount}', label: 'LEDS'),
                    const SizedBox(width: 8),
                    _DarkStat(value: p.status.firmware, label: 'FIRMWARE'),
                    const SizedBox(width: 8),
                    _DarkStat(
                        value: _sourceLabel(p.status.activeSource),
                        label: 'MIDI IN'),
                  ],
                ),
                const Spacer(),
                ChunkyButton(
                  label: 'Start your first lit lesson',
                  large: true,
                  expand: true,
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Lessons coming soon!')),
                    );
                  },
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () async {
                    await context.read<BleController>().disconnect();
                    if (context.mounted) {
                      Navigator.of(context).popUntil((r) => r.isFirst);
                    }
                  },
                  child: Text('Disconnect',
                      style: TextStyle(
                          color: Colors.white.withOpacity(0.6),
                          fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _statusChip(int ledCount) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.brand.withOpacity(0.18),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.brand.withOpacity(0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
                shape: BoxShape.circle, color: AppColors.brand),
          ),
          const SizedBox(width: 6),
          Text('CONNECTED · $ledCount LEDs',
              style: const TextStyle(
                  color: AppColors.brand,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1)),
        ],
      ),
    );
  }

  Widget _disconnected(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1117),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Disconnected',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w900)),
              const SizedBox(height: 16),
              ChunkyButton(
                label: 'Back',
                onPressed: () =>
                    Navigator.of(context).popUntil((r) => r.isFirst),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DarkStat extends StatelessWidget {
  const _DarkStat({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.06),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.12)),
        ),
        child: Column(
          children: [
            Text(value,
                style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: Colors.white)),
            const SizedBox(height: 2),
            Text(label,
                style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                    color: Colors.white.withOpacity(0.6))),
          ],
        ),
      ),
    );
  }
}
