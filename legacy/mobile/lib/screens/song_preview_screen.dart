import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:provider/provider.dart';

import '../audio/piano_audio.dart';
import '../ble/ble_controller.dart';
import '../data/models/library_item.dart';
import '../music/musicxml.dart';
import '../music/song_analyzer.dart';
import '../music/song_player.dart';
import '../theme/app_theme.dart';
import '../widgets/chunky_button.dart';
import '../widgets/notation_view.dart';
import '../widgets/pp_card.dart';
import '../widgets/range_piano.dart';
import 'lesson_screen.dart';

/// Preview a song produced by OMR: hear it played faithfully (both hands) on the
/// on-screen keyboard + LED strip, inspect the MusicXML, or learn it by chords.
class SongPreviewScreen extends StatefulWidget {
  const SongPreviewScreen({super.key, required this.item});
  final LibraryItem item;

  @override
  State<SongPreviewScreen> createState() => _SongPreviewScreenState();
}

class _SongPreviewScreenState extends State<SongPreviewScreen> {
  Score? _score;
  SongPlayer? _player;
  List<String> _chords = const [];
  String? _rawXml;
  String? _error;
  int _lowMidi = 36;
  int _highMidi = 84;
  final NotationController _notation = NotationController();
  int _appliedCursor = -1; // how many cursor steps we've applied during play

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final content = widget.item.musicXmlContent;
    final asset = widget.item.musicXmlAsset;
    if ((content == null || content.trim().isEmpty) && asset == null) {
      setState(() => _error = 'No score yet — this sheet is still processing.');
      return;
    }
    try {
      final xml = (content != null && content.trim().isNotEmpty)
          ? content
          : await rootBundle.loadString(asset!);
      final score = parseMusicXml(xml, title: widget.item.title);
      if (!mounted) return;
      // keyboard range = song's note range, snapped to whole octaves
      var lo = 127, hi = 0;
      for (final n in score.notes) {
        lo = min(lo, n.midi);
        hi = max(hi, n.midi);
      }
      if (score.notes.isEmpty) {
        lo = 36;
        hi = 84;
      } else {
        lo = (lo - 2);
        hi = (hi + 2);
        lo -= lo % 12; // down to a C
        hi += (12 - hi % 12) % 12; // up to a C
        lo = lo.clamp(24, 84);
        hi = hi.clamp(48, 108);
        if (hi - lo < 24) hi = lo + 24;
      }
      setState(() {
        _rawXml = xml;
        _score = score;
        _chords = barChords(score);
        _lowMidi = lo;
        _highMidi = hi;
        _player = SongPlayer(
          score: score,
          ble: context.read<BleController>(),
          audio: context.read<PianoAudio>(),
        );
      });
      _notation.loadScore(xml);
      _player!.addListener(_syncCursor);
    } catch (e) {
      if (mounted) setState(() => _error = 'Could not load score: $e');
    }
  }

  @override
  void dispose() {
    _player?.removeListener(_syncCursor);
    _player?.dispose();
    super.dispose();
  }

  /// Advance the OSMD cursor in lockstep with the player's musical onsets, so
  /// the rendered sheet highlights exactly the note(s) sounding now.
  void _syncCursor() {
    final p = _player;
    if (p == null) return;
    if (!p.playing) {
      if (_appliedCursor != -1) {
        _notation.cursorReset();
        _appliedCursor = -1;
      }
      return;
    }
    if (_appliedCursor < 0) {
      _notation.cursorReset();
      _appliedCursor = 0;
    }
    while (_appliedCursor < p.onsetIndex) {
      _notation.cursorNext();
      _appliedCursor++;
    }
  }

  @override
  Widget build(BuildContext context) {
    final connected = context.watch<BleController>().state is BleConnected;
    return Scaffold(
      backgroundColor: AppColors.cream50,
      appBar: AppBar(
        backgroundColor: AppColors.cream50,
        elevation: 0,
        foregroundColor: AppColors.ink900,
        title: Text(widget.item.title,
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
      ),
      body: SafeArea(
        child: _error != null
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(_error!, textAlign: TextAlign.center, style: AppTheme.subtitle),
                ),
              )
            : _player == null
                ? const Center(child: CircularProgressIndicator(color: AppColors.brand))
                : AnimatedBuilder(animation: _player!, builder: (context, _) => _content(connected)),
      ),
    );
  }

  Widget _content(bool connected) {
    final p = _player!;
    final s = _score!;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        Row(
          children: [
            Text('PREVIEW', style: AppTheme.eyebrow),
            const Spacer(),
            Icon(Icons.circle, size: 8, color: connected ? AppColors.brand : AppColors.ink300),
            const SizedBox(width: 4),
            Text(connected ? 'LEDs live' : 'LEDs off',
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: connected ? AppColors.brand : AppColors.ink300)),
          ],
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            _tag('${s.timeSignature} time'),
            if (s.genre != null) _tag(s.genre!),
            _tag('${s.barCount} bars'),
            _tag('${s.tempoBpm.round()} BPM'),
            _tag('${widget.item.pageCount} page(s)'),
          ],
        ),
        const SizedBox(height: 12),
        NotationView(controller: _notation, height: 200),
        const SizedBox(height: 10),
        RangePiano(lowMidi: _lowMidi, highMidi: _highMidi, litMidis: p.sounding, height: 96),
        const SizedBox(height: 10),
        Center(
          child: Text(
            p.playing ? 'Bar ${p.currentBar} / ${p.totalBars}' : 'Ready to play — both hands',
            style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.ink700),
          ),
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: p.progress,
            minHeight: 8,
            backgroundColor: AppColors.cream200,
            color: AppColors.brand,
          ),
        ),
        const SizedBox(height: 12),
        ChunkyButton(
          label: p.playing ? 'Stop' : 'Play whole song',
          icon: p.playing ? Icons.stop : Icons.play_arrow,
          expand: true,
          color: p.playing ? AppColors.rust : AppColors.brand,
          shadowColor: p.playing ? AppColors.rustDark : AppColors.brandDark,
          onPressed: () => p.playing ? p.stop() : p.play(),
        ),
        const SizedBox(height: 10),
        ChunkyButton(
          label: 'Teach me step by step',
          icon: Icons.school,
          expand: true,
          color: AppColors.sky,
          shadowColor: AppColors.skyDark,
          onPressed: () {
            p.stop();
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => LessonScreen(lesson: lessonFromScore(s, id: 'omr-${widget.item.id}')),
              ),
            );
          },
        ),
        const SizedBox(height: 14),
        _chordCard(p),
        const SizedBox(height: 12),
        _xmlCard(),
      ],
    );
  }

  Widget _tag(String text) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.inkLine, width: 1.5),
        ),
        child: Text(text, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900)),
      );

  Widget _chordCard(SongPlayer p) {
    final current = p.playing ? p.currentBar - 1 : -1;
    return PpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Chords (one per bar)',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (var i = 0; i < _chords.length; i++)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: i == current ? AppColors.brand : AppColors.cream200,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('${i + 1}. ${_chords[i]}',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: i == current ? Colors.white : AppColors.ink700)),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _xmlCard() => PpCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.code, size: 18, color: AppColors.ink700),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text('MusicXML',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                ),
                TextButton(
                  onPressed: _showXml,
                  child: const Text('View',
                      style: TextStyle(color: AppColors.sky, fontWeight: FontWeight.w900)),
                ),
              ],
            ),
            Text(
              'The grouped song is stored as a MusicXML score (two hands, time signature, '
              'durations) — that is what we analyze to teach it by chords.',
              style: AppTheme.subtitle.copyWith(fontSize: 12),
            ),
          ],
        ),
      );

  void _showXml() {
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('MusicXML'),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Text(_rawXml ?? '',
                style: const TextStyle(fontFamily: 'monospace', fontSize: 11)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Close')),
        ],
      ),
    );
  }
}
