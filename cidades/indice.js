(async () => {
  const el = document.getElementById('dados');
  if (!el) return;
  const nacional = 'fonte' in el.dataset;
  const D = nacional ? await (await fetch(el.dataset.fonte)).json() : JSON.parse(el.textContent);
  const fmt = (v, c = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  const url = d => '/cidades/' + d.u + '/' + d.s + '/';
  const nome = d => nacional ? d.n + ' (' + d.u.toUpperCase() + ')' : d.n;
  const R = [
    { t: 'Maior renda média por pessoa', k: 'r', f: v => 'R$ ' + fmt(v) },
    { t: 'Mais empresas abertas por mil moradores', k: 'a', f: v => fmt(v, 1) },
    { t: 'Mais ligações com energia solar por mil imóveis', k: 'g', f: v => fmt(v, 1) },
    { t: 'População que mais cresce (% ao ano)', k: 'c', f: v => fmt(v, 2) + '%' },
  ];
  const box = document.getElementById('rk');
  let faixa = '';
  function desenha() {
    if (!box) return;
    box.replaceChildren();
    for (const r of R) {
      const top = D.filter(d => d[r.k] != null && (!faixa || d.f === faixa)).sort((a, b) => b[r.k] - a[r.k]).slice(0, 10);
      const card = document.createElement('div'); card.className = 'painel';
      const h = document.createElement('div'); h.className = 'painel-tit'; h.textContent = r.t;
      const ol = document.createElement('ol');
      top.forEach((d, i) => {
        const li = document.createElement('li');
        const b = document.createElement('b'); b.textContent = i + 1;
        const a = document.createElement('a'); a.href = url(d); a.textContent = nome(d);
        const v = document.createElement('span'); v.textContent = r.f(d[r.k]);
        li.append(b, a, v); ol.append(li);
      });
      card.append(h, ol); box.append(card);
    }
  }
  document.querySelectorAll('.filtro button').forEach(bt => bt.addEventListener('click', () => {
    faixa = bt.dataset.f;
    document.querySelectorAll('.filtro button').forEach(x => x.setAttribute('aria-pressed', String(x === bt)));
    desenha();
  }));
  desenha();
  const sem = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = document.getElementById('q'), sug = document.getElementById('sug');
  if (!q) return;
  q.addEventListener('input', () => {
    const t = sem(q.value.trim()); sug.replaceChildren();
    if (!t) { sug.hidden = true; return; }
    const achados = D.filter(d => sem(d.n).includes(t))
      .sort((a, b) => sem(a.n).indexOf(t) - sem(b.n).indexOf(t) || (b.p || 0) - (a.p || 0)).slice(0, 8);
    for (const d of achados) {
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = url(d); a.textContent = nacional ? nome(d) : d.n; li.append(a); sug.append(li);
    }
    sug.hidden = !achados.length;
  });
  q.addEventListener('keydown', ev => { if (ev.key === 'Enter') { const a = sug.querySelector('a'); if (a) location.href = a.href; } });
})();
