// 手机：主屏、TOKTOK、BLINK、더쿠판、InstaSnap，以及手机事件的播放界面
(function () {
  const { $, $$, esc } = UI;
  const scr = () => $('#phone-screen');
  const N = (who) => (CONFIG.NAMES[who] || who);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // 头像：只用确认存在的文件（启动时预加载），没有就显示名字首字
  const AVAIL = {};
  function preloadAvatars() {
    Object.entries(CONFIG.AVATARS).forEach(([k, src]) => { const im = new Image(); im.onload = () => { AVAIL[k] = src; }; im.src = src; });
  }
  function avatarHTML(key, label) {
    const ch = esc((label || '?').slice(0, 1));
    return AVAIL[key] ? `<div class="avatar"><img src="${AVAIL[key]}" alt=""></div>` : `<div class="avatar">${ch}</div>`;
  }
  const speakerKey = { '弟弟': 'brother', '他': 'he', '徐允在': 'he', '东旻': 'dongmin', '韩东旻': 'dongmin', '柳时元': 'siwon', '郑书娟': 'friend', '宋恩智': 'eunji' };
  const statusBar = (light) => `<div class="status-bar ${light ? 'light' : ''}"><span>${UI.clock()}</span><span>LTE ▮▮▮ 82%</span></div>`;
  const head = (title, sub, back) => `<div class="app-head"><button class="back" data-back="${back || 'home'}"><img src="assets/ui/ic_back.png" alt=""></button><div class="title">${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`;

  function offlineFeed() {
    try { const f = JSON.parse(PROMPTS.feedEx[0]); f.offline = true; return f; } catch (e) { return { bubble: [], forum: [], instasnap: [], fan_group: [] }; }
  }

  const Phone = {
    view: 'home', busy: false,

    isOpen() { return !$('#phone').classList.contains('hidden'); },
    open(view) {
      $('#phone').classList.remove('hidden');
      $('#phone-close').classList.remove('hidden');
      this.go(view || 'home');
    },
    close() {
      if (Story.ev && Story.mode === 'phone') return;
      $('#phone').classList.add('hidden');
      UI.updateBadge();
      Game.autosave();
    },

    go(view, arg) {
      this.view = view; this.arg = arg;
      const S = Game.S;
      UI.tick(1);
      const html = {
        home: () => this.home(),
        toktok: () => this.chatList(),
        chat: () => this.chatView(arg),
        blink: () => this.blink(),
        pan: () => this.panList(),
        post: () => this.panPost(arg),
        insta: () => this.insta(arg || 'feed')
      }[view]();
      scr().innerHTML = html;
      $$('[data-back]', scr()).forEach(b => b.onclick = () => this.go(b.dataset.back));
      this.bind(view, arg);
      const body = $('.app-body', scr());
      if (body && (view === 'chat' || view === 'blink' || (view === 'insta' && arg === 'group'))) body.scrollTop = body.scrollHeight;
      if (view === 'chat') { S.unread[arg] = 0; }
      if (view === 'blink') S.unread.blink = 0;
      if (view === 'pan') S.unread.pan = 0;
      if (view === 'insta') S.unread.insta = 0;
      UI.tip({ home: 'home', chat: 'chat', blink: 'blink', pan: 'pan', insta: 'insta' }[view]);
    },

    unreadTotal() {
      const u = (Game.S && Game.S.unread) || {};
      return Object.values(u).reduce((a, b) => a + (b || 0), 0);
    },
    chatUnread() {
      const u = Game.S.unread;
      return Object.keys(Game.CHATS).reduce((a, k) => a + (u[k] || 0), 0);
    },

    // ---------- 主屏 ----------
    home() {
      const u = Game.S.unread;
      const app = (id, name, n) => `<div class="app-icon" data-app="${id}"><img src="assets/ui/app_${id === 'pan' ? 'pan' : id}.png" alt=""><span>${name}</span>${n ? `<div class="badge">${n}</div>` : ''}</div>`;
      return `<div class="home" style="background-image:url(assets/bg/wallpaper.jpg)">${statusBar(true)}
        <div class="home-clock"><div class="hm">${UI.clock()}</div><div class="dt">${esc(Game.dateStr(Game.S.day))}</div></div>
        <div class="home-apps">${app('toktok', 'TOKTOK', this.chatUnread())}${app('blink', 'BLINK', u.blink)}${app('pan', '더쿠판', u.pan)}${app('insta', 'InstaSnap', u.insta)}</div></div>`;
    },

    // ---------- TOKTOK ----------
    chatList() {
      const S = Game.S;
      const items = Game.availableChats().map(id => {
        const c = Game.CHATS[id], msgs = S.chats[id], last = msgs[msgs.length - 1];
        const lastText = last ? (last.type === 'sticker' ? '[表情]' : last.type === 'photo' ? '[照片]' : last.type === 'voice' ? '[语音]' : (last.ko || last.zh)) : '';
        const n = S.unread[id] || 0;
        return `<div class="item" data-chat="${id}">${avatarHTML(id, c.short)}<div class="meta"><div class="nm">${esc(c.name)}</div><div class="last">${esc(lastText)}</div></div>${n ? `<div class="cnt">${n}</div>` : ''}</div>`;
      }).join('');
      return `<div class="app toktok">${statusBar(true)}${head('TOKTOK', '톡톡')}<div class="app-body chat-list">${items}</div></div>`;
    },

    msgHTML(m, chatId) {
      if (m.sep) return `<div class="day-sep">${esc(m.sep)}</div>`;
      const me = !!m.me;
      let inner;
      if (m.type === 'sticker') {
        const st = CONFIG.STICKERS[m.sticker];
        inner = st ? `<img class="sticker" src="${st.img}" alt="">` : `<div class="bubble">[表情]</div>`;
      } else if (m.type === 'photo') {
        inner = `<div class="photo-card">${esc(m.note || '（照片）')}</div>`;
      } else if (m.type === 'voice') {
        inner = `<div class="bubble voice"><img src="assets/ui/ic_voice.png" alt=""><span>${esc(m.ko || '')}</span></div>${m.note ? `<div class="bubble"><span class="note">${esc(m.note)}</span></div>` : ''}`;
      } else if (me) {
        inner = `<div class="bubble">${m.ko ? esc(m.ko) + `<span class="zh">${esc(m.zh)}</span>` : esc(m.zh)}</div>`;
      } else {
        inner = `<div class="bubble">${esc(m.ko)}<span class="zh">${esc(m.zh)}</span>${m.note ? `<span class="note">${esc(m.note)}</span>` : ''}</div>`;
      }
      if (me) return `<div class="msg me"><div class="col">${inner}</div></div>`;
      const who = m.speaker || Game.CHATS[chatId].who;
      const key = speakerKey[who] || chatId;
      const showName = chatId === 'group' || chatId === 'work';
      return `<div class="msg">${avatarHTML(key, N(who))}<div class="col">${showName ? `<div class="who">${esc(N(who))}</div>` : ''}${inner}</div></div>`;
    },

    chatView(id) {
      const S = Game.S, c = Game.CHATS[id];
      let lastDay = 0, out = '';
      for (const m of S.chats[id]) {
        if (m.day && m.day !== lastDay) { out += this.msgHTML({ sep: Game.dateStr(m.day) }, id); lastDay = m.day; }
        out += this.msgHTML(m, id);
      }
      if (!out) out = `<div class="empty-tip">还没有消息</div>`;
      return `<div class="app toktok">${statusBar(true)}${head(c.name, '', 'toktok')}<div class="app-body"><div class="msgs" id="msgs">${out}</div></div>
        <div class="app-foot"><textarea id="chat-in" placeholder="打中文，发出去会变成韩文"></textarea><button class="send" id="chat-send"><img src="assets/ui/ic_send.png" alt=""></button></div></div>`;
    },

    async sendChat(id, text) {
      const S = Game.S;
      if (this.busy) return;
      const me = { me: true, zh: text, day: S.day };
      S.chats[id].push(me);
      this.go('chat', id);
      UI.tick(3);
      if (!Game.settings().apiKey) {
        await sleep(400);
        S.chats[id].push({ ko: '（还没有设置 API）', zh: '去桌上的专辑 → 设置，填好 API Key 就能聊天了', speaker: Game.CHATS[id].who === '三人群' ? '他' : Game.CHATS[id].who, day: S.day });
        this.go('chat', id); return;
      }
      this.busy = true;
      const box = $('#msgs');
      box.insertAdjacentHTML('beforeend', `<div class="typing" id="typing">입력 중…</div>`);
      $('.app-body', scr()).scrollTop = 1e9;
      try {
        const j = await API.chat(id, text);
        if (j.player_ko) me.ko = j.player_ko;
        Game.applyFx(j.delta, 'chat');
        if (j.flags && j.flags.includes('date_promised') && j.date) Game.remember('约好了：' + j.date);
        this.go('chat', id);
        for (const r of (j.replies || [])) {
          await sleep(700 + Math.random() * 1200);
          const m = { day: S.day, speaker: r.speaker || (id === 'he' ? '他' : Game.CHATS[id].who) };
          if (r.type === 'sticker') { m.type = 'sticker'; m.sticker = r.ko; }
          else if (r.type === 'photo') { m.type = 'photo'; m.note = r.note || r.zh; }
          else if (r.type === 'voice') { m.type = 'voice'; m.ko = r.ko; m.zh = r.zh; m.note = r.note; }
          else { m.ko = r.ko; m.zh = r.zh; m.note = r.note; }
          S.chats[id].push(m);
          Sound.sfx('msg');
          if (this.view === 'chat' && this.arg === id) this.go('chat', id); else S.unread[id] = (S.unread[id] || 0) + 1;
        }
        UI.tick(2);
      } catch (e) {
        S.chats[id].push({ ko: '…', zh: '（API 出错：' + e.message + '）', speaker: '他', day: S.day });
        this.go('chat', id);
      }
      this.busy = false;
      Main.checkExposure();
    },

    // 对方主动发来（不打开也能收到）
    pushIncoming(id, replies) {
      const S = Game.S;
      for (const r of replies) {
        const m = { day: S.day, speaker: r.speaker || (id === 'he' ? '他' : Game.CHATS[id].who) };
        if (r.type === 'sticker') { m.type = 'sticker'; m.sticker = r.ko; }
        else if (r.type === 'photo') { m.type = 'photo'; m.note = r.note || r.zh; }
        else { m.ko = r.ko; m.zh = r.zh; m.note = r.note; if (r.type === 'voice') m.type = 'voice'; }
        S.chats[id].push(m);
      }
      S.unread[id] = (S.unread[id] || 0) + replies.length;
      const first = replies[0];
      if (first) UI.notify('toktok', Game.CHATS[id].name, first.type === 'sticker' ? '[表情]' : (first.ko || '[消息]'), () => { this.open('home'); this.go('chat', id); });
      UI.updateBadge();
    },

    // ---------- BLINK ----------
    feedsRecent(n) {
      const S = Game.S, out = [];
      for (let d = S.day; d >= Math.max(1, S.day - (n || 3) + 1); d--) if (S.feeds[d]) out.push([d, S.feeds[d]]);
      return out;
    },
    blink() {
      const S = Game.S;
      if (!S.sub) {
        return `<div class="app blink">${statusBar()}${head('BLINK', '블링크')}<div class="blink-lock"><img src="assets/ui/ic_lock.png" alt="">
          <div>你没有订阅他的 BLINK。<br>他发的泡泡，论坛和 InstaSnap 上常有人截图。</div>
          <button class="btn-small primary" id="blink-sub">订阅（每月 4,500 원）</button></div></div>`;
      }
      let out = '';
      for (const [d, f] of this.feedsRecent(4).reverse()) {
        out += `<div class="day-sep">${esc(Game.dateStr(d))}</div>`;
        for (const g of (f.bubble || [])) {
          out += `<div class="bubble-time">${esc(g.time)}</div>`;
          for (const m of g.messages) out += this.msgHTML(Object.assign({ speaker: '他' }, m.type === 'photo' ? { type: 'photo', note: m.note } : m), 'he');
        }
      }
      for (const r of S.bubbleReplies.filter(r => r.day >= S.day - 3)) out += this.msgHTML({ me: true, zh: r.text }, 'he');
      if (!out) out = `<div class="empty-tip">他今天还没发泡泡</div>`;
      return `<div class="app blink">${statusBar()}${head('徐允在', 'BLINK · LUMIÈRE')}<div class="app-body"><div class="msgs">${out}</div></div>
        <div class="app-foot"><textarea id="blink-in" placeholder="给他回一句（他看不到单条回复）"></textarea><button class="send" id="blink-send"><img src="assets/ui/ic_send.png" alt=""></button></div></div>`;
    },

    // ---------- 더쿠판 ----------
    allPosts() {
      const list = [];
      for (const [d, f] of this.feedsRecent(3)) (f.forum || []).forEach((p, i) => list.push({ d, i, p }));
      list.sort((a, b) => (b.p.hot ? 1 : 0) - (a.p.hot ? 1 : 0) || b.d - a.d);
      return list;
    },
    panList() {
      const posts = this.allPosts();
      const items = posts.map(({ d, i, p }) => `<div class="post" data-post="${d}:${i}">
        <div class="pt">${p.hot ? '<img src="assets/ui/ic_hot.png" alt="HOT">' : ''}<span>${esc(p.title_ko)}</span></div>
        <div class="pz">${esc(p.title_zh)}</div>
        <div class="pm">${(p.comments || []).length} 评论 · ${(p.views || 0).toLocaleString()} 浏览 · ${esc(Game.dateStr(d).slice(5, 10))}</div></div>`).join('');
      return `<div class="app pan">${statusBar()}${head('더쿠판', 'THEQOOPAN')}<div class="pan-tabs"><div class="on">스퀘어</div><div>핫게</div><div>루미에르</div></div>
        <div class="app-body pan-list">${items || '<div class="empty-tip">还没有帖子</div>'}</div></div>`;
    },
    panPost(key) {
      const [d, i] = key.split(':').map(Number);
      const p = Game.S.feeds[d].forum[i];
      const cm = (p.comments || []).map(c => `<div class="cmt ${c.mine ? 'mine' : ''}"><div class="who">${c.floor ? c.floor + '. ' : ''}${c.author === '원판러' ? '<b>원판러</b>' : esc(c.author || '무명의 판러')}</div>${esc(c.ko)}<span class="zh">${esc(c.zh)}</span>${c.note ? `<span class="zh"><i>${esc(c.note)}</i></span>` : ''}</div>`).join('');
      return `<div class="app pan">${statusBar()}${head('더쿠판', '', 'pan')}<div class="app-body"><div class="pan-post">
        <div class="pt">${esc(p.title_ko)}</div><div class="pz">${esc(p.title_zh)}</div>
        <div class="body">${esc(p.body_ko)}<span class="zh">${esc(p.body_zh)}</span></div>${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}
        <div style="margin-top:14px">${cm}</div></div></div>
        <div class="app-foot"><textarea id="post-in" placeholder="用小号评论（打中文）"></textarea><button class="send" id="post-send"><img src="assets/ui/ic_send.png" alt=""></button></div></div>`;
    },

    // ---------- InstaSnap ----------
    insta(tab) {
      const tabs = `<div class="pan-tabs"><div class="${tab === 'feed' ? 'on' : ''}" data-tab="feed">动态</div><div class="${tab === 'group' ? 'on' : ''}" data-tab="group">粉丝群</div></div>`;
      if (tab === 'group') {
        let out = '';
        for (const [d, f] of this.feedsRecent(3).reverse()) {
          out += `<div class="day-sep">${esc(Game.dateStr(d))}</div>`;
          for (const m of (f.fan_group || [])) {
            if (m.mine) out += this.msgHTML({ me: true, zh: m.zh, ko: m.ko }, 'group');
            else out += `<div class="msg">${avatarHTML('fan', m.speaker)}<div class="col"><div class="who">${esc(m.speaker)} · ${esc(m.time || '')}</div><div class="bubble">${esc(m.ko)}<span class="zh">${esc(m.zh)}</span></div></div></div>`;
          }
        }
        return `<div class="app insta">${statusBar()}${head('InstaSnap', '달빛수집가 粉丝群')}${tabs}<div class="app-body"><div class="msgs">${out || '<div class="empty-tip">群里很安静</div>'}</div></div>
          <div class="app-foot"><textarea id="fg-in" placeholder="用小号在群里说话（打中文）"></textarea><button class="send" id="fg-send"><img src="assets/ui/ic_send.png" alt=""></button></div></div>`;
      }
      const cards = [];
      for (const [d, f] of this.feedsRecent(3)) (f.instasnap || []).forEach((p, i) => cards.push(`<div class="ig-card">
        <div class="ig-top">${avatarHTML('ig', p.display_name || p.account)}<div><div class="acc">${esc(p.account)}</div><div class="dn">${esc(p.display_name || '')}</div></div></div>
        <div class="ig-photo">${esc(p.note || '')}</div>
        <div class="ig-acts"><img src="assets/ui/ic_heart.png" alt=""><img src="assets/ui/ic_comment.png" alt=""><span>${(p.likes || 0).toLocaleString()}</span></div>
        <div class="ig-cap">${esc(p.caption_ko)}<span class="zh">${esc(p.caption_zh)}</span></div>
        <div class="ig-cmts">${(p.comments || []).map(c => `<div class="cmt ${c.mine ? 'mine' : ''}"><b>${esc(c.account)}</b> ${esc(c.ko)}<span class="zh">${esc(c.zh)}</span></div>`).join('')}</div>
        <div class="ig-reply"><input data-ig="${d}:${i}" placeholder="用小号评论…"><button data-igs="${d}:${i}">发布</button></div></div>`));
      return `<div class="app insta">${statusBar()}${head('InstaSnap', '인스타스냅')}${tabs}<div class="app-body">${cards.join('') || '<div class="empty-tip">还没有动态</div>'}</div></div>`;
    },

    async userPost(where, context, text, attach) {
      if (!Game.settings().apiKey) { attach({ mine: true, ko: '', zh: text, author: '나', account: '나', speaker: '나' }, []); return; }
      UI.loading(true, '发出去了…');
      try {
        const j = await API.post(where, context, text);
        Game.applyFx(j.delta, 'chat');
        (j.flags || []).forEach(f => Game.remember(f === 'noticed_by_moon' ? '小号在粉丝群里被月光收藏家注意到了' : f === 'praised_other_idol' ? '小号夸了别的男爱豆' : f));
        attach({ mine: true, ko: j.player_ko, zh: text }, j.reactions || []);
        Game.remember(`用小号在${where}说：${text}`);
      } catch (e) { attach({ mine: true, ko: '', zh: text }, [{ author: '系统', ko: '', zh: 'API 出错：' + e.message }]); }
      UI.loading(false);
      Main.checkExposure();
    },

    bind(view, arg) {
      const S = Game.S, root = scr();
      if (view === 'home') $$('[data-app]', root).forEach(a => a.onclick = () => this.go(a.dataset.app));
      if (view === 'toktok') $$('[data-chat]', root).forEach(a => a.onclick = () => this.go('chat', a.dataset.chat));
      if (view === 'chat') {
        const send = () => { const t = $('#chat-in').value.trim(); if (t && !this.busy) this.sendChat(arg, t); };
        $('#chat-send').onclick = send;
        $('#chat-in').onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } };
      }
      if (view === 'blink') {
        const sub = $('#blink-sub'); if (sub) sub.onclick = () => { S.sub = true; this.go('blink'); };
        const bs = $('#blink-send');
        if (bs) bs.onclick = () => { const t = $('#blink-in').value.trim(); if (t) { S.bubbleReplies.push({ day: S.day, text: t }); this.go('blink'); } };
      }
      if (view === 'pan') $$('[data-post]', root).forEach(a => a.onclick = () => this.go('post', a.dataset.post));
      if (view === 'post') {
        const [d, i] = arg.split(':').map(Number);
        const p = S.feeds[d].forum[i];
        $('#post-send').onclick = () => {
          const t = $('#post-in').value.trim(); if (!t) return;
          const ctx = `${p.title_ko}（${p.title_zh}）\n${p.body_zh}\n` + (p.comments || []).slice(-8).map(c => `${c.ko}（${c.zh}）`).join('\n');
          this.userPost('더쿠판 帖子「' + p.title_zh + '」下面评论', ctx, t, (mine, reacts) => {
            const n = (p.comments || []).length;
            p.comments.push({ floor: n + 1, author: '나 (小号)', ko: mine.ko || mine.zh, zh: mine.ko ? mine.zh : '', mine: true });
            reacts.forEach((r, k) => p.comments.push({ floor: n + 2 + k, author: r.author || '무명의 판러', ko: r.ko, zh: r.zh }));
            this.go('post', arg);
          });
        };
      }
      if (view === 'insta') {
        $$('[data-tab]', root).forEach(t => t.onclick = () => this.go('insta', t.dataset.tab));
        $$('[data-igs]', root).forEach(b => b.onclick = () => {
          const [d, i] = b.dataset.igs.split(':').map(Number);
          const p = S.feeds[d].instasnap[i];
          const t = root.querySelector(`[data-ig="${b.dataset.igs}"]`).value.trim(); if (!t) return;
          this.userPost('InstaSnap 上 ' + p.account + ' 的动态下面评论', `${p.caption_ko}（${p.caption_zh}）\n照片：${p.note}`, t, (mine, reacts) => {
            p.comments = p.comments || [];
            p.comments.push({ account: '나', ko: mine.ko || mine.zh, zh: mine.ko ? mine.zh : '', mine: true });
            reacts.forEach(r => p.comments.push({ account: r.author || '@fan', ko: r.ko, zh: r.zh }));
            this.go('insta', 'feed');
          });
        });
        const fs = $('#fg-send');
        if (fs) fs.onclick = () => {
          const t = $('#fg-in').value.trim(); if (!t) return;
          const f = S.feeds[S.day] || (S.feeds[S.day] = { bubble: [], forum: [], instasnap: [], fan_group: [] });
          const ctx = (f.fan_group || []).slice(-10).map(m => `${m.speaker}：${m.ko}（${m.zh}）`).join('\n');
          this.userPost('月光收藏家的粉丝群', ctx, t, (mine, reacts) => {
            f.fan_group = f.fan_group || [];
            f.fan_group.push({ mine: true, ko: mine.ko, zh: mine.zh, time: UI.clock() });
            reacts.forEach(r => f.fan_group.push({ speaker: r.author || '群友', ko: r.ko, zh: r.zh, time: UI.clock() }));
            this.go('insta', 'group');
          });
        };
      }
    },

    // 底部弹出输入框 / 选项时，给记录留出同样高度，最后几行不会被压住
    padLog(box) {
      const log = $('#story-log'); if (!log) return;
      log.style.paddingBottom = (box ? box.offsetHeight + 20 : 60) + 'px';
      log.scrollTop = log.scrollHeight;
    },

    // ---------- 手机事件播放 ----------
    openStory(title) {
      $('#phone').classList.remove('hidden');
      $('#phone-close').classList.add('hidden');
      scr().innerHTML = `<div class="app">${statusBar()}<div class="app-head"><div class="title" style="padding:0">${esc(title)}</div></div>
        <div class="app-body" style="position:relative"><div class="story-log" id="story-log"></div></div>
        <div class="story-tap" id="story-tap">点击继续 ▼</div></div>`;
      this.view = 'story';
    },
    closeStory() {
      $('#phone-close').classList.remove('hidden');
      $('#phone').classList.add('hidden');
      this.view = 'home';
    },
    storyAppend(html) {
      const log = $('#story-log'); if (!log) return;
      log.insertAdjacentHTML('beforeend', html);
      log.scrollTop = log.scrollHeight;
    },
    storyLine(b) {
      if (b.t === 'nar') return this.storyAppend(`<div class="nar">${esc(b.text)}</div>`);
      if (b.t === 'me') return this.storyAppend(this.msgHTML({ me: true, zh: b.zh }, 'he'));
      if (b.t === 'photo') return this.storyAppend(this.msgHTML({ type: 'photo', note: b.text, speaker: b.who }, 'he'));
      if (b.who === '论坛') return this.storyAppend(`<div class="cmt" style="background:#fff;padding:8px 12px;border:1px solid #e2ddd7"><div class="who">${b.manner === '标题' ? '<b>더쿠판 · 帖子</b>' : '무명의 판러'}</div>${esc(b.ko)}<span class="zh">${esc(b.zh)}</span></div>`);
      const m = { ko: b.ko, zh: b.zh, speaker: b.who };
      const html = this.msgHTML(m, b.who === '他' ? 'he' : 'group');
      this.storyAppend(b.ch === 'bubble' ? html.replace('<div class="col">', '<div class="col"><div class="who">BLINK</div>') : html);
    },
    storyChoices(labels, cb) {
      const app = $('.app', scr());
      const tap = $('#story-tap'); tap.classList.add('hidden');
      const box = document.createElement('div');
      box.className = 'story-choices';
      box.innerHTML = labels.map((l, i) => `<button class="opt" data-i="${i}">${esc(l)}</button>`).join('') +
        `<div class="free"><textarea placeholder="自己说……（打中文）"></textarea><button>发送</button></div>`;
      app.appendChild(box);
      this.padLog(box);
      const fin = (r) => { box.remove(); this.padLog(null); tap.classList.remove('hidden'); cb(r); };
      $$('[data-i]', box).forEach(b => b.onclick = () => fin({ index: +b.dataset.i }));
      $('.free button', box).onclick = () => { const t = $('.free textarea', box).value.trim(); if (t) fin({ free: true, text: t }); };
      return { innerHTML: '', classList: { add() {} } };
    },
    storyInput(placeholder, gal) {
      return new Promise(res => {
        if (gal) {
          const box = $('#choices'); box.classList.remove('hidden');
          box.innerHTML = `<div class="free-box"><textarea placeholder="${esc(placeholder)}"></textarea><button class="send"><img src="assets/ui/ic_send.png" alt=""></button></div>`;
          box.querySelector('.send').onclick = () => { const t = box.querySelector('textarea').value.trim(); if (t) { box.innerHTML = ''; res(t); } };
          return;
        }
        const app = $('.app', scr());
        const tap = $('#story-tap'); tap.classList.add('hidden');
        const box = document.createElement('div');
        box.className = 'story-choices';
        box.innerHTML = `<div class="free"><textarea placeholder="${esc(placeholder)}"></textarea><button>发送</button></div>`;
        app.appendChild(box);
      this.padLog(box);
        $('.free button', box).onclick = () => { const t = $('.free textarea', box).value.trim(); if (t) { box.remove(); this.padLog(null); tap.classList.remove('hidden'); res(t); } };
      });
    },
    storyPost() {
      return new Promise(res => {
        const app = $('.app', scr());
        const tap = $('#story-tap'); tap.classList.add('hidden');
        const box = document.createElement('div');
        box.className = 'story-choices';
        box.innerHTML = `<div style="font-size:13px;text-align:center">用小号在 더쿠판 发帖（打中文）</div>
          <input id="sp-title" placeholder="标题" style="height:38px;border:1px solid #161616;padding:0 10px;font-size:14px">
          <div class="free"><textarea id="sp-body" placeholder="正文" style="height:110px"></textarea><button>发帖</button></div>`;
        app.appendChild(box);
      this.padLog(box);
        $('.free button', box).onclick = () => {
          const title = $('#sp-title').value.trim(), body = $('#sp-body').value.trim();
          if (title && body) { box.remove(); this.padLog(null); tap.classList.remove('hidden'); this.storyAppend(`<div class="cmt" style="background:#fff;padding:8px 12px;border:2px solid #8e1b2a"><div class="who"><b>我的帖子</b></div>${esc(title)}<span class="zh">${esc(body)}</span></div>`); res({ title, body }); }
        };
      });
    },

    offlineFeed, preloadAvatars
  };

  window.Phone = Phone;
})();
