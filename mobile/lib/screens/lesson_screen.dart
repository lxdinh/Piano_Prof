import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../audio/piano_audio.dart';
import '../audio/voice_service.dart';
import '../ble/ble_controller.dart';
import '../data/engagement.dart';
import '../data/profile_controller.dart';
import '../services/analytics_service.dart';
import '../input/note_input_service.dart';
import '../lessons/lesson_controller.dart';
import '../lessons/lesson_models.dart';
import '../theme/app_theme.dart';
import '../widgets/chunky_button.dart';
import '../widgets/mascot_image.dart';
import '../widgets/pp_card.dart';
import '../widgets/pp_keyboard.dart';

/// In-lesson screen — mascot teaches, the on-screen piano (and the real LED
/// strip, if connected) lights the notes. Ports the prototype's ScreenLesson.
class LessonScreen extends StatefulWidget {
  const LessonScreen({super.key, required this.lesson});
  final Lesson lesson;

  @override
  State<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  late final LessonController _c;

  @override
  void initState() {
    super.initState();
    // Lessons play in landscape — wider keyboard, easier chords + LED reading.
    SystemChrome.setPreferredOrientations(
        [DeviceOrientation.landscapeLeft, DeviceOrientation.landscapeRight]);
    _c = LessonController(
      lesson: widget.lesson,
      ble: context.read<BleController>(),
      profile: context.read<ProfileController>(),
      input: context.read<NoteInputService>(),
      audio: context.read<PianoAudio>(),
      voice: context.read<VoiceService>(),
      analytics: context.read<AnalyticsService>(),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _c.start());
  }

  @override
  void dispose() {
    // Back to portrait when leaving the lesson.
    SystemChrome.setPreferredOrientations(
        [DeviceOrientation.portraitUp, DeviceOrientation.portraitDown]);
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream50,
      body: SafeArea(
        child: AnimatedBuilder(
          animation: _c,
          builder: (context, _) {
            final s = _c.state;
            final hearts = context.watch<ProfileController>().hearts;
            // The keyboard lives OUTSIDE the scroll view so its multi-touch
            // isn't stolen by the scroll's drag recognizer (fixes chords).
            final Map<int, String>? pianoLit = switch (s) {
              LessonPlaying p => p.litColors,
              LessonQuizState q when q.quiz is KeyQuiz => const <int, String>{},
              _ => null,
            };
            return Column(
              children: [
                _topBar(s, hearts),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                    child: _body(s),
                  ),
                ),
                if (pianoLit != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
                    child: _piano(pianoLit),
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  child: _bottom(s),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  double _progress(LessonUiState s) => switch (s) {
        LessonPlaying p => (p.stepIndex + 1) / p.totalSteps,
        LessonQuizState() => 0.9,
        LessonCompleteState() => 1,
        LessonFailedState() => 1,
        LessonIdle() => 0,
      };

  Widget _topBar(LessonUiState s, HeartsState hearts) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).maybePop(),
            child: Container(
              width: 30,
              height: 30,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.cardBg,
                border: Border.all(color: AppColors.inkLine, width: 1.5),
              ),
              child: const Text('✕',
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: AppColors.ink500)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(7),
              child: LinearProgressIndicator(
                value: _progress(s),
                minHeight: 14,
                backgroundColor: AppColors.cream200,
                color: AppColors.brand,
              ),
            ),
          ),
          const SizedBox(width: 12),
          const Icon(Icons.favorite, color: AppColors.heart, size: 18),
          const SizedBox(width: 3),
          Text(hearts.unlimited ? '∞' : '${hearts.count}',
              style: const TextStyle(
                  fontWeight: FontWeight.w900, color: AppColors.heart, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _body(LessonUiState s) {
    final (mood, text) = switch (s) {
      LessonPlaying p => (p.speaking ? 'conduct' : 'teach', p.text),
      LessonQuizState q => ('wow', q.quiz.question),
      LessonCompleteState c => ('trophy', c.message),
      LessonFailedState f => ('wow', f.message),
      LessonIdle() => ('teach', 'Get ready…'),
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            SizedBox(width: 84, height: 84, child: MascotImage(mood: mood, size: 84)),
            const SizedBox(width: 10),
            Expanded(child: _SpeechBubble(text: text.isEmpty ? '…' : text)),
          ],
        ),
        const SizedBox(height: 16),
        if (s is LessonQuizState && s.quiz is Mcq)
          _quizSub((s.quiz as Mcq).sub),
        // (the piano is rendered outside the scroll view — see build)
        if (s is LessonPlaying && s.chordChips.isNotEmpty) ...[
          const SizedBox(height: 10),
          _chips(s.chordChips),
        ],
        if (s is LessonQuizState && s.lastWrong) ...[
          const SizedBox(height: 10),
          const Text('Not quite — that costs a heart. Try again!',
              style: TextStyle(
                  color: AppColors.rust, fontWeight: FontWeight.w900, fontSize: 13)),
        ],
        if (s is LessonCompleteState && s.reward != null) ...[
          const SizedBox(height: 16),
          _RewardSummary(reward: s.reward!),
        ],
      ],
    );
  }

  Widget _piano(Map<int, String> lit) => PpKeyboard(
        litColors: lit,
        height: 150,
        onDown: _c.pressKey,
        onUp: _c.releaseKey,
      );

  Widget _quizSub(String sub) => sub.isEmpty
      ? const SizedBox.shrink()
      : Text(sub, style: AppTheme.subtitle, textAlign: TextAlign.center);

  Widget _chips(List<String> chips) {
    return Wrap(
      spacing: 6,
      children: [
        for (var i = 0; i < chips.length; i++)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: i == 0 ? AppColors.brand : AppColors.cream200,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(chips[i],
                style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    color: i == 0 ? Colors.white : AppColors.ink500)),
          ),
      ],
    );
  }

  Widget _bottom(LessonUiState s) {
    switch (s) {
      case LessonPlaying p:
        // Continue is a dim green while the instructor is still talking, then
        // turns bright green the moment the line finishes (your cue to go on).
        final ready = !p.speaking;
        return Row(
          children: [
            ChunkyButton(
              label: '↻ Replay',
              ghost: true,
              onPressed: _c.replayStep,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ChunkyButton(
                label: 'Continue',
                expand: true,
                color: ready ? AppColors.brand : const Color(0xFF8FB36B),
                shadowColor: ready ? AppColors.brandDark : const Color(0xFF6E8E50),
                onPressed: _c.nextStep,
              ),
            ),
          ],
        );
      case LessonQuizState q when q.quiz is Mcq:
        final mcq = q.quiz as Mcq;
        return Column(
          children: [
            for (final opt in mcq.options)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: ChunkyButton(
                  label: opt,
                  expand: true,
                  ghost: true,
                  onPressed: () => _c.onQuizAnswered(opt == mcq.answer),
                ),
              ),
          ],
        );
      case LessonQuizState():
        // KeyQuiz — accept a tap as "I found it" for this turn.
        return ChunkyButton(
            label: 'I played it',
            expand: true,
            onPressed: () => _c.onQuizAnswered(true));
      case LessonCompleteState():
        return ChunkyButton(
            label: 'Finish',
            large: true,
            expand: true,
            onPressed: () => Navigator.of(context).maybePop());
      case LessonFailedState():
        return ChunkyButton(
            label: 'Back to lessons',
            large: true,
            expand: true,
            onPressed: () => Navigator.of(context).maybePop());
      case LessonIdle():
        return const SizedBox.shrink();
    }
  }
}

/// Stars + XP + gems earned, shown on the lesson-complete card.
class _RewardSummary extends StatelessWidget {
  const _RewardSummary({required this.reward});
  final LessonReward reward;

  @override
  Widget build(BuildContext context) {
    return PpCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < 3; i++)
                Icon(
                  i < reward.stars ? Icons.star_rounded : Icons.star_outline_rounded,
                  size: 38,
                  color: i < reward.stars ? AppColors.butter : AppColors.ink300,
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _reward(Icons.bolt, '+${reward.xpEarned}', 'XP', AppColors.butter),
              _reward(Icons.diamond, '+${reward.gemsEarned}', 'GEMS', AppColors.sky),
              _reward(Icons.local_fire_department, '${reward.streakCount}', 'STREAK',
                  const Color(0xFFFF7A1C)),
            ],
          ),
          if (reward.dailyGoalMet) ...[
            const SizedBox(height: 12),
            const Text('🎯 Daily goal complete!',
                style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    color: AppColors.brandDeep)),
          ],
          if (reward.unlockedAchievements.isNotEmpty) ...[
            const SizedBox(height: 14),
            const Text('NEW ACHIEVEMENT',
                style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: AppColors.rust,
                    letterSpacing: 1.5)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [
                for (final a in reward.unlockedAchievements)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                            shape: BoxShape.circle, color: a.color),
                        child: Icon(a.icon, color: Colors.white, size: 16),
                      ),
                      const SizedBox(width: 6),
                      Text(a.title,
                          style: const TextStyle(
                              fontWeight: FontWeight.w900, fontSize: 12)),
                      const SizedBox(width: 6),
                    ],
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _reward(IconData icon, String value, String label, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 2),
        Text(value,
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
        Text(label,
            style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 9,
                color: AppColors.ink500,
                letterSpacing: 0.5)),
      ],
    );
  }
}

class _SpeechBubble extends StatelessWidget {
  const _SpeechBubble({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return PpCard(
      padding: const EdgeInsets.all(14),
      radius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('MAESTRO PENGUINI',
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  color: AppColors.rust,
                  letterSpacing: 1)),
          const SizedBox(height: 4),
          Text(text,
              style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink900,
                  height: 1.4)),
        ],
      ),
    );
  }
}
