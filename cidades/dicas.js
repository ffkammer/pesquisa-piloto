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
