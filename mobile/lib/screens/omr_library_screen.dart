import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/models/library_item.dart';
import '../library/library_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/mascot_image.dart';
import '../widgets/pp_card.dart';

/// Tab 1 — Optical Music Recognition. Upload a PDF or snap a photo of sheet
/// music; the OMR pipeline turns it into playable MusicXML.
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
                  Text('Snap or upload a score — we turn it into playable notes.',
                      style: AppTheme.subtitle),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Row(
                children: [
                  _action(context, Icons.photo_camera, 'Snap', () => c.snapPhoto()),
                  const SizedBox(width: 10),
                  _action(context, Icons.image, 'Photo', () => c.pickImage()),
                  const SizedBox(width: 10),
                  _action(context, Icons.picture_as_pdf, 'PDF', () => c.pickPdf()),
                ],
              ),
            ),
            if (c.busy) const LinearProgressIndicator(minHeight: 3, color: AppColors.sky),
            Expanded(
              child: c.items.isEmpty
                  ? _empty()
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                      itemCount: c.items.length,
                      itemBuilder: (_, i) => _itemRow(c.items[i]),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _action(BuildContext context, IconData icon, String label, VoidCallback onTap) {
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
            Text('Tap Snap, Photo, or PDF above to add your first sheet.',
                textAlign: TextAlign.center, style: AppTheme.subtitle),
          ],
        ),
      ),
    );
  }

  Widget _itemRow(LibraryItem item) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: PpCard(
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.cream200,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                item.source == 'pdfUpload' ? Icons.picture_as_pdf : Icons.image,
                color: AppColors.ink700,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
            ),
            _statusChip(item.status),
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
                status == LibraryStatus.ready
                    ? Icons.check_circle
                    : status == LibraryStatus.failed
                        ? Icons.error
                        : Icons.cloud_done,
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
