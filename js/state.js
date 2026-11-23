// 游戏状态、数值、存档
(function () {
  const SAVE_PREFIX = 'idolsao_save_';
  const SETTINGS_KEY = 'idolsao_settings';
  const GLOBAL_KEY = 'idolsao_global';

  // desc：通讯录里名字旁边的一句介绍
  const CHATS = {
    he: { name: '徐允在', short: '윤재', who: '他', desc: 'LUMIÈRE 门面兼主唱 · 男朋友' },
    group: { name: '우리 셋', short: '셋', who: '三人群', desc: '允在、东旻和你' },
    dongmin: { name: '韩东旻', short: '동민', who: '东旻', desc: 'LUMIÈRE 忙内 · 住允在楼下 · 团里唯一知情的人' },
    friend: { name: '郑书娟', short: '서연', who: '郑书娟', desc: '大学同学、闺蜜 · 唯一知道你们在交往的人' },
    siwon: { name: '柳时元', short: '🍱', who: '柳时元', desc: 'LUMIÈRE 主舞' },
    eunji: { name: '宋恩智', short: '은지', who: '宋恩智', desc: '公司宣传部前辈 · 八卦王' },
    work: { name: '영양팀 업무방', short: '업무', who: '公司工作群', desc: '营养组工作群 · 室长和宣传部也在' },
    shop: { name: '밥심 공방 업무방', short: '공방', who: '工坊员工群', desc: '饭力工坊工作群 · 秀珍、叡琳和你' },
    brother: { name: '지호 (弟弟)', short: '호', who: '弟弟', desc: '亲弟弟 · 在江原道当兵，晚上 6–10 点能用手机' }
  };

  function fresh(opts) {
    return {
      ver: 1,
      role: opts.role || 'civ',          // civ 素人线 / staff 员工线
      name: opts.name || '지은', nameZh: opts.nameZh || opts.name || '智恩',
      sub: opts.sub != null ? opts.sub : (opts.role !== 'staff'),
      day: 1,
      aff: 60, exp: 10, amb: 0,
      flags: { knot1: false, knot2: false, cheat: false },
      lastChoice: 0, outcome: '',
      seen: {},                // 已播放的事件
      chats: { he: [], group: [], dongmin: [], friend: [], siwon: [], eunji: [], work: [], shop: [], brother: [] },
      unread: {},
      feeds: {},               // day → feed
      bubbleReplies: [],
      recent: [],              // 最近发生的事（给 API）
      dayDelta: { aff: 0, exp: 0 },
      ending: null,
      savedAt: Date.now()
    };
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const Game = {
    S: null,
    CHATS,
    newGame(opts) { this.S = fresh(opts); const f = (CONFIG.FACTS_START || {})[this.S.role]; this.S.facts = f ? [f] : []; return this.S; },

    // 数值变化：source = 'event' 不受每日上限；'chat' 受上限（感情 ±8 / 曝光 ±6）
    applyFx(fx, source) {
      if (!fx) return;
      const S = this.S;
      let a = fx.aff || fx.affection || 0, e = fx.exp || fx.exposure || 0, m = fx.amb || fx.ambiguity || 0;
      a = +a || 0; e = +e || 0; m = +m || 0;
      if (source === 'chat') m = Math.max(-3, Math.min(3, m));
      if (source === 'chat') {
        const B = CONFIG.BALANCE, capE = B.chatExpCap; // 每天聊天带来的变化上限
        a = clamp(a, -B.chatAffFloor - S.dayDelta.aff, B.chatAffCap - S.dayDelta.aff);
        e = clamp(e, -capE - S.dayDelta.exp, capE - S.dayDelta.exp);
        S.dayDelta.aff += a; S.dayDelta.exp += e;
      }
      S.aff = clamp(S.aff + a, 0, 100);
      S.exp = clamp(S.exp + e, 0, 100);
      S.amb = clamp(S.amb + m, 0, 100);
      if (window.UI && UI.debugRefresh) { UI.debugRefresh(); UI.deskStats(); }
    },
    setFlag(f) { this.S.flags[f] = true; },

    affTier() { const a = this.S.aff, B = CONFIG.BALANCE; return a >= B.love ? '高' : a >= B.night ? '中' : '低'; },
    expTier() { const e = this.S.exp; return e >= 85 ? '临界' : e >= 60 ? '危险' : e >= 30 ? '有苗头' : '安全'; },
    ambTier() { const m = this.S.amb; return m === 0 ? '0' : m < 30 ? '低' : m < 60 ? '中' : '高'; },

    dateOf(day) {
      const d = new Date(CONFIG.START_DATE + 'T12:00:00');
      d.setDate(d.getDate() + day - 1);
      return d;
    },
    dateStr(day) {
      const d = this.dateOf(day);
      const wk = '日一二三四五六'[d.getDay()];
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}（${wk}）`;
    },

    // 一直有效的事实（见 CONFIG.EVENT_FACTS）
    addFact(key) {
      const S = this.S; let f = (CONFIG.EVENT_FACTS || {})[key];
      if (f && typeof f === 'object') f = f[S.role];
      if (!f) return;
      S.facts = S.facts || [];
      if (!S.facts.includes(f)) S.facts.push(f);
    },
    remember(text) {
      const S = this.S;
      S.recent.push(`第${S.day}天：${text}`);
      if (S.recent.length > 12) S.recent.shift();
    },

    // 条件表达式（只来自自己生成的事件数据）
    check(cond) {
      if (!cond) return true;
      const S = this.S;
      const env = { role: S.role, aff: S.aff, exp: S.exp, amb: S.amb, knot1: S.flags.knot1, knot2: S.flags.knot2,
        cheat: S.flags.cheat, lastChoice: S.lastChoice, outcome: S.outcome, sub: !!S.sub, day: S.day, pick: S.picks || {} };
      try { return !!Function(...Object.keys(env), 'return (' + cond + ');')(...Object.values(env)); }
      catch (e) { console.warn('条件出错', cond, e); return true; }
    },

    // 可用的聊天
    availableChats() {
      const S = this.S, list = ['he'];
      if (S.day >= 12 || S.seen.day12) list.push('group');
      if (S.role === 'civ') { if (!S.chats.shop) S.chats.shop = []; list.push('shop'); list.push('friend'); } else { list.push('work'); list.push('eunji'); }
      // 东旻第 12 天才加你（员工线在公司见过，但私下没有联系方式）
      if (S.day >= 12 || S.seen.day12 || (S.chats.dongmin || []).length) list.push('dongmin');
      if (!S.chats.brother) S.chats.brother = [];
      if (S.day >= 20 || S.seen.day20) list.push('brother');
      if (S.amb > 0) list.push('siwon');
      return list;
    },

    // ---- 时间：上班时段、可以跳到的时间点 ----
    // 素人线：饭力工坊 10–19 点（午市 11–14 最忙），每周一店休；员工线：公司 9–18 点，周末休息
    isWorkDay() { const w = this.dateOf(this.S.day).getDay(); return this.S.role === 'civ' ? w !== 1 : (w !== 0 && w !== 6); },
    workHours() { return this.S.role === 'civ' ? [600, 1140] : [540, 1080]; },
    workStatus() {
      const S = this.S, m = S.minutes || 510, [a, b] = this.workHours(), civ = S.role === 'civ';
      if (!this.isWorkDay()) return civ ? '今天店休（每周一），在家' : '周末，公司不上班，在家';
      if (m < a) return civ ? '还没去店里（10 点开店）' : '还没上班（9 点上班）';
      if (m < b) return civ ? (m >= 660 && m < 840 ? '在店里上班，午市正忙，回消息很慢' : '在店里上班') : (m >= 720 && m < 780 ? '在公司，午休' : '在公司上班');
      return m >= 1440 ? '下班了，在家（已经过了零点）' : '下班了，在家';
    },
    timeSlots() {
      const S = this.S;
      if (!this.isWorkDay()) return [[720, '中午', '睡到自然醒，磨蹭到了中午'], [900, '下午', '下午在家收拾、补觉'], [1140, '傍晚', '天黑了'], [1260, '晚上', ''], [1410, '深夜', ''], [1530, '凌晨', '']];
      if (S.role === 'civ') return [[600, '去店里', '开店。秀珍已经在备菜了'], [840, '忙完午市', '午市的单子全部送出去了'], [1020, '下午', '下午的配送和明天的备菜'], [1140, '下班', '关店，叡琳把最后一单送走了'], [1260, '晚上', ''], [1410, '深夜', ''], [1530, '凌晨', '']];
      return [[540, '去公司', '打卡上班'], [780, '午休', '上午的饮食表核对完了'], [1020, '下午', '给团员发明天的菜单'], [1080, '下班', '走出公司大楼'], [1260, '晚上', ''], [1410, '深夜', ''], [1530, '凌晨', '']];
    },
    nextSlot() { const m = this.S.minutes || 510; return this.timeSlots().find(x => x[0] > m + 10) || null; },
    // 他今天的状态：按行程算累不累，心情每天随机一点；今天感情掉得多 / 吵过架就变差
    heMood() {
      const S = this.S;
      if (!S.heMood || S.heMood.day !== S.day) {
        const plan = SCHEDULE.todayPlan(S.day);
        const heavy = /凌晨|一整天|第二天|拍剧|外景|颁奖|直播|彩排一整天/.test(plan), light = /空出|休息|难得|没有行程|放假/.test(plan);
        const r = Math.random();
        S.heMood = { day: S.day, tired: light ? 0 : heavy ? (r < 0.6 ? 2 : 1) : (r < 0.25 ? 2 : r < 0.7 ? 1 : 0), mood: Math.random() < 0.2 ? 0 : Math.random() < 0.55 ? 2 : 1 };
      }
      const m = S.heMood, h = Math.floor(this.nowMin() / 60) % 24;
      let tired = m.tired + ((h >= 23 || h < 3) && m.tired < 2 && !/空出|难得/.test(SCHEDULE.todayPlan(S.day)) ? 1 : 0);
      let mood = m.mood; if (S.dayDelta && S.dayDelta.aff <= -3) mood = 0;
      const T = ['精神还行', '有点累', '累瘫了'][Math.min(2, tired)], M = ['心情不太好', '心情一般', '心情不错'][mood];
      return { tired: Math.min(2, tired), mood, text: `${T}，${M}` };
    },

    // 现在几点（分钟）：剧情里按剧情时间，平时按桌面时间
    nowMin() { return (window.Story && Story.ev && Story.storyMin != null) ? (Story.storyMin < 360 ? Story.storyMin + 1440 : Story.storyMin) : (this.S.minutes || 510); },
    hhmm(min) { return `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; },

    // ---- 约好的见面 ----
    addDate(d, nowDay, who) {
      who = who || '他';
      const S = this.S; S.dates = S.dates || [];
      if (!d || typeof d !== 'object') { const t = String(d || '').match(/(\d{1,2})[:：](\d{2})/); d = { time: t ? `${t[1]}:${t[2]}` : '23:30', place: '她家', what: String(d || '') }; }
      const t = String(d.time || '23:30').match(/(\d{1,2})[:：](\d{2})/) || [0, 23, 30];
      let min = (+t[1]) * 60 + (+t[2]); if (min < 360) min += 1440;
      const day = (nowDay || S.day) + Math.max(0, Math.min(7, Math.round(+d.day_offset || 0)));
      if (S.dates.some(x => x.day === day && (x.who || '他') === who && !x.done)) return null; // 同一个人一天只约一次
      const x = { day, min, time: this.hhmm(min), place: d.place || (who === '他' ? '她家' : '外面'), what: d.what || '', who, done: false };
      S.dates.push(x);
      return x;
    },
    pendingDate() { const S = this.S; return (S.dates || []).filter(x => x.day === S.day && !x.done).sort((a, b) => a.min - b.min)[0] || null; },
    dayWord(day) { const k = day - this.S.day; return k === 0 ? '今天' : k === 1 ? '明天' : k === 2 ? '后天' : this.dateStr(day).slice(5); },
    whoName(who) { return (CONFIG.NAMES[who] || who); },

    // ---- 存档 ----
    save(slot) {
      this.S.savedAt = Date.now();
      localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(this.S));
    },
    load(slot) {
      const raw = localStorage.getItem(SAVE_PREFIX + slot);
      if (!raw) return false;
      this.S = JSON.parse(raw);
      // 旧存档补字段
      const S = this.S;
      if (!S.nameZh) S.nameZh = S.name;
      // 11/23 第五轮：开局事实换成新版（便当店员工、上班时间）
      const f0 = (CONFIG.FACTS_START || {})[S.role];
      if (S.facts && f0 && S.facts[0] && S.facts[0] !== f0 && /^她(在弘大开|是公司签约)/.test(S.facts[0])) S.facts[0] = f0;
      if (!S.chats.shop) S.chats.shop = [];
      // 配图规则改过：读档时让 InstaSnap 动态重新挑图
      Object.values(S.feeds || {}).forEach(f => (f.instasnap || []).forEach(p => { delete p._img; }));
      if (!S.facts) {
        const f = (CONFIG.FACTS_START || {})[S.role]; S.facts = f ? [f] : [];
        Object.keys(S.seen || {}).forEach(id => this.addFact(id));
      }
      return true;
    },
    peek(slot) {
      const raw = localStorage.getItem(SAVE_PREFIX + slot);
      return raw ? JSON.parse(raw) : null;
    },
    autosave() { if (this.S && !this.S.ending) this.save('auto'); },

    settings() {
      const def = { provider: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini',
        temperature: 0.9, bgm: 0.5, sfx: 0.7, textSpeed: 30 };
      try { return Object.assign(def, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) { return def; }
    },
    saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); },

    global() { try { return JSON.parse(localStorage.getItem(GLOBAL_KEY) || '{"endings":{}}'); } catch (e) { return { endings: {} }; } },
    markCG(img) { const g = this.global(); g.cgs = g.cgs || {}; g.cgs[img] = Date.now(); localStorage.setItem(GLOBAL_KEY, JSON.stringify(g)); },
    markEnding(song) { const g = this.global(); g.endings = g.endings || {}; g.endings[song] = Date.now(); localStorage.setItem(GLOBAL_KEY, JSON.stringify(g)); }
  };

  window.Game = Game;
})();
