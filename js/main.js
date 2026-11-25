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
      const waiting = !!(S.pendingReply && S.pendingReply.he);
      Phone.flushPending(); // 之前没回的，到点了就回
      // 行程间隙他可能会来找你；开店时店里的群会有人说话
      if (!Game.settings().apiKey) return;
      const day = S.day;
      if (!waiting && Math.random() < 0.5) this.ping('he', `现在 ${UI.clock()}（她：${Game.workStatus()}）。他在行程间隙或收工以后主动找她，聊今天行程里的幕后小事（今天的行程：${SCHEDULE.todayPlan(day)}）。`, day);
      this.ambient(nx, day);
    },
    // 其他人自己也会发消息：闺蜜、店里的群、三人群、弟弟……每次往后过挑一两个
    ambient(nx, day) {
      const S = Game.S, h = Math.floor((S.minutes % 1440) / 60), now = UI.clock(), st = Game.workStatus();
      const working = /上班/.test(st), list = Game.availableChats();
      const pool = [];
      // 每个人一天主动找你的次数有上限（书娟一天最多两次）
      const cnt = (S.ambientCount && S.ambientCount.day === day) ? S.ambientCount : (S.ambientCount = { day });
      const add = (id, w, why, tp) => { if (list.includes(id) && (cnt[id] || 0) < (this.AMBIENT_MAX[id] || 1)) pool.push({ id, w, why, tp }); };
      // 话题池：每人记住最近用过的几个，挑的时候跳过，免得老围着一个话题转
      const log = S.topicLog || (S.topicLog = {});
      const topic = (id, arr) => {
        const recent = log[id] || [], keep = Math.max(1, Math.floor(arr.length * 0.6));
        let cand = arr.map((t, i) => i).filter(i => !recent.slice(-keep).includes(arr[i]));
        if (!cand.length) cand = arr.map((t, i) => i);
        const i = cand[Math.floor(Math.random() * cand.length)];
        return { id, text: arr[i] };
      };
      const said = (tp) => { if (!tp) return; const r = log[tp.id] || (log[tp.id] = []); r.push(tp.text); if (r.length > 12) r.shift(); };
      const NO_REPEAT = '按这里给的话题来，不要绕回聊天记录里已经聊过的事和说法；话题可以自然展开，不用每句都扣着它。';
      let tp;
      if (S.role === 'civ') {
        tp = working ? (Math.random() < 0.15 ? topic('shop_off', this.SHOP_OFF_TOPICS) : topic('shop', this.SHOP_TOPICS)) : topic('shop_after', this.SHOP_AFTER_TOPICS);
        add('shop', /去店里/.test(nx[1]) ? 6 : working ? 3 : 0.5, `现在 ${now}，${working ? '店里营业中' : '店已经关了'}。白秀珍或吴叡琳在工作群里说话，这次说的是：${tp.text}。工作群以店里的事为主，偶尔闲聊一两句。${NO_REPEAT}`, tp);
        tp = topic('friend', this.FRIEND_TOPICS);
        add('friend', 1.5, `现在 ${now}（她：${st}）。闺蜜郑书娟主动找她，这次聊的是：${tp.text}。书娟早就知道她在和允在交往，不要问"有什么好事""是不是恋爱了""最近气色好"这种话。${NO_REPEAT}`, tp);
      } else {
        tp = Math.random() < 0.15 ? topic('work_off', this.WORK_OFF_TOPICS) : topic('work', this.WORK_TOPICS);
        add('work', working ? 4 : 0.5, `现在 ${now}。公司工作群里有人发消息，这次是：${tp.text}。工作群以公事为主，偶尔有一两句闲话。${NO_REPEAT}`, tp);
        tp = topic('eunji', this.EUNJI_TOPICS);
        add('eunji', working ? 3 : 1, `现在 ${now}（她：${st}）。宋恩智主动找她，这次聊的是：${tp.text}。${NO_REPEAT}`, tp);
      }
      tp = topic('group', this.GROUP_TOPICS);
      add('group', 3, `现在 ${now}。三人群里东旻先说话，这次是：${tp.text}。允在有空也会插一两句。${NO_REPEAT}`, tp);
      const dm = this.DONGMIN_TOPICS.concat(S.day >= 52 && Math.random() < 0.25 ? ['他在追的女团练习生朴夏律的一点小进展（和之前说的一致，还没在一起，进展很慢）'] : []);
      tp = topic('dongmin', dm);
      add('dongmin', 1, `现在 ${now}。东旻单独私聊她，这次聊的是：${tp.text}。${NO_REPEAT}`, tp);
      if (h >= 18 && h < 22) {
        // 跟姐姐要东西：两周最多一次，而且只要小东西
        const canAsk = day - (S.brotherAskDay || -99) >= 14 && Math.random() < 0.3;
        tp = canAsk ? { id: 'brother', text: this.BROTHER_ASK, ask: true } : topic('brother', this.BROTHER_TOPICS);
        add('brother', 2.5, `现在 ${now}，他刚从部队拿到手机，主动找姐姐聊，这次聊的是：${tp.text}。${canAsk ? '' : '这次不要跟姐姐要东西。'}${NO_REPEAT}`, tp);
      }
      if (S.amb >= 20) { tp = topic('siwon', this.SIWON_TOPICS); add('siwon', h >= 22 || h < 3 ? 2 : 0.5, `现在 ${now}。柳时元很克制地主动发一两句消息：${tp.text}。${NO_REPEAT}`, tp); }
      const pick = () => { const tot = pool.reduce((a, x) => a + x.w, 0); let r = Math.random() * tot; for (let k = 0; k < pool.length; k++) { r -= pool[k].w; if (r <= 0) return pool.splice(k, 1)[0]; } return null; };
      const n = Math.random() < 0.25 ? 2 : 1; // 一次一两个人
      for (let k = 0; k < n && pool.length; k++) {
        const x = pick();
        if (x && x.w > 0) {
          cnt[x.id] = (cnt[x.id] || 0) + 1; said(x.tp);
          if (x.tp && x.tp.ask) S.brotherAskDay = day;
          setTimeout(() => this.ping(x.id, x.why, day), 1500 + k * 4000);
        }
      }
    },
    AMBIENT_MAX: { friend: 2, shop: 3, work: 2, eunji: 2, group: 2, dongmin: 1, brother: 1, siwon: 1 },
    DONGMIN_TOPICS: [
      '吐槽允在今天在练习室 / 待机室干的蠢事',
      '求她帮忙打掩护，或者帮忙带个东西',
      '济州老家的事：三个姐姐又合起来教训他、家里民宿来了奇怪的客人、橘子收成',
      '被队长俊浩骂了，来找嫂子诉苦',
      '转发论坛上一个关于允在的帖子，紧张兮兮地问要不要紧',
      '打游戏连输，求嫂子安慰，或者炫耀终于上分了',
      '在网上看到一个很好笑的视频 / 梗，非要分享',
      '宿舍里的事：谁没洗碗、热水器又坏了、俊浩哥半夜在客厅写歌',
      '问嫂子一个很认真的问题：怎么跟姐姐们和好、怎么给妈妈挑生日礼物',
      '今天录综艺 / 拍物料时出的糗',
      '突然很想吃某样东西，问嫂子哪里好吃'
    ],
    FRIEND_TOPICS: [
      '吐槽她自己公司的上司或同事（具体发生了什么）',
      '分享一个八卦、或者刚刷到的好笑的东西',
      '约这周末出去（说清楚去哪：烤肉、逛街、咖啡店、KTV……）',
      '她自己家里的事，或者被妈妈催相亲',
      '下班累死了，求安慰、求一起吃宵夜',
      '推荐一部最近在追的剧或者一家店',
      '看到论坛 / 新闻里允在的消息，来问她允在最近怎么样、你们有没有吵架',
      '她自己的感情：暧昧对象、前任、相亲对象',
      '网购踩雷 / 买到了好东西，发来给她看',
      '她最近在减肥 / 健身 / 学某样东西，汇报进度',
      '想起两个人高中时候的一件事',
      '纠结要不要跳槽、要不要搬家这种大事，问她意见',
      '天气、季节：下雪了、好冷、想吃热乎的'
    ],
    GROUP_TOPICS: [
      '转发论坛帖 / 泡泡截图来报警或者吐槽',
      '吐槽两个人太黏，"저 여기 있어요"',
      '练习室或待机室里刚发生的糗事',
      '宿舍里的小事：谁偷吃了谁的零食、谁没洗碗',
      '俊浩哥又发火了，两个人在群里偷偷吐槽',
      '晚上组队打游戏，拉嫂子一起或者让嫂子评谁更菜',
      '允在和东旻为一件小事吵起来，让嫂子评理',
      '下周的行程，谁要去拍什么、谁要早起',
      '东旻分享一个好笑的视频或者梗',
      '一起想下次三个人去哪吃饭（只是闲聊，不一定约定）',
      '东旻济州家里寄来了东西'
    ],
    SIWON_TOPICS: [
      '练习结束，一个人留在练习室',
      '睡不着',
      '路过便利店看到一样东西想起她',
      '听到一首歌，发了歌名',
      '外面下雨 / 下雪了',
      '很克制地问她吃了没有',
      '今天练会了一段很难的编舞，只说了一句',
      '在宿舍楼下看到一只猫'
    ],
    BROTHER_TOPICS: [
      '吐槽今天部队伙食（具体吃了什么难吃的）',
      '班长 / 分队长的糗事',
      '站岗、夜里值勤：很冷、看到星星或者野猫',
      '训练：行军、射击、体能测验的成绩，有点得意或者很丧',
      '同宿舍战友的趣事：谁收到女朋友的信、谁偷藏零食被抓',
      '数退伍还剩多少天，或者下次休假回家想干什么',
      '妈妈打电话说了家里饭馆的事，转述给姐姐',
      '问姐姐最近累不累、有没有好好吃饭，嘴上还是很贫',
      '在部队小卖部（PX）买了什么好东西',
      '江原道太冷了，已经下雪了',
      '突然很想吃姐姐做的某道菜，点名要回家吃',
      '部队里大家看的电视 / 听说的外面的事，问姐姐是不是真的'
    ],
    BROTHER_ASK: '跟姐姐要一样小东西（暖宝宝、一种零食、厚袜子、润唇膏之类，挑一样聊天记录里没要过的）；不要再要专辑或签名；如果聊天记录里姐姐说过已经寄了东西，先说收到了、分给了谁',
    SHOP_TOPICS: [
      '今天的订单：哪家要加量、哪家改了时间',
      '备菜：哪样食材快没了、要不要临时去市场',
      '配送：叡琳跑到哪了、路上堵、地址找不到',
      '客人的奇怪要求（不要葱、要心形饭团……）',
      '今天卖完了什么、剩了什么',
      '厨房的小事故：电饭锅跳闸、打翻了酱',
      '叡琳上课要迟到 / 请假调班',
      'LUMIÈRE 那边的大订单（对她们来说只是大客户）'
    ],
    SHOP_OFF_TOPICS: [
      '叡琳的考试 / 学校社团的事',
      '秀珍家里的猫又闯祸了',
      '附近新开了一家店，下班要不要去看看',
      '天气突然变冷，提醒大家穿厚点'
    ],
    SHOP_AFTER_TOPICS: [
      '提醒明天的订单和早上几点来备菜',
      '秀珍下班路上随口说点事',
      '叡琳发来一张下班后吃的东西 / 买的东西',
      '有人把东西落在店里了',
      '叡琳问下周排班能不能换'
    ],
    WORK_TOPICS: [
      '明天行程变动、集合时间改了',
      '团员饮食问题：谁偷吃夜宵被发现、谁说想吃炸鸡',
      '会议时间通知',
      '宣传部要她配合拍一段营养餐的物料',
      '有人发错了消息又赶紧撤回',
      '室长要下周的饮食计划表'
    ],
    WORK_OFF_TOPICS: [
      '有人在群里请大家喝咖啡',
      '下班前有人抱怨电梯又坏了',
      '有人分享楼下新开的饭馆'
    ],
    EUNJI_TOPICS: [
      '茶水间听到的艺人传闻',
      '约下午茶 / 一起去楼下咖啡店',
      '吐槽她们组的组长',
      '她自己周末干了什么',
      '公司食堂今天的菜很难吃',
      '打听她最近在忙什么',
      '发来一个购物链接问好不好看',
      '公司新进了一批练习生，听说的事',
      '加班到很晚，求一起点外卖'
    ],
    async ping(id, reason, day) {
      try {
        const S = Game.S, j = await API.chatInitiate(id, reason);
        if (Game.S !== S || S.day !== day) return;
        if (j.replies && j.replies.length) { Phone.pushIncoming(id, j.replies); Phone.maybeDate(id, '', j.replies); } // 对方主动约你：弹框问要不要记进日程
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
      const bg = this.dateBg(d, isHe);
      // 新背景还没生成的话，先用一张现有的顶上
      const img = new Image();
      img.onload = () => Story.setBg(`assets/bg/${bg}.jpg`);
      img.onerror = () => Story.setBg(`assets/bg/${this.BG_FALLBACK[bg] || 'bbq'}.jpg`);
      img.src = `assets/bg/${bg}.jpg`;
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
      // 记一笔这次见面做了什么（旁白摘要），下次见面别重复
      S.dateLog = S.dateLog || [];
      S.dateLog.push({ day: S.day, who, sum: Story.log.filter(l => !/^玩家：/.test(l)).map(l => l.replace(/：[^（]*（([^）]*)）$/, '：$1')).join(' ').replace(/\s+/g, ' ').slice(0, 240) });
      if (S.dateLog.length > 8) S.dateLog = S.dateLog.slice(-8);
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
    // 约在哪，就用哪张背景（新背景见 提示词/1123晚_背景_头像_ins配图提示词.md）
    BG_FALLBACK: { mall: 'corridor', cafe: 'kitchen', pocha: 'bbq', karaoke: 'backstage', street: 'hanriver', chicken: 'bbq', hanpark: 'hanriver', shop: 'kitchen', lounge: 'corridor', jjim: 'apartment' },
    dateBg(d, isHe) {
      const P = (d.place || '') + ' ' + (d.what || ''), h = Math.floor(d.min / 60) % 24;
      const rules = [
        [/她家|你家|我家|^家/, 'apartment'],
        [/汗蒸|찜질/, 'jjim'],
        [/烤肉|고기|삼겹|五花/, 'bbq'],
        [/汉江公园|野餐|한강공원/, 'hanpark'],
        [/炸鸡|치킨|치맥|啤酒/, 'chicken'],
        [/포차|路边摊|帐篷|小酒馆|居酒屋|喝酒|烧酒|酒/, 'pocha'],
        [/KTV|노래방|唱歌|练歌房|K歌/, 'karaoke'],
        [/商场|逛街|购物|百货|COEX|时代广场|买衣服|shopping/i, 'mall'],
        [/咖啡|카페|甜品|下午茶|奶茶|蛋糕/, 'cafe'],
        [/店里|工坊|공방/, 'shop'],
        [/公司|休息室|茶水间|练习室/, isHe ? 'corridor' : 'lounge'],
        [/汉江|兜风|车/, 'hanriver'],
        [/街|弘大|散步|明洞|江南|圣水|延南/, 'street'],
        [/吃|饭|餐|聚/, 'bbq']
      ];
      for (const [re, k] of rules) if (re.test(P)) return k;
      return isHe ? 'parking' : (h >= 18 || h < 5 ? 'street' : 'cafe');
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
          S.chats.he.push({ day: S.day, t: Game.nowMin(), speaker: '他', ko: '누나 자?', zh: '姐姐睡了？' }, { day: S.day, t: Game.nowMin(), speaker: '他', ko: '…문 앞까지 왔는데', zh: '……我都到门口了' });
        } else if (d.who === '郑书娟') S.chats.friend.push({ day: S.day, t: Game.nowMin(), speaker: '郑书娟', ko: '야 어디야??', zh: '喂 你人呢？？' }, { day: S.day, t: Game.nowMin(), speaker: '郑书娟', ko: '나 혼자 고기 굽고 있다 진짜', zh: '我一个人在这烤肉 真的' });
        UI.deskStats();
        return this.endDay();
      }
      const ok = await UI.confirm(`结束第 ${S.day} 天？`, '吃完便当，睡觉', '再玩会儿');
      if (!ok) return;
      // 还没回的：睡前（或者半夜）他们总会回的
      if (S.pendingReply && Object.keys(S.pendingReply).length && Game.settings().apiKey) { UI.loading(true, '睡前看一眼手机'); await Phone.flushPending(true); UI.loading(false); }
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
        S.chats.he.push({ day: S.day, t: Game.nowMin(), speaker: '他', ko: '내일 금요일이다', zh: '明天是周五了' });
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
        if (S._lastTier && (tier === '危险' || tier === '临界')) UI.alert(tier === '临界' ? '论坛首页一半都在说他。有人说，照片已经在记者手里了。' : '关于他恋爱的帖子越来越多了。');
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
