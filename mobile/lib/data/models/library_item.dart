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
    this.musicXmlAsset,
    this.musicXmlContent,
    this.grouped = false,
    this.pageCount = 1,
  });

  final String id;
  final String title;
  final String source; // pdfUpload | photoOmr | import | grouped
  final LibraryStatus status;
  final String? musicXmlPath; // Storage path (online)
  final String? musicXmlAsset; // bundled asset path (offline demo OMR result)
  final String? musicXmlContent; // raw MusicXML from the OMR server (in-memory)
  final bool grouped; // a song made from multiple pages
  final int pageCount;

  bool get isSong => grouped || status == LibraryStatus.ready;

  factory LibraryItem.fromDoc(DocumentSnapshot<Map<String, dynamic>> d) {
    final m = d.data() ?? const <String, dynamic>{};
    return LibraryItem(
      id: d.id,
      title: m['title'] as String? ?? 'Untitled',
      source: m['source'] as String? ?? 'pdfUpload',
      status: statusFrom(m['status'] as String?),
      musicXmlPath: m['musicXmlPath'] as String?,
      grouped: m['grouped'] as bool? ?? false,
      pageCount: (m['pageCount'] as num?)?.toInt() ?? 1,
    );
  }

  LibraryItem copyWith({
    LibraryStatus? status,
    String? musicXmlPath,
    String? musicXmlAsset,
    String? musicXmlContent,
    bool? grouped,
    int? pageCount,
  }) =>
      LibraryItem(
        id: id,
        title: title,
        source: source,
        status: status ?? this.status,
        musicXmlPath: musicXmlPath ?? this.musicXmlPath,
        musicXmlAsset: musicXmlAsset ?? this.musicXmlAsset,
        musicXmlContent: musicXmlContent ?? this.musicXmlContent,
        grouped: grouped ?? this.grouped,
        pageCount: pageCount ?? this.pageCount,
      );

  static LibraryStatus statusFrom(String? s) => switch (s) {
        'processing' => LibraryStatus.processing,
        'ready' => LibraryStatus.ready,
        'failed' => LibraryStatus.failed,
        _ => LibraryStatus.uploaded,
      };
}
