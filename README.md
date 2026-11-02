# CarusMKT

Transforming marketing as we know

Prévia local: execute `python3 -m http.server 8000 --bind 127.0.0.1` na raiz e abra
http://localhost:8000. O site é estático e não precisa de build.

O fundo da abertura usa uma adaptação sem React do Pattern Waves fornecido,
preservando o preset silk e os shaders originais. Cores e opacidade ficam em
`assets/css/overrides.css`; o fade pelo scroll fica em `assets/js/components/HomeWaves.js`
e está temporariamente desativado para manter a intensidade constante.
