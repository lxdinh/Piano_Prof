import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/models/library_item.dart';
import '../library/library_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/chunky_button.dart';
import '../widgets/mascot_image.dart';
import '../widgets/pp_card.dart';
import 'song_preview_screen.dart';

/// Tab 1 — Optical Music Recognition. Upload PDF/photos of sheet music, group
/// the pages into one song, then preview it or learn it by chords.
class OmrLibraryScreen extends StatelessWidget {
  const OmrLibraryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.watch<LibraryController>();
    return Scaffold(
      backgroundColor: AppColors.cream50,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('SCAN · OMR', style: AppTheme.eyebrow),
                  const SizedBox(height: 2),
                  Text('Sheet Music', style: AppTheme.h2),
                  const SizedBox(height: 4),
                  Text('Upload pages, group them into a song, then preview or learn it.',
                      style: AppTheme.subtitle),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Row(
                children: [
                  _action(Icons.photo_camera, 'Snap', c.snapPhoto),
                  const SizedBox(width: 10),
                  _action(Icons.image, 'Photo', c.pickImage),
                  const SizedBox(width: 10),
                  _action(Icons.picture_as_pdf, 'PDF', c.pickPdf),
                ],
              ),
            ),
            if (c.busy) const LinearProgressIndicator(minHeight: 3, color: AppColors.sky),
            if (c.selected.length >= 2) _groupBar(context, c),
            Expanded(
              child: c.items.isEmpty
                  ? _empty()
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                      itemCount: c.items.length,
                      itemBuilder: (_, i) => _itemRow(context, c, c.items[i]),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _action(IconData icon, String label, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: AppColors.cardBg,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.inkLine, width: 1.5),
            boxShadow: const [BoxShadow(color: AppColors.inkSoft, offset: Offset(0, 3))],
          ),
          child: Column(
            children: [
              Icon(icon, color: AppColors.rust, size: 24),
              const SizedBox(height: 4),
              Text(label,
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _groupBar(BuildContext context, LibraryController c) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 4),
      padding: const EdgeInsets.fromLTRB(14, 8, 8, 8),
      decoration: BoxDecoration(
        color: AppColors.brandSoft,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.brand, width: 1.5),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text('${c.selected.length} pages selected',
                style: const TextStyle(
                    fontWeight: FontWeight.w900, color: AppColors.brandDeep)),
          ),
          TextButton(
            onPressed: c.clearSelection,
            child: const Text('Clear',
                style: TextStyle(color: AppColors.ink500, fontWeight: FontWeight.w900)),
          ),
          ChunkyButton(
            label: 'Group into song',
            onPressed: () => _groupDialog(context, c),
          ),
        ],
      ),
    );
  }

  Future<void> _groupDialog(BuildContext context, LibraryController c) async {
    final ctrl = TextEditingController(text: 'My Song');
    final title = await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Name your song'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Song title'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(context).pop(), child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.of(context).pop(ctrl.text),
              child: const Text('Group')),
        ],
      ),
    );
    if (title != null) c.groupSelected(title);
  }

  Widget _itemRow(BuildContext context, LibraryController c, LibraryItem item) {
    final ready = item.status == LibraryStatus.ready && item.musicXmlAsset != null;
    final selectable = !item.grouped;
    final isSelected = c.selected.contains(item.id);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: PpCard(
        child: Row(
          children: [
            if (selectable)
              Checkbox(
                value: isSelected,
                activeColor: AppColors.brand,
                onChanged: (_) => c.toggleSelect(item.id),
              )
            else
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.brandSoft,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.library_music, color: AppColors.brandDeep),
              ),
            const SizedBox(width: 8),
            Expanded(
              child: GestureDetector(
                onTap: ready
                    ? () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                              builder: (_) => SongPreviewScreen(item: item)),
                        )
                    : null,
                behavior: HitTestBehavior.opaque,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontWeight: FontWeight.w900, fontSize: 14)),
                    Text(
                        item.grouped
                            ? 'Song · ${item.pageCount} pages · tap to preview'
                            : item.source == 'pdfUpload'
                                ? 'PDF page'
                                : 'Photo page',
                        style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink500)),
                  ],
                ),
              ),
            ),
            if (ready)
              IconButton(
                icon: const Icon(Icons.play_circle_fill, color: AppColors.brand),
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => SongPreviewScreen(item: item)),
                ),
              )
            else
              _statusChip(item.status),
          ],
        ),
      ),
    );
  }

  Widget _empty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const MascotImage(mood: 'wow', size: 110),
            const SizedBox(height: 8),
            Text('No scores yet', style: AppTheme.h2),
            const SizedBox(height: 6),
            Text('Tap Snap, Photo, or PDF above to add sheet-music pages.',
                textAlign: TextAlign.center, style: AppTheme.subtitle),
          ],
        ),
      ),
    );
  }

  Widget _statusChip(LibraryStatus status) {
    final (label, color, spinner) = switch (status) {
      LibraryStatus.uploaded => ('Uploaded', AppColors.ink500, false),
      LibraryStatus.processing => ('Processing', AppColors.sky, true),
      LibraryStatus.ready => ('Ready', AppColors.brand, false),
      LibraryStatus.failed => ('Failed', AppColors.rust, false),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (spinner)
            SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(strokeWidth: 2, color: color),
            )
          else
            Icon(
                status == LibraryStatus.failed ? Icons.error : Icons.cloud_done,
                size: 12,
                color: color),
          const SizedBox(width: 5),
          Text(label,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: color)),
        ],
      ),
    );
  }
}
