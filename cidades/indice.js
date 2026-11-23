(async () => {
  const el = document.getElementById('dados');
  if (!el) return;
  const bruto = await (await fetch(el.dataset.fonte)).json();
  const D = bruto.linhas.map(l => Object.fromEntries(bruto.campos.map((c, i) => [c, l[i]])));
  const RK = bruto.rankings;
  const nf = (v, c = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  const FMT = { taxa: v => nf(v, 1), reais: v => 'R$ ' + nf(v), idh: v => nf(v, 3), um: v => nf(v, 1),
    pct1: v => nf(v, 1) + '%', pct2: v => nf(v, 2) + '%' };
  const morad = p => p < 1000 ? nf(p) + ' moradores' : p < 1e6 ? nf(Math.round(p / 1000)) + ' mil moradores'
    : nf(p / 1e6, 1).replace(',0', '') + ' milhões de moradores';
  const url = d => '/cidades/' + d.u + '/' + d.s + '/';
  const rk = k => RK.find(r => r.k === k);
  const ordenar = (lista, r) => lista.filter(d => d[r.k] != null)
    .sort((a, b) => (r.ordem === 'asc' ? a[r.k] - b[r.k] : b[r.k] - a[r.k]) || (b.p || 0) - (a.p || 0));
  const novo = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };
  const selUf = document.getElementById('f-uf'), selTam = document.getElementById('f-tam');
  // Filtro de estado (fixo na página do estado) e de tamanho ("mínimo-máximo" de moradores)
  function filtro(ufFixa) {
    const uf = ufFixa || (selUf ? selUf.value : '');
    const [mn, mx] = selTam && selTam.value ? selTam.value.split('-').map(Number) : [0, 0];
    return d => (!uf || d.u === uf) && (d.p || 0) >= mn && (!mx || (d.p || 0) < mx);
  }

  // Blocos de ranking (página inicial e estados)
  const grade = document.getElementById('rk-grade');
  const ufFixa = grade ? grade.dataset.uf || '' : '';
  function desenhaRk() {
    if (!grade) return;
    const uf = ufFixa || (selUf ? selUf.value : ''), ok = filtro(ufFixa);
    grade.querySelectorAll('.rk').forEach(art => {
      const r = rk(art.dataset.k);
      const top = ordenar(D.filter(ok), r).slice(0, 10);
      const maior = top.length ? top[0][r.k] : 1;
      const itens = top.map((d, i) => {
        const li = novo('li');
        const a = novo('a', '', d.n); a.href = url(d);
        if (!uf) a.append(' ', novo('small', '', d.u.toUpperCase()));
        let meio;
        if (r.ordem === 'asc') meio = novo('span', 'rk-ctx', morad(d.p));
        else { meio = novo('span', 'rk-barra'); const b = novo('i'); b.style.width = (d[r.k] / maior * 100).toFixed(1) + '%'; meio.append(b); }
        li.append(novo('b', '', i + 1), a, meio, novo('span', 'rk-v', FMT[r.fmt](d[r.k])));
        return li;
      });
      art.querySelector('ol').replaceChildren(...(itens.length ? itens : [novo('li', 'rk-vazio', 'Nenhuma cidade com esse filtro.')]));
      const link = art.querySelector('.rk-mais');
      link.href = '/rankings/' + r.slug + '/' + (uf ? uf + '/' : '');
      link.textContent = 'Ver o ranking completo ' + (uf ? bruto.ufs[uf] : 'do Brasil');
    });
  }

  // Tabela do ranking completo
  const tab = document.getElementById('tabela');
  const mais = document.getElementById('mais'), conta = document.getElementById('contagem');
  let limite = 100;
  function desenhaTab() {
    if (!tab) return;
    const r = rk(tab.dataset.k), uf = tab.dataset.uf || (selUf ? selUf.value : '');
    const lista = ordenar(D.filter(filtro(tab.dataset.uf)), r);
    tab.querySelector('tbody').replaceChildren(...lista.slice(0, limite).map((d, i) => {
      const tr = novo('tr'), td = novo('td'), a = novo('a', '', d.n);
      a.href = url(d); td.append(a); if (!uf) td.append(' ', novo('small', '', d.u.toUpperCase()));
      tr.append(novo('td', '', (i + 1) + 'ª'), td, novo('td', 'n v', FMT[r.fmt](d[r.k])), novo('td', 'n', nf(d.p || 0)));
      return tr;
    }));
    if (mais) mais.hidden = lista.length <= limite;
    if (conta) conta.textContent = lista.length.toLocaleString('pt-BR') + (lista.length === 1 ? ' cidade' : ' cidades');
  }
  if (mais) mais.addEventListener('click', () => { limite += 100; desenhaTab(); });

  // Mapa: um ponto por cidade, cor pelo indicador escolhido (mais claro = melhor); fora do filtro, apagado
  const svg = document.getElementById('mapa');
  let pts = [];
  function marcaMapa() { const ok = filtro(); pts.forEach(c => { c.style.opacity = ok(c._d) ? '' : '.12'; }); }
  [selUf, selTam].forEach(s => s && s.addEventListener('change', () => { limite = 100; desenhaRk(); desenhaTab(); marcaMapa(); }));
  desenhaRk(); desenhaTab();
  if (svg) {
    const ns = 'http://www.w3.org/2000/svg', k0 = Math.cos(14 * Math.PI / 180);
    const X = lo => (lo + 74.2) * k0, Y = la => 5.6 - la;
    svg.setAttribute('viewBox', `0 0 ${((74.2 - 34.6) * k0).toFixed(2)} 39.6`);
    pts = D.filter(d => d.la != null).map(d => {
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', X(d.lo).toFixed(2)); c.setAttribute('cy', Y(d.la).toFixed(2)); c.setAttribute('r', '.19');
      c.setAttribute('stroke', '#0e2a33'); c.setAttribute('stroke-width', '.05');   // contorno na cor do fundo: pontos nítidos
      c._d = d; return c;
    });
    const RAMPA = ['#76611a', '#927819', '#b8961c', '#dcb51f', '#f7d14a', '#fff0b8'], SEM = '#2b4651';
    const leg = document.getElementById('mapa-leg');
    function pinta(k) {
      const r = rk(k), sinal = r.ordem === 'asc' ? -1 : 1;
      const vals = pts.map(c => c._d[k]).filter(v => v != null).map(v => sinal * v).sort((a, b) => a - b);
      const cortes = [1, 2, 3, 4, 5].map(i => vals[Math.floor(i * vals.length / 6)]);
      pts.forEach(c => {
        const v = c._d[k];
        let cl = -1;
        if (v != null) { cl = 0; while (cl < 5 && sinal * v >= cortes[cl]) cl++; }
        c._cl = cl;
        c.setAttribute('fill', cl < 0 ? SEM : RAMPA[cl]);
        c.dataset.tip = (v == null ? 'Sem dado' : FMT[r.fmt](v)) + '|' + c._d.n + ' (' + c._d.u.toUpperCase() + ')';
      });
      svg.replaceChildren(...pts.slice().sort((a, b) => a._cl - b._cl));
      const pior = FMT[r.fmt](sinal * vals[0]), melhor = FMT[r.fmt](sinal * vals[vals.length - 1]);
      const escala = novo('div', 'mapa-escala');
      RAMPA.forEach(cor => { const i = novo('i'); i.style.background = cor; escala.append(i); });
      const pontas = novo('div', 'mapa-pontas');
      pontas.append(novo('span', '', pior), novo('span', '', melhor));
      leg.replaceChildren(novo('span', '', 'Cada ponto é uma cidade. ' + r.legenda), escala, pontas);
    }
    document.querySelectorAll('.mapa-chips button').forEach(bt => bt.addEventListener('click', () => {
      document.querySelectorAll('.mapa-chips button').forEach(x => x.setAttribute('aria-pressed', String(x === bt)));
      pinta(bt.dataset.k);
    }));
    svg.addEventListener('click', ev => { if (ev.target._d) location.href = url(ev.target._d); });
    pinta(document.querySelector('.mapa-chips button[aria-pressed="true"]').dataset.k);
    marcaMapa();
  }

  // Busca
  const sem = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = document.getElementById('q'), sug = document.getElementById('sug');
  if (q) {
    const ufBusca = q.dataset.uf || '';
    const base = ufBusca ? D.filter(d => d.u === ufBusca) : D;
    q.addEventListener('input', () => {
      const t = sem(q.value.trim()); sug.replaceChildren();
      if (!t) { sug.hidden = true; return; }
      const achados = base.filter(d => sem(d.n).includes(t))
        .sort((a, b) => sem(a.n).indexOf(t) - sem(b.n).indexOf(t) || (b.p || 0) - (a.p || 0)).slice(0, 8);
      for (const d of achados) {
        const li = novo('li'), a = novo('a', '', ufBusca ? d.n : d.n + ' (' + d.u.toUpperCase() + ')');
        a.href = url(d); li.append(a); sug.append(li);
      }
      sug.hidden = !achados.length;
    });
    q.addEventListener('keydown', ev => { if (ev.key === 'Enter') { const a = sug.querySelector('a'); if (a) location.href = a.href; } });
    document.addEventListener('click', ev => { if (!ev.target.closest('.busca')) sug.hidden = true; });
    const q0 = new URLSearchParams(location.search).get('q');
    if (q0) { q.value = q0; q.dispatchEvent(new Event('input')); }
  }
})();
