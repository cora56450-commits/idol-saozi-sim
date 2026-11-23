// 流程：标题 → 开局 → 每天（固定事件 → 当日动态 → 桌面自由活动 → 结束一天）→ 结算
(function () {
  const { $, $$, esc } = UI;

  const HOT_LABEL = { polaroid: '拍立得 · 结局回想', album: '专辑 · 菜单', note: '便签 · 今日行程', phone: '手机', bento: '便当 · 结束这一天' };

  const Main = {
    boot() {
      UI.fit();
      Phone.preloadAvatars();
      this.bindTitle(); this.bindSetup(); this.bindDesk();
      $('#phone-close').onclick = () => Phone.close();
      $('.phone-dim').onclick = () => Phone.close();
      this.toTitle();
    },

    toTitle() {
      Phone.close(); $('#phone').classList.add('hidden');
      Game.S = null;
      Sound.bgm('theme');
      $('[data-act=continue]').style.display = Game.peek('auto') && !Game.peek('auto').ending ? '' : 'none';
      UI.show('scr-title');
    },

    bindTitle() {
      $$('#scr-title [data-act]').forEach(b => b.onclick = () => {
        const a = b.dataset.act;
        if (a === 'new') { this.setupRole = 'civ'; this.subTouched = false; this.refreshSetup(); UI.show('scr-setup'); }
        if (a === 'continue') { if (Game.load('auto')) this.resume(); }
        if (a === 'load') UI.savesModal('load');
        if (a === 'settings') UI.settingsModal();
      });
    },

    refreshSetup() {
      $$('#scr-setup .role').forEach(b => b.classList.toggle('sel', b.dataset.role === this.setupRole));
      if (!this.subTouched) $('#setup-sub').checked = this.setupRole === 'civ';
    },
    // 中文名字 → 韩文读音（汉字词音 + 头音法则），已经是韩文的字原样保留
    toKorean(s) {
      if (!this._hj) { this._hj = {}; const H = window.HANJA || ''; for (let i = 0; i + 1 < H.length; i += 2) this._hj[H[i]] = H[i + 1]; }
      const SUR = { '金': '김', '朴': '박', '卢': '노', '盧': '노', '罗': '나', '羅': '나', '林': '임', '李': '이', '柳': '유', '刘': '유', '劉': '유', '吕': '여', '梁': '양', '龙': '용', '陆': '육', '雷': '뇌' };
      let out = '';
      [...s].forEach((c, i) => {
        if (/[가-힣]/.test(c)) { out += c; return; }
        let k = (i === 0 && SUR[c]) || this._hj[c];
        if (!k) return;
        if (out.length === 0) { // 头音法则
          const code = k.charCodeAt(0) - 0xAC00, L = Math.floor(code / 588), V = Math.floor((code % 588) / 28), T = code % 28;
          let nl = L;
          if (L === 5 || L === 2) nl = (L === 5 && ![2, 6, 7, 12, 17, 20].includes(V)) ? 2 : ([2, 6, 7, 12, 17, 20].includes(V) ? 11 : L);
          k = String.fromCharCode(0xAC00 + nl * 588 + V * 28 + T);
        }
        out += k;
      });
      return out;
    },
    bindSetup() {
      $$('#scr-setup .role').forEach(b => b.onclick = () => { this.setupRole = b.dataset.role; this.refreshSetup(); });
      $('#setup-sub').onchange = () => { this.subTouched = true; };
      $('#setup-name').oninput = () => { $('#setup-name-ko').value = Main.toKorean($('#setup-name').value.trim()) || ''; };
      $('#scr-setup [data-act=back]').onclick = () => UI.show('scr-title');
      $('#scr-setup [data-act=start]').onclick = () => {
        const zh = $('#setup-name').value.trim() || '智恩';
        const ko = $('#setup-name-ko').value.trim() || this.toKorean(zh) || '지은';
        Game.newGame({ role: this.setupRole, name: ko, nameZh: zh, sub: $('#setup-sub').checked });
        this.playIntro().then(() => {
          if (!Game.settings().apiKey) UI.notify('toktok', '提示', '还没设置 API：聊天、论坛、泡泡会用离线样例。桌上的专辑 → 设置');
          this.startDay();
        });
      };
    },

    bindDesk() {
      const label = $('#hot-label');
      $$('.hotspot').forEach(h => {
        h.onmouseenter = () => { label.textContent = HOT_LABEL[h.dataset.hot]; label.style.display = 'block'; };
        h.onmousemove = (e) => {
          const st = $('#stage').getBoundingClientRect(), k = st.width / 1600;
          let x = (e.clientX - st.left) / k + 18, y = (e.clientY - st.top) / k + 18;
          if (x > 1380) x -= 260;
          label.style.left = x + 'px'; label.style.top = Math.min(y, 840) + 'px';
        };
        h.onmouseleave = () => { label.style.display = 'none'; };
        h.onclick = () => this.hot(h.dataset.hot);
      });
    },

    hot(k) {
      if (!Game.S || Story.ev) return;
      if (k === 'phone') Phone.open('home');
      if (k === 'album') UI.albumMenu();
      if (k === 'note') UI.planModal();
      if (k === 'polaroid') UI.galleryModal();
      if (k === 'bento') this.endDay();
    },

    // ---------- 开场介绍 ----------
    async playIntro() {
      const S = Game.S, I = INTRO;
      const lines = [...I.before, ...I[S.role], ...I.after].map(s => ({ t: 'nar', text: s.replace(/\{name\}/g, S.nameZh && S.nameZh !== S.name ? `${S.nameZh}（${S.name}）` : S.name) }));
      EVENTS.intro = { id: 'intro', day: 1, title: '', mode: 'gal', kind: 'intro', blocks: lines };
      await Story.play('intro');
    },

    // ---------- 一天 ----------
    async startDay() {
      const S = Game.S;
      S.minutes = 510; S.dayDelta = { aff: 0, exp: 0 };
      // 前几天约了没见成的，作废
      (S.dates || []).forEach(d => { if (d.day < S.day && !d.done) { d.done = true; Game.remember(`第${d.day}天约好的见面没见成`); } });
      if (S.dates) S.dates = S.dates.filter(d => d.day >= S.day - 3);
      const id = 'day' + S.day;
      const ev = EVENTS[id];
      if (ev && !S.seen[id]) {
        if (S.day === 72 && S.aff < CONFIG.BALANCE.cheat) S.flags.cheat = true;
        await Story.play(id);
        Game.remember(`发生了「${ev.title.replace(/（.*?）$/, '')}」`);
        if (this.checkExposure()) return;
        if (S.day === 90) return this.settle();
      }
      UI.renderDesk();
      Game.autosave();
      if (!S.feeds[S.day]) await this.genFeed();
      if (!ev && Game.settings().apiKey && S.day > 1) this.morningPing();
      if (Game.settings().apiKey && S.day > 1 && Math.random() < 0.6) this.ambient([S.minutes, '早上'], S.day);
      UI.updateBadge();
    },

    resume() {
      const S = Game.S;
      if (S.ending) return this.toTitle();
      const id = 'day' + S.day;
      if (EVENTS[id] && !S.seen[id]) return this.startDay();
      UI.renderDesk();
      if (!S.feeds[S.day]) this.genFeed();
    },

    async genFeed() {
      const S = Game.S, day = S.day; // 记下是哪一天的：加载途中玩家可能已经结束这一天
      let f;
      if (Game.settings().apiKey) {
        UI.loading(true, '大家在刷手机…');
        try { f = await API.feed('A'); f.forum = []; f.fan_group = []; f._pendingB = true; } catch (e) { console.warn(e); UI.notify('pan', 'API 出错', e.message); }
        UI.loading(false);
      }
      if (!f) f = Phone.offlineFeed();
      if (Game.S !== S) return; // 中途读档 / 开新游戏
      this.mergeStoryFeed(S, day, f);
      S.feeds[day] = f;
      if (S.day !== day) { Game.autosave(); return; } // 已经过了这一天：只存档，不再弹提醒、不再算曝光
      // 只留最近 5 天，避免存档太大
      Object.keys(S.feeds).forEach(d => { if (+d < S.day - 4) delete S.feeds[d]; });
      S.unread.blink = S.sub ? (f.bubble || []).length : 0;
      S.unread.pan = (f.forum || []).length;
      S.unread.insta = (f.instasnap || []).length;
      if (!f.offline) Game.applyFx({ exp: Math.max(-2, Math.min(2, f.exposure_hint || 0)) }, 'event'); // 每日动态对曝光的影响压在 ±2
      if (!f.offline) (f.alerts || []).forEach(a => Game.remember(a));
      if (f.alerts && f.alerts.length && !f.offline && !Story.ev) UI.alert(f.alerts[0]);
      else { const g = S.sub && (f.bubble || []).find(x => !x.story && x.messages && x.messages[0]); if (g) UI.notify('blink', 'BLINK · 徐允在', g.messages[0].ko || '[照片]', () => Phone.open('blink')); }
      UI.updateBadge();
      this.checkExposure();
      Game.autosave();
      if (f._pendingB) this.genFeedB(S, day, f);
    },

    // 剧情里出现过的泡泡 / 帖子 / 粉丝群消息，放在当天 App 内容的最前面
    mergeStoryFeed(S, day, f, partB) {
      const x = (S.storyFeed || {})[day]; if (!x) return;
      if (!partB) f.bubble = (x.bubble || []).concat((f.bubble || []).filter(g => !g.story));
      f.forum = (x.forum || []).concat((f.forum || []).filter(p => !p.story));
      f.fan_group = (x.fan_group || []).concat((f.fan_group || []).filter(m => !m.story));
    },

    // 第二步：论坛 + 粉丝群，在后台生成，不挡玩家
    async genFeedB(S, day, f) {
      let b = null;
      try { b = await API.feed('B', f); } catch (e) { console.warn(e); }
      if (Game.S !== S) return;
      f._pendingB = false;
      if (b) { f.forum = b.forum || []; f.fan_group = b.fan_group || []; }
      this.mergeStoryFeed(S, day, f, true);
      if (S.day === day) {
        S.unread.pan = (f.forum || []).length;
        UI.updateBadge();
        if (Phone.view === 'pan' || Phone.view === 'post') Phone.go(Phone.view, Phone.arg);
      }
      Game.autosave();
    },

    async morningPing() {
      try {
        const S = Game.S, day = S.day;
        const j = await API.chatInitiate('he', `新的一天（${SCHEDULE.todayPlan(day)}），他在出门前或休息间隙主动找你。`);
        if (Game.S !== S || S.day !== day) return; // 已经过了这一天，早安消息作废
        if (j.replies && j.replies.length) Phone.pushIncoming('he', j.replies);
      } catch (e) { console.warn(e); }
    },

    // ---------- 时间往后走 ----------
    async skipTime() {
      const S = Game.S;
      if (!S || Story.ev || this._skipping) return;
      const nx = Game.nextSlot(), d = Game.pendingDate();
      if (!nx && !d) return;
      this._skipping = true;
      Phone.close();
      if (d && (!nx || d.min <= nx[0])) { // 约好的时间先到（或者已经是今天最后一个时间点了）
        S.minutes = Math.max(S.minutes || 0, d.min);
        await UI.transition(d.time, '约好的时间到了', 1400);
        await this.runDate(d);
        this._skipping = false; return;
      }
      S.minutes = nx[0];
      await UI.transition(`${Game.hhmm(nx[0])} · ${nx[1]}`, nx[2] || '', 1300);
      UI.renderDesk();
      this._skipping = false;
      Game.autosave();
      // 行程间隙他可能会来找你；开店时店里的群会有人说话
      if (!Game.settings().apiKey) return;
      const day = S.day;
      if (Math.random() < 0.5) this.ping('he', `现在 ${UI.clock()}（她：${Game.workStatus()}）。他在行程间隙或收工以后主动找她，聊今天行程里的幕后小事（今天的行程：${SCHEDULE.todayPlan(day)}）。`, day);
      this.ambient(nx, day);
    },
    // 其他人自己也会发消息：闺蜜、店里的群、三人群、弟弟……每次往后过挑一两个
    ambient(nx, day) {
      const S = Game.S, h = Math.floor((S.minutes % 1440) / 60), now = UI.clock(), st = Game.workStatus();
      const working = /上班/.test(st), list = Game.availableChats();
      const pool = [];
      const add = (id, w, why) => { if (list.includes(id)) pool.push({ id, w, why }); };
      if (S.role === 'civ') {
        add('shop', /去店里/.test(nx[1]) ? 6 : working ? 3 : 0.5, working
          ? `现在 ${now}，店里营业中。白秀珍或吴叡琳在工作群里说店里的事：订单、备菜、食材不够、配送跑到哪、客人的奇怪要求、叡琳上课迟到之类。`
          : `现在 ${now}，店已经关了。白秀珍或吴叡琳在工作群里随口说点下班后的事，或者提醒明天的订单。`);
        add('friend', 3, `现在 ${now}（她：${st}）。闺蜜郑书娟主动找她闲聊：吐槽自己公司和上司、分享八卦或好笑的事、约周末、追问她和允在最近怎么样。要像真闺蜜，不用每次都绕到恋爱上。`);
      } else {
        add('work', working ? 4 : 0.5, `现在 ${now}。公司工作群里室长或宣传部发公事：明天行程变动、团员饮食问题、会议时间、偶尔有人发错消息。`);
        add('eunji', working ? 3 : 1, `现在 ${now}（她：${st}）。宋恩智主动来八卦：茶水间听到的艺人传闻、约下午茶、打听她最近在忙什么。`);
      }
      add('group', 3, `现在 ${now}。三人群里东旻先说话（转发论坛帖、吐槽允在、报告练习室发生的事），允在有空也会插一两句。`);
      add('dongmin', 1, `现在 ${now}。东旻单独私聊她：求她帮忙、问恋爱建议、吐槽允在，或者为自己追的女团练习生的事求助。`);
      if (h >= 18 && h < 22) add('brother', 2.5, `现在 ${now}，他刚从部队拿到手机。主动找姐姐聊：吐槽部队伙食、班长、站岗，或者跟她要东西。`);
      if (S.amb >= 20) add('siwon', h >= 22 || h < 3 ? 2 : 0.5, `现在 ${now}。柳时元很克制地主动发一两句消息（练习结束、看到某样东西想起她）。`);
      const pick = () => { const tot = pool.reduce((a, x) => a + x.w, 0); let r = Math.random() * tot; for (let k = 0; k < pool.length; k++) { r -= pool[k].w; if (r <= 0) return pool.splice(k, 1)[0]; } return null; };
      const n = Math.random() < 0.35 ? 2 : 1; // 一次一两个人
      for (let k = 0; k < n && pool.length; k++) { const x = pick(); if (x && x.w > 0) setTimeout(() => this.ping(x.id, x.why, day), 1500 + k * 4000); }
    },
    async ping(id, reason, day) {
      try {
        const S = Game.S, j = await API.chatInitiate(id, reason);
        if (Game.S !== S || S.day !== day) return;
        if (j.replies && j.replies.length) Phone.pushIncoming(id, j.replies);
      } catch (e) { console.warn(e); }
    },
    // 聊天里时间走过了约好的点
    checkDate() {
      const S = Game.S, d = S && Game.pendingDate();
      if (!d || Story.ev || (S.minutes || 0) < d.min) return;
      this.runDate(d);
    },

    // ---------- 线下见面（他在私聊里答应几点来）----------
    async runDate(d) {
      const S = Game.S, hasKey = !!Game.settings().apiKey, who = d.who || '他', isHe = who === '他', nm = Game.whoName(who);
      if (d.done || Story.ev) return;
      d.done = true;
      Story.ev = { id: 'date', day: S.day, title: '见面', mode: 'gal', kind: 'date', blocks: [], who };
      Phone.close(); $('#phone').classList.add('hidden'); $('#notify').classList.add('hidden');
      Story.mode = 'gal'; Story.log = []; Story.storyMin = null; Story.cgOn = false; Story._cgShown = {};
      Sound.bgm(isHe ? 'sweet' : 'theme');
      const P = d.place + ' ' + (d.what || '');
      const bg = /家/.test(d.place) && !/他家|她家里吃饭/.test(d.place) ? 'apartment' : /烤肉|고기|肉|酒|吃|餐|炸鸡|饭|聚/.test(P) ? 'bbq' : /江|兜风|车/.test(P) ? 'hanriver' : /公司|练习室/.test(P) ? 'corridor' : isHe ? 'parking' : 'bbq';
      Story.setBg(`assets/bg/${bg}.jpg`);
      $('#scene-sprite').style.display = 'none'; $('#scene-section').innerHTML = `<span>${esc(d.time)} · ${esc(d.place)}${isHe ? '' : ' · ' + esc(nm)}</span>`;
      $('#choices').innerHTML = ''; $('#dialog').classList.remove('hidden');
      UI.show('scr-scene');
      const say = async (l) => {
        const sp = l.who && !/^(他|徐允在|允在)$/.test(l.who) ? (Object.keys(CONFIG.NAMES).find(k => CONFIG.NAMES[k] === l.who || k === l.who) || l.who) : who;
        const b = l.t === 'say' ? { t: 'say', who: sp, ko: l.ko || '', zh: l.zh || '' } : { t: 'nar', text: l.text || '' };
        if (b.t === 'nar' && !b.text) return;
        Story.show(b); Story.logLine(b); await Story.wait();
      };
      let aff = 0, exp = 0, amb = 0;
      const turn = async (phase, text) => {
        if (!hasKey) return null;
        UI.loading(true, phase === 'open' ? (isHe ? '他快到了' : '出门赴约') : '在想怎么回');
        try { const j = await API.dateTurn(phase, d, Story.log.join('\n'), text); UI.loading(false); return j; }
        catch (e) { UI.loading(false); console.warn(e); return null; }
      };
      // 开场
      let j = await turn('open');
      if (j && j.lines && j.lines.length) { for (const l of j.lines) await say(l); }
      else if (isHe) {
        for (const l of [{ t: 'nar', text: '门铃没响。手机先亮了：他发来一个「도착」（到了）。' }, { t: 'nar', text: '你开门的时候，他已经站在门口，帽檐压得很低，口罩拉到下巴。' }, { t: 'say', ko: '빨리 들여보내줘 추워', zh: '快让我进去，好冷' }]) await say(l);
      } else await say({ t: 'nar', text: `你到的时候，${nm}已经在了。` });
      // 聊几轮
      for (let round = 0; round < 4; round++) {
        const r = await this.dateInput();
        if (r.leave) break;
        Story.show({ t: 'me', zh: r.text }); Story.logLine({ t: 'me', zh: r.text });
        UI.tick(20);
        j = await turn('talk', r.text);
        if (!j) { await say({ t: 'nar', text: hasKey ? '（API 出错了，这一轮他的回答跳过。）' : '（还没有设置 API，见面里的对话要设置以后才能用。）' }); if (!hasKey) break; continue; }
        aff += j.fx.aff; exp += j.fx.exp; amb += j.fx.amb;
        for (const l of (j.lines || [])) await say(l);
        if (j.leave) break;
      }
      // 收尾
      UI.tick(20);
      j = await turn('close', isHe ? '（她送他到门口）' : '（差不多该散了）');
      if (j && j.lines && j.lines.length) { aff += j.fx.aff; amb += j.fx.amb; for (const l of j.lines) await say(l); }
      else if (isHe) for (const l of [{ t: 'say', ko: '나 간다. 문 잠그고 자', zh: '我走了。锁好门睡觉' }, { t: 'nar', text: '门关上以后，楼道里的声控灯亮了一会儿，又灭了。' }]) await say(l);
      else await say({ t: 'nar', text: '你们在路口分开，各自回家。' });
      if (isHe) {
        // 见面：感情 +2，曝光 +1（在外面 +3）；聊天里的加减压在 ±6 / 4 以内
        aff = Math.max(-6, Math.min(6, aff)) + 2; exp = Math.min(4, exp) + (/家/.test(d.place) ? 1 : 3);
        Game.applyFx({ aff, exp }, 'event');
        S.lastDateDay = S.day;
        Game.remember(`${d.time} 他来见她（${d.place}${d.what ? '，' + d.what : ''}），待到 ${UI.clock()} 才走`);
      } else {
        // 和别人见面不动感情 / 曝光；柳时元会动暧昧值
        if (who === '柳时元') Game.applyFx({ amb: Math.max(-6, Math.min(6, amb)) }, 'event');
        Game.remember(`${d.time} 和${nm}见了面（${d.place}${d.what ? '，' + d.what : ''}）`);
      }
      Story.ev = null;
      $('#scene-section').innerHTML = '';
      UI.renderDesk();
      Game.autosave();
      this.checkExposure();
    },
    // 见面时的输入：自己打字，或者送他走
    dateInput() {
      return new Promise(res => {
        const box = $('#choices'); box.classList.remove('hidden');
        $('#dialog').classList.add('hidden');
        box.innerHTML = `<div class="free-box"><textarea placeholder="和他说……（打中文）"></textarea><button class="send"><img src="assets/ui/ic_send.png" alt="发送"></button></div>
          <button class="btn-choice date-leave"><span>${(Story.ev && Story.ev.who && Story.ev.who !== '他') ? '差不多了，散了吧' : '差不多了，送他走'}</span></button>`;
        const done = (r) => { box.innerHTML = ''; box.classList.add('hidden'); $('#dialog').classList.remove('hidden'); res(r); };
        box.querySelector('.send').onclick = () => { const t = box.querySelector('textarea').value.trim(); if (t) done({ text: t }); };
        box.querySelector('textarea').onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); box.querySelector('.send').click(); } };
        box.querySelector('.date-leave').onclick = () => done({ leave: true });
      });
    },

    async endDay() {
      const S = Game.S;
      const d = Game.pendingDate();
      if (d) {
        const isHe = (d.who || '他') === '他', nm = Game.whoName(d.who || '他');
        const wait = await UI.confirm(isHe ? `他说 ${d.time} 会来（${d.place}）。` : `和${nm}约了 ${d.time}（${d.place}）。`, isHe ? '等他来' : '去赴约', isHe ? '先睡了（放他鸽子）' : '不去了（放鸽子）');
        if (wait) { if ((S.minutes || 0) < d.min) S.minutes = d.min; await UI.transition(d.time, '约好的时间到了', 1400); await this.runDate(d); return; }
        d.done = true; Game.remember(`约好 ${d.time} 和${nm}见面，她没去，放了鸽子`);
        if (isHe) {
          Game.applyFx({ aff: -3 }, 'event');
          S.chats.he.push({ day: S.day, speaker: '他', ko: '누나 자?', zh: '姐姐睡了？' }, { day: S.day, speaker: '他', ko: '…문 앞까지 왔는데', zh: '……我都到门口了' });
        } else if (d.who === '郑书娟') S.chats.friend.push({ day: S.day, speaker: '郑书娟', ko: '야 어디야??', zh: '喂 你人呢？？' }, { day: S.day, speaker: '郑书娟', ko: '나 혼자 고기 굽고 있다 진짜', zh: '我一个人在这烤肉 真的' });
        UI.deskStats();
        return this.endDay();
      }
      const ok = await UI.confirm(`结束第 ${S.day} 天？`, '吃完便当，睡觉', '再玩会儿');
      if (!ok) return;
      // 白天发给弟弟的消息：晚上六点他拿到手机，一起回
      if (S.brotherPending && Game.settings().apiKey) {
        S.brotherPending = false;
        try {
          UI.loading(true, '지호 拿到手机了');
          const j = await API.chatInitiate('brother', '现在是晚上六点零几分，他刚从部队拿到手机，看到姐姐白天发的消息，一起回复她（只回应她白天说的话）。');
          UI.loading(false);
          if (j.replies && j.replies.length) { Phone.pushIncoming('brother', j.replies); await new Promise(r => setTimeout(r, 1800)); }
        } catch (e) { UI.loading(false); console.warn(e); }
      }
      // 第 3 天约好了周五自由餐：每周四晚上十一点他准时发来「明天是周五了」
      if ((S.picks || {}).day3 === 2 && Game.dateOf(S.day).getDay() === 4) {
        S.chats.he.push({ day: S.day, speaker: '他', ko: '내일 금요일이다', zh: '明天是周五了' });
        UI.notify('toktok', '徐允在', '내일 금요일이다', () => {});
        await new Promise(r => setTimeout(r, 1600));
      }
      S.day += 1;
      if (S.day % 7 === 1) Game.applyFx({ exp: -CONFIG.BALANCE.expWeeklyDecay }, 'event'); // 曝光自然回落
      if (S.day % CONFIG.BALANCE.affDriftEvery === 0) Game.applyFx({ aff: -1 }, 'event'); // 各忙各的，感情慢慢淡一点
      S.unread.blink = 0; S.unread.pan = 0; S.unread.insta = 0;
      await UI.transition(`第 ${S.day} 天`, Game.dateStr(S.day), 1200);
      this.startDay();
    },

    // ---------- 曝光 / 结算 ----------
    checkExposure() {
      const S = Game.S;
      if (!S || S.ending) return false;
      if (S.exp >= 100) { this.ending('If You'); return true; }
      const tier = Game.expTier();
      if (tier !== S._lastTier) {
        if (S._lastTier && (tier === '危险' || tier === '临界')) UI.alert(tier === '临界' ? '论坛首页一半都在说他。有人在等元旦的新闻。' : '关于他恋爱的帖子越来越多了。');
        S._lastTier = tier;
        if (!Story.ev && document.querySelector('#scr-desk.on')) Sound.deskBgm();
      }
      return false;
    },

    settle() {
      const S = Game.S;
      let song;
      if (S.amb >= 60) song = '사랑과 전쟁';
      else if (S.flags.cheat) song = 'L.I.E';
      else if (S.exp >= 85) song = 'If You';
      else if (S.aff >= CONFIG.BALANCE.love && S.flags.knot1 && S.flags.knot2) song = 'Love wins all';
      else if (S.aff >= CONFIG.BALANCE.night) song = '밤편지';
      else song = '사랑이 잘';
      this.ending(song);
    },

    async ending(song) {
      const S = Game.S;
      S.ending = song;
      Game.markEnding(song);
      Phone.close(); $('#phone').classList.add('hidden');
      const nm = (CONFIG.ENDING_NAMES || {})[song] || {};
      await UI.transition(`‘${song}’`, nm.zh ? `${nm.zh} · ${nm.artist}` : '', 2400);
      await Story.play('end:' + song);
      if (EVENTS['after:' + song]) { await UI.transition('后日谈', '', 1400); await Story.play('after:' + song); }
      Game.save('auto');
      UI.renderDesk();
      const cg = (CONFIG.ENDING_CG || {})[song];
      UI.modal(`<div class="ending-big"><div class="ending-card"><div class="ec-img" ${cg ? `style="background-image:url(${cg})"` : ''}></div><div class="ec-text"><b>‘${esc(song)}’</b><em>${esc(nm.zh || '')}${nm.artist ? ' · ' + esc(nm.artist) : ''}</em><span>${esc(nm.kind || '')} · 第 ${S.day} 天</span></div></div>
        <button class="btn-small primary" id="end-ok">回到标题</button></div>`, (root) => {
        $('#end-ok', root).onclick = () => { UI.closeModal(); this.toTitle(); };
      });
    }
  };

  window.Main = Main;
  window.addEventListener('DOMContentLoaded', () => Main.boot());
})();
