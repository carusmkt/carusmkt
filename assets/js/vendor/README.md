`ogl.js` contains the OGL 1.0.11 exports used by Pattern Waves, bundled as an ES module.
Source: https://github.com/oframe/ogl (Unlicense, public domain).

It is served locally so the static site needs no CDN or build step at runtime.
To regenerate, install `ogl@1.0.11` and `esbuild@0.28.2` in a temporary directory,
create an entry exporting `Renderer, Program, Mesh, Triangle, RenderTarget, Texture`
from `ogl`, then bundle that entry with `esbuild --bundle --minify --format=esm`.
