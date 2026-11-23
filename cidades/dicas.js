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
