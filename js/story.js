// 固定事件播放器：线下事件用 gal 对话框，手机事件在手机里一条条弹出
(function () {
  const { $, esc } = UI;
  const N = (who) => (CONFIG.NAMES[who] || who);

  const Story = {
    ev: null, mode: 'gal', log: [], waiter: null,

    async play(id) {
      const ev = EVENTS[id];
      if (!ev) return;
      this.ev = ev; this.log = []; this._cgShown = {}; this.cgOn = false;
      document.querySelector('#alert').classList.add('hidden');
      this.mode = ev.mode;
      const S = Game.S;
      if (ev.kind === 'event') await UI.transition(ev.day === 1 ? '序章' : `第 ${ev.day} 天`, ev.title.replace(/（.*?）$/, ''));
      if (this.mode === 'gal') {
        this.setBg(this.bgFor(ev.id));
        $('#scene-sprite').style.display = 'none';
        $('#scene-cg').classList.remove('on');
        $('#scene-section').innerHTML = '';
        $('#choices').innerHTML = '';
        UI.show('scr-scene');
      } else {
        UI.renderDesk();
        Phone.openStory(ev.kind === 'event' ? ev.title.replace(/（.*?）$/, '') : ev.title);
      }
      if (ev.kind === 'ending' && CONFIG.ENDING_CG[ev.id.slice(4)]) this.setCG(CONFIG.ENDING_CG[ev.id.slice(4)], true);
      await this.run(ev.blocks);
      if (this.mode === 'phone') Phone.closeStory();
      if (ev.kind === 'event') S.seen[ev.id] = true;
      this.ev = null;
    },

    bgFor(key) {
      let b = CONFIG.SCENE_BG[key];
      if (b && typeof b === 'object') b = b[Game.S.role];
      return b ? `assets/bg/${b}.jpg` : `assets/desk/${Game.S.role === 'staff' ? 'desk_staff' : 'desk'}.jpg`;
    },
    setBg(url) { $('#scene-bg').style.backgroundImage = `url(${url})`; $('#scene-cg').classList.remove('on'); },

    // ---- 立绘 ----
    spriteFor(b) {
      let key = CONFIG.SPRITES[b.who];
      const o = (CONFIG.EVENT_OUTFIT[this.ev.id] || {})[b.who];
      if (o) key = typeof o === 'object' ? o[Game.S.role] : o;
      if (!key) return null;
      let file = key;
      const X = CONFIG.EXPRESSIONS;
      if (b.who === '他' && key === X.base && b.zh) {
        const r = X.rules.find(([, re]) => new RegExp(re).test(b.zh));
        if (r) file = key + '_' + r[0];
      }
      return { def: CONFIG.SPRITE_DEFS[key], file: `assets/char/${file}.png` };
    },
    showSprite(b) {
      const img = $('#scene-sprite');
      const sp = this.cgOn ? null : this.spriteFor(b);
      if (!sp || !sp.def) { img.style.display = 'none'; return; }
      const d = sp.def, K = CONFIG.SPRITE_SCALE;
      const E = 12 * K.pxPerCm * (d.female ? 0.93 : 1);
      const sc = E / (d.chin - d.eye) * (d.adj || 1);
      const eyeY = K.baseEyeY + (K.refHeight - d.h) * K.pxPerCm + (d.dy || 0);
      img.style.width = (864 * sc) + 'px'; img.style.height = (1152 * sc) + 'px';
      img.style.left = (K.centerX - d.cx * sc) + 'px';
      img.style.top = (eyeY - d.eye * sc) + 'px';
      img.onerror = () => { img.style.display = 'none'; };
      if (!img.src.endsWith(sp.file)) img.src = sp.file;
      img.style.display = 'block';
    },

    // ---- CG ----
    setCG(src, keepSprite) {
      const c = $('#scene-cg');
      c.style.backgroundImage = `url(${src})`; c.classList.add('on');
      if (!keepSprite) $('#scene-sprite').style.display = 'none';
      this.cgOn = true;
    },
    async showCG(img) {
      const src = `assets/cg/${img}.jpg`;
      Game.markCG(img);
      if (this.mode === 'gal') { this.setCG(src); return; }
      const v = $('#cg-view');
      v.querySelector('.cg-img').style.backgroundImage = `url(${src})`;
      v.classList.remove('hidden');
      await new Promise(res => { v.onclick = () => { v.classList.add('hidden'); res(); }; });
    },
    async cgByMatch(b) {
      const txt = b.text || b.ko || b.zh || '';
      if (!txt) return;
      const c = CONFIG.EVENT_CG.find(c => c.ev === this.ev.id && c.match && txt.includes(c.match) && (!c.role || c.role === Game.S.role));
      if (c && !this._cgShown[c.img]) { this._cgShown[c.img] = true; await this.showCG(c.img); }
    },

    async run(blocks) {
      for (const b of blocks) {
        if (!Game.check(b.if)) continue;
        await this.cgByMatch(b);
        switch (b.t) {
          case 'note': break;
          case 'fx': Game.applyFx(b.fx, 'event'); break;
          case 'section': this.section(b.text); break;
          case 'nar': case 'say': case 'me': case 'photo':
            this.show(b); this.logLine(b); await this.wait(); break;
          case 'freechat': await this.freeChat(b); break;
          case 'freepost': await this.freePost(); break;
          case 'choice': await this.choice(b); break;
        }
      }
    },

    logLine(b) {
      const t = b.t === 'say' ? `${N(b.who)}：${b.ko}（${b.zh}）` : b.t === 'me' ? `玩家：${b.zh}` : b.t === 'photo' ? `${N(b.who)} 发来一张照片` : b.text;
      this.log.push(t); if (this.log.length > 24) this.log.shift();
      // 手机事件里的台词同步进聊天记录
      if (this.mode === 'phone' && (b.t === 'say' || b.t === 'me' || b.t === 'photo')) {
        const map = { '他': 'he', '东旻': (Game.S.day >= 12 ? 'group' : 'dongmin'), '柳时元': 'siwon', '郑书娟': 'friend', '宋恩智': 'eunji', '弟弟': 'brother' };
        if (b.ch === 'bubble' || b.who === '论坛') return;
        const cid = b.t === 'me' ? 'he' : map[b.who];
        if (!cid) return;
        const m = b.t === 'me' ? { me: true, zh: b.zh } : b.t === 'photo' ? { type: 'photo', note: b.text || '（照片）', speaker: b.who } : { ko: b.ko, zh: b.zh, speaker: b.who };
        m.day = Game.S.day; m.fromEvent = true;
        (Game.S.chats[cid] = Game.S.chats[cid] || []).push(m);
      }
    },

    section(text) {
      if (this.mode === 'gal') $('#scene-section').innerHTML = `<span>${esc(text)}</span>`;
      else Phone.storyAppend(`<div class="sec">${esc(text)}</div>`);
    },

    lineHTML(b) {
      if (b.t === 'nar') return `<div class="nar">${esc(b.text)}</div>`;
      if (b.t === 'me') return `<div class="me">「${esc(b.zh)}」</div>`;
      if (b.t === 'photo') return `<div class="note-photo"><div class="photo-card">${esc(b.text || '（照片）')}</div></div>`;
      return `<div class="ko">${esc(b.ko)}</div><div class="zh">${esc(b.zh)}</div>`;
    },

    show(b) {
      if (this.mode === 'gal') {
        const plate = $('#dlg-name');
        if (b.t === 'say' || b.t === 'photo') {
          plate.classList.remove('empty');
          plate.querySelector('span').innerHTML = esc(N(b.who)) + (b.manner ? `<small>${esc(b.manner)}</small>` : '') + (b.ch === 'bubble' ? '<small>BLINK</small>' : '');
          this.showSprite(b);
        } else if (b.t === 'me') {
          plate.classList.remove('empty'); plate.querySelector('span').textContent = Game.S.name;
        } else plate.classList.add('empty');
        $('#dlg-text').innerHTML = this.lineHTML(b);
      } else {
        Phone.storyLine(b);
      }
    },

    wait() {
      return new Promise(res => { this.waiter = res; });
    },
    advance() { if (this.waiter) { const w = this.waiter; this.waiter = null; w(); } },

    // ---- 选项 ----
    async choice(b) {
      const S = Game.S;
      const opts = b.options;
      let idx;
      if (b.outcome) {
        idx = Math.max(0, opts.findIndex(o => o.label === S.outcome));
      } else {
        const r = await this.askChoice(opts);
        if (r.free) { await this.freeOption(opts, r.text); return; }
        idx = r.index;
      }
      const o = opts[idx];
      S.lastChoice = idx + 1;
      Game.applyFx(o.fx, 'event');
      (o.flags || []).forEach(f => Game.setFlag(f));
      if (!b.outcome) Game.remember(`「${this.ev.title.replace(/（.*?）$/, '')}」里选了：${o.label}`);
      this.log.push(`（玩家选择：${o.label}）`);
      const cb = CONFIG.CHOICE_BG[`${this.ev.id}#${idx + 1}`];
      if (cb && this.mode === 'gal') this.setBg(`assets/bg/${cb}.jpg`);
      const cgc = CONFIG.EVENT_CG.find(c => c.ev === this.ev.id && c.choice === idx + 1 && (!c.role || c.role === S.role));
      if (cgc) await this.showCG(cgc.img);

      await this.run(o.after);
    },

    askChoice(opts) {
      return new Promise(res => {
        const done = (r) => { box.innerHTML = ''; box.classList.add('hidden'); res(r); };
        let box;
        if (this.mode === 'gal') {
          box = $('#choices'); box.classList.remove('hidden');
          $('#dialog').classList.add('hidden');
          box.innerHTML = opts.map((o, i) => `<button class="btn-choice" data-i="${i}"><span>${esc(o.label)}</span></button>`).join('') +
            `<div class="free-box"><textarea placeholder="自己说……（打中文就行）"></textarea><button class="send"><img src="assets/ui/ic_send.png" alt="发送"></button></div>`;
          const fin = (r) => { $('#dialog').classList.remove('hidden'); done(r); };
          box.querySelectorAll('[data-i]').forEach(btn => btn.onclick = () => fin({ index: +btn.dataset.i }));
          box.querySelector('.send').onclick = () => { const t = box.querySelector('textarea').value.trim(); if (t) fin({ free: true, text: t }); };
        } else {
          box = Phone.storyChoices(opts.map(o => o.label), (r) => done(r));
        }
      });
    },

    async freeOption(opts, text) {
      const S = Game.S;
      this.show({ t: 'me', zh: text }); this.logLine({ t: 'me', zh: text });
      if (!Game.settings().apiKey) {
        this.show({ t: 'nar', text: '（还没有设置 API，自由输入暂时不能用。这次按第一个选项继续。）' }); await this.wait();
        const o = opts[0]; S.lastChoice = 1; Game.applyFx(o.fx, 'event'); (o.flags || []).forEach(f => Game.setFlag(f));
        await this.run(o.after); return;
      }
      UI.loading(true, '他在打字…');
      try {
        const j = await API.storyFree(this.ev, this.log.join('\n'), opts, text);
        UI.loading(false);
        S.lastChoice = 0;
        Game.applyFx(j.fx, 'event');
        (j.flags || []).forEach(f => { if (['knot1', 'knot2'].includes(f)) Game.setFlag(f); });
        Game.remember(`「${this.ev.title.replace(/（.*?）$/, '')}」里自己说了：${text}`);
        for (const l of (j.lines || [])) {
          const b = l.t === 'say' ? { t: 'say', who: l.who || '他', ko: l.ko, zh: l.zh } : { t: 'nar', text: l.text || '' };
          this.show(b); this.logLine(b); await this.wait();
        }
      } catch (e) {
        UI.loading(false);
        this.show({ t: 'nar', text: '（API 出错了：' + e.message + '。按第一个选项继续。）' }); await this.wait();
        const o = opts[0]; S.lastChoice = 1; Game.applyFx(o.fx, 'event'); await this.run(o.after);
      }
    },

    // ---- 自由聊天（序章、第 40 天）----
    async freeChat(b) {
      const S = Game.S;
      const text = await Phone.storyInput(b.text.includes('教学') ? '在这里打字就能和他聊天（打中文）' : '和他聊聊（打中文）', this.mode === 'gal');
      if (!text) return;
      this.show({ t: 'me', zh: text }); this.logLine({ t: 'me', zh: text });
      if (!S.chats.he.length || true) { /* 记录已在 logLine 里 */ }
      if (!Game.settings().apiKey) { this.show({ t: 'nar', text: '（还没有设置 API，他的回复先跳过。）' }); await this.wait(); return; }
      UI.loading(true, '他在打字…');
      try {
        const j = await API.chat('he', text);
        UI.loading(false);
        Game.applyFx(j.delta, 'chat');
        const last = S.chats.he[S.chats.he.length - 1];
        if (last && last.me && j.player_ko) last.ko = j.player_ko;
        for (const r of (j.replies || [])) {
          const blk = r.type === 'photo' ? { t: 'photo', who: '他', text: r.note } : { t: 'say', who: '他', ko: r.type === 'sticker' ? (CONFIG.STICKERS[r.ko] || {}).ko || r.ko : r.ko, zh: r.zh || r.note || '' };
          this.show(blk); this.logLine(blk); await this.wait();
        }
      } catch (e) { UI.loading(false); this.show({ t: 'nar', text: '（API 出错：' + e.message + '）' }); await this.wait(); }
    },

    // ---- 第 33 天写帖子 ----
    async freePost() {
      const S = Game.S;
      const r = await Phone.storyPost();
      if (!Game.settings().apiKey) { S.outcome = r.body.length > 40 ? '成功' : '翻车'; return; }
      UI.loading(true, '帖子发出去了…');
      try {
        const j = await API.judgePost(r.title, r.body);
        S.outcome = /翻车/.test(j.result) ? '翻车' : '成功';
        Game.remember(`用小号发了帖子「${r.title}」，结果${S.outcome}`);
      } catch (e) { S.outcome = '成功'; }
      UI.loading(false);
    }
  };

  // 点击 / 空格推进
  document.addEventListener('click', (e) => {
    if (!Story.waiter) return;
    if (e.target.closest('#dialog') || e.target.closest('.story-tap') || e.target.closest('.story-log')) Story.advance();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && Story.waiter && !/TEXTAREA|INPUT/.test(document.activeElement.tagName)) { e.preventDefault(); Story.advance(); }
  });

  window.Story = Story;
})();
