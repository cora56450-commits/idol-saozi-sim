// 界面：缩放、切屏、桌面、弹窗、横幅、调试面板
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function fit() {
    const st = $('#stage');
    const k = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    st.style.transform = `scale(${k})`;
  }
  window.addEventListener('resize', fit);

  const UI = {
    $, $$, esc,
    fit,
    show(id) {
      $$('.screen').forEach(s => s.classList.remove('on'));
      $('#' + id).classList.add('on');
    },

    // ---- 游戏内时钟（分钟）----
    clock() {
      const m = (window.Story && Story.ev && Story.storyMin != null) ? Story.storyMin : ((Game.S && Game.S.minutes) || 510);
      return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    },
    tick(min) { if (Game.S) { Game.S.minutes = Math.min(((Game.S.minutes) || 510) + min, 26 * 60 + 59); this.deskStats(); if (window.Phone && Phone.flushPending) Phone.flushPending(); } },

    // ---- 桌面 ----
    renderDesk() {
      const S = Game.S;
      $('#desk-bg').style.backgroundImage = `url(assets/desk/${S.role === 'staff' ? 'desk_staff' : 'desk'}.jpg)`;
      $('#cal-day').textContent = `第 ${S.day} 天`;
      $('#cal-date').textContent = Game.dateStr(S.day);
      $('#cal-phase').textContent = SCHEDULE.phaseOf(S.day);
      this.deskStats();
      this.updateBadge();
      this.show('scr-desk');
      if (!Story.ev) { Sound.deskBgm(); this.deskTour(); }
    },
    // 桌面常驻：现在几点、在干嘛、数值、往后过
    deskStats() {
      const S = Game.S, el = $('#desk-stats'); if (!S || !el) return;
      const bar = (k, v, cls) => `<div class="ds-row ${cls}"><span>${k}</span><i><b style="width:${v}%"></b></i><em>${v}</em></div>`;
      const nx = Game.nextSlot(), d = Game.pendingDate();
      el.innerHTML = `<div class="ds-time">${UI.clock()}<small>${esc(Game.workStatus().replace(/，.*$/, ''))}</small></div>
        ${d ? `<div class="ds-date">约好了 · ${esc(d.time)}${(d.who || '他') !== '他' ? ' · ' + esc(Game.whoName(d.who)) : ''}<small>${esc(d.place)}</small></div>`
          : (() => { const n = Game.nextDate(); return n ? `<div class="ds-date later">${esc(Game.dayWord(n.day))} ${esc(n.time)} · ${esc((n.who || '他') === '他' ? '他' : Game.whoName(n.who))}<small>${esc(n.place)}</small></div>` : ''; })()}
        ${bar('感情', S.aff, 'aff')}${bar('曝光', S.exp, 'exp')}${S.amb > 0 ? bar('暧昧', S.amb, 'amb') : ''}
        ${d && (!nx || d.min <= nx[0]) ? `<button class="ds-next" id="ds-next">${(d.who || '他') === '他' ? '等他来' : '去赴约'} ▸ ${esc(d.time)}</button>`
          : nx ? `<button class="ds-next" id="ds-next">往后过 ▸ ${Game.hhmm(nx[0])} ${esc(nx[1])}</button>` : `<div class="ds-late">今天很晚了，吃完便当睡觉吧</div>`}`;
      const b = $('#ds-next', el); if (b) b.onclick = () => Main.skipTime();
    },
    updateBadge() {
      const n = Phone.unreadTotal();
      const b = $('#desk-badge');
      b.textContent = n > 9 ? '9+' : n;
      b.classList.toggle('hidden', !n);
    },

    // ---- 加载提示 ----
    // 等 API 时：文字 + 跳动的点点点 + 已经等了几秒
    loading(on, text) {
      const el = $('#loading');
      el.classList.toggle('hidden', !on);
      clearInterval(this._lt);
      if (!on) return;
      const base = (text || el.dataset.base || '加载中').replace(/[.…]+$/, '');
      el.dataset.base = base;
      const t0 = Date.now(); let k = 0;
      const draw = () => { k = (k + 1) % 4; el.querySelector('span').textContent = `${base}${'·'.repeat(k || 1).padEnd(3, '\u2002')}  ${Math.floor((Date.now() - t0) / 1000)} 秒`; };
      draw(); this._lt = setInterval(draw, 400);
    },

    // ---- 手机横幅 ----
    notify(app, title, text, onClick) {
      const n = $('#notify');
      n.querySelector('.nb-icon').src = `assets/ui/app_${app}.png`;
      n.querySelector('b').textContent = title;
      n.querySelector('span').textContent = text;
      n.classList.remove('hidden');
      Sound.sfx(app === 'blink' ? 'bubble' : 'msg');
      n.onclick = () => { n.classList.add('hidden'); onClick && onClick(); };
      clearTimeout(this._nt);
      this._nt = setTimeout(() => n.classList.add('hidden'), 4200);
    },

    // ---- 速报（曝光危险）----
    alert(text) {
      const a = $('#alert');
      a.querySelector('.alert-text').textContent = text;
      a.classList.remove('hidden');
      Sound.sfx('alert');
      clearTimeout(this._at);
      this._at = setTimeout(() => a.classList.add('hidden'), 4500);
      a.onclick = () => a.classList.add('hidden');
    },

    // ---- 过场（撕纸条）----
    transition(title, sub, ms) {
      return new Promise(res => {
        const t = $('#transition');
        t.querySelector('span').innerHTML = esc(title) + (sub ? `<small>${esc(sub)}</small>` : '');
        t.classList.remove('hidden');
        Sound.sfx('tear');
        const done = () => { t.classList.add('hidden'); t.onclick = null; res(); };
        t.onclick = done;
        setTimeout(done, ms || 1800);
      });
    },

    // ---- 弹窗 ----
    modal(html, onMount, small) {
      const m = $('#modal');
      m.classList.toggle('small', !!small);
      $('#modal-inner').innerHTML = html;
      m.classList.remove('hidden');
      $('.modal-close', m).onclick = () => this.closeModal();
      $('.modal-dim', m).onclick = () => this.closeModal();
      onMount && onMount($('#modal-inner'));
    },
    closeModal() { $('#modal').classList.add('hidden'); },

    // 只有一个「知道了」按钮的提示框
    info(title, text) {
      this.modal(`<h2>${esc(title)}</h2><div class="form"><p class="info-text">${esc(text)}</p><div class="btns">
        <button class="btn-small primary" data-x="yes">知道了</button></div></div>`, null, true);
      return new Promise(res => { $('[data-x=yes]').onclick = () => { this.closeModal(); res(true); }; });
    },
    confirm(text, yes, no, body) {
      this.modal(`<h2>${esc(text)}</h2><div class="form">${body ? `<p class="info-text">${esc(body)}</p>` : ''}<div class="btns">
        <button class="btn-small" data-x="no">${esc(no || '再想想')}</button>
        <button class="btn-small primary" data-x="yes">${esc(yes || '确定')}</button></div></div>`, null, true);
      return new Promise(res => {
        $('[data-x=yes]').onclick = () => { this.closeModal(); res(true); };
        $('[data-x=no]').onclick = () => { this.closeModal(); res(false); };
      });
    },

    settingsModal() {
      const s = Game.settings();
      const inGame = !!Game.S;
      this.modal(`<h2>设置</h2><div class="form">
        <div class="row"><span>接口类型</span><select id="st-provider">
          <option value="openai">OpenAI 兼容（OpenAI / DeepSeek / 中转站）</option>
          <option value="anthropic">Anthropic（Claude）</option></select></div>
        <div class="row"><span>接口地址</span><input type="text" id="st-base" value="${esc(s.baseUrl)}"></div>
        <div class="hint">DeepSeek：接口类型选 OpenAI 兼容，地址填 https://api.deepseek.com/v1 ，模型填 deepseek-flash。Anthropic 地址可以留空。</div>
        <div class="row"><span>API Key</span><input type="password" id="st-key" value="${esc(s.apiKey)}"></div>
        <div class="row"><span>模型</span><input type="text" id="st-model" value="${esc(s.model)}"></div>
        <div class="row"><span>温度</span><input type="range" id="st-temp" min="0" max="1.3" step="0.05" value="${s.temperature}"><b id="st-temp-v">${s.temperature}</b></div>
        <div class="row"><span>音乐音量</span><input type="range" id="st-bgm" min="0" max="1" step="0.05" value="${s.bgm}"></div>
        <div class="row"><span>音效音量</span><input type="range" id="st-sfx" min="0" max="1" step="0.05" value="${s.sfx}"></div>
        ${inGame ? `<div class="row"><span>泡泡订阅</span><label><input type="checkbox" id="st-sub" ${Game.S.sub ? 'checked' : ''}> 订阅他的 BLINK</label></div>` : ''}
        <div class="btns"><button class="btn-small" id="st-tips">重新显示新手提示</button><button class="btn-small" id="st-test">测试连接</button><button class="btn-small primary" id="st-save">保存</button></div>
        <div class="hint" id="st-msg" style="margin-left:0;text-align:center"></div>
      </div>`, (root) => {
        $('#st-provider', root).value = s.provider;
        $('#st-temp', root).oninput = (e) => { $('#st-temp-v').textContent = e.target.value; };
        $('#st-bgm', root).oninput = (e) => { Game.saveSettings(Object.assign(Game.settings(), { bgm: +e.target.value })); Sound.setVolume(); };
        $('#st-sfx', root).oninput = (e) => { Game.saveSettings(Object.assign(Game.settings(), { sfx: +e.target.value })); Sound.sfx('msg'); };
        const read = () => ({ provider: $('#st-provider').value, baseUrl: $('#st-base').value.trim(), apiKey: $('#st-key').value.trim(),
          model: $('#st-model').value.trim(), temperature: +$('#st-temp').value, bgm: +$('#st-bgm').value, sfx: +$('#st-sfx').value });
        $('#st-save', root).onclick = () => {
          Game.saveSettings(Object.assign(Game.settings(), read()));
          if (inGame) { Game.S.sub = $('#st-sub').checked; }
          $('#st-msg').textContent = '已保存';
        };
        $('#st-tips', root).onclick = () => { this.resetTips(); $('#st-msg').textContent = '新手提示已重置'; };
        $('#st-test', root).onclick = async () => {
          Game.saveSettings(Object.assign(Game.settings(), read()));
          $('#st-msg').textContent = '连接中…';
          try { await API.test(); $('#st-msg').textContent = '连接成功'; }
          catch (e) { $('#st-msg').textContent = '连接失败：' + (e.message === 'NO_KEY' ? '还没填 API Key' : e.message); }
        };
      });
    },

    savesModal(mode) { // mode: 'save' | 'load'
      const slots = ['auto', '1', '2', '3'];
      const html = slots.map(k => {
        const p = Game.peek(k);
        const label = k === 'auto' ? '自动' : k;
        const info = p ? `<b>第 ${p.day} 天</b><span>${p.role === 'civ' ? '素人线' : '员工线'} · ${esc(p.nameZh || p.name)}</span><i>${new Date(p.savedAt).toLocaleString()}</i>` : '<span>空</span>';
        return `<div class="slot" data-slot="${k}"><div class="num">${label}</div><div class="info">${info}</div></div>`;
      }).join('');
      this.modal(`<h2>${mode === 'save' ? '存档' : '读档'}</h2><div class="slots">${html}</div>`, (root) => {
        $$('.slot', root).forEach(el => el.onclick = () => {
          const k = el.dataset.slot;
          if (mode === 'save') {
            if (k === 'auto') return;
            Game.save(k); this.savesModal('save');
          } else if (Game.peek(k)) {
            Game.load(k); this.closeModal(); Main.resume();
          }
        });
      });
    },

    albumMenu() {
      this.modal(`<h2>菜单</h2><div class="form"><div class="btns" style="flex-direction:column;align-items:center;gap:14px">
        <button class="btn-choice" data-m="save"><span>存档</span></button>
        <button class="btn-choice" data-m="load"><span>读档</span></button>
        <button class="btn-choice" data-m="settings"><span>设置（API / 音量 / 泡泡订阅）</span></button>
        <button class="btn-choice" data-m="title"><span>回到标题</span></button></div></div>`, (root) => {
        $$('[data-m]', root).forEach(b => b.onclick = () => {
          const m = b.dataset.m;
          if (m === 'save') this.savesModal('save');
          if (m === 'load') this.savesModal('load');
          if (m === 'settings') this.settingsModal();
          if (m === 'title') { Game.autosave(); this.closeModal(); Main.toTitle(); }
        });
      });
    },

    planModal() {
      const S = Game.S;
      const ev = EVENTS['day' + S.day];
      this.modal(`<h2>今日便签</h2><div class="plan-text">
        <div>${esc(Game.dateStr(S.day))} · ${esc(SCHEDULE.phaseOf(S.day))}</div>
        <div>他今天的行程：<b>${esc(SCHEDULE.todayPlan(S.day))}</b></div>
        <div style="margin-top:18px;font-size:17px;color:#8a8784">吃完便当 = 结束这一天<br>拍立得 = 结局回想　专辑 = 菜单　手机 = 手机</div>
        ${ev && !S.seen[ev.id] ? `<div style="margin-top:12px">今天会发生：${esc(ev.title)}</div>` : ''}
      </div>`);
    },

    galleryModal() {
      const G = Game.global(), g = G.endings || {}, cgs = G.cgs || {};
      const list = [['Love wins all', '公开'], ['If You', '被扒分手'], ['밤편지', '地下恋继续'], ['L.I.E', '他劈腿'], ['사랑과 전쟁', '你劈腿'], ['사랑이 잘', '和平分手']];
      const ecg = (s) => (CONFIG.ENDING_CG || {})[s];
      const evThumbs = CONFIG.EVENT_CG.map(c => cgs[c.img]
        ? `<div class="cg-thumb" data-cg="assets/cg/${c.img}.jpg" style="background-image:url(assets/cg/${c.img}_s.jpg)"><span>${esc(c.name)}</span></div>`
        : `<div class="cg-thumb locked"><span>?</span></div>`).join('');
      this.modal(`<h2>结局</h2><div class="gallery">${list.map(([s, n]) => `
        <div class="ending-card ${g[s] ? '' : 'locked'}" ${g[s] && ecg(s) ? `data-cg="${ecg(s)}"` : ''} style="${g[s] ? 'cursor:pointer' : ''}"><div class="ec-img" ${g[s] && ecg(s) ? `style="background-image:url(${ecg(s).replace('.jpg', '_s.jpg')})"` : ''}>${g[s] ? '' : '?'}</div>
        <div class="ec-text"><b>‘${esc(g[s] ? s : '？？？')}’</b>${g[s] ? `<em>${esc((CONFIG.ENDING_NAMES[s] || {}).zh || '')}</em>` : ''}<span>${g[s] ? esc(n) : '未达成'}</span></div></div>`).join('')}</div>
        <div class="gallery-sec">CG</div><div class="cg-grid">${evThumbs}</div>`, (root) => {
        $$('[data-cg]', root).forEach(el => el.onclick = () => {
          const v = $('#cg-view');
          v.querySelector('.cg-img').style.backgroundImage = `url(${el.dataset.cg})`;
          v.classList.remove('hidden');
          v.onclick = () => v.classList.add('hidden');
        });
      });
    },

    // ---- 新手提示（每个只弹一次）----
    // 第一次来到桌面：一个一个高亮桌上的东西，告诉玩家点它是干什么的
    deskTour() {
      const g = Game.global(); g.tips = g.tips || {};
      if (g.tips.desk) return Promise.resolve();
      g.tips.desk = 1; localStorage.setItem('idolsao_global', JSON.stringify(g));
      const steps = [
        ['.desk-calendar', '日历', '今天是第几天、几月几号、现在是什么时期（回归准备 / 打歌期 / 年末）。'],
        ['[data-hot=phone]', '手机', '最常用的地方：和他私聊、看他的泡泡、刷论坛和 InstaSnap。图标上有红点就是有新消息。'],
        ['[data-hot=note]', '便签', '他今天的行程。什么时候在录音、什么时候有空，看这里。'],
        ['[data-hot=album]', '专辑', '存档、读档和设置（API、音量）都在这里。'],
        ['[data-hot=polaroid]', '拍立得', '看过的结局和 CG 都收在这里，可以回想。'],
        ['[data-hot=bento]', '便当', '这一天玩够了就吃便当：结束今天，进入第二天。']
      ];
      const desk = $('#scr-desk');
      const ov = document.createElement('div'); ov.className = 'tour';
      ov.innerHTML = '<div class="tour-hole"></div><div class="tour-box"><b></b><p></p><div class="tour-foot"><span class="tour-n"></span><button class="btn-small primary">下一个</button></div></div>';
      desk.appendChild(ov);
      return new Promise(res => {
        let i = 0;
        const show = () => {
          const [sel, title, text] = steps[i];
          const el = desk.querySelector(sel);
          const W = desk.offsetWidth, H = desk.offsetHeight, pad = 10;
          // 按屏幕上的实际位置算（日历用了 transform 居中，offsetLeft 不准），再换回舞台坐标
          const dr = desk.getBoundingClientRect(), er = el.getBoundingClientRect(), k = dr.width / W;
          const x = (er.left - dr.left) / k - pad, y = (er.top - dr.top) / k - pad, w = er.width / k + pad * 2, h = er.height / k + pad * 2;
          Object.assign(ov.querySelector('.tour-hole').style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
          const box = ov.querySelector('.tour-box');
          box.querySelector('b').textContent = title; box.querySelector('p').textContent = text;
          ov.querySelector('.tour-n').textContent = `${i + 1} / ${steps.length}`;
          ov.querySelector('button').textContent = i === steps.length - 1 ? '开始吧' : '下一个';
          const bw = 420, right = x + w / 2 < W / 2;
          box.style.left = (right ? Math.min(x + w + 24, W - bw - 24) : Math.max(24, x - bw - 24)) + 'px';
          box.style.top = Math.max(24, Math.min(y + h / 2 - 90, H - 220)) + 'px';
        };
        ov.querySelector('button').onclick = (e) => {
          e.stopPropagation();
          if (++i >= steps.length) { ov.remove(); res(); } else show();
        };
        show();
      });
    },

    tip(key) {
      const g = Game.global(); g.tips = g.tips || {};
      if (g.tips[key] || !TIPS[key]) return Promise.resolve();
      g.tips[key] = 1; localStorage.setItem('idolsao_global', JSON.stringify(g));
      return new Promise(res => {
        $('#tip-title').textContent = TIPS[key][0];
        $('#tip-text').textContent = TIPS[key][1];
        $('#tip').classList.remove('hidden');
        $('#tip-ok').onclick = () => { $('#tip').classList.add('hidden'); res(); };
      });
    },
    resetTips() { const g = Game.global(); g.tips = {}; localStorage.setItem('idolsao_global', JSON.stringify(g)); },

    // ---- 调试（Shift + D）----
    debugToggle() { $('#debug').classList.toggle('hidden'); this.debugRefresh(); },
    debugRefresh() {
      const d = $('#debug');
      if (d.classList.contains('hidden') || !Game.S) return;
      const S = Game.S;
      d.innerHTML = `第${S.day}天 ${this.clock()}　感情 ${S.aff}　曝光 ${S.exp}　暧昧 ${S.amb}<br>
        心结① ${S.flags.knot1 ? '✔' : '✘'} ② ${S.flags.knot2 ? '✔' : '✘'}　劈腿线 ${S.flags.cheat ? '是' : '否'}　今日聊天 Δ ${S.dayDelta.aff}/${S.dayDelta.exp}<br>
        <button data-d="aff+">感情+10</button><button data-d="aff-">感情-10</button><button data-d="exp+">曝光+10</button><button data-d="exp-">曝光-10</button><button data-d="amb+">暧昧+10</button><br>
        跳到第 <input id="dbg-day" type="number" min="1" max="90" value="${S.day}"> 天 <button data-d="jump">跳</button> <button data-d="ev">重播今天事件</button>`;
      $$('[data-d]', d).forEach(b => b.onclick = () => {
        const k = b.dataset.d;
        if (k === 'aff+') S.aff = Math.min(100, S.aff + 10);
        if (k === 'aff-') S.aff = Math.max(0, S.aff - 10);
        if (k === 'exp+') S.exp = Math.min(100, S.exp + 10);
        if (k === 'exp-') S.exp = Math.max(0, S.exp - 10);
        if (k === 'amb+') S.amb = Math.min(100, S.amb + 10);
        if (k === 'jump') { S.day = Math.max(1, Math.min(90, +$('#dbg-day').value)); Main.startDay(); }
        if (k === 'ev') { delete S.seen['day' + S.day]; Main.startDay(); }
        this.debugRefresh(); this.deskStats();
      });
    }
  };

  window.UI = UI;
  document.addEventListener('keydown', (e) => { if (e.shiftKey && e.key.toLowerCase() === 'd') UI.debugToggle(); });
})();
