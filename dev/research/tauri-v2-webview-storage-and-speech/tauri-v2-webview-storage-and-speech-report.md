# Research Report: Tauri v2 Webview Storage Persistence, Web Speech API, and Mobile Maturity

**Date:** 2026-09-16
**Query:** In Tauri v2 (2.x), does IndexedDB/localStorage persist across restarts on macOS, Windows, Linux, iOS, Android? Does `window.speechSynthesis` work offline in each webview? How mature is Tauri v2 mobile, and do `tauri-plugin-sql` / `tauri-plugin-store` support mobile? Is there a TTS plugin?

---

## Executive Summary

Browser storage persists by default on all five Tauri v2 targets because wry uses the persistent default data store on every platform; the main loss vectors are changing the app `identifier` or the page origin, not the webview. `window.speechSynthesis` works offline with system voices on macOS, iOS, Windows, and Android, but is undefined on Linux WebKitGTK. Tauri mobile has been stable since 2.0.0 (Oct 2024), both `tauri-plugin-sql` and `tauri-plugin-store` support iOS and Android, and there is no official TTS plugin, though `brenogonzaga/tauri-plugin-tts` covers all five platforms.

---

## Findings

### Q1. IndexedDB and localStorage persistence across restarts

**Confidence: High (desktop), Medium (iOS/Android, no counter-evidence found but no explicit Tauri doc statement either).**

- wry's WKWebView backend selects the data store with this logic: incognito → `nonPersistentDataStore`; macOS 14+/iOS 17+ with a `data_store_identifier` → `dataStoreForIdentifier`; otherwise `defaultDataStore` [4]. The default store is the persistent one, so macOS and iOS persist unless `incognito` is enabled.
- Tauri's `WebviewWindowBuilder::data_store_identifier` exists "as a replacement for data_directory not being available in WKWebView", available on macOS >= 14 and iOS >= 17, unsupported on Windows/Linux/Android [3]. `data_directory` therefore has no effect on Apple platforms. Calling `data_store_identifier` crashed on macOS until issue #12843 was fixed via PR #12900 (Feb–Mar 2025) [7].
- The `identifier` config field "must be unique across applications since it is used in system configurations like the bundle ID and path to the webview data directory" [1]. Changing it after release orphans existing storage on every platform.
- Windows: WebView2 stores `LocalStorage`, `IndexedDb`, `Cookies`, and `CacheStorage` in its user data folder [11]. Tauri places it at `%LOCALAPPDATA%\<identifier>\EBWebView` [6]. Microsoft warns that changing the UDF location does not migrate or clean up the previous folder [11].
- Windows origin-change trap: upgrading from Tauri 1 to 2 changed the origin from `https://tauri.localhost` to `http://tauri.localhost`, moving IndexedDB from `https_tauri.localhost_0.indexeddb.leveldb` to `http_tauri.localhost_0.indexeddb.leveldb` and making old data invisible (issue #11252, addressed by PR #11477 and the `dangerousUseHttpScheme` option) [6]. The same mechanism applies to dev (`http://localhost:1420`) vs production (`tauri.localhost`) origins: they are separate storage partitions.
- Windows session-loss report: issue #13433 (open, May 2025) reports reload via context menu logging the user out; #13308 "Persistent User Session" closed completed [8]. Neither is confirmed as a storage-engine defect.
- Linux (WebKitGTK), Android, iOS: no Tauri issues reporting localStorage or IndexedDB loss were found under searches for `localStorage ios`, `android localStorage`, `ios data lost OR cleared OR persist`, or `indexeddb` [8][22]. Absence of reports is not proof, hence Medium confidence for mobile.
- `navigator.storage.persist()` is supported in Chrome, Edge, Safari, Safari iOS, and WebView Android (baseline December 2021) and requires a secure context [12]. On Tauri the production origin is `http://tauri.localhost` on Windows/Android and `tauri://localhost` on macOS/Linux/iOS, so availability must be feature-detected.
- iOS storage eviction: WebKit's ITP deletes all script-writable storage (IndexedDB, localStorage, etc.) "after seven days of Safari use without user interaction on the site" [13]. The posts describe Safari only and do not state whether the rule applies inside WKWebView [13]. Treat as unverified for Tauri iOS. Apple's `WKWebsiteDataStore` pages could not be retrieved (JS-rendered), so the persistent-vs-non-persistent contrast is cited from wry source instead [4].

#### Key Points
- Persistent by default on all five platforms; only `incognito` opts out [3][4].
- Never change `identifier` after shipping [1].
- Keep the page origin stable; origin changes partition storage [6].
- `data_directory` is a no-op on WKWebView; use `data_store_identifier` (macOS 14+/iOS 17+) if isolation is needed [3].

### Q2. `window.speechSynthesis` availability and offline behavior

**Confidence: High for the Linux gap and Apple/Windows support; Medium for Android offline behavior.**

- Baseline support: Safari 7+, Safari iOS 7+, Edge 14+, Chrome 33+, Chrome for Android [14]. MDN lists SpeechSynthesis as "Widely available" since September 2018 [17].
- macOS / iOS (WKWebView): supported. Known gap: `getVoices()` "only lists a fixed pre-installed sounds, newly downloaded sounds (System Settings > Accessibility > Spoken content > Voices) are not listed", leaving "robotic-sounding, low quality" voices (WebKit bug 290497, NEW, P2, reported 2025-03-26, Safari 18) [16]. Built-in voices work offline. Voices load asynchronously; populate on `voiceschanged` [17]. A separate regression dropped the Kyoko ja-JP voice on iOS 16.0.2 (bug 250665) [18].
- Windows (WebView2): supported. Offline SAPI voices are exposed. Historical WebView2 issues: natural (online) voices not retrievable in WebView2 although they worked in Edge (#2660, closed Aug 2022); `getVoices()` returns 0 voices in UWP hosts vs 3 in Win32 (#3155, closed) [15]. Tauri uses a Win32 host.
- Linux (WebKitGTK): `window.speechSynthesis` is `undefined`. WebKit bug 309017 "[Gtk] window.speechSynthesis undefined: fatal React hydration error", NEW, filed 2026-03-02 against GNOME Web on Ubuntu 24.04, has no developer response [18]. Treat speech synthesis as unavailable on Linux Tauri builds and feature-detect before use.
- Android (System WebView): supported per caniuse [14]. Chromium's `content/browser/speech/tts_android.cc` calls `Java_TtsPlatformImpl_speak`, i.e. the Android `TextToSpeech` service [19]. Offline operation therefore depends on a system TTS engine (for example Google Speech Services) with the language pack installed. Devices without an engine expose zero voices.
- No Tauri-repo issues exist for speechSynthesis; searches returned unrelated results [8].

#### Code Example
```js
function getVoicesAsync() {
  return new Promise((resolve) => {
    if (typeof speechSynthesis === "undefined") return resolve([]);
    const voices = speechSynthesis.getVoices();
    if (voices.length) return resolve(voices);
    speechSynthesis.addEventListener("voiceschanged", () => resolve(speechSynthesis.getVoices()), { once: true });
  });
}
```
> Source: pattern from MDN `getVoices()` guidance, guarded for WebKitGTK where the global is undefined [17][18]

### Q3. Tauri v2 mobile status and maturity

**Confidence: High.**

- Tauri 2.0.0 was released 2024-10-02 ("Promote to v2 stable!") [9]. The announcement states mobile support "now extends to iOS and Android" but that the team is "not completely happy about the developer experience at the moment" and "not all official plugins support mobile" [10].
- Current stable crate: `tauri` 2.11.5, released 2026-07-01, with `x86_64-apple-ios` and `x86_64-linux-android` target docs [21]. A `v3.0.0-alpha.0/1` line started 2026-09-12/13 [20].
- iOS requires Xcode on macOS; Android requires Android Studio, NDK, and rustup targets [24].
- Open iOS-labeled issues (12): Xcode build phase cannot find Node via NVM (#15931), signing identity/provisioning on CI (#15740, #15741, #14462, #15663), PKCS#12 import on macOS 26 (#15843), empty `UISceneConfigurations` crash on iOS 27 SDK (#15719), Japanese asset text rendering (#15180), menu support (#15964), iPhone debug build failure (#14675) [22].
- Open Android-labeled issues (12): `NDK_HOME` detection (#11841), keyboard overlay behavior changes between launches (#7868), navigation freeze (#14694), APK/AAB path differences (#11560), AAB compiles first Rust target twice (#15910), `keepDebugSymbols` applies to all build types (#15884), autocomplete saves credentials to `https://tauri.localhost` (#14367), fails on Android < 8 (#8788) [23].
- Neither list contains a webview-storage or runtime-stability issue; most are build, signing, and CI tooling.
- `tauri-plugin-sql`: Windows, Linux, macOS, Android, iOS all supported [5][20]. `tauri-plugin-store`: same five platforms, JSON file persisted "between app restarts" [2][20].

### Q4. Text-to-speech plugin

**Confidence: High.**

- No speech or TTS plugin exists in the official `tauri-apps/plugins-workspace` [20].
- `brenogonzaga/tauri-plugin-tts` (crate `tauri-plugin-tts` v0.1.13): Windows (WinRT), macOS/iOS (AVSpeechSynthesizer), Linux (speech-dispatcher), Android (TextToSpeech); fully offline; 19 stars; updated within the last two weeks [25][26].
- `httpjamesm/tauri-plugin-tts`: mobile-only (Android API 21+, iOS 13+), 10 stars, last updated 2024-11-22 [27].
- Alternatives seen on lib.rs: `tauri-plugin-supertonic` (on-device neural TTS with model download) [25].

---

## Recommendations

1. **Rely on IndexedDB/localStorage with the identifier and origin frozen** — persistence is default on all five platforms; loss comes from `identifier` or scheme changes, not the webview [1][4][6].
2. **Keep authoritative data in `tauri-plugin-sql` or `tauri-plugin-store`** — both support iOS and Android and are unaffected by ITP or origin partitioning [2][5].
3. **Feature-detect `speechSynthesis` and treat Linux as unsupported** — WebKitGTK exposes no `speechSynthesis` global [18]. On Apple, expect only built-in voices [16]. On Android, expect zero voices without a system engine [19].
4. **If TTS on Linux or richer voices matter, adopt `brenogonzaga/tauri-plugin-tts`** — it is the only actively maintained community plugin covering all five platforms [26].
5. **Call `navigator.storage.persist()` where available, but do not depend on it** — it needs a secure context and the ITP-in-WKWebView question is open [12][13].

---

## Caveats & Open Questions

- Whether WebKit ITP's 7-day storage purge applies inside WKWebView on iOS is not stated in the WebKit posts fetched; Apple documentation pages were JS-rendered and could not be retrieved [13].
- Windows session-loss issue #13433 is open and untriaged; root cause unknown [8].
- Android WebView offline TTS depends on device configuration; behavior is inferred from Chromium source, not a Tauri-specific test [19].
- GitHub search pages loaded with partial errors on several queries; issue counts may be incomplete [8][22][23].

---

## References

| # | Source | URL | Retrieved |
|---|--------|-----|-----------|
| 1 | Tauri v2 Configuration reference (`identifier`) | https://v2.tauri.app/reference/config/ | 2026-09-16 |
| 2 | Tauri v2 Store plugin docs | https://v2.tauri.app/plugin/store/ | 2026-09-16 |
| 3 | docs.rs `tauri::webview::WebviewWindowBuilder` (`data_directory`, `data_store_identifier`, `incognito`) | https://docs.rs/tauri/latest/tauri/webview/struct.WebviewWindowBuilder.html | 2026-09-16 |
| 4 | wry source `src/wkwebview/mod.rs` (data store selection) | https://raw.githubusercontent.com/tauri-apps/wry/dev/src/wkwebview/mod.rs | 2026-09-16 |
| 5 | Tauri v2 SQL plugin docs | https://v2.tauri.app/plugin/sql/ | 2026-09-16 |
| 6 | tauri-apps/tauri #11252 IndexedDB path changed after upgrading to Tauri 2 | https://github.com/tauri-apps/tauri/issues/11252 | 2026-09-16 |
| 7 | tauri-apps/tauri #12843 `data_store_identifier` crashes on macOS | https://github.com/tauri-apps/tauri/issues/12843 | 2026-09-16 |
| 8 | tauri-apps/tauri issue searches (localStorage cleared, indexeddb, speechSynthesis, ios/android storage) | https://github.com/tauri-apps/tauri/issues?q=is%3Aissue+localStorage+cleared | 2026-09-16 |
| 9 | Tauri 2.0.0 release tag | https://github.com/tauri-apps/tauri/releases/tag/tauri-v2.0.0 | 2026-09-16 |
| 10 | Tauri 2.0 announcement blog | https://v2.tauri.app/blog/tauri-20/ | 2026-09-16 |
| 11 | Microsoft Learn: WebView2 user data folders | https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/user-data-folder | 2026-09-16 |
| 12 | MDN `StorageManager.persist()` | https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist | 2026-09-16 |
| 13 | WebKit blog: Full third-party cookie blocking and more (7-day storage cap) ⚠️ (dated — verify currency) | https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ | 2026-09-16 |
| 14 | caniuse Speech Synthesis API | https://caniuse.com/speech-synthesis | 2026-09-16 |
| 15 | MicrosoftEdge/WebView2Feedback speechSynthesis issues (#2660, #3155, #3091) ⚠️ (dated — verify currency) | https://github.com/MicrosoftEdge/WebView2Feedback/issues?q=is%3Aissue+speechSynthesis | 2026-09-16 |
| 16 | WebKit bug 290497: getVoices lists only low-quality voices | https://bugs.webkit.org/show_bug.cgi?id=290497 | 2026-09-16 |
| 17 | MDN `SpeechSynthesis.getVoices()` | https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices | 2026-09-16 |
| 18 | WebKit bug 309017: [Gtk] window.speechSynthesis undefined | https://bugs.webkit.org/show_bug.cgi?id=309017 | 2026-09-16 |
| 19 | Chromium `content/browser/speech/tts_android.cc` | https://chromium.googlesource.com/chromium/src/+/main/content/browser/speech/tts_android.cc | 2026-09-16 |
| 20 | tauri-apps/plugins-workspace README plugin table | https://github.com/tauri-apps/plugins-workspace | 2026-09-16 |
| 21 | docs.rs tauri crate (2.11.5) | https://docs.rs/tauri/latest/tauri/ | 2026-09-16 |
| 22 | tauri-apps/tauri open issues labeled platform: iOS | https://github.com/tauri-apps/tauri/issues?q=is%3Aissue+is%3Aopen+label%3A%22platform%3A+iOS%22+sort%3Aupdated-desc | 2026-09-16 |
| 23 | tauri-apps/tauri open issues labeled platform: Android | https://github.com/tauri-apps/tauri/issues?q=is%3Aissue+is%3Aopen+label%3A%22platform%3A+Android%22+sort%3Aupdated-desc | 2026-09-16 |
| 24 | Tauri v2 Prerequisites (mobile) | https://v2.tauri.app/start/prerequisites/ | 2026-09-16 |
| 25 | lib.rs search: tauri tts | https://lib.rs/search?q=tauri+tts | 2026-09-16 |
| 26 | brenogonzaga/tauri-plugin-tts | https://github.com/brenogonzaga/tauri-plugin-tts | 2026-09-16 |
| 27 | httpjamesm/tauri-plugin-tts | https://github.com/httpjamesm/tauri-plugin-tts | 2026-09-16 |
| 28 | Tauri GitHub releases (v3 alpha line) | https://github.com/tauri-apps/tauri/releases | 2026-09-16 |
