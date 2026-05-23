import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'billing/subscription_controller.dart';
import 'ble/ble_controller.dart';
import 'data/user_repository.dart';
import 'input/note_input_service.dart';
import 'library/library_controller.dart';
import 'screens/home_shell.dart';
import 'services/auth_service.dart';
import 'services/firebase_bootstrap.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase is optional for this turn: if it isn't configured the app still
  // runs the BLE pairing flow (see services/firebase_bootstrap.dart).
  final firebaseReady = await initializeFirebase();
  final auth = AuthService(firebaseReady);
  await auth.ensureSignedIn(); // anonymous uid to hang Firestore data off of
  final userRepo = UserRepository(auth);
  await userRepo.ensureProfile();

  runApp(PianoProfessorApp(auth: auth, userRepo: userRepo));
}

class PianoProfessorApp extends StatelessWidget {
  const PianoProfessorApp({
    super.key,
    required this.auth,
    required this.userRepo,
  });

  final AuthService auth;
  final UserRepository userRepo;

  @override
  Widget build(BuildContext context) {
    // Providers live above MaterialApp so the pushed pairing-flow screens
    // (calibrate → connected) share the same controller + repository.
    return MultiProvider(
      providers: [
        Provider<AuthService>.value(value: auth),
        Provider<UserRepository>.value(value: userRepo),
        ChangeNotifierProvider<BleController>(create: (_) => BleController()..init()),
        ChangeNotifierProvider<NoteInputService>(
            create: (context) => NoteInputService(context.read<BleController>())),
        ChangeNotifierProvider<SubscriptionController>(create: (_) => SubscriptionController()),
        ChangeNotifierProvider<LibraryController>(create: (_) => LibraryController(userRepo)),
      ],
      child: MaterialApp(
        title: 'Piano Professor',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        home: const HomeShell(),
      ),
    );
  }
}
