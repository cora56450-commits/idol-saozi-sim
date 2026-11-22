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
    bindSetup() {
      $$('#scr-setup .role').forEach(b => b.onclick = () => { this.setupRole = b.dataset.role; this.refreshSetup(); });
      $('#setup-sub').onchange = () => { this.subTouched = true; };
      $('#scr-setup [data-act=back]').onclick = () => UI.show('scr-title');
      $('#scr-setup [data-act=start]').onclick = () => {
        Game.newGame({ role: this.setupRole, name: $('#setup-name').value.trim() || '지은', sub: $('#setup-sub').checked });
        if (!Game.settings().apiKey) UI.notify('toktok', '提示', '还没设置 API：聊天、论坛、泡泡会用离线样例。桌上的专辑 → 设置');
        this.startDay();
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

    // ---------- 一天 ----------
    async startDay() {
      const S = Game.S;
      S.minutes = 600; S.dayDelta = { aff: 0, exp: 0 };
      const id = 'day' + S.day;
      const ev = EVENTS[id];
      if (ev && !S.seen[id]) {
        if (S.day === 72 && S.aff < 30) S.flags.cheat = true;
        await Story.play(id);
        Game.remember(`发生了「${ev.title.replace(/（.*?）$/, '')}」`);
        if (this.checkExposure()) return;
        if (S.day === 90) return this.settle();
      }
      UI.renderDesk();
      Game.autosave();
      if (!S.feeds[S.day]) await this.genFeed();
      if (!ev && Game.settings().apiKey && S.day > 1) this.morningPing();
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
      const S = Game.S;
      let f;
      if (Game.settings().apiKey) {
        UI.loading(true, '大家在刷手机…');
        try { f = await API.feed(); } catch (e) { console.warn(e); UI.notify('pan', 'API 出错', e.message); }
        UI.loading(false);
      }
      if (!f) f = Phone.offlineFeed();
      S.feeds[S.day] = f;
      // 只留最近 5 天，避免存档太大
      Object.keys(S.feeds).forEach(d => { if (+d < S.day - 4) delete S.feeds[d]; });
      S.unread.blink = S.sub ? (f.bubble || []).length : 0;
      S.unread.pan = (f.forum || []).length;
      S.unread.insta = (f.instasnap || []).length;
      if (!f.offline) Game.applyFx({ exp: Math.max(-5, Math.min(5, f.exposure_hint || 0)) }, 'event');
      if (!f.offline) (f.alerts || []).forEach(a => Game.remember(a));
      if (f.alerts && f.alerts.length && !f.offline && !Story.ev) UI.alert(f.alerts[0]);
      else if (S.sub && f.bubble && f.bubble[0]) UI.notify('blink', 'BLINK · 徐允在', f.bubble[0].messages[0].ko, () => Phone.open('blink'));
      UI.updateBadge();
      this.checkExposure();
      Game.autosave();
    },

    async morningPing() {
      try {
        const j = await API.chatInitiate('he', `新的一天（${SCHEDULE.todayPlan(Game.S.day)}），他在出门前或休息间隙主动找你。`);
        if (j.replies && j.replies.length) Phone.pushIncoming('he', j.replies);
      } catch (e) { console.warn(e); }
    },

    async endDay() {
      const S = Game.S;
      const ok = await UI.confirm(`结束第 ${S.day} 天？`, '吃完便当，睡觉', '再玩会儿');
      if (!ok) return;
      S.day += 1;
      if (S.day % 7 === 1) Game.applyFx({ exp: -3 }, 'event'); // 曝光自然回落：一周 −3
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
      }
      return false;
    },

    settle() {
      const S = Game.S;
      let song;
      if (S.amb >= 60) song = '사랑과 전쟁';
      else if (S.flags.cheat) song = 'L.I.E';
      else if (S.exp >= 85) song = 'If You';
      else if (S.aff >= 75 && S.flags.knot1 && S.flags.knot2) song = 'Love wins all';
      else if (S.aff >= 40) song = '밤편지';
      else song = '사랑이 잘';
      this.ending(song);
    },

    async ending(song) {
      const S = Game.S;
      S.ending = song;
      Game.markEnding(song);
      Phone.close(); $('#phone').classList.add('hidden');
      await UI.transition(`‘${song}’`, '', 2200);
      await Story.play('end:' + song);
      if (EVENTS['after:' + song]) { await UI.transition('后日谈', '', 1400); await Story.play('after:' + song); }
      Game.save('auto');
      UI.renderDesk();
      const cg = (CONFIG.ENDING_CG || {})[song];
      const names = { 'Love wins all': '公开', 'If You': '被扒分手', '밤편지': '地下恋继续', 'L.I.E': '他劈腿', '사랑과 전쟁': '你劈腿', '사랑이 잘': '和平分手' };
      UI.modal(`<div class="ending-big"><div class="ending-card"><div class="ec-img" ${cg ? `style="background-image:url(${cg})"` : ''}></div><div class="ec-text"><b>‘${esc(song)}’</b><span>${esc(names[song] || '')} · 第 ${S.day} 天</span></div></div>
        <button class="btn-small primary" id="end-ok">回到标题</button></div>`, (root) => {
        $('#end-ok', root).onclick = () => { UI.closeModal(); this.toTitle(); };
      });
    }
  };

  window.Main = Main;
  window.addEventListener('DOMContentLoaded', () => Main.boot());
})();
