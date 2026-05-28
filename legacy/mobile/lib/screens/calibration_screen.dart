import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../ble/ble_controller.dart';
import '../ble/ble_transport.dart';
import '../ble/piano_professor_gatt.dart';
import '../theme/app_theme.dart';
import '../widgets/chunky_button.dart';
import '../widgets/led_strip_art.dart';
import '../widgets/pp_card.dart';
import 'connected_screen.dart';

/// Step 2 of pairing — "Press the highlighted keys". Lights three LEDs on the
/// strip one at a time and advances when the student plays the matching key
/// (note-on forwarded over the GATT Note-Event characteristic).
/// Ports `ScreenHwPairing` from the design prototype.
class CalibrationScreen extends StatefulWidget {
  const CalibrationScreen({super.key});

  @override
  State<CalibrationScreen> createState() => _CalibrationScreenState();
}

class _CalibrationScreenState extends State<CalibrationScreen> {
  // device LED indices (0..59) lit during calibration: left / middle / right
  static const _deviceTargets = [4, 28, 52];
  // illustration positions (the art has 32 LEDs)
  static const _artTargets = [4, 16, 28];
  static const _stepNames = [
    'Press the LEFT-most green key',
    'Press the MIDDLE green key',
    'Press the RIGHT-most green key',
  ];

  int _step = 0;
  ConnectedPeripheral? _peripheral;
  StreamSubscription<NoteEvent>? _noteSub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _begin());
  }

  void _begin() {
    final s = context.read<BleController>().state;
    if (s is! BleConnected) return;
    _peripheral = s.peripheral;
    // Any note-on advances. Real calibration would map the note to the LED;
    // for this flow we just confirm the student found the lit key.
    _noteSub = _peripheral!.noteEvents.listen((e) {
      if (e.on) _advance();
    });
    _lightCurrent();
  }

  void _lightCurrent() {
    final p = _peripheral;
    if (p == null || _step >= _deviceTargets.length) return;
    p.writeLed(PianoProfessorGatt.clearAll());
    p.writeLed(PianoProfessorGatt.setLed(_deviceTargets[_step], 88, 204, 2));
  }

  void _advance() {
    if (!mounted) return;
    if (_step < _deviceTargets.length - 1) {
      setState(() => _step++);
      _lightCurrent();
    } else {
      _finish();
    }
  }

  void _finish() {
    _peripheral?.writeLed(PianoProfessorGatt.clearAll());
    _goToConnected();
  }

  void _goToConnected() {
    _noteSub?.cancel();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(builder: (_) => const ConnectedScreen()),
    );
  }

  @override
  void dispose() {
    _noteSub?.cancel();
    super.dispose();
  }

  List<Color> _artColors() {
    final list = List<Color>.filled(32, const Color(0xFF222222));
    for (var i = 0; i < _artTargets.length; i++) {
      final p = _artTargets[i];
      if (p < list.length) {
        list[p] = i < _step ? AppColors.brandDeep : AppColors.brand;
      }
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final connected = context.watch<BleController>().state is BleConnected;
    return Scaffold(
      backgroundColor: AppColors.cream50,
      appBar: AppBar(
        backgroundColor: AppColors.cardBg,
        elevation: 0,
        foregroundColor: AppColors.ink900,
        title: const Text('Piano Lights',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
      ),
      body: SafeArea(
        child: !connected
            ? _disconnected()
            : SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                        child: Text('STEP 2 OF 3 · CALIBRATING',
                            style: AppTheme.eyebrow)),
                    const SizedBox(height: 6),
                    Center(
                        child: Text('Press the highlighted keys',
                            style: AppTheme.h2, textAlign: TextAlign.center)),
                    const SizedBox(height: 6),
                    Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 320),
                        child: Text(
                          'We need to learn where your octaves start. Tap each '
                          'green key lit on the strip.',
                          textAlign: TextAlign.center,
                          style: AppTheme.subtitle,
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Center(child: LedStripArt(width: 320, height: 200, ledColors: _artColors())),
                    const SizedBox(height: 10),
                    _progressCard(),
                    const SizedBox(height: 16),
                    ChunkyButton(
                      label: 'Skip calibration',
                      ghost: true,
                      expand: true,
                      onPressed: _goToConnected,
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _progressCard() {
    return PpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Calibration',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              Text('$_step / ${_deviceTargets.length} keys',
                  style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      color: AppColors.brand)),
            ],
          ),
          const SizedBox(height: 6),
          for (var i = 0; i < _stepNames.length; i++)
            _stepRow(i, _stepNames[i]),
        ],
      ),
    );
  }

  Widget _stepRow(int i, String name) {
    final done = i < _step;
    final active = i == _step;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: i == 0
            ? null
            : const Border(top: BorderSide(color: AppColors.inkLine)),
      ),
      child: Opacity(
        opacity: done ? 0.5 : 1,
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: done
                    ? AppColors.brand
                    : active
                        ? const Color(0xFFFFE6BA)
                        : AppColors.cream200,
                border: active
                    ? Border.all(color: AppColors.butterDark, width: 2.5)
                    : null,
              ),
              alignment: Alignment.center,
              child: done
                  ? const Icon(Icons.check, size: 16, color: Colors.white)
                  : Text('${i + 1}',
                      style: TextStyle(
                          fontWeight: FontWeight.w900,
                          color: active ? AppColors.ink900 : AppColors.ink300)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(name,
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: active ? AppColors.ink900 : AppColors.ink500)),
            ),
            if (active)
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                    shape: BoxShape.circle, color: AppColors.brand),
              ),
          ],
        ),
      ),
    );
  }

  Widget _disconnected() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Lost the connection', style: AppTheme.h2),
            const SizedBox(height: 8),
            Text('Your Piano Lights disconnected. Go back and pair again.',
                textAlign: TextAlign.center, style: AppTheme.subtitle),
            const SizedBox(height: 16),
            ChunkyButton(
              label: 'Back',
              onPressed: () => Navigator.of(context).maybePop(),
            ),
          ],
        ),
      ),
    );
  }
}
