import 'dart:async';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';

import '../data/models/library_item.dart';
import '../data/user_repository.dart';
import '../omr/omr_service.dart';
import '../services/app_settings.dart';

/// Backs the OMR "Sheet Music" tab: lists the user's uploaded scores and
/// handles picking a PDF / photo and kicking off the OMR pipeline.
///
/// Online (Firebase configured): uploads bytes to Storage + creates the library
/// doc; a Cloud Function runs OMR and flips status to `ready`. The list streams
/// from Firestore. Offline: keeps a local list and simulates OMR so the flow is
/// demoable in the APK without a backend.
class LibraryController extends ChangeNotifier {
  LibraryController(this.repo, this.settings, this.omr) {
    if (repo.isReady) {
      _sub = repo.watchLibrary().listen((list) {
        _items = list;
        notifyListeners();
      });
    }
  }

  final UserRepository repo;
  final AppSettings settings;
  final OmrService omr;
  StreamSubscription<List<LibraryItem>>? _sub;

  List<LibraryItem> _items = [];
  List<LibraryItem> get items => _items;

  bool _busy = false;
  bool get busy => _busy;

  // --- multi-select + grouping ---
  final Set<String> selected = {};
  bool get selecting => selected.isNotEmpty;

  void toggleSelect(String id) {
    if (!selected.remove(id)) selected.add(id);
    notifyListeners();
  }

  void clearSelection() {
    selected.clear();
    notifyListeners();
  }

  /// Combine the selected pages into a single song with one MusicXML score.
  /// (Real OMR of all pages happens in the backend; offline we attach the demo
  /// score so the preview + chord lesson work end-to-end.)
  void groupSelected(String title) {
    final ids = selected.toList();
    if (ids.length < 2) return;
    final pages = _items.where((i) => ids.contains(i.id)).toList();
    final remaining = _items.where((i) => !ids.contains(i.id)).toList();
    String? content;
    for (final p in pages) {
      if (p.musicXmlContent != null) {
        content = p.musicXmlContent;
        break;
      }
    }
    final song = LibraryItem(
      id: 'song-${DateTime.now().millisecondsSinceEpoch}',
      title: title.trim().isEmpty ? 'My Song' : title.trim(),
      source: 'grouped',
      status: LibraryStatus.ready,
      grouped: true,
      pageCount: pages.length,
      musicXmlContent: content,
      musicXmlAsset: content == null ? 'assets/songs/demo_song.musicxml' : null,
    );
    _items = [song, ...remaining];
    selected.clear();
    notifyListeners();
  }

  Future<void> pickPdf() => _ingest(pdf: true, camera: false);
  Future<void> pickImage() => _ingest(pdf: false, camera: false);
  Future<void> snapPhoto() => _ingest(pdf: false, camera: true);

  Future<void> _ingest({required bool pdf, required bool camera}) async {
    Uint8List? bytes;
    var name = 'Sheet music';
    try {
      if (camera) {
        final x = await ImagePicker().pickImage(source: ImageSource.camera);
        if (x == null) return;
        bytes = await x.readAsBytes();
        name = x.name;
      } else if (pdf) {
        final res = await FilePicker.platform.pickFiles(
          type: FileType.custom,
          allowedExtensions: const ['pdf'],
          withData: true,
        );
        if (res == null || res.files.isEmpty) return;
        bytes = res.files.first.bytes;
        name = res.files.first.name;
      } else {
        final x = await ImagePicker().pickImage(source: ImageSource.gallery);
        if (x == null) return;
        bytes = await x.readAsBytes();
        name = x.name;
      }
    } catch (_) {
      return;
    }
    if (bytes == null) return;

    _busy = true;
    notifyListeners();

    final source = pdf ? 'pdfUpload' : 'photoOmr';
    if (settings.hasOmrServer) {
      await _runOmr(name, source, bytes, pdf); // real OMR via self-hosted oemer
    } else if (repo.isReady) {
      await repo.uploadSheet(title: name, source: source, bytes: bytes, isPdf: pdf);
      // Firestore stream reflects the new doc; a Cloud Function does the OMR.
    } else {
      _simulateOmr(name, source); // offline demo
    }

    _busy = false;
    notifyListeners();
  }

  /// Send the page to the self-hosted oemer server and attach the MusicXML.
  Future<void> _runOmr(String name, String source, Uint8List bytes, bool pdf) async {
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    final item = LibraryItem(
        id: id, title: name, source: source, status: LibraryStatus.processing);
    _items = [item, ..._items];
    notifyListeners();
    final xml = await omr.transcribe(
      serverUrl: settings.omrServerUrl,
      bytes: bytes,
      filename: pdf ? '$name.pdf' : '$name.jpg',
    );
    _items = _items.map((e) {
      if (e.id != id) return e;
      return xml != null
          ? e.copyWith(status: LibraryStatus.ready, musicXmlContent: xml)
          : e.copyWith(status: LibraryStatus.failed);
    }).toList();
    notifyListeners();
  }

  /// Offline-only: optimistic item + a fake processing→ready transition.
  void _simulateOmr(String name, String source) {
    final item = LibraryItem(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: name,
      source: source,
      status: LibraryStatus.processing,
    );
    _items = [item, ..._items];
    notifyListeners();
    Timer(const Duration(seconds: 3), () {
      _items = _items
          .map((e) => e.id == item.id
              ? e.copyWith(
                  status: LibraryStatus.ready,
                  musicXmlAsset: 'assets/songs/demo_song.musicxml',
                )
              : e)
          .toList();
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
