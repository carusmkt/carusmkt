# CarusMKT — local website

A lightweight, framework-free bilingual website. Serve the folder locally so the blog can load its article file:

```sh
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Blog administration

The public blog reads `assets/data/posts.json`. Serve the site over HTTP; `fetch` does not reliably work when opening `blog.html` as a `file://` page.

To publish from `admin.html`:

1. Create a GitHub fine-grained personal access token for **only** `carusmkt/carusmkt`, with repository permission **Contents: Read and write**. Choose a short expiration date. The token owner must be allowed to write to `main`.
2. Open the deployed `admin.html`, enter the PIN, paste the token under **GitHub fine-grained token**, and click **Conectar token**. The editor verifies access to the repository before saving the token in this browser's local storage. It restores the connection on later visits; use **Desconectar e apagar token** to remove it. Use this option on a trusted browser. The token is never included in site files, posts, or a URL. Write permission is checked when publishing.
3. Write the article, select **Publicar agora**, and click **Salvar artigo**. The editor commits the article to `assets/data/posts.json` and uploads cover images to `assets/blog/`. The public blog shows the change after the site host deploys the new commit. Saving a draft keeps it only in this browser; switching a published article back to draft removes it from the public JSON.

The repository and branch are configured in `assets/js/blog-store.js`. If deployment uses a different branch or repository, update those constants. The browser PIN is a visual gate, not server-side authorization; GitHub enforces write access through the token. Keep backups with **Exportar backup** and **Importar backup**. Existing browser-only articles remain in the admin library and can be published using the new flow.

## Pages

`index.html`, `sobre.html`, `servicos.html`, `branding.html`, `restauracao.html`, `contato.html`, `blog.html`, `privacidade.html`, and `admin.html`.
