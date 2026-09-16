# Research Summary: Tauri v2 Webview Storage Persistence, Web Speech API, and Mobile Maturity

**Date:** 2026-09-16
**Full Report:** tauri-v2-webview-storage-and-speech-report.md

## TL;DR

IndexedDB and localStorage persist by default on macOS, Windows, Linux, iOS, and Android in Tauri 2.x; data is lost only if the app `identifier` or page origin changes. `window.speechSynthesis` works offline on Apple, Windows, and Android webviews but is undefined on Linux WebKitGTK. Mobile has been stable since 2.0.0 (Oct 2024), `tauri-plugin-sql` and `tauri-plugin-store` support both mobile platforms, and there is no official TTS plugin.

## Top Recommendations

1. Freeze the `identifier` and keep the production origin stable; that is the only realistic storage-loss vector — [1][4][6].
2. Keep must-not-lose data in `tauri-plugin-sql` or `tauri-plugin-store`; both support iOS and Android — [2][5].
3. Feature-detect `speechSynthesis`; treat Linux as unsupported and expect only built-in voices on Apple and engine-dependent voices on Android — [16][18][19].
4. Use `brenogonzaga/tauri-plugin-tts` if TTS is needed on Linux or with richer voices — [26].

## Confidence per question

| Question | Confidence |
|---|---|
| Q1 storage persistence | High (desktop), Medium (mobile) |
| Q2 speechSynthesis | High (Linux gap, Apple/Windows), Medium (Android offline) |
| Q3 mobile maturity and plugin support | High |
| Q4 TTS plugin | High |

## Key References

- [Tauri config reference: identifier](https://v2.tauri.app/reference/config/)
- [wry WKWebView data store selection](https://raw.githubusercontent.com/tauri-apps/wry/dev/src/wkwebview/mod.rs)
- [tauri#11252 IndexedDB path changed after Tauri 2 upgrade](https://github.com/tauri-apps/tauri/issues/11252)
- [WebKit bug 309017: WebKitGTK speechSynthesis undefined](https://bugs.webkit.org/show_bug.cgi?id=309017)
- [WebKit bug 290497: only built-in voices listed](https://bugs.webkit.org/show_bug.cgi?id=290497)
- [Tauri 2.0 announcement](https://v2.tauri.app/blog/tauri-20/)
- [tauri-apps/plugins-workspace platform table](https://github.com/tauri-apps/plugins-workspace)
- [brenogonzaga/tauri-plugin-tts](https://github.com/brenogonzaga/tauri-plugin-tts)
