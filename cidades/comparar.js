(async () => {
  const el = document.getElementById('cmp'); if (!el) return;
  let bruto;
  try { bruto = await (await fetch(el.dataset.fonte)).json(); }
  catch (e) { el.textContent = 'Não consegui carregar os dados. Tente recarregar a página.'; return; }
  const IND = bruto.ind, RKS = bruto.rks, NI = IND.length;
  const D = bruto.linhas.map((l, i) => ({ i, n: l[0], s: l[1], u: l[2], v: l.slice(3, 3 + NI),
    pos: Object.fromEntries(RKS.map((k, j) => [k, l[3 + NI + j]])), perto: l[3 + NI + RKS.length] || [] }));
  const porId = new Map(D.map(d => [d.u + '/' + d.s, d]));
  const nf = (v, c = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  const FMT = { int: v => nf(v), reais: v => 'R$ ' + nf(v), idh: v => nf(v, 3), taxa: v => nf(v, 1), um: v => nf(v, 1),
    pct0: v => nf(v) + '%', pct1: v => nf(v, 1) + '%', pct2: v => nf(v, 2) + '%', anos: v => nf(v, 1) + ' anos',
    mbps: v => nf(v) + ' Mbps', txt: v => v, graus: v => nf(v, 1) + ' °C', mm: v => nf(v) + ' mm' };
  const novo = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };
  const celular = matchMedia('(max-width: 767px)');
  const limite = () => celular.matches ? 2 : 4;
  const MAX = 4;
  let sel = (new URLSearchParams(location.search).get('c') || '').split(',').map(x => porId.get(x.trim())).filter(Boolean);
  sel = [...new Map(sel.map(d => [d.i, d])).values()].slice(0, MAX);
  let aviso = '';
  const guarda = () => {
    const q = sel.map(d => d.u + '/' + d.s).join(',');
    history.replaceState(null, '', q ? '?c=' + q : location.pathname);
  };
  function adiciona(d) {
    if (sel.includes(d)) return;
    if (sel.length >= MAX) { aviso = 'Dá para comparar até 4 cidades. Tire uma para incluir outra.'; desenha(); return; }
    sel.push(d);
    const m = limite();
    if (sel.length > m) sel.splice(m - 1, 0, sel.pop());   // no celular, a nova entra entre as que aparecem
    aviso = ''; guarda(); desenha();
  }
  const tira = d => { sel = sel.filter(x => x !== d); aviso = ''; guarda(); desenha(); };
  function mostra(d) {
    const m = limite(), i = sel.indexOf(d);
    if (i < m) return;
    sel.splice(i, 1); sel.splice(m - 1, 0, d); guarda(); desenha();
  }
  function desenha() {
    const m = limite(), vis = sel.slice(0, m), out = [];
    el.style.setProperty('--n', Math.max(vis.length, 1));
    if (sel.length) {
      const chips = novo('div', 'cmp-chips');
      sel.forEach((d, i) => {
        const chip = novo('span', 'cmp-chip' + (i < m ? '' : ' fora'));
        const nome = novo('button', 'cmp-chip-nome', d.n + ' (' + d.u.toUpperCase() + ')'); nome.type = 'button';
        if (i >= m) { nome.title = 'Trazer para a comparação'; nome.addEventListener('click', () => mostra(d)); }
        else nome.tabIndex = -1;
        const x = novo('button', 'cmp-chip-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Tirar ' + d.n);
        x.addEventListener('click', () => tira(d));
        chip.append(nome, x); chips.append(chip);
      });
      out.push(chips);
      if (sel.length > m) out.push(novo('p', 'nota', 'No celular aparecem 2 cidades por vez. Toque no nome de uma cidade apagada para trazê-la para a comparação.'));
    }
    if (aviso) out.push(novo('p', 'cmp-aviso', aviso));
    if (!vis.length) {
      out.push(novo('p', 'cmp-vazio', 'Use a busca acima para escolher a primeira cidade, ou comece por um destes exemplos:'));
      const ex = novo('div', 'cmp-exemplos');
      for (const grupo of [['sp/sao-paulo', 'rj/rio-de-janeiro'], ['mg/belo-horizonte', 'pr/curitiba', 'rs/porto-alegre'],
                           ['pe/recife', 'ba/salvador', 'ce/fortaleza']]) {
        const ds = grupo.map(g => porId.get(g)).filter(Boolean);
        if (ds.length < 2) continue;
        const a = novo('a', 'cmp-add', ds.map(d => d.n).join(' x ')); a.href = '?c=' + grupo.join(','); ex.append(a);
      }
      out.push(ex);
    } else {
      const cab = novo('div', 'cmp-cab'); cab.append(novo('div', 'cmp-rot'));
      for (const d of vis) {
        const c = novo('div', 'cmp-cidade'), a = novo('a', '', d.n);
        a.href = '/cidades/' + d.u + '/' + d.s + '/';
        c.append(a, novo('span', '', d.u.toUpperCase())); cab.append(c);
      }
      out.push(cab);
      let grupo = '';
      IND.forEach((ind, j) => {
        const vals = vis.map(d => d.v[j]);
        if (vals.every(v => v == null)) return;
        if (ind.g !== grupo) { grupo = ind.g; out.push(novo('h2', 'cmp-grupo', grupo)); }
        const num = ind.fmt !== 'txt', nums = num ? vals.filter(v => v != null) : [];
        const maior = nums.length ? Math.max(...nums.map(Math.abs)) : 0;
        let melhor = null;
        if (ind.o && nums.length > 1) {
          const alvo = ind.o === 'desc' ? Math.max(...nums) : Math.min(...nums);
          if (nums.some(v => v !== alvo)) melhor = alvo;
        }
        const linha = novo('div', 'cmp-linha'); linha.append(novo('div', 'cmp-rot', ind.rot));
        vis.forEach((d, i) => {
          const v = vals[i], cel = novo('div', 'cmp-cel');
          if (v == null) cel.append(novo('span', 'cmp-val vazio', 'sem dado'));
          else {
            cel.append(novo('span', 'cmp-val' + (v === melhor ? ' melhor' : ''), FMT[ind.fmt](v)));
            if (num && maior > 0) {
              const b = novo('span', 'cmp-barra'), f = novo('i');
              f.style.width = (Math.abs(v) / maior * 100).toFixed(1) + '%'; b.append(f); cel.append(b);
            }
            if (ind.rk && d.pos[ind.rk]) cel.append(novo('span', 'cmp-pos', d.pos[ind.rk].toLocaleString('pt-BR') + 'ª no Brasil'));
          }
          linha.append(cel);
        });
        out.push(linha);
      });
    }
    if (sel.length && sel.length < MAX) {
      const base = sel[0], sug = base.perto.map(i => D[i]).filter(d => d && !sel.includes(d));
      if (sug.length) {
        const box = novo('div', 'cmp-sugest'); box.append(novo('span', '', 'Cidades perto de ' + base.n + ':'));
        for (const d of sug) {
          const b = novo('button', 'cmp-add', '+ ' + d.n + ' (' + d.u.toUpperCase() + ')'); b.type = 'button';
          b.addEventListener('click', () => adiciona(d)); box.append(b);
        }
        out.splice(sel.length ? 1 : 0, 0, box);
      }
    }
    if (vis.length > 1) {
      const a = novo('a', 'zap cmp-zap', 'Compartilhar esta comparação no WhatsApp'); a.target = '_blank'; a.rel = 'noopener';
      a.href = 'https://wa.me/?text=' + encodeURIComponent(vis.map(d => d.n).join(' x ') + ': compare no Brasil Responde ' + location.href);
      out.push(a);
    }
    el.replaceChildren(...out);
  }
  celular.addEventListener('change', desenha);
  const sem = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = document.getElementById('cmp-q'), sug = document.getElementById('cmp-sug');
  const escolhe = d => { adiciona(d); q.value = ''; sug.hidden = true; sug.replaceChildren(); };
  q.addEventListener('input', () => {
    const t = sem(q.value.trim()); sug.replaceChildren();
    if (!t) { sug.hidden = true; return; }
    const achados = D.filter(d => !sel.includes(d) && sem(d.n).includes(t))
      .sort((a, b) => sem(a.n).indexOf(t) - sem(b.n).indexOf(t) || (b.v[0] || 0) - (a.v[0] || 0)).slice(0, 8);
    for (const d of achados) {
      const li = novo('li'), b = novo('button', '', d.n + ' (' + d.u.toUpperCase() + ')'); b.type = 'button';
      b.addEventListener('click', () => escolhe(d)); li.append(b); sug.append(li);
    }
    sug.hidden = !achados.length;
  });
  q.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') { ev.preventDefault(); const b = sug.querySelector('button'); if (b) b.click(); }
  });
  document.addEventListener('click', ev => { if (!ev.target.closest('.busca')) sug.hidden = true; });
  guarda(); desenha();
})();
