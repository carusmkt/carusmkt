(() => {
  const salt = '54e8236dd05561b6d02dbf54fc3a2848';
  const verifier = 'fd5bcf1dbf4762fc012f697649e188afa1ff575a8891088ec64f52d9a31a8900';
  const iterations = 600000;
  const gate = document.createElement('div');
  gate.id = 'admin-pin-gate';
  gate.setAttribute('role', 'dialog');
  gate.setAttribute('aria-modal', 'true');
  gate.setAttribute('aria-labelledby', 'admin-pin-title');
  gate.innerHTML = `<form class="pin-card" id="admin-pin-form">
    <h1 id="admin-pin-title">Acesso ao admin</h1>
    <p>Digite seu PIN de 6 dígitos para continuar.</p>
    <label for="admin-pin-input">PIN</label>
    <input id="admin-pin-input" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" minlength="6" autocomplete="off" required>
    <button type="submit">Entrar</button>
    <div id="admin-pin-error" role="alert" aria-live="polite"></div>
  </form>`;

  const content = [...document.body.children];
  content.forEach(element => { element.inert = true; });
  document.body.append(gate);
  const form = gate.querySelector('form');
  const input = gate.querySelector('input');
  const button = gate.querySelector('button');
  const error = gate.querySelector('#admin-pin-error');
  input.focus();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const value = input.value;
    if (!/^[0-9]{6}$/.test(value)) {
      error.textContent = 'Digite exatamente 6 dígitos.';
      return;
    }
    button.disabled = true;
    error.textContent = '';
    try {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(value), 'PBKDF2', false, ['deriveBits']);
      const saltBytes = new Uint8Array(salt.match(/../g).map(byte => parseInt(byte, 16)));
      const derived = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' }, key, 256));
      const expected = new Uint8Array(verifier.match(/../g).map(byte => parseInt(byte, 16)));
      let difference = 0;
      for (let index = 0; index < expected.length; index++) difference |= derived[index] ^ expected[index];
      if (difference !== 0) {
        error.textContent = 'PIN incorreto. Tente novamente.';
        input.value = '';
        input.focus();
        return;
      }
      content.forEach(element => { element.inert = false; });
      gate.remove();
      document.documentElement.classList.remove('admin-locked');
    } catch {
      error.textContent = 'Não foi possível verificar o PIN neste navegador.';
    } finally {
      button.disabled = false;
    }
  });
})();
