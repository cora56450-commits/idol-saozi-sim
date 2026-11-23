// 固定事件播放器：线下事件用 gal 对话框，手机事件在手机里一条条弹出
(function () {
  const { $, esc } = UI;
  const N = (who) => (CONFIG.NAMES[who] || who);

  const Story = {
    ev: null, mode: 'gal', log: [], waiter: null,

    async play(id) {
      const ev = EVENTS[id];
      if (!ev) return;
      this.ev = ev; this.log = []; this._cgShown = {}; this.cgOn = false; this.storyMin = CONFIG.EVENT_TIME[id] != null ? CONFIG.EVENT_TIME[id] : null;
      document.querySelector('#alert').classList.add('hidden');
      this.mode = ev.mode;
      Sound.bgm(CONFIG.BGM_EVENT[id] || (ev.mode === 'gal' ? 'sweet' : 'theme'));
      if (CONFIG.SFX_EVENT[id]) Sound.sfx(CONFIG.SFX_EVENT[id]);
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
        Sound.sfx('vibrate');
        Phone.openStory(ev.kind === 'event' ? ev.title.replace(/（.*?）$/, '') : ev.title);
      }
      this.prefetchKo(ev);
      if (ev.kind === 'ending' && CONFIG.ENDING_CG[ev.id.slice(4)]) this.setCG(CONFIG.ENDING_CG[ev.id.slice(4)], true);
      await UI.tip(this.mode === 'gal' ? 'gal' : 'phoneStory');
      await this.run(ev.blocks);
      if (this.mode === 'phone') Phone.closeStory();
      if (ev.kind === 'event') { S.seen[ev.id] = true; Game.addFact(ev.id); }
      // 剧情里走到了几点，桌面的时间就从那里接着走（凌晨算当天夜里）
      if (this.storyMin != null && ev.kind === 'event') { const t = this.storyMin < 360 ? this.storyMin + 1440 : this.storyMin; if (t > (S.minutes || 0)) S.minutes = t; }
      this.ev = null; this.storyMin = null;
    },

    // ---- 玩家在手机里说的固定台词：一次性在后台翻成韩文（存在浏览器里，下次不用再翻）----
    koCache() { if (!this._ko) { try { this._ko = JSON.parse(localStorage.getItem('idolsao_ko') || '{}'); } catch (e) { this._ko = {}; } } return this._ko; },
    koOf(zh) { return this.koCache()[zh] || ''; },
    meLines(ev) {
      const out = [];
      const walk = (bs) => bs.forEach(b => {
        if (b.t === 'me' && b.zh) out.push(b.zh);
        if (b.t === 'choice') b.options.forEach(o => { const q = this.quoteOf(o); if (q) out.push(q); walk(o.after || []); });
      });
      walk(ev.blocks || []);
      return [...new Set(out)];
    },
    async prefetchKo(ev) {
      if (!Game.settings().apiKey || ev.mode !== 'phone') return;
      const C = this.koCache(), need = this.meLines(ev).filter(z => !C[z]);
      if (!need.length) return;
      try {
        const ko = await API.translateKo(need);
        need.forEach((z, i) => { if (ko[i]) C[z] = ko[i]; });
        try { localStorage.setItem('idolsao_ko', JSON.stringify(C)); } catch (e) {}
        // 已经显示出来的、已经记进聊天记录的，补上韩文
        need.forEach(z => { if (C[z]) Phone.fillMeKo(z, C[z]); });
        Object.values(Game.S.chats).forEach(list => list.forEach(m => { if (m.me && !m.ko && C[m.zh]) m.ko = C[m.zh]; }));
      } catch (e) { console.warn('翻译失败', e); }
    },
    // 选项本身是一句话（「不行。」）或者带着「」引号的那一句
    quoteOf(o) {
      if (o.say) return o.label;
      const q = (o.label.match(/「([^」]+)」?/) || [])[1];
      return q && !/写/.test(o.label) ? q : '';
    },

    // 文案里的〔素人：A｜员工：B〕按身份换成对应的那段
    roleText(b) {
      const re = /〔素人：([^｜〕]*)｜员工：([^〕]*)〕/g;
      if (!/〔素人：/.test((b.text || '') + (b.zh || '') + (b.ko || ''))) return b;
      const pick = (s) => s && s.replace(re, (m, a, c) => Game.S.role === 'civ' ? a : c);
      return Object.assign({}, b, { text: pick(b.text), zh: pick(b.zh), ko: pick(b.ko) });
    },

    // 旁白里的时间（「凌晨一点四十」「中午十二点零三分」）→ 剧情里手机状态栏的时间
    parseTime(txt) {
      const cn = s => { if (/^\d+$/.test(s)) return +s; const D = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
        if (s === '十') return 10; if (s[0] === '十') return 10 + (D[s[1]] || 0);
        if (s.includes('十')) { const [a, b] = s.split('十'); return D[a] * 10 + (b ? D[b] || 0 : 0); }
        return [...s].reduce((n, c) => n * 10 + (D[c] || 0), 0); };
      const m = txt.match(/(?:^|[^第])(凌晨|清晨|早上|上午|中午|下午|傍晚|晚上|夜里|半夜|深夜)?([零〇一二两三四五六七八九十]{1,3}|\d{1,2})点(半|一刻|([零〇一二三四五六七八九十]{1,3}|\d{1,2})分?)?/);
      if (!m || (!m[1] && !m[3]) || m.index > 4) return null; // 只认开头的时间（「那天晚上十一点」可以，「在下午三点」不算）
      let h = cn(m[2]); const per = m[1] || '';
      let min = m[3] === '半' ? 30 : m[3] === '一刻' ? 15 : m[4] ? cn(m[4]) : 0;
      if (h > 24 || min > 59) return null;
      if (/下午|傍晚|晚上|夜里|深夜/.test(per) && h < 12) h += 12;
      if (per === '中午' && h < 6) h += 12;
      if (/凌晨|半夜/.test(per) && h === 12) h = 0;
      return (h % 24) * 60 + min;
    },
    setStoryTime(txt) {
      const t = this.parseTime(txt || '');
      if (t == null) return;
      this.storyMin = t;
      document.querySelectorAll('#phone .status-bar span:first-child').forEach(s => { s.textContent = UI.clock(); });
    },

    // 手机剧情中途切到线下画面（回忆等），再切回手机
    async switchMode(b) {
      if (b.mode === 'gal') {
        if (b.title) await UI.transition(b.title, b.sub || '');
        $('#phone').classList.add('hidden');
        this.mode = 'gal';
        let bg = b.bg; if (bg && typeof bg === 'object') bg = bg[Game.S.role];
        $('#scene-sprite').style.display = 'none';
        $('#scene-cg').classList.remove('on'); this.cgOn = false;
        $('#scene-section').innerHTML = ''; $('#choices').innerHTML = '';
        $('#dialog').classList.remove('hidden');
        if (bg && bg.startsWith('cg:')) { this.setBg(this.bgFor(this.ev.id)); await this.showCG(bg.slice(3)); }
        else this.setBg(bg ? `assets/bg/${bg}.jpg` : this.bgFor(this.ev.id));
        UI.show('scr-scene');
        await UI.tip('gal');
      } else {
        this.mode = 'phone'; this.cgOn = false;
        UI.renderDesk();
        $('#phone').classList.remove('hidden');
        const log = $('#story-log'); if (log) log.scrollTop = log.scrollHeight;
      }
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
      if (this.cgOn && this._cgEnd && new RegExp(this._cgEnd).test(txt)) { $('#scene-cg').classList.remove('on'); this.cgOn = false; this._cgEnd = null; }
      const c = CONFIG.EVENT_CG.find(c => c.ev === this.ev.id && c.match && txt.includes(c.match) && (!c.role || c.role === Game.S.role));
      if (c && !this._cgShown[c.img]) { this._cgShown[c.img] = true; this._cgEnd = c.end || null; await this.showCG(c.img); }
    },

    async run(blocks) {
      for (let b of blocks) {
        if (!Game.check(b.if)) continue;
        b = this.roleText(b);
        await this.cgByMatch(b);
        if (b.t === 'nar' || b.t === 'section') this.setStoryTime(b.text);
        switch (b.t) {
          case 'note': break;
          case 'scene': await this.switchMode(b); break;
          case 'title': await UI.transition(b.text, '', 2600); break;
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
      if ((this.mode === 'phone' || b.ch === 'chat') && (b.t === 'say' || b.t === 'me' || b.t === 'photo')) {
        const map = { '他': 'he', '东旻': (Game.S.day >= 12 ? 'group' : 'dongmin'), '柳时元': 'siwon', '郑书娟': 'friend', '宋恩智': 'eunji', '弟弟': 'brother' };
        if (b.ch === 'bubble' || b.who === '论坛') return;
        let cid = b.t === 'me' ? 'he' : map[b.who];
        if (this.mode === 'phone' && Phone.storyChat && (b.t === 'me' || b.who === '他')) cid = Phone.storyChat; // 和画面上的聊天一致（三人群 / 私聊）
        if (!cid) return;
        const m = b.t === 'me' ? { me: true, zh: b.zh, ko: b.ko || this.koOf(b.zh) || undefined } : b.t === 'photo' ? { type: 'photo', note: b.text || '（照片）', speaker: b.who } : { ko: b.ko, zh: b.zh, speaker: b.who, type: b.vtype, note: b.note };
        m.day = Game.S.day; m.fromEvent = true;
        (Game.S.chats[cid] = Game.S.chats[cid] || []).push(m);
      }
    },

    section(text) {
      if (this.mode === 'gal') $('#scene-section').innerHTML = `<span>${esc(text)}</span>`;
      else { const app = Phone.appOf({ t: 'section', text }); if (app) Phone.switchStoryApp(app); Phone.storyAppend(`<div class="sec">${esc(text)}</div>`); }
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
          plate.querySelector('span').innerHTML = esc(N(b.who)) + (b.manner ? `<small>${esc(b.manner)}</small>` : '') + (b.ch === 'bubble' ? '<small>BLINK</small>' : '') + (b.ch === 'chat' ? '<small>톡톡</small>' : '');
          // 手机消息：人不在场，不显示立绘
          if (b.ch === 'chat' || b.ch === 'bubble' || b.t === 'photo') $('#scene-sprite').style.display = 'none';
          else this.showSprite(b);
        } else if (b.t === 'me') {
          plate.classList.remove('empty'); plate.querySelector('span').textContent = Game.S.nameZh || Game.S.name;
        } else plate.classList.add('empty');
        $('#dlg-text').innerHTML = this.lineHTML(b);
      } else {
        if (b.t === 'me' && !b.ko && this.koOf(b.zh)) b = Object.assign({}, b, { ko: this.koOf(b.zh) });
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
        const r = await this.askChoice(opts, true);
        if (r.free) { await this.freeOption(opts, r.text, b); return; }
        idx = r.index;
      }
      const o = opts[idx];
      S.lastChoice = idx + 1;
      S.picks = S.picks || {}; if (S.picks[this.ev.id] == null) S.picks[this.ev.id] = idx + 1; // 每个事件记第一个选择，后面的剧情可以按它分支
      Game.addFact(`${this.ev.id}#${idx + 1}`);
      Game.applyFx(o.fx, 'event');
      (o.flags || []).forEach(f => Game.setFlag(f));
      if (!b.outcome) Game.remember(`「${this.ev.title.replace(/（.*?）$/, '')}」里选了：${o.label}`);
      this.log.push(`（玩家选择：${o.label}）`);
      const cb = CONFIG.CHOICE_BG[`${this.ev.id}#${idx + 1}`];
      if (cb && this.mode === 'gal') this.setBg(`assets/bg/${cb}.jpg`);
      const cgc = CONFIG.EVENT_CG.find(c => c.ev === this.ev.id && c.choice === idx + 1 && (!c.role || c.role === S.role));
      if (cgc) await this.showCG(cgc.img);

      // 选项里带着引号的话（「听了，高音很好。」）= 你说出口的话，先显示出来
      // 线下场景里，整个选项就是当面说的话；选项里夹着「」的那种（「先回他：……」）在线下场景里是发的消息
      const q = this.quoteOf(o);
      const first = (o.after || []).find(x => Game.check(x.if));
      if (q && !(first && first.t === 'me')) { const mb = { t: 'me', zh: q, ch: this.mode === 'phone' || o.say ? undefined : 'chat' }; this.show(mb); this.logLine(mb); await this.wait(); }
      await this.run(o.after);
    },

    askChoice(opts) {
      UI.tip('choice');
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

    async freeOption(opts, text, cb) {
      const S = Game.S;
      this.show({ t: 'me', zh: text }); this.logLine({ t: 'me', zh: text });
      if (!Game.settings().apiKey) {
        this.show({ t: 'nar', text: '（还没有设置 API，自由输入暂时不能用。这次按第一个选项继续。）' }); await this.wait();
        const o = opts[0]; S.lastChoice = 1; Game.applyFx(o.fx, 'event'); (o.flags || []).forEach(f => Game.setFlag(f));
        await this.run(o.after); return;
      }
      UI.loading(true, '他在打字…');
      try {
        const i = cb ? this.ev.blocks.indexOf(cb) : -1;
        const rest = i >= 0 ? this.ev.blocks.slice(i + 1).filter(x => Game.check(x.if) && x.t !== 'note' && x.t !== 'fx') : [];
        const ctx = { isLast: i >= 0 && rest.length === 0, next: i >= 0 ? this.upcoming(cb, 10) : '' };
        const j = await API.storyFree(this.ev, this.log.join('\n'), opts, text, ctx);
        UI.loading(false);
        if (j.player_ko) this.fillKo(text, j.player_ko);
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

    // 自己打的字翻好了：补到气泡和聊天记录上
    fillKo(zh, ko) {
      Phone.fillMeKo(zh, ko);
      Object.values(Game.S.chats).forEach(list => { for (let k = list.length - 1; k >= Math.max(0, list.length - 6); k--) { const m = list[k]; if (m.me && m.zh === zh && !m.ko) { m.ko = ko; break; } } });
    },

    // 当前事件里某个块后面的固定内容（给 API 参考，避免前后矛盾）
    upcoming(b, n) {
      const bs = this.ev.blocks, i = bs.indexOf(b);
      if (i < 0) return '';
      return bs.slice(i + 1).filter(x => Game.check(x.if) && ['nar', 'say', 'me', 'section'].includes(x.t)).slice(0, n)
        .map(x => x.t === 'say' ? `${N(x.who)}：${x.ko || ''}（${x.zh || ''}）` : x.t === 'me' ? `玩家：${x.zh || x.text}` : (x.text || '')).join('\n');
    },

    // ---- 自由聊天（序章、第 40 天）----
    async freeChat(b) {
      const S = Game.S;
      // 说明现在是在和他私聊（前一句可能是粉丝群在说话，免得玩家回错地方）
      if (this.mode === 'phone' && !/教学/.test(b.text)) this.section('和他的私聊 · 自由聊天');
      const text = await Phone.storyInput(b.text.includes('教学') ? '在这里打字就能和他聊天（打中文）' : '和他聊聊（打中文）', this.mode === 'gal');
      if (!text) return;
      this.show({ t: 'me', zh: text }); this.logLine({ t: 'me', zh: text });
      if (!S.chats.he.length || true) { /* 记录已在 logLine 里 */ }
      if (!Game.settings().apiKey) { this.show({ t: 'nar', text: '（还没有设置 API，他的回复先跳过。）' }); await this.wait(); return; }
      UI.loading(true, '他在打字…');
      try {
        const j = await API.chat('he', text, this.upcoming(b, 12));
        UI.loading(false);
        Game.applyFx(j.delta, 'chat');
        if (j.player_ko) this.fillKo(text, j.player_ko);
        for (const r of (j.replies || [])) {
          const blk = r.type === 'photo' ? { t: 'photo', who: '他', text: r.note }
            : r.type === 'voice' ? { t: 'say', who: '他', vtype: 'voice', ko: r.ko, zh: r.zh, note: r.note }
            : { t: 'say', who: '他', ko: r.type === 'sticker' ? (CONFIG.STICKERS[r.ko] || {}).ko || r.ko : r.ko, zh: r.zh || r.note || '' };
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
        UI.loading(false);
        // 先让玩家看到自己发出去的帖子（翻成韩文的样子）
        const post = [{ t: 'section', text: '你的帖子' },
          { t: 'say', who: '论坛', ko: j.title_ko || r.title, zh: r.title, manner: '标题' },
          { t: 'say', who: '论坛', ko: j.body_ko || r.body, zh: r.body }];
        await this.run(post);
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
