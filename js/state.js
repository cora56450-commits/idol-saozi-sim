// 游戏状态、数值、存档
(function () {
  const SAVE_PREFIX = 'idolsao_save_';
  const SETTINGS_KEY = 'idolsao_settings';
  const GLOBAL_KEY = 'idolsao_global';

  const CHATS = {
    he: { name: '徐允在', short: '윤재', who: '他' },
    group: { name: '우리 셋', short: '셋', who: '三人群' },
    dongmin: { name: '韩东旻', short: '동민', who: '东旻' },
    friend: { name: '郑书娟', short: '서연', who: '郑书娟' },
    siwon: { name: '柳时元', short: '🍱', who: '柳时元' },
    eunji: { name: '宋恩智', short: '은지', who: '宋恩智' },
    work: { name: '영양팀 업무방', short: '업무', who: '公司工作群' },
    brother: { name: '지호 (弟弟)', short: '호', who: '弟弟' }
  };

  function fresh(opts) {
    return {
      ver: 1,
      role: opts.role || 'civ',          // civ 素人线 / staff 员工线
      name: opts.name || '지은',
      sub: opts.sub != null ? opts.sub : (opts.role !== 'staff'),
      day: 1,
      aff: 60, exp: 10, amb: 0,
      flags: { knot1: false, knot2: false, cheat: false },
      lastChoice: 0, outcome: '',
      seen: {},                // 已播放的事件
      chats: { he: [], group: [], dongmin: [], friend: [], siwon: [], eunji: [], work: [], brother: [] },
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
    newGame(opts) { this.S = fresh(opts); return this.S; },

    // 数值变化：source = 'event' 不受每日上限；'chat' 受上限（感情 ±8 / 曝光 ±6）
    applyFx(fx, source) {
      if (!fx) return;
      const S = this.S;
      let a = fx.aff || fx.affection || 0, e = fx.exp || fx.exposure || 0, m = fx.amb || fx.ambiguity || 0;
      a = +a || 0; e = +e || 0; m = +m || 0;
      if (source === 'chat') m = Math.max(-3, Math.min(3, m));
      if (source === 'chat') {
        const capA = 8, capE = 6;
        a = clamp(a, -capA - S.dayDelta.aff, capA - S.dayDelta.aff);
        e = clamp(e, -capE - S.dayDelta.exp, capE - S.dayDelta.exp);
        S.dayDelta.aff += a; S.dayDelta.exp += e;
      }
      S.aff = clamp(S.aff + a, 0, 100);
      S.exp = clamp(S.exp + e, 0, 100);
      S.amb = clamp(S.amb + m, 0, 100);
      if (window.UI && UI.debugRefresh) UI.debugRefresh();
    },
    setFlag(f) { this.S.flags[f] = true; },

    affTier() { const a = this.S.aff; return a >= 75 ? '高' : a >= 40 ? '中' : '低'; },
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
        cheat: S.flags.cheat, lastChoice: S.lastChoice, outcome: S.outcome };
      try { return !!Function(...Object.keys(env), 'return (' + cond + ');')(...Object.values(env)); }
      catch (e) { console.warn('条件出错', cond, e); return true; }
    },

    // 可用的聊天
    availableChats() {
      const S = this.S, list = ['he'];
      if (S.day >= 12 || S.seen.day12) list.push('group');
      list.push('dongmin');
      if (S.role === 'civ') list.push('friend'); else { list.push('work'); list.push('eunji'); }
      if (!S.chats.brother) S.chats.brother = [];
      list.push('brother');
      if (S.amb > 0) list.push('siwon');
      return list;
    },

    // ---- 存档 ----
    save(slot) {
      this.S.savedAt = Date.now();
      localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(this.S));
    },
    load(slot) {
      const raw = localStorage.getItem(SAVE_PREFIX + slot);
      if (!raw) return false;
      this.S = JSON.parse(raw); return true;
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
    markEnding(song) { const g = this.global(); g.endings[song] = Date.now(); localStorage.setItem(GLOBAL_KEY, JSON.stringify(g)); }
  };

  window.Game = Game;
})();
