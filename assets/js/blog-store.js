// Public articles live in the repository. The GitHub token exists only in this page's memory.
window.CarusBlogStore = (() => {
  const owner = 'carusmkt';
  const repo = 'carusmkt';
  const branch = 'main';
  const postsPath = 'assets/data/posts.json';
  const apiRoot = `https://api.github.com/repos/${owner}/${repo}/contents/`;
  const requestTimeoutMs = 25000;
  let token = '';

  const encode = value => btoa(Array.from(new TextEncoder().encode(value), byte => String.fromCharCode(byte)).join(''));
  const decode = value => new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g, '')), char => char.charCodeAt(0)));
  const apiUrl = (path, withRef = true) => `${apiRoot}${path.split('/').map(encodeURIComponent).join('/')}${withRef ? `?ref=${branch}` : ''}`;
  const headers = () => ({
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28'
  });
  const parsePosts = value => {
    if (!Array.isArray(value) || value.some(post => !post || typeof post.id !== 'string' || typeof post.title !== 'string' || typeof post.content !== 'string')) {
      throw new Error('O arquivo de artigos no GitHub é inválido.');
    }
    return value;
  };
  const messageFor = response => {
    if (response.status === 401 || response.status === 403) return 'Token sem acesso. Confira se ele está ativo e tem permissão Contents: Read and write neste repositório.';
    if (response.status === 409 || response.status === 422) return 'O repositório mudou durante a publicação. Recarregue o admin e tente novamente.';
    return `O GitHub não aceitou a operação (HTTP ${response.status}).`;
  };
  const request = async (url, options = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) throw new Error('O GitHub demorou demais para responder. Confira se o artigo foi publicado antes de tentar novamente.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };

  async function loadPublicPosts() {
    const response = await fetch(`assets/data/posts.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Não foi possível carregar os artigos publicados.');
    return parsePosts(await response.json());
  }

  async function readFile(path) {
    if (!token) throw new Error('Informe o fine-grained token para publicar no GitHub.');
    const response = await request(apiUrl(path), { headers: headers(), cache: 'no-store' });
    if (response.status === 404) return { sha: null, content: null };
    if (!response.ok) throw new Error(messageFor(response));
    const file = await response.json();
    if (typeof file.content !== 'string' || !file.sha) throw new Error('Arquivo do GitHub grande demais para este editor.');
    return { sha: file.sha, content: decode(file.content) };
  }

  async function putFile(path, base64, message, sha = null) {
    const body = { message, content: base64, branch };
    if (sha) body.sha = sha;
    const response = await request(apiUrl(path, false), {
      method: 'PUT',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(messageFor(response));
  }

  async function uploadImage(value, path) {
    if (!/^data:image\/(?:webp|png|jpeg);base64,/i.test(value || '')) return value;
    const existing = await readFile(path);
    await putFile(path, value.split(',')[1], `Atualizar imagem do blog: ${path}`, existing.sha);
    return path;
  }

  async function publish(post) {
    const current = await readFile(postsPath);
    const posts = parsePosts(current.content ? JSON.parse(current.content) : []);
    const safeId = post.id.replace(/[^a-z0-9-]/gi, '-');
    const image = await uploadImage(post.image, `assets/blog/${safeId}/cover.webp`);
    const inlineImages = {};
    for (const [id, value] of Object.entries(post.inlineImages || {})) {
      const safeImageId = id.replace(/[^a-z0-9-]/gi, '-');
      inlineImages[id] = await uploadImage(value, `assets/blog/${safeId}/${safeImageId}.webp`);
    }
    const publicPost = { ...post, image, inlineImages, published: true };
    const next = [publicPost, ...posts.filter(item => item.id !== post.id)];
    await putFile(postsPath, encode(JSON.stringify(next, null, 2) + '\n'), `Publicar artigo: ${post.title}`, current.sha);
    return publicPost;
  }

  async function unpublish(id) {
    const current = await readFile(postsPath);
    if (!current.content) return;
    const posts = parsePosts(JSON.parse(current.content));
    if (!posts.some(post => post.id === id)) return;
    await putFile(postsPath, encode(JSON.stringify(posts.filter(post => post.id !== id), null, 2) + '\n'), `Remover artigo do blog: ${id}`, current.sha);
  }

  return { loadPublicPosts, publish, unpublish, setToken(value) { token = value.trim(); }, hasToken() { return !!token; } };
})();
