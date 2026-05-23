import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:provider/provider.dart';

import '../ble/ble_controller.dart';
import '../data/models/library_item.dart';
import '../music/musicxml.dart';
import '../music/song_analyzer.dart';
import '../music/song_player.dart';
import '../theme/app_theme.dart';
import '../widgets/big_piano.dart';
import '../widgets/chunky_button.dart';
import '../widgets/pp_card.dart';
import 'lesson_screen.dart';

/// Preview a song produced by OMR: play the whole thing on the on-screen piano
/// (and the LED strip over BLE), inspect the MusicXML, or learn it by chords.
class SongPreviewScreen extends StatefulWidget {
  const SongPreviewScreen({super.key, required this.item});
  final LibraryItem item;

  @override
  State<SongPreviewScreen> createState() => _SongPreviewScreenState();
}

class _SongPreviewScreenState extends State<SongPreviewScreen> {
  Score? _score;
  SongPlayer? _player;
  String? _rawXml;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final asset = widget.item.musicXmlAsset;
    if (asset == null) {
      setState(() => _error = 'No score yet — this sheet is still processing.');
      return;
    }
    try {
      final xml = await rootBundle.loadString(asset);
      final score = parseMusicXml(xml, title: widget.item.title);
      if (!mounted) return;
      setState(() {
        _rawXml = xml;
        _score = score;
        _player = SongPlayer(score: score, ble: context.read<BleController>());
      });
    } catch (e) {
      if (mounted) setState(() => _error = 'Could not load score: $e');
    }
  }

  @override
  void dispose() {
    _player?.dispose();
    super.dispose();
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
                  child: Text(_error!,
                      textAlign: TextAlign.center, style: AppTheme.subtitle),
                ),
              )
            : _player == null
                ? const Center(child: CircularProgressIndicator(color: AppColors.brand))
                : AnimatedBuilder(
                    animation: _player!,
                    builder: (context, _) => _content(connected),
                  ),
      ),
    );
  }

  Widget _content(bool connected) {
    final p = _player!;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        Row(
          children: [
            Text('PREVIEW', style: AppTheme.eyebrow),
            const Spacer(),
            Row(
              children: [
                Icon(Icons.circle, size: 8,
                    color: connected ? AppColors.brand : AppColors.ink300),
                const SizedBox(width: 4),
                Text(connected ? 'LEDs live' : 'LEDs off',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: connected ? AppColors.brand : AppColors.ink300)),
              ],
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text('${widget.item.pageCount} page(s) · ${p.total} moments',
            style: AppTheme.subtitle),
        const SizedBox(height: 14),
        BigPiano(litWhites: p.litWhites, height: 150),
        const SizedBox(height: 10),
        Center(
          child: Text(
            p.playing ? 'Playing moment ${p.index + 1} / ${p.total}' : 'Ready to play',
            style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.ink700),
          ),
        ),
        const SizedBox(height: 10),
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
                builder: (_) => LessonScreen(
                  lesson: lessonFromScore(_score!, id: 'omr-${widget.item.id}'),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 12),
        PpCard(
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
                        style: TextStyle(
                            color: AppColors.sky, fontWeight: FontWeight.w900)),
                  ),
                ],
              ),
              Text(
                'The grouped song is stored as a MusicXML score — that is what we '
                'analyze to teach it by chords instead of by heart.',
                style: AppTheme.subtitle.copyWith(fontSize: 12),
              ),
            ],
          ),
        ),
      ],
    );
  }

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
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
