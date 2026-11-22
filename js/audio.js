// 音乐和音效。浏览器要求先有一次点击才能出声，所以第一次点击后才开始放 BGM。
(function () {
  const B = 'assets/bgm/';
  const Audio_ = {
    cur: null, curName: '', want: '', unlocked: false,
    vol() { const s = Game.settings(); return { bgm: s.bgm != null ? +s.bgm : 0.5, sfx: s.sfx != null ? +s.sfx : 0.7 }; },

    bgm(name) {
      this.want = name || '';
      if (!this.unlocked || this.curName === this.want) return;
      const old = this.cur;
      this.curName = this.want;
      if (old) this.fade(old, old.volume, 0, 800, () => old.pause());
      if (!this.want) { this.cur = null; return; }
      const a = new Audio(B + this.want + '.mp3');
      a.loop = true; a.volume = 0;
      a.play().catch(() => {});
      this.cur = a;
      this.fade(a, 0, this.vol().bgm, 1200);
    },
    fade(a, from, to, ms, done) {
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / ms);
        a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
        if (k < 1) requestAnimationFrame(step); else if (done) done();
      };
      requestAnimationFrame(step);
    },
    setVolume() { if (this.cur) this.cur.volume = this.vol().bgm; },
    sfx(name) {
      if (!this.unlocked) return;
      const v = this.vol().sfx; if (!v) return;
      const a = new Audio(B + 'sfx_' + name + '.mp3'); a.volume = v; a.play().catch(() => {});
    },

    // 桌面：曝光危险时换成紧张的音乐
    deskBgm() {
      if (Game.S && Game.S.ending) return;
      const t = Game.S ? Game.expTier() : '安全';
      this.bgm(t === '危险' || t === '临界' ? 'tense' : 'theme');
    }
  };
  window.Sound = Audio_;
  document.addEventListener('pointerdown', () => {
    if (Sound.unlocked) return;
    Sound.unlocked = true;
    const w = Sound.want || 'theme'; Sound.want = ''; Sound.bgm(w);
  }, { capture: true });
})();
