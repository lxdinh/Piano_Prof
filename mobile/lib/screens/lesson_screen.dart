import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../ble/ble_controller.dart';
import '../data/user_repository.dart';
import '../input/note_input_service.dart';
import '../lessons/lesson_controller.dart';
import '../lessons/lesson_models.dart';
import '../theme/app_theme.dart';
import '../widgets/big_piano.dart';
import '../widgets/chunky_button.dart';
import '../widgets/mascot_image.dart';
import '../widgets/pp_card.dart';

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
  static const _fingerHints = {'C': 1, 'E': 3, 'G': 5};

  @override
  void initState() {
    super.initState();
    _c = LessonController(
      lesson: widget.lesson,
      ble: context.read<BleController>(),
      repo: context.read<UserRepository>(),
      input: context.read<NoteInputService>(),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _c.start());
  }

  @override
  void dispose() {
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
            return Column(
              children: [
                _topBar(s),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                    child: _body(s),
                  ),
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
        LessonIdle() => 0,
      };

  Widget _topBar(LessonUiState s) {
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
          const Text('5',
              style: TextStyle(
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
          _quizSub((s.quiz as Mcq).sub)
        else if (s is LessonPlaying)
          _piano(s.litWhites)
        else if (s is LessonQuizState && s.quiz is KeyQuiz)
          _piano(const {}),
        if (s is LessonPlaying && s.chordChips.isNotEmpty) ...[
          const SizedBox(height: 10),
          _chips(s.chordChips),
        ],
        if (s is LessonQuizState && s.lastWrong) ...[
          const SizedBox(height: 10),
          Text('Not quite — try again!',
              style: TextStyle(
                  color: AppColors.rust, fontWeight: FontWeight.w900, fontSize: 13)),
        ],
      ],
    );
  }

  Widget _piano(Set<String> lit) =>
      BigPiano(litWhites: lit, fingerHints: _fingerHints, height: 150);

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
      case LessonPlaying():
        return ChunkyButton(
            label: 'Continue', expand: true, onPressed: _c.nextStep);
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
      case LessonIdle():
        return const SizedBox.shrink();
    }
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
          Text('MAESTRO PENGUINI',
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
