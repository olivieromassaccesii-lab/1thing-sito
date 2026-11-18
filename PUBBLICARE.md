# Pubblicare il sito di 1thing su 1thingapp.com

Il sito è statico: si carica la cartella `dist/` così com'è, alla radice del dominio, e non c'è niente da compilare sul server. Lo zip pronto è in `pubblicazione/`.

## Cosa c'è in `dist/`

| percorso | cos'è |
|---|---|
| `index.html` | la radice: manda ognuno alla sua lingua (inglese se non è fra le cinque) |
| `it/`, `en/`, `es/`, `fr/`, `pt/` | la pagina del sito in ogni lingua |
| `<lingua>/faq/`, `<lingua>/privacy/` | domande frequenti e privacy in ogni lingua |
| `faq/`, `privacy/` | gli indirizzi che apre l'app (`1thingapp.com/faq`, `/privacy`): mandano alla lingua giusta |
| `assets/` | stile, script, font, immagini, il motore a pastello e i dati della costa |
| `404.html` | la pagina che non c'è, in cinque lingue |
| `robots.txt`, `sitemap.xml` | per i motori di ricerca |
| `favicon.ico`, `apple-touch-icon.png` | l'icona nel browser |
| `_headers` | intestazioni di sicurezza e cache (le usano Cloudflare Pages e Netlify; gli altri hosting le ignorano) |

In tutto sono circa 5 MB. La prima visita scarica circa 0,7 MB; il motore e la costa (1,3 MB) arrivano solo quando l'iPhone dell'apertura è sullo schermo.

## Consigliato: Cloudflare Pages

Il server dell'app gira già su Cloudflare, quindi conviene tenere tutto lì. Il piano gratuito basta.

1. Vai su Cloudflare, **Workers & Pages**, poi **Create**, scheda **Pages**, poi **Upload assets**.
2. Dai un nome al progetto, per esempio `1thing-sito`, e trascina la cartella `dist/` oppure lo zip in `pubblicazione/`.
3. Pubblica. Cloudflare ti dà un indirizzo di prova, per esempio `1thing-sito.pages.dev`. Aprilo e controlla l'apertura, le lingue, `/faq` e `/privacy`.
4. Nel progetto, vai su **Custom domains**, poi **Set up a custom domain**, e aggiungi `1thingapp.com`. Poi ripeti con `www.1thingapp.com`.
   - Se il dominio è già su Cloudflare, i record DNS si creano da soli.
   - Se il dominio è registrato altrove, Cloudflare ti dice quale record aggiungere (un `CNAME` verso `1thing-sito.pages.dev`), oppure ti propone di spostare lì i DNS.
5. **Non toccare i record della posta** (`MX`, `TXT` di SPF, DKIM e DMARC): servono a `feedback@1thingapp.com`.

Per gli aggiornamenti successivi, dalla cartella `sites/1thing`:

```bash
python3 src/build.py
```

```bash
npx wrangler pages deploy dist --project-name 1thing-sito
```

## In alternativa: qualsiasi hosting statico

Carica il **contenuto** di `dist/` (non la cartella stessa) nella cartella pubblica del dominio, per esempio `public_html/` via FTP. Va bene qualsiasi hosting statico: Netlify, GitHub Pages, un hosting tradizionale. Impostazioni da controllare:

- la pagina d'errore deve essere `404.html`;
- `https` deve essere attivo, con il passaggio automatico da `http`;
- gli indirizzi senza barra finale (`/faq`) devono portare a quelli con la barra (`/faq/`). Quasi tutti gli hosting lo fanno da soli.

## Prima di pubblicare

- [ ] **App Store.** Quando l'app è pubblicata, metti il link in `APP_STORE` dentro `src/build.py` e rifai il build. Il tasto passa da «presto sull'App Store» a «scarica dall'App Store».
- [ ] **Privacy.** Falla rileggere da un avvocato, soprattutto la parte sul consenso all'IA. Controlla poi la frase su quanto tempo Anthropic conserva i dati con le sue condizioni del momento.
- [ ] **App.** Nell'app i link sono `https://1thingapp.com/faq` e `https://1thingapp.com/privacy`, e funzionano così come sono.
- [ ] **App Store Connect.** Come URL della privacy usa `https://1thingapp.com/privacy`; come URL di supporto `https://1thingapp.com/faq` oppure la mail.
- [ ] **Vecchio hosting.** `.openai/hosting.json` è la configurazione del vecchio sito sull'hosting OpenAI. Non serve più: se quel sito è ancora online, spegnilo per non avere due versioni in giro.

## Dopo la pubblicazione

- Apri `https://1thingapp.com` da un iPhone e da un computer, e prova il gesto del cerchio nell'apertura.
- Apri `https://1thingapp.com/faq` e `https://1thingapp.com/privacy` dall'app.
- Facoltativo: aggiungi il sito a Google Search Console e invia `https://1thingapp.com/sitemap.xml`.
