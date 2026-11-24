(() => {
  const tip = document.createElement('div');
  tip.className = 'tip'; tip.hidden = true; document.body.append(tip);
  function mostra(el) {
    const [valor, rotulo] = el.dataset.tip.split('|');
    const b = document.createElement('strong'); b.textContent = valor;
    const s = document.createElement('span'); s.textContent = rotulo || '';
    tip.replaceChildren(b, s); tip.hidden = false;
    const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect();
    const x = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), innerWidth - t.width - 8);
    const y = r.top - t.height - 8 < 8 ? r.bottom + 8 : r.top - t.height - 8;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  const esconde = () => { tip.hidden = true; };
  document.addEventListener('pointerover', ev => { const el = ev.target.closest('[data-tip]'); el ? mostra(el) : esconde(); });
  document.addEventListener('focusin', ev => { const el = ev.target.closest('[data-tip]'); el ? mostra(el) : esconde(); });
  document.addEventListener('focusout', esconde);
  addEventListener('scroll', esconde, { passive: true });
})();
// Janela de detalhes das pessoas (prefeito, vice, vereadores): os dados vêm do bloco JSON #fichas da página e
// entram como texto (textContent), nunca como HTML
(() => {
  let dlg;
  const novo = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };
  let dados;
  const ROT = ['Nome completo', 'Cargo', 'Partido', 'Número', '', '', 'Partidos da coligação', 'Votos', 'Gênero', 'Idade', 'Escolaridade', 'Ocupação declarada'];
  function abre(botao) {
    if (!dados) { try { dados = JSON.parse(document.getElementById('fichas').textContent); } catch (e) { return; } }
    const f = dados.p[+botao.dataset.i]; if (!f) return;
    if (!dlg) {
      dlg = novo('dialog', 'ficha'); dlg.setAttribute('aria-labelledby', 'ficha-nome');
      dlg.addEventListener('click', ev => { if (ev.target === dlg) dlg.close(); });
      document.body.append(dlg);
    }
    const fechar = novo('button', 'ficha-fechar', '×'); fechar.type = 'button'; fechar.setAttribute('aria-label', 'Fechar');
    fechar.addEventListener('click', () => dlg.close());
    const h = novo('h3', '', f[0]); h.id = 'ficha-nome';
    const topo = novo('div', 'ficha-topo'); topo.append(h, fechar);
    const dl = novo('dl');
    const linhas = [[ROT[0], f[1]], [ROT[1], f[2]], [ROT[2], f[3]], [ROT[3], f[4]],
      [f[5] === 'F' ? 'Federação' : 'Coligação', f[6]], [ROT[6], f[7]], [ROT[7], f[8]],
      [ROT[8], f[9] === 'F' ? 'Feminino' : f[9] === 'M' ? 'Masculino' : ''],
      ['Nascimento', f[14] || (f[10] ? f[10] + ' anos' : '')], ['Estado de nascimento', f[15]],
      ['Estado civil', f[16]], [ROT[10], f[11]], [ROT[11], f[12]], ['Bens declarados', f[17]]];
    for (const [k, v] of linhas) if (v) dl.append(novo('dt', '', k), novo('dd', '', v));
    const bens = novo('div', 'ficha-bens');
    if (f[18] && f[18].length) {
      const t = novo('table'); const tb = novo('tbody');
      for (const [tipo, valor] of f[18]) { const tr = novo('tr'); tr.append(novo('td', '', tipo), novo('td', 'n', valor)); tb.append(tr); }
      t.append(tb); bens.append(novo('div', 'ficha-bens-tit', 'Bens por tipo, como declarados ao TSE em 2024'), t);
    }
    const pe = novo('div', 'ficha-pe');
    const a = novo('a', '', 'Ficha completa da candidatura no TSE');
    a.href = f[13] ? `https://divulgacandcontas.tse.jus.br/divulga/#/candidato/${dados.r}/${dados.uf}/2045202024/${f[13]}/2024/${dados.ue}`
                   : 'https://divulgacandcontas.tse.jus.br/divulga/#/home';
    a.target = '_blank'; a.rel = 'noopener';
    pe.append(a, novo('span', '', 'Dados do registro de candidatura no TSE, em 2024. Não mostramos documentos, a data completa de nascimento, cor ou raça nem a descrição de cada bem, que pode trazer endereço ou placa.'));
    dlg.replaceChildren(topo, dl, bens, pe);
    dlg.showModal(); fechar.focus();
  }
  document.addEventListener('click', ev => { const b = ev.target.closest('button.pessoa[data-i]'); if (b) abre(b); });
})();
// "Reportar dado incorreto": completa o e-mail com a cidade, a seção e o endereço da página na hora do clique
document.addEventListener('click', ev => {
  const a = ev.target.closest('a.reportar[data-sec]'); if (!a) return;
  const cidade = (document.querySelector('main[data-cidade]') || {}).dataset?.cidade || document.title;
  const assunto = `Dado incorreto: ${cidade} - ${a.dataset.tema}`;
  const corpo = `Página: ${location.origin}${location.pathname}\nSeção: ${a.dataset.sec}\n\nO que está errado:\n\nQual seria o dado certo e a fonte (se souber):\n`;
  a.href = a.href.split('?')[0] + '?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo);
});
// Previsão do tempo e alertas do INMET, buscados ao abrir a página da cidade. Tudo entra como texto (textContent);
// a cor do alerta e o ícone só são usados se tiverem o formato esperado.
(() => {
  const box = document.getElementById('tempo');
  if (!box || !/^\d{7}$/.test(box.dataset.cod || '') || !window.fetch) return;
  const cod = box.dataset.cod, API = 'https://apiprevmet3.inmet.gov.br';
  const novo = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };
  const le = (k, ttl) => { try { const x = JSON.parse(sessionStorage.getItem(k)); if (x && Date.now() - x.t < ttl) return x.v; } catch (e) {} return null; };
  const guarda = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify({ t: Date.now(), v })); } catch (e) {} };
  async function pega(url, k, ttl, enxuga) {
    const c = le(k, ttl); if (c) return c;
    const r = await fetch(url); if (!r.ok) throw new Error(r.status);
    const v = enxuga(await r.json()); guarda(k, v); return v;
  }
  const icone = s => typeof s === 'string' && /^data:image\/(png|gif|jpeg);base64,[A-Za-z0-9+/=]+$/.test(s) ? s : '';
  const quando = s => { const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(s || ''); return m ? `${m[3]}/${m[2]} às ${m[4]}h${m[5] !== '00' ? m[5] : ''}` : ''; };
  const mostra = () => { box.hidden = false; };
  const alertas = pega(API + '/avisos/ativos', 'inmet-avisos', 15 * 60e3, d => {
    const out = [], vistos = new Set();
    for (const g of ['hoje', 'futuro']) for (const a of (d && d[g]) || []) {
      if (vistos.has(a.id)) continue; vistos.add(a.id);
      out.push({ d: String(a.descricao || ''), s: String(a.severidade || ''), c: String(a.aviso_cor || ''), i: a.inicio, f: a.fim,
        r: (a.riscos || []).map(String), n: (a.instrucoes || []).map(String), g: String(a.geocodes || '') });
    }
    return out;
  }).then(lista => {
    const meus = lista.filter(a => a.g.split(',').includes(cod));
    if (!meus.length) return;
    const caixa = novo('div', 'tempo-alertas'); caixa.setAttribute('role', 'region');
    caixa.setAttribute('aria-label', 'Alertas do INMET');
    caixa.append(novo('div', 'tempo-tit', `Alertas do INMET para ${box.dataset.nome || 'a cidade'}`));
    for (const a of meus) {
      const el = novo('details', 'alerta');
      if (/^#[0-9a-fA-F]{6}$/.test(a.c)) el.style.setProperty('--cor', a.c);
      const sm = novo('summary'); sm.append(novo('i', 'alerta-cor'), novo('b', '', a.d),
        novo('span', 'alerta-sev', a.s ? ' · ' + a.s.toLowerCase() : ''), novo('span', 'alerta-quando', `${quando(a.i)} até ${quando(a.f)}`));
      el.append(sm);
      if (a.r.length) el.append(novo('p', '', a.r.join(' ')));
      if (a.n.length) { const ul = novo('ul'); for (const t of a.n) ul.append(novo('li', '', t.trim())); el.append(ul); }
      caixa.append(el);
    }
    box.prepend(caixa); mostra();
  }).catch(() => {});
  pega(API + '/previsao/' + cod, 'inmet-prev-' + cod, 60 * 60e3, d => {
    const dias = (d && d[cod]) || {}, out = [];
    for (const [data, v] of Object.entries(dias)) {
      const p = v.tarde || v.manha || v;
      out.push({ data, sem: String(p.dia_semana || ''), max: p.temp_max, min: p.temp_min, res: String(p.resumo || ''), ic: icone(p.icone) });
    }
    return out.slice(0, 5);
  }).then(dias => {
    if (!dias.length) return;
    const prev = novo('div', 'tempo-prev');
    prev.append(novo('div', 'tempo-tit', 'Previsão do tempo para os próximos dias (INMET)'));
    const linha = novo('div', 'tempo-dias');
    dias.forEach((x, i) => {
      const el = novo('div', 'dia');
      const nome = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : (x.sem.split('-')[0] || x.data.slice(0, 5));
      el.append(novo('div', 'dia-nome', nome));
      if (x.ic) { const im = novo('img'); im.src = x.ic; im.alt = ''; im.width = 44; im.height = 44; el.append(im); }
      const t = novo('div', 'dia-temp');
      if (Number.isFinite(+x.max)) t.append(novo('b', '', `${Math.round(+x.max)}°`));
      if (Number.isFinite(+x.min)) t.append(novo('span', '', ` / ${Math.round(+x.min)}°`));
      el.append(t, novo('div', 'dia-res', x.res));
      linha.append(el);
    });
    prev.append(linha); box.append(prev); mostra();
  }).catch(() => {});
})();
