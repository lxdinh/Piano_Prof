import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../ble/ble_controller.dart';
import '../ble/ble_transport.dart';
import '../theme/app_theme.dart';
import '../widgets/chunky_button.dart';
import '../widgets/led_strip_art.dart';
import '../widgets/mascot_image.dart';
import '../widgets/pp_card.dart';
import '../widgets/stat_pill.dart';

/// "Connect your Piano Lights" — BLE discovery + pairing.
/// Ports `ScreenHwDiscover` from the design prototype (pp-screens-hardware.jsx)
/// and wires it to [BleController].
class BleConnectScreen extends StatefulWidget {
  const BleConnectScreen({super.key});

  @override
  State<BleConnectScreen> createState() => _BleConnectScreenState();
}

class _BleConnectScreenState extends State<BleConnectScreen> {
  @override
  void initState() {
    super.initState();
    // Native: auto-start discovery once the first frame is up (so permission
    // dialogs have a UI to attach to). Web waits for the user to tap "Choose".
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final c = context.read<BleController>();
      if (c.canListDevices) c.startScan();
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.watch<BleController>();
    return Scaffold(
      backgroundColor: AppColors.cream50,
      body: SafeArea(
        child: Column(
          children: [
            const _Header(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(child: Text('STEP 1 OF 3 · CONNECT', style: AppTheme.eyebrow)),
                    const SizedBox(height: 6),
                    Center(child: Text('Plug in your Piano Lights', style: AppTheme.h2)),
                    const SizedBox(height: 6),
                    Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 320),
                        child: Text(
                          'Stick the strip above your keys and connect the USB-C '
                          'cable. The status dot turns green when ready.',
                          textAlign: TextAlign.center,
                          style: AppTheme.subtitle,
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Center(child: LedStripArt(width: 320, height: 200)),
                    const SizedBox(height: 10),
                    _StateSection(controller: c),
                    const SizedBox(height: 14),
                    const _HelpRow(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Top bar: mascot + section label + stat pills (static demo values for now).
class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 12),
      decoration: const BoxDecoration(
        color: AppColors.cardBg,
        border: Border(bottom: BorderSide(color: AppColors.inkLine, width: 1.5)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.cream200,
            ),
            clipBehavior: Clip.antiAlias,
            child: const MascotImage(mood: 'teach', size: 40),
          ),
          const SizedBox(width: 10),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('PIANO LIGHTS',
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: AppColors.ink500,
                      letterSpacing: 1.2)),
              Text('Hardware setup',
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: AppColors.ink900)),
            ],
          ),
          const Spacer(),
          const StatPill(
              icon: Icons.local_fire_department, value: '12', color: Color(0xFFFF7A1C)),
          const SizedBox(width: 6),
          const StatPill(icon: Icons.diamond, value: '142', color: AppColors.sky),
          const SizedBox(width: 6),
          const StatPill(icon: Icons.favorite, value: '4', color: AppColors.heart),
        ],
      ),
    );
  }
}

/// Renders the right card for the current BLE state.
class _StateSection extends StatelessWidget {
  const _StateSection({required this.controller});
  final BleController controller;

  @override
  Widget build(BuildContext context) {
    return switch (controller.state) {
      BleScanning s => _SearchCard(devices: s.devices, controller: controller),
      BleConnecting s => _connecting(s.device.name),
      BleConnected s => _Connected(controller: controller, peripheral: s.peripheral),
      BleBluetoothOff() => _Notice(
          mood: 'confused',
          title: 'Bluetooth is off',
          body: 'Turn on Bluetooth, then tap retry to find your Piano Lights.',
          actionLabel: 'RETRY',
          onAction: controller.startScan,
        ),
      BleUnauthorized() => _Notice(
          mood: 'nervous',
          title: 'Bluetooth permission needed',
          body: 'Piano Professor needs Bluetooth access to find your LED strip.',
          actionLabel: 'GRANT & RETRY',
          onAction: controller.startScan,
        ),
      BleFailure f => _Notice(
          mood: 'nervous',
          title: 'Something went wrong',
          body: f.message,
          actionLabel: 'TRY AGAIN',
          onAction: controller.reset,
        ),
      BleIdle() => controller.canListDevices
          ? _Notice(
              mood: 'teach',
              title: 'Ready to connect',
              body: 'Tap below to search for your Piano Lights nearby.',
              actionLabel: 'START SEARCHING',
              onAction: controller.startScan,
            )
          : _Notice(
              mood: 'teach',
              title: 'Choose your Piano Lights',
              body: 'Your browser will show a device chooser. Pick the device '
                  'named Piano-Prof-…',
              actionLabel: 'CHOOSE DEVICE',
              onAction: controller.pickAndConnect,
            ),
    };
  }

  Widget _connecting(String name) => PpCard(
        child: Row(
          children: [
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.sky),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text('Connecting to $name…',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
            ),
          ],
        ),
      );
}

/// Scanning card: searching header + pulse ring + discovered device rows.
class _SearchCard extends StatelessWidget {
  const _SearchCard({required this.devices, required this.controller});
  final List<DiscoveredDevice> devices;
  final BleController controller;

  @override
  Widget build(BuildContext context) {
    return PpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const _PulseBluetooth(),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Searching nearby…',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                    SizedBox(height: 2),
                    Text('Bluetooth is on. Holding the BOOT button helps.',
                        style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink500)),
                  ],
                ),
              ),
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.sky),
              ),
            ],
          ),
          for (final d in devices) ...[
            const _DashedDivider(),
            _DeviceRow(device: d, onPair: () => controller.connect(d)),
          ],
        ],
      ),
    );
  }
}

class _DeviceRow extends StatelessWidget {
  const _DeviceRow({required this.device, required this.onPair});
  final DiscoveredDevice device;
  final VoidCallback onPair;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: Row(
        children: [
          const _PpBadge(),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(device.name,
                    style:
                        const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                const SizedBox(height: 2),
                Text('● Discoverable · ${device.signalLabel}',
                    style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.brand)),
              ],
            ),
          ),
          ChunkyButton(label: 'Pair', onPressed: onPair),
        ],
      ),
    );
  }
}

class _Connected extends StatelessWidget {
  const _Connected({required this.controller, required this.peripheral});
  final BleController controller;
  final ConnectedPeripheral peripheral;

  @override
  Widget build(BuildContext context) {
    return PpCard(
      child: Column(
        children: [
          Row(
            children: [
              SizedBox(
                width: 56,
                height: 56,
                child: const MascotImage(mood: 'trophy', size: 56),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.brandSoft,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        'CONNECTED · ${peripheral.status.ledCount} LEDs',
                        style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            color: AppColors.brandDeep,
                            letterSpacing: 1),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text('Your piano just woke up.',
                        style: AppTheme.h2.copyWith(fontSize: 20)),
                    Text('${peripheral.name} is online.',
                        style: AppTheme.subtitle.copyWith(fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
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
          ChunkyButton(
            label: 'Disconnect',
            ghost: true,
            expand: true,
            onPressed: controller.disconnect,
          ),
        ],
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({
    required this.mood,
    required this.title,
    required this.body,
    required this.actionLabel,
    required this.onAction,
  });

  final String mood;
  final String title;
  final String body;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return PpCard(
      child: Column(
        children: [
          Row(
            children: [
              SizedBox(width: 52, height: 52, child: MascotImage(mood: mood, size: 52)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontWeight: FontWeight.w900, fontSize: 15)),
                    const SizedBox(height: 2),
                    Text(body,
                        style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink500)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ChunkyButton(label: actionLabel, expand: true, onPressed: onAction),
        ],
      ),
    );
  }
}

// ---- small visual bits ----------------------------------------------------

class _PpBadge extends StatelessWidget {
  const _PpBadge();
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: AppColors.ink900,
        borderRadius: BorderRadius.circular(10),
      ),
      alignment: Alignment.center,
      child: const Text('PP',
          style: TextStyle(
              color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
    );
  }
}

class _HelpRow extends StatelessWidget {
  const _HelpRow();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFFE6BA),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: AppColors.butterDark, width: 1.5, style: BorderStyle.solid),
      ),
      child: const Row(
        children: [
          Text('💡', style: TextStyle(fontSize: 18)),
          SizedBox(width: 10),
          Expanded(
            child: Text.rich(
              TextSpan(children: [
                TextSpan(
                    text: 'No device showing? ',
                    style: TextStyle(fontWeight: FontWeight.w900)),
                TextSpan(text: 'Hold BOOT for 3s while plugging in USB-C.'),
              ]),
              style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.ink700),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashedDivider extends StatelessWidget {
  const _DashedDivider();
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: LayoutBuilder(
        builder: (context, c) {
          final count = (c.maxWidth / 8).floor();
          return Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(
              count,
              (_) => Container(width: 4, height: 1.5, color: AppColors.inkLine),
            ),
          );
        },
      ),
    );
  }
}

/// Sky bluetooth circle with an expanding pulse ring behind it.
class _PulseBluetooth extends StatefulWidget {
  const _PulseBluetooth();
  @override
  State<_PulseBluetooth> createState() => _PulseBluetoothState();
}

class _PulseBluetoothState extends State<_PulseBluetooth>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..repeat();

  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 48,
      height: 48,
      child: AnimatedBuilder(
        animation: _ctl,
        builder: (context, child) {
          final t = _ctl.value;
          return Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 40 + 16 * t,
                height: 40 + 16 * t,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.sky.withOpacity((1 - t) * 0.55),
                    width: 2,
                  ),
                ),
              ),
              child!,
            ],
          );
        },
        child: Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.sky,
            boxShadow: [BoxShadow(color: AppColors.skyDark, offset: Offset(0, 3))],
          ),
          child: const Icon(Icons.bluetooth_searching, color: Colors.white, size: 22),
        ),
      ),
    );
  }
}
