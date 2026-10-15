(() => {
  'use strict';

  // ---------- game data ----------
  // time is in seconds; every harvest yields CROP_YIELD items.
  const CROP_YIELD = 2;
  const CROPS = [
    { id: 'strawberry', name: 'Strawberry', plural: 'strawberries', emoji: '🍓', cost: 2, time: 20, sell: 3, xp: 1, level: 1 },
    { id: 'carrot', name: 'Carrot', plural: 'carrots', emoji: '🥕', cost: 5, time: 60, sell: 6, xp: 2, level: 1 },
    { id: 'sunflower', name: 'Sunflower', plural: 'sunflowers', emoji: '🌻', cost: 10, time: 180, sell: 11, xp: 3, level: 2 },
    { id: 'corn', name: 'Corn', plural: 'corn', emoji: '🌽', cost: 15, time: 360, sell: 17, xp: 4, level: 3 },
    { id: 'pumpkin', name: 'Pumpkin', plural: 'pumpkins', emoji: '🎃', cost: 25, time: 900, sell: 30, xp: 6, level: 4 },
    { id: 'rose', name: 'Rose', plural: 'roses', emoji: '🌹', cost: 40, time: 1800, sell: 48, xp: 8, level: 5 },
    { id: 'tulip', name: 'Tulip', plural: 'tulips', emoji: '🌷', cost: 60, time: 3600, sell: 75, xp: 12, level: 6 },
    { id: 'cherry', name: 'Cherries', plural: 'cherries', emoji: '🍒', cost: 80, time: 7200, sell: 105, xp: 16, level: 7 },
    { id: 'grapes', name: 'Grapes', plural: 'grapes', emoji: '🍇', cost: 120, time: 14400, sell: 160, xp: 24, level: 8 },
  ];
  const CROP = Object.fromEntries(CROPS.map(c => [c.id, c]));

  const TOTAL_PLOTS = 12;
  const START_PLOTS = 6;
  const ORDER_SLOTS = 3;
  const ORDER_COOLDOWN = 20; // seconds before a new order arrives
  const CUSTOMERS = [
    ['🧁', 'Royal Baker'], ['🧚', 'Fairy Godmother'], ['👩‍🍳', 'Palace Chef'],
    ['🦄', 'Unicorn Stable'], ['🤴', 'Prince Daniel'], ['🐰', 'Bunny Burrow'],
    ['🧜‍♀️', 'Mermaid Cove'], ['🐶', 'Royal Puppies'], ['🦋', 'Butterfly Garden'],
    ['👑', 'The Queen'], ['🐴', 'Pony Meadow'], ['🍰', 'Tea Party Club'],
  ];
  const IDLE_LINES = [
    'What a lovely day in the garden! 🌸',
    'The flowers smell so sweet today.',
    'I wonder what the kingdom needs next? 📜',
    'Gardening is my favorite thing ever 💕',
    'Look at all these cozy little plots!',
    'A princess always takes time to smell the roses 🌹',
  ];

  function xpToNext(level) { return 8 + level * level * 4; }
  function plotPrice(owned) { return Math.round(25 * Math.pow(1.6, owned - START_PLOTS)); }

  // ---------- state ----------
  const SAVE_KEY = 'annika-garden-v1';
  const now = () => Date.now();

  function freshState() {
    return {
      v: 1,
      name: 'Annika',
      coins: 30,
      level: 1,
      xp: 0,
      look: {},
      plots: Array.from({ length: TOTAL_PLOTS }, (_, i) => ({ s: i < START_PLOTS ? 'empty' : 'locked' })),
      basket: {},
      orders: [],
      seed: 'strawberry',
      stats: { harvested: 0, orders: 0, earned: 0 },
      intro: false,
      lastGift: '',
      lastPlay: now(),
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return freshState();
      const data = JSON.parse(raw);
      const base = freshState();
      const s = Object.assign(base, data);
      s.stats = Object.assign(freshState().stats, data.stats || {});
      while (s.plots.length < TOTAL_PLOTS) s.plots.push({ s: 'locked' });
      return s;
    } catch (e) {
      return freshState();
    }
  }

  let state = load();
  function save() {
    state.lastPlay = now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
  }

  // ---------- helpers ----------
  const $ = id => document.getElementById(id);
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const unlockedCrops = () => CROPS.filter(c => c.level <= state.level);
  const ownedPlots = () => state.plots.filter(p => p.s !== 'locked').length;

  function fmtTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60), s = sec % 60;
    if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60), mm = m % 60;
    return mm ? `${h}h ${mm}m` : `${h}h`;
  }

  function plotProgress(p) {
    const crop = CROP[p.c];
    const elapsed = (now() - p.t) / 1000;
    return { crop, elapsed, left: crop.time - elapsed, frac: Math.min(1, elapsed / crop.time) };
  }

  // ---------- feedback ----------
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  function floatText(el, text, color) {
    const r = el.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'float';
    f.textContent = text;
    f.style.left = `${r.left + r.width / 2}px`;
    f.style.top = `${r.top + r.height * 0.2}px`;
    if (color) f.style.color = color;
    $('fx').appendChild(f);
    setTimeout(() => f.remove(), 1000);
  }

  function sparkles(el, n = 6) {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'sparkle';
      s.textContent = rand(['✨', '💖', '⭐', '🌸']);
      s.style.left = `${r.left + r.width / 2 - 8}px`;
      s.style.top = `${r.top + r.height / 2 - 8}px`;
      const ang = (Math.PI * 2 * i) / n;
      s.style.setProperty('--dx', `${Math.cos(ang) * 40}px`);
      s.style.setProperty('--dy', `${Math.sin(ang) * 40}px`);
      $('fx').appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  }

  function confetti() {
    const colors = ['#f7a8c8', '#b9a6ef', '#8fd3ad', '#ffd36e', '#9ad7f5', '#ffb4a2'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = `${Math.random() * 100}vw`;
      c.style.background = rand(colors);
      c.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
      c.style.animationDelay = `${Math.random() * 0.4}s`;
      c.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
      c.style.setProperty('--rot', `${Math.random() * 720}deg`);
      $('fx').appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }
  }

  let bubbleTimer = null;
  function say(text, ms = 3800) {
    const b = $('bubble');
    b.textContent = text;
    b.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => b.classList.remove('show'), ms);
  }

  function princessHop() {
    const p = $('scenePrincess');
    p.classList.remove('happy');
    void p.offsetWidth;
    p.classList.add('happy');
  }

  function bumpCoins() {
    const c = $('coinBox');
    c.classList.remove('bump');
    void c.offsetWidth;
    c.classList.add('bump');
  }

  // ---------- economy ----------
  function addCoins(n) {
    state.coins += n;
    if (n > 0) state.stats.earned += n;
    bumpCoins();
  }

  function addXp(n) {
    state.xp += n;
    let leveled = false;
    while (state.xp >= xpToNext(state.level)) {
      state.xp -= xpToNext(state.level);
      state.level += 1;
      leveled = true;
      const unlocked = CROPS.filter(c => c.level === state.level);
      setTimeout(() => showLevelUp(state.level, unlocked), 500);
    }
    if (leveled) renderSeeds();
  }

  // ---------- garden ----------
  const plotEls = [];
  const plotKeys = [];

  function buildGarden() {
    const g = $('garden');
    g.innerHTML = '';
    state.plots.forEach((_, i) => {
      const el = document.createElement('button');
      el.className = 'plot';
      el.addEventListener('click', () => onPlotTap(i));
      g.appendChild(el);
      plotEls[i] = el;
      plotKeys[i] = '';
    });
    renderGarden();
  }

  function renderGarden() {
    const firstLocked = state.plots.findIndex(p => p.s === 'locked');
    state.plots.forEach((p, i) => {
      const el = plotEls[i];
      let key, cls, html;
      if (p.s === 'locked') {
        if (i === firstLocked) {
          key = `locked-buy-${ownedPlots()}`;
          cls = 'plot locked';
          html = `<span class="lock">🔒</span><span>🪙 ${plotPrice(ownedPlots())}</span>`;
        } else {
          key = 'locked';
          cls = 'plot locked';
          html = `<span class="lock">🔒</span>`;
        }
      } else if (p.s === 'empty') {
        key = `empty-${!!state.seed}`;
        cls = 'plot empty' + (state.seed ? ' can-plant' : '');
        html = `<span class="plus">+</span>`;
      } else {
        const { crop, frac } = plotProgress(p);
        if (frac >= 1) {
          key = `ready-${p.c}`;
          cls = 'plot ready';
          html = `<span class="crop">${crop.emoji}</span><span class="ready-tag">Ready!</span>`;
        } else {
          const stage = frac < 0.34 ? 0 : frac < 0.67 ? 1 : 2;
          key = `grow-${p.c}-${stage}`;
          cls = `plot growing stage-${stage}`;
          const look = stage === 0 ? '🌱' : crop.emoji;
          html = `<span class="crop">${look}</span><span class="timer"><i></i></span>`;
        }
      }
      if (plotKeys[i] !== key) {
        el.className = cls;
        el.innerHTML = html;
        plotKeys[i] = key;
      }
      if (p.s === 'growing') {
        const bar = el.querySelector('.timer i');
        if (bar) bar.style.width = `${plotProgress(p).frac * 100}%`;
      }
    });
  }

  function onPlotTap(i) {
    const p = state.plots[i];
    const el = plotEls[i];

    if (p.s === 'locked') {
      const first = state.plots.findIndex(q => q.s === 'locked');
      if (i !== first) { toast('Unlock the plots in order 🌿'); return; }
      const price = plotPrice(ownedPlots());
      openSheet(`
        <h3>🌿 New garden plot</h3>
        <p>Expand Princess ${esc(state.name)}'s garden for <b>🪙 ${price}</b>?</p>
        <div class="stack">
          <button class="btn mint" id="buyPlot" ${state.coins < price ? 'disabled' : ''}>${state.coins < price ? `Need ${price - state.coins} more coins` : 'Buy plot'}</button>
          <button class="btn soft" data-close>Not now</button>
        </div>`);
      const buy = $('buyPlot');
      if (buy) buy.onclick = () => {
        if (state.coins < price) return;
        addCoins(-price);
        p.s = 'empty';
        closeSheet();
        save(); renderAll();
        sparkles(el, 8);
        say('A brand new plot! 🌿');
      };
      return;
    }

    if (p.s === 'empty') {
      if (!state.seed) { toast('Pick a seed below first 🌱'); return; }
      const crop = CROP[state.seed];
      if (state.coins < crop.cost) { toast(`You need 🪙 ${crop.cost} for ${crop.name} seeds`); return; }
      addCoins(-crop.cost);
      p.s = 'growing'; p.c = crop.id; p.t = now();
      floatText(el, `-${crop.cost} 🪙`, '#c0647d');
      save(); renderAll();
      return;
    }

    const { crop, left } = plotProgress(p);
    if (left > 0) {
      toast(`${crop.emoji} ${crop.name} ready in ${fmtTime(left)}`);
      return;
    }

    // harvest
    state.basket[crop.id] = (state.basket[crop.id] || 0) + CROP_YIELD;
    state.stats.harvested += CROP_YIELD;
    p.s = 'empty'; delete p.c; delete p.t;
    floatText(el, `+${CROP_YIELD} ${crop.emoji}`);
    sparkles(el, 5);
    addXp(crop.xp);
    if (Math.random() < 0.25) say(rand([`Yay, ${crop.plural}! 💕`, 'What a lovely harvest!', 'Into the basket you go! 🧺']));
    save(); renderAll();
  }

  // ---------- seeds ----------
  function renderSeeds() {
    const bar = $('seedbar');
    bar.innerHTML = '';
    CROPS.forEach(c => {
      const locked = c.level > state.level;
      const b = document.createElement('button');
      b.className = 'seed' + (state.seed === c.id ? ' selected' : '') + (locked ? ' locked' : '') + (!locked && state.coins < c.cost ? ' poor' : '');
      b.innerHTML = `<span class="emoji">${c.emoji}</span><span class="label">${c.name}</span>` +
        (locked ? `<span class="meta">🔒 Lv ${c.level}</span>` : `<span class="meta">🪙${c.cost} · ${fmtTime(c.time)}</span>`);
      b.onclick = () => {
        if (locked) { toast(`${c.emoji} ${c.name} unlocks at level ${c.level}`); return; }
        state.seed = state.seed === c.id ? null : c.id;
        save(); renderSeeds(); renderGarden();
      };
      bar.appendChild(b);
    });
  }

  // ---------- basket ----------
  function renderBasket() {
    const box = $('basket');
    const items = CROPS.filter(c => state.basket[c.id] > 0);
    if (!items.length) {
      box.innerHTML = `<div class="card empty-note"><span class="big">🧺</span>Your basket is empty.<br>Harvest crops in the garden to fill it!</div>`;
      return;
    }
    box.innerHTML = '';
    items.forEach(c => {
      const n = state.basket[c.id];
      const card = document.createElement('div');
      card.className = 'card basket-item';
      card.innerHTML = `
        <span class="emoji">${c.emoji}</span>
        <span class="info"><b>${c.name} × ${n}</b><span>🪙 ${c.sell} each</span></span>
        <span class="btn-row">
          <button class="btn soft" data-one>Sell 1</button>
          <button class="btn" data-all>All 🪙${c.sell * n}</button>
        </span>`;
      card.querySelector('[data-one]').onclick = e => sell(c, 1, e.currentTarget);
      card.querySelector('[data-all]').onclick = e => sell(c, state.basket[c.id], e.currentTarget);
      box.appendChild(card);
    });
  }

  function sell(crop, n, el) {
    n = Math.min(n, state.basket[crop.id] || 0);
    if (!n) return;
    state.basket[crop.id] -= n;
    if (state.basket[crop.id] <= 0) delete state.basket[crop.id];
    const earned = n * crop.sell;
    addCoins(earned);
    floatText(el, `+${earned} 🪙`, '#c48a10');
    save(); renderAll();
  }

  // ---------- orders ----------
  function makeOrder() {
    const pool = unlockedCrops();
    const kinds = Math.min(pool.length, state.level < 2 ? 1 : randInt(1, 3));
    const picks = [...pool].sort(() => Math.random() - 0.5).slice(0, kinds);
    const needs = {};
    let value = 0, xp = 0;
    picks.forEach(c => {
      const qty = c.time <= 60 ? randInt(2, 5) : c.time <= 900 ? randInt(1, 3) : randInt(1, 2);
      needs[c.id] = qty;
      value += c.sell * qty;
      xp += c.xp * qty;
    });
    const [emoji, who] = rand(CUSTOMERS);
    return {
      id: Math.random().toString(36).slice(2, 9),
      emoji, who, needs,
      coins: Math.round(value * 1.6) + 5,
      xp: Math.max(2, Math.round(xp * 0.9)),
    };
  }

  function fillOrders() {
    let changed = false;
    while (state.orders.length < ORDER_SLOTS) { state.orders.push(makeOrder()); changed = true; }
    state.orders.forEach((o, i) => {
      if (o.wait && now() >= o.wait) { state.orders[i] = makeOrder(); changed = true; }
    });
    return changed;
  }

  function canFill(o) {
    return !o.wait && Object.entries(o.needs).every(([id, q]) => (state.basket[id] || 0) >= q);
  }

  function renderOrders() {
    const box = $('orders');
    box.innerHTML = '';
    state.orders.forEach((o, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      if (o.wait) {
        card.innerHTML = `<div class="order-wait">🕊️ A new order is on its way… <b data-wait="${i}">${fmtTime((o.wait - now()) / 1000)}</b></div>`;
        box.appendChild(card);
        return;
      }
      const needs = Object.entries(o.needs).map(([id, q]) => {
        const have = state.basket[id] || 0;
        return `<span class="need ${have >= q ? 'have' : ''}">${CROP[id].emoji} ${q} <small>(${Math.min(have, q)}/${q})</small></span>`;
      }).join('');
      const ok = canFill(o);
      card.innerHTML = `
        <div class="order-head"><span class="who">${o.emoji}</span><span><b>${o.who}</b><span>would love some crops!</span></span></div>
        <div class="order-needs">${needs}</div>
        <div class="order-foot">
          <span class="reward">🪙 ${o.coins} <small>+ ${o.xp} ⭐</small></span>
          <span class="btn-row">
            <button class="btn soft" data-skip>Skip</button>
            <button class="btn mint" data-send ${ok ? '' : 'disabled'}>Deliver</button>
          </span>
        </div>`;
      card.querySelector('[data-send]').onclick = e => deliver(i, e.currentTarget);
      card.querySelector('[data-skip]').onclick = () => {
        state.orders[i] = { wait: now() + ORDER_COOLDOWN * 1000 };
        save(); renderAll();
      };
      box.appendChild(card);
    });
  }

  function deliver(i, el) {
    const o = state.orders[i];
    if (!o || !canFill(o)) return;
    Object.entries(o.needs).forEach(([id, q]) => {
      state.basket[id] -= q;
      if (state.basket[id] <= 0) delete state.basket[id];
    });
    addCoins(o.coins);
    floatText(el, `+${o.coins} 🪙`, '#c48a10');
    sparkles(el, 8);
    state.stats.orders += 1;
    state.orders[i] = { wait: now() + ORDER_COOLDOWN * 1000 };
    addXp(o.xp);
    toast(`${o.emoji} ${o.who} says thank you! 💕`);
    princessHop();
    save(); renderAll();
  }

  // ---------- header ----------
  function renderHeader() {
    $('princessName').textContent = state.name;
    $('levelNum').textContent = state.level;
    $('coinNum').textContent = state.coins;
    $('xpFill').style.width = `${(state.xp / xpToNext(state.level)) * 100}%`;
    const basketCount = Object.values(state.basket).reduce((a, b) => a + b, 0);
    setBadge('basketBadge', basketCount);
    setBadge('ordersBadge', state.orders.filter(canFill).length);
  }

  function setBadge(id, n) {
    const b = $(id);
    b.textContent = n > 99 ? '99+' : n;
    b.classList.toggle('show', n > 0);
  }

  function renderPrincess() {
    $('avatarSmall').innerHTML = princessSVG(state.look, { avatar: true });
    $('scenePrincess').innerHTML = princessSVG(state.look);
  }

  let currentView = 'garden';
  function renderAll() {
    renderHeader();
    renderGarden();
    renderSeeds();
    if (currentView === 'basket') renderBasket();
    if (currentView === 'orders') renderOrders();
  }

  // ---------- sheet ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function openSheet(html) {
    const sh = $('sheet');
    sh.innerHTML = html;
    sh.querySelectorAll('[data-close]').forEach(b => b.onclick = closeSheet);
    $('sheetBackdrop').classList.add('show');
    sh.classList.add('show');
  }
  function closeSheet() {
    $('sheetBackdrop').classList.remove('show');
    $('sheet').classList.remove('show');
    if (document.activeElement) document.activeElement.blur();
  }
  $('sheetBackdrop').onclick = closeSheet;

  function showLevelUp(level, unlocked) {
    confetti();
    princessHop();
    const list = unlocked.length
      ? `<p>New seeds: ${unlocked.map(c => `<b>${c.emoji} ${c.name}</b>`).join(', ')}</p>`
      : `<p>Your garden is growing beautifully!</p>`;
    openSheet(`
      <div class="big-princess">${princessSVG(state.look)}</div>
      <h3>🎉 Level ${level}!</h3>
      ${list}
      <button class="btn" data-close>Hooray!</button>`);
  }

  function showSettings() {
    openSheet(`
      <div class="big-princess">${princessSVG(state.look)}</div>
      <h3>Princess ${esc(state.name)}</h3>
      <div class="stats">
        <div class="stat"><b>${state.stats.harvested}</b>crops harvested</div>
        <div class="stat"><b>${state.stats.orders}</b>orders delivered</div>
      </div>
      <label for="nameInput">Princess name</label>
      <input id="nameInput" maxlength="16" value="${esc(state.name)}" autocomplete="off" autocapitalize="words">
      <button class="btn" id="saveName">Save</button>
      <button class="link-btn" id="resetGame">Start a new garden</button>`);
    $('saveName').onclick = () => {
      const v = $('nameInput').value.trim();
      if (v) state.name = v;
      save(); renderAll(); closeSheet();
      say(`Hello, I'm Princess ${state.name}! 👑`);
    };
    $('resetGame').onclick = () => {
      openSheet(`
        <h3>Start over?</h3>
        <p>This clears all coins, crops and levels. It can't be undone.</p>
        <div class="stack">
          <button class="btn soft" data-close>Keep my garden</button>
          <button class="btn" id="confirmReset">Yes, start over</button>
        </div>`);
      $('confirmReset').onclick = () => {
        state = freshState();
        fillOrders();
        save(); closeSheet(); renderPrincess(); renderAll();
        runIntro();
      };
    };
  }
  $('princessChip').onclick = showSettings;

  // ---------- tabs ----------
  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => {
      currentView = t.dataset.view;
      document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
      document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${currentView}`));
      renderAll();
    };
  });

  // ---------- intro & daily gift ----------
  function runIntro() {
    const lines = [
      `Welcome to my castle garden! I'm Princess ${state.name} 👑`,
      'Tap a seed below, then tap a plot to plant it 🌱',
      'When crops are ready, tap to harvest, then fill orders for coins!',
    ];
    lines.forEach((l, i) => setTimeout(() => say(l, 4200), 600 + i * 4400));
    state.intro = true;
    save();
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function checkDailyGift() {
    const key = todayKey();
    if (state.lastGift === key) return false;
    const first = !state.lastGift;
    state.lastGift = key;
    if (first) { save(); return false; }
    const gift = 10 + state.level * 5;
    addCoins(gift);
    setTimeout(() => toast(`🎁 Daily gift: +${gift} coins!`), 800);
    save();
    return true;
  }

  function welcomeBack() {
    const away = now() - state.lastPlay;
    const ready = state.plots.filter(p => p.s === 'growing' && plotProgress(p).frac >= 1).length;
    if (away > 2 * 60 * 1000 && ready) {
      setTimeout(() => say(`Welcome back! ${ready} ${ready === 1 ? 'plot is' : 'plots are'} ready to harvest 🌸`), 700);
    } else if (away > 2 * 60 * 1000) {
      setTimeout(() => say(`Welcome back! 💕`), 700);
    }
  }

  // ---------- loop ----------
  function tick() {
    renderGarden();
    if (fillOrders()) { save(); renderHeader(); if (currentView === 'orders') renderOrders(); }
    if (currentView === 'orders') {
      document.querySelectorAll('[data-wait]').forEach(el => {
        const o = state.orders[+el.dataset.wait];
        if (o && o.wait) el.textContent = fmtTime((o.wait - now()) / 1000);
      });
    }
  }

  let idleTimer = null;
  function scheduleIdleChat() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (currentView === 'garden' && !$('sheet').classList.contains('show')) say(rand(IDLE_LINES));
      scheduleIdleChat();
    }, 45000 + Math.random() * 30000);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
    else { welcomeBack(); checkDailyGift(); renderAll(); }
  });
  window.addEventListener('pagehide', save);

  // ---------- start ----------
  $('castle').innerHTML = castleSVG();
  renderPrincess();
  fillOrders();
  buildGarden();
  checkDailyGift();
  renderAll();
  if (!state.intro) runIntro(); else welcomeBack();
  save();
  setInterval(tick, 1000);
  scheduleIdleChat();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
