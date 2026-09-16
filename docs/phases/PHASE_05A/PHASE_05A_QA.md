# PHASE_05A Manual QA Checklist

**Status:** Pending manual execution
**Scope:** Seed bootstrap, offline game flow, local custom-role persistence, IndexedDB reopen behavior, and origin separation.
**Environment:** Start the frontend independently with `npm run dev` from `yourwolf-frontend/`. Use `http://localhost:3000`. Use DevTools Network with Preserve log enabled.
**Rule:** Every row remains `Pending` until a human or browser-capable runner records evidence. Automated tests do not mark manual rows passed.

## 1. First launch and seeded catalog

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 1.1 | Clear site data for `http://localhost:3000`, start the frontend, and open `/games/new`. | The bootstrap gate finishes and **New Game Setup** appears. | Pending | — |
| 1.2 | Inspect the catalog in `/roles`. | The shipped catalog contains 30 official roles. | Pending | — |
| 1.3 | Open `/roles/new`, enter a temporary name, set **Wake Order (0–40)** to `1`, click **Next**, and inspect the **Abilities** step. | The seeded ability palette contains 15 abilities. | Pending | — |

## 2. Full game with the backend stopped from the start

Use the shipped six-card defaults. Set **Players** to `6`, set **Center Cards** to `0`, and select **Werewolf**, **Minion**, and **Villager** once each. Their defaults total six cards: 2 + 1 + 3.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 2.1 | Stop the backend before opening `/games/new`. Start only the frontend with `npm run dev`. | The frontend opens and the local catalog loads. | Pending | — |
| 2.2 | On `/games/new`, set **Players** to `6` and **Center Cards** to `0`. | The heading reads **Select Roles (0 / 6)**. | Pending | — |
| 2.3 | Select **Werewolf**, **Minion**, and **Villager** once each. | The heading reads **Select Roles (6 / 6)** and **Next** is enabled. | Pending | — |
| 2.4 | Click **Next**. | `/games/new/wake-order` opens and **Review Wake Order** appears. | Pending | — |
| 2.5 | Leave the wake order unchanged and click **Start Game**. | `/games/{gameId}` opens and **SETUP Phase** appears. | Pending | — |
| 2.6 | Inspect the preserved Network log from 2.1 through 2.5. | No request path contains `/api/v1`. | Pending | — |
| 2.7 | Click **Begin Night Phase**, then click **Next →** until it becomes **Start Discussion**. Click **Start Discussion**. | **DISCUSSION Phase** appears without backend access. | Pending | — |
| 2.8 | Click **Skip to Voting**, then **Reveal Results**, then **Complete Game**. | **VOTING Phase**, **RESOLUTION Phase**, and **Game Over** appear in order. | Pending | — |
| 2.9 | Inspect the complete preserved Network log. | No game, role, ability, or script request was sent to `/api/v1`. | Pending | — |

## 3. Custom-role visibility and local save

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 3.1 | Open `/roles/new`, enter a unique name, set **Wake Order (0–40)** to `1`, and complete **Basic Info**, **Abilities**, **Win Conditions**, and **Review**. Add the required condition with **+ Add Condition**. | The **Create Role** control becomes enabled after the server validation and name check report success. | Pending | — |
| 3.2 | Click **Create Role**. | The role is stored locally and `/roles` opens. | Pending | — |
| 3.3 | Keep the default **My Roles** filter active on `/roles`. | The new private role appears immediately without a reload. | Pending | — |
| 3.4 | Open `/games/new`. | The same custom role appears in setup without a browser reload. | Pending | — |
| 3.5 | Return to `/roles/new`, enter the name of an official role with different casing, and wait for the form to settle. | **Taken ✗** appears and no validation or name-check request is sent for the colliding name. | Pending | — |
| 3.6 | Enter the name of the saved custom role with different casing. | **Taken ✗** appears and saving remains blocked. | Pending | — |

## 4. Close and reopen at every game phase

Create the six-card game described in Section 2 at `/games/new`, then use the same `/games/{gameId}` URL after each close and reopen.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 4.1 | Close and reopen the browser at the facilitator **SETUP Phase**. | Setup returns with **Begin Night Phase**. | Pending | — |
| 4.2 | Start night, close and reopen before advancing. | **NIGHT Phase** returns with the first action. | Pending | — |
| 4.3 | Advance once, close and reopen. | **NIGHT Phase** returns and the reader starts at the first action. | Pending | — |
| 4.4 | Complete the night reader with **Next →** until **Start Discussion** appears. Click it, then close and reopen the same `/games/{gameId}` URL. | **DISCUSSION Phase** returns with the configured timer. | Pending | — |
| 4.5 | Click **Skip to Voting**, then close and reopen the same `/games/{gameId}` URL. | **VOTING Phase** returns with **Reveal Results**. | Pending | — |
| 4.6 | Click **Reveal Results**, then close and reopen the same `/games/{gameId}` URL. | **RESOLUTION Phase** returns with **Complete Game**. | Pending | — |
| 4.7 | Click **Complete Game**, then close and reopen the same `/games/{gameId}` URL. | **Game Over** and **New Game** remain visible. **Leave Game** is absent. | Pending | — |

## 5. Two-tab refresh behavior

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 5.1 | Open the same `/games/{gameId}` URL in two tabs. Advance the game in one tab. Refresh the other tab. | The refreshed tab reads the latest persisted snapshot. | Pending | — |
| 5.2 | Create or save a custom role in one tab, then refresh `/roles` in the other tab. | The second tab sees the role after refresh. Live cross-tab updates are not required. | Pending | — |

## 6. Seed-version reseed

After the first launch, use DevTools Console to run this controlled local edit. It changes only the seed metadata version and leaves custom role records untouched:

```js
await new Promise((resolve, reject) => {
  const request = indexedDB.open('yourwolf-local');
  request.onerror = () => reject(request.error);
  request.onsuccess = () => {
    const database = request.result;
    const transaction = database.transaction('metadata', 'readwrite');
    const store = transaction.objectStore('metadata');
    const read = store.get('seed');
    read.onerror = () => reject(read.error);
    read.onsuccess = () => {
      const record = read.result;
      record.seed_version = record.seed_version === 1 ? 2 : 1;
      store.put(record, 'seed');
    };
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  };
});
```

Confirm that the metadata record now has a different `seed_version`, then reload the page.

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 6.1 | In the `yourwolf-local` metadata store, confirm key `seed` and shipped `SEED_VERSION` `1`, run the controlled edit above, and reload `/roles`. | Bootstrap reseeds official data and abilities after the metadata version changes. | Pending | — |
| 6.2 | After reload, open `/roles` and setup. | 30 official roles and 15 abilities remain available. | Pending | — |
| 6.3 | After reseed, inspect the custom role from Section 3. | The custom role remains available. | Pending | — |

## 7. Origin note

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 7.1 | Run the development app at `http://localhost:3000` and inspect its local data. | Development origin data is available in its own browser store. | Pending | — |
| 7.2 | Launch the packaged Tauri app when Phase 06 supplies that runtime and inspect its local data. | Packaged Tauri origin data uses a separate store by design. Do not expect development data to appear. | Pending | — |

## Completion record

| Field | Value |
|---|---|
| Tester | Pending |
| Browser and version | Pending |
| Date | Pending |
| Manual result | Pending |
| Failed checks and evidence | None recorded |
