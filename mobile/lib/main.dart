import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'ble/ble_controller.dart';
import 'screens/ble_connect_screen.dart';
import 'theme/app_theme.dart';

void main() => runApp(const PianoProfessorApp());

class PianoProfessorApp extends StatelessWidget {
  const PianoProfessorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Piano Professor',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      // For this foundational turn the BLE pairing screen is the home screen.
      // Firebase init + auth + the rest of the app come later.
      home: ChangeNotifierProvider(
        create: (_) => BleController()..init(),
        child: const BleConnectScreen(),
      ),
    );
  }
}
