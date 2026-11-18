# Fjernkontrollstyring for strømmevinduer (TV 2 Play, Netflix …)

`strom-nav.js` gjør tjenestens egen nettside styrbar med fjernkontroll:
piltaster flytter en tydelig markering, OK klikker, Tilbake går tilbake (og lukker
vinduet når det ikke er mer å gå tilbake til). Rullefelt, musepeker og chat-bobler skjules.
Under avspilling: OK = pause/spill, ◀ ▶ = spol 10 s, Tilbake = avslutt.

Skriptet rører ikke avspilling eller kopibeskyttelse – videoen spilles fortsatt i tjenestens
egen spiller. Det hentes fra GitHub-siden hver gang vinduet laster, så forbedringer krever
ikke nytt bygg av Windows-appen.

## Anbefalt på stue-PC-en: åpne strømmetjenestene i ekte Microsoft Edge

**Status 18.11.2026: innført i Windows-appen** (`openEdge` i `windows-app/main.js`): TV 2 Play, Netflix, Disney+, Max, Viaplay og SkyShowtime åpnes i Edge med vanlig profil og `--start-fullscreen`. Fjernkontrollens Tilbake sendes som Esc til Edge (tillegget går tilbake), Hjem/F8 lukker fanen (Ctrl+W) og henter fram Eskedals Univers.

I dag åpnes TV 2 Play/Netflix i et eget Electron-vindu. Det vinduet husker ikke innloggingen
(økten er ikke lagret på disk) og får ikke fjernkontrolltillegget. Edge på stue-PC-en har
tillegget «Eskedals Univers – fjernkontroll» (mappen `C:\EskedalsUnivers\fjernkontroll-edge`)
og husker innlogging.

I hovedprosessen: send disse adressene til Edge i stedet for å åpne eget vindu:

```js
const { shell } = require('electron');
const EU_EXT_HOSTS = /(^|\.)(tv2\.no|netflix\.com|disneyplus\.com|max\.com|hbomax\.com|viaplay\.no|skyshowtime\.com)$/i;
// i setWindowOpenHandler for hovedvinduet:
mainWindow.webContents.setWindowOpenHandler(({ url }) => {
  try { if (EU_EXT_HOSTS.test(new URL(url).hostname)) {
    require('child_process').spawn('cmd', ['/c', 'start', '', 'msedge', '--start-fullscreen', url], { detached: true, stdio: 'ignore' });
    return { action: 'deny' };
  } } catch (_) {}
  return { action: 'allow' }; // (behold eksisterende logikk for andre adresser)
});
```

Hvis eget Electron-vindu skal beholdes i stedet: gi det en lagret økt
(`webPreferences: { partition: 'persist:strom' }`) slik at innloggingen huskes, og bruk koden under.

## Alternativ: last inn skriptet i appens eget vindu (Electron, hovedprosessen)

Legg dette i `main.js` (eller tilsvarende) – én gang:

```js
const { app, BrowserWindow, net } = require('electron');

const EU_NAV_URL = 'https://eskedalanders-creator.github.io/min-iptv/inject/strom-nav.js';
const EU_NAV_HOSTS = /(^|\.)(tv2\.no|netflix\.com|disneyplus\.com|max\.com|hbomax\.com|viaplay\.no|skyshowtime\.com)$/i;

function euAttachNav(wc) {
  const inject = async () => {
    try {
      const host = new URL(wc.getURL()).hostname;
      if (!EU_NAV_HOSTS.test(host)) return;
      const r = await net.fetch(EU_NAV_URL + '?t=' + Date.now());
      if (!r.ok) return;
      await wc.executeJavaScript(await r.text(), true);
    } catch (_) {}
  };
  wc.on('did-finish-load', inject);
  // Skriptet skriver «EU:close» når Tilbake trykkes på første side → lukk vinduet
  wc.on('console-message', (_e, _lvl, msg) => {
    if (msg === 'EU:close') { const w = BrowserWindow.fromWebContents(wc); if (w && !w.isDestroyed()) w.close(); }
  });
}

app.on('web-contents-created', (_e, wc) => {
  if (wc.getType() === 'window' || wc.getType() === 'webview') euAttachNav(wc);
});
```

Sørg også for at vinduet som åpnes for TV 2 Play / Netflix er i fullskjerm uten menylinje
(`fullscreen: true, autoHideMenuBar: true`) og får fokus når det åpnes, slik at tastene fra
fjernkontrollen går dit.
