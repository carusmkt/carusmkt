# CarusMKT — local website

A lightweight, framework-free bilingual website. Open `index.html` directly, or serve the folder for the smoothest experience:

```sh
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Blog público e editor local

O link **Blog** permanece no site. Visitantes leem os artigos de `assets/data/posts.json`. A página de entrada do editor não é enviada ao GitHub Pages: `admin.html` foi removido e `admin-local.html` é ignorado pelo Git. Seu verificador de PIN fica apenas nesse arquivo local.

Para criar o editor no seu computador, execute `python3 tools/create_local_admin.py` e informe o PIN de oito dígitos quando solicitado. Sirva a pasta somente na sua máquina com `python3 -m http.server 8080 --bind 127.0.0.1`. Abra `http://localhost:8080/admin-local.html` e entre com o mesmo PIN. O PIN é apenas uma trava local da interface; a autorização para publicar no site é a permissão de escrita no repositório GitHub. Clique em **Sair** ao terminar.

No editor, marque os artigos desejados como **Publicados** e salve. Clique em **Exportar para o site**: isso baixa `posts.json` com apenas os artigos publicados. No repositório GitHub, substitua `assets/data/posts.json` pelo arquivo exportado e confirme a alteração. O GitHub Pages exibirá esses artigos depois da implantação. **Exportar backup** salva também os rascunhos para recuperação e transferência entre navegadores; eles ficam no `localStorage` do navegador usado no editor.

## Pages

`index.html`, `sobre.html`, `servicos.html`, `branding.html`, `restauracao.html`, `contato.html`, `blog.html`, and `privacidade.html`.
