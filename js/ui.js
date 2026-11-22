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
      const m = (Game.S && Game.S.minutes) || 600;
      return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    },
    tick(min) { if (Game.S) Game.S.minutes = Math.min(((Game.S.minutes) || 600) + min, 23 * 60 + 59); },

    // ---- 桌面 ----
    renderDesk() {
      const S = Game.S;
      $('#desk-bg').style.backgroundImage = `url(assets/desk/${S.role === 'staff' ? 'desk_staff' : 'desk'}.jpg)`;
      $('#cal-day').textContent = `第 ${S.day} 天`;
      $('#cal-date').textContent = Game.dateStr(S.day);
      $('#cal-phase').textContent = SCHEDULE.phaseOf(S.day);
      this.updateBadge();
      this.show('scr-desk');
      if (!Story.ev) { Sound.deskBgm(); this.tip('desk'); }
    },
    updateBadge() {
      const n = Phone.unreadTotal();
      const b = $('#desk-badge');
      b.textContent = n > 9 ? '9+' : n;
      b.classList.toggle('hidden', !n);
    },

    // ---- 加载提示 ----
    loading(on, text) {
      $('#loading').classList.toggle('hidden', !on);
      if (text) $('#loading span').textContent = text;
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
    modal(html, onMount) {
      const m = $('#modal');
      $('#modal-inner').innerHTML = html;
      m.classList.remove('hidden');
      $('.modal-close', m).onclick = () => this.closeModal();
      $('.modal-dim', m).onclick = () => this.closeModal();
      onMount && onMount($('#modal-inner'));
    },
    closeModal() { $('#modal').classList.add('hidden'); },

    confirm(text, yes, no) {
      this.modal(`<h2>${esc(text)}</h2><div class="form"><div class="btns">
        <button class="btn-small" data-x="no">${esc(no || '再想想')}</button>
        <button class="btn-small primary" data-x="yes">${esc(yes || '确定')}</button></div></div>`);
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
        const info = p ? `<b>第 ${p.day} 天</b><span>${p.role === 'civ' ? '素人线' : '员工线'} · ${esc(p.name)}</span><i>${new Date(p.savedAt).toLocaleString()}</i>` : '<span>空</span>';
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
        <div class="ec-text"><b>‘${esc(g[s] ? s : '？？？')}’</b><span>${g[s] ? esc(n) : '未达成'}</span></div></div>`).join('')}</div>
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
        this.debugRefresh();
      });
    }
  };

  window.UI = UI;
  document.addEventListener('keydown', (e) => { if (e.shiftKey && e.key.toLowerCase() === 'd') UI.debugToggle(); });
})();
