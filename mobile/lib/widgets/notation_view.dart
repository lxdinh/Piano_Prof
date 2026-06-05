import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Renders MusicXML as real staff notation using OpenSheetMusicDisplay (loaded
/// from a CDN inside a WebView) and exposes a playback **cursor** that
/// highlights the note(s) currently playing. Drive it from a player:
/// `cursorReset()` at start, `cursorNext()` for each musical onset.
///
/// Requires internet on first use (to fetch the OSMD engine) + the INTERNET
/// permission in AndroidManifest.
class NotationController {
  NotationController() {
    web
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFBF5E4))
      ..addJavaScriptChannel('PP', onMessageReceived: (m) {
        if (_disposed) return; // ignore late messages after the screen is gone
        if (m.message == 'init') {
          _ready = true;
          for (final js in _pending) {
            web.runJavaScript(js);
          }
          _pending.clear();
        }
      })
      ..loadHtmlString(_html);
  }

  final WebViewController web = WebViewController();
  bool _ready = false;
  bool _disposed = false;
  final List<String> _pending = [];

  void _run(String js) {
    if (_disposed) return;
    if (_ready) {
      web.runJavaScript(js);
    } else {
      _pending.add(js);
    }
  }

  /// Stop the OSMD engine + free the rendered SVG/DOM and ignore any further JS
  /// callbacks. (webview_flutter has no controller.dispose(); the native view is
  /// released with the WebViewWidget — this frees the heavy page content.)
  void dispose() {
    _disposed = true;
    _pending.clear();
    try {
      web.loadHtmlString('<!doctype html><html></html>');
    } catch (_) {}
  }

  /// Render a MusicXML score (passed base64 to avoid any string-escaping issues).
  void loadScore(String xml) {
    final b64 = base64Encode(utf8.encode(xml));
    _run('loadScoreB64("$b64")');
  }

  void cursorReset() => _run('cursorReset()');
  void cursorNext() => _run('cursorNext()');
  void cursorHide() => _run('cursorHide()');

  static const String _html = '''
<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>html,body{margin:0;padding:0;background:#FBF5E4;} #c{width:100%;}</style>
<script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay/build/opensheetmusicdisplay.min.js"></script>
</head>
<body>
<div id="c"></div>
<script>
var osmd, ready=false;
function init(){
  try{
    osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("c", {
      autoResize:true, backend:"svg", drawingParameters:"compacttight", followCursor:true
    });
    ready=true;
    if(window.PP) PP.postMessage("init");
  }catch(e){ if(window.PP) PP.postMessage("error:"+e); }
}
function loadScoreB64(b){
  if(!ready||!osmd) return;
  var xml;
  try{ xml = decodeURIComponent(escape(atob(b))); }catch(e){ return; }
  osmd.load(xml).then(function(){
    osmd.render();
    try{ osmd.cursor.show(); }catch(e){}
    if(window.PP) PP.postMessage("loaded");
  }).catch(function(e){ if(window.PP) PP.postMessage("error:"+e); });
}
function cursorReset(){ try{ osmd.cursor.reset(); osmd.cursor.show(); }catch(e){} }
function cursorNext(){ try{ osmd.cursor.next(); }catch(e){} }
function cursorHide(){ try{ osmd.cursor.hide(); }catch(e){} }
if(window.opensheetmusicdisplay){ init(); } else { window.addEventListener('load', init); }
</script>
</body>
</html>
''';
}

class NotationView extends StatelessWidget {
  const NotationView({super.key, required this.controller, this.height = 220});
  final NotationController controller;
  final double height;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        height: height,
        child: WebViewWidget(controller: controller.web),
      ),
    );
  }
}
