import 'package:cloud_firestore/cloud_firestore.dart';

enum LibraryStatus { uploaded, processing, ready, failed }

/// Mirror of a `users/{uid}/library/{itemId}` doc (SCHEMA.md §1f).
class LibraryItem {
  const LibraryItem({
    required this.id,
    required this.title,
    required this.source,
    required this.status,
    this.musicXmlPath,
  });

  final String id;
  final String title;
  final String source; // pdfUpload | photoOmr | import
  final LibraryStatus status;
  final String? musicXmlPath;

  factory LibraryItem.fromDoc(DocumentSnapshot<Map<String, dynamic>> d) {
    final m = d.data() ?? const <String, dynamic>{};
    return LibraryItem(
      id: d.id,
      title: m['title'] as String? ?? 'Untitled',
      source: m['source'] as String? ?? 'pdfUpload',
      status: statusFrom(m['status'] as String?),
      musicXmlPath: m['musicXmlPath'] as String?,
    );
  }

  LibraryItem copyWith({LibraryStatus? status, String? musicXmlPath}) => LibraryItem(
        id: id,
        title: title,
        source: source,
        status: status ?? this.status,
        musicXmlPath: musicXmlPath ?? this.musicXmlPath,
      );

  static LibraryStatus statusFrom(String? s) => switch (s) {
        'processing' => LibraryStatus.processing,
        'ready' => LibraryStatus.ready,
        'failed' => LibraryStatus.failed,
        _ => LibraryStatus.uploaded,
      };
}
