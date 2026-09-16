"""Create the owner-only editor entry page, excluded from Git."""

import hashlib
import json
import re
import secrets
from getpass import getpass
from pathlib import Path

root = Path(__file__).resolve().parent.parent
target = root / "admin-local.html"
pin = getpass("PIN de 8 dígitos para o editor: ")
if not re.fullmatch(r"[0-9]{8}", pin):
    raise SystemExit("O PIN deve conter exatamente 8 números.")
salt = secrets.token_bytes(16)
auth = json.dumps(
    {
        "salt": salt.hex(),
        "digest": hashlib.pbkdf2_hmac("sha256", pin.encode(), salt, 310000).hex(),
    }
)
target.write_text(
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1">'
    '<meta name="robots" content="noindex"><title>Estúdio editorial — CarusMKT</title>'
    '<link rel="stylesheet" href="assets/css/style.css">'
    '<link rel="stylesheet" href="assets/css/overrides.css">'
    '</head><body data-page="admin">'
    f'<script>window.__carusAdminAuth={auth}</script>'
    '<script src="assets/js/app.js"></script></body></html>\n',
    encoding="utf-8",
)
print(f"Editor local criado: {target}")
