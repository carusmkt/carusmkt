# CarusMKT — local website

A lightweight, framework-free bilingual website. Open `index.html` directly, or serve the folder for the smoothest experience:

```sh
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Blog administration

Open `admin.html`. Posts and uploaded images are stored in the current browser's `localStorage`, so the static site remains deployable without a server. Use **Export posts** to download a backup, and **Import posts** to restore it in another browser/device. For a shared, production authoring workflow, connect the same UI to a CMS or small authenticated API.

## Pages

`index.html`, `sobre.html`, `servicos.html`, `branding.html`, `restauracao.html`, `contato.html`, `blog.html`, `privacidade.html`, and `admin.html`.
