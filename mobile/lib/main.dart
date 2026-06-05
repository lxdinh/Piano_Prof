import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_soloud/flutter_soloud.dart';
import 'package:provider/provider.dart';

import 'audio/piano_audio.dart';
import 'audio/voice_service.dart';
import 'billing/subscription_controller.dart';
import 'ble/ble_controller.dart';
import 'data/profile_controller.dart';
import 'data/user_repository.dart';
import 'input/note_input_service.dart';
import 'library/library_controller.dart';
import 'omr/omr_service.dart';
import 'screens/home_shell.dart';
import 'services/analytics_service.dart';
import 'services/app_settings.dart';
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

  final audio = PianoAudio();
  await audio.init(); // piano sound engine (real samples or synth; silent-safe)

  final settings = await AppSettings.load();

  // Google Gemini instructor voice (realistic TTS; set the Google AI Studio key
  // in Profile → AI Voice). Shares the SoLoud engine; lessons show text if unset.
  final voice = VoiceService(SoLoud.instance, settings);
  // Let the piano "sing" the solfège syllables with the same voice (pitch-shifted
  // to each played key). No-op until a key is set; falls back to bundled clips.
  audio.solfegeSynthesizer = voice.synthesizeWav;
  // Pre-render the common note range in the background so the first key press
  // (and chords) sound instantly, with no synth-render hitch.
  unawaited(audio.prewarm([for (var m = 48; m <= 84; m++) m]));

  // Usage analytics (no-op until Firebase is configured) + the entitlement that
  // gates premium features (reads the client read-only subscription doc).
  final analytics = AnalyticsService(firebaseReady);
  final subscription = SubscriptionController()..bindEntitlement(userRepo);

  runApp(PianoProfessorApp(
    auth: auth,
    userRepo: userRepo,
    audio: audio,
    voice: voice,
    settings: settings,
    analytics: analytics,
    subscription: subscription,
  ));
}

class PianoProfessorApp extends StatelessWidget {
  const PianoProfessorApp({
    super.key,
    required this.auth,
    required this.userRepo,
    required this.audio,
    required this.voice,
    required this.settings,
    required this.analytics,
    required this.subscription,
  });

  final AuthService auth;
  final UserRepository userRepo;
  final PianoAudio audio;
  final VoiceService voice;
  final AppSettings settings;
  final AnalyticsService analytics;
  final SubscriptionController subscription;

  @override
  Widget build(BuildContext context) {
    // Providers live above MaterialApp so the pushed pairing-flow screens
    // (calibrate → connected) share the same controller + repository.
    return MultiProvider(
      providers: [
        Provider<AuthService>.value(value: auth),
        Provider<UserRepository>.value(value: userRepo),
        Provider<AnalyticsService>.value(value: analytics),
        ChangeNotifierProvider<SubscriptionController>.value(value: subscription),
        ChangeNotifierProvider<ProfileController>(
            create: (_) => ProfileController(userRepo, subscription: subscription)..init()),
        Provider<PianoAudio>.value(value: audio),
        Provider<VoiceService>.value(value: voice),
        Provider<AppSettings>.value(value: settings),
        ChangeNotifierProvider<BleController>(create: (_) => BleController()..init()),
        ChangeNotifierProvider<NoteInputService>(
            create: (context) => NoteInputService(context.read<BleController>())),
        ChangeNotifierProvider<LibraryController>(
            create: (_) => LibraryController(userRepo, settings, OmrService())),
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
