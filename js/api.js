// API 调用：支持 OpenAI 兼容接口（OpenAI / DeepSeek / 各种中转）和 Anthropic
(function () {
  function stripJSON(text) {
    if (!text) return null;
    let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b < 0) return null;
    t = t.slice(a, b + 1);
    try { return JSON.parse(t); } catch (e) {
      try { return JSON.parse(t.replace(/,\s*([}\]])/g, '$1')); } catch (e2) { return null; }
    }
  }

  async function rawCall(system, user, maxTokens) {
    const s = Game.settings();
    if (!s.apiKey) throw new Error('NO_KEY');
    if (s.provider === 'anthropic') {
      const base = (s.baseUrl && !/openai/.test(s.baseUrl)) ? s.baseUrl.replace(/\/$/, '') : 'https://api.anthropic.com';
      const r = await fetch(base + '/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': s.apiKey, 'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: s.model, max_tokens: maxTokens || 2000, temperature: +s.temperature, system,
          messages: [{ role: 'user', content: user }] })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
      const j = await r.json();
      return (j.content || []).map(c => c.text || '').join('');
    }
    const r = await fetch(s.baseUrl.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + s.apiKey },
      body: JSON.stringify(Object.assign({ model: s.model, temperature: +s.temperature, max_tokens: maxTokens || 2000,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }] },
        // DeepSeek 默认开思考模式，会慢很多，还会吃掉 max_tokens；游戏里关掉
        /deepseek/i.test(s.baseUrl) ? { thinking: { type: 'disabled' } } : {}))
    });
    if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
    const j = await r.json();
    return j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : '';
  }

  async function callJSON(system, user, maxTokens) {
    for (let i = 0; i < 2; i++) {
      const text = await rawCall(system, user + (i ? '\n\n（上一次输出不是合法 JSON。只输出 JSON 对象，不要任何别的文字。）' : ''), maxTokens);
      const j = stripJSON(text);
      if (j) return j;
      console.warn('JSON 解析失败', text);
    }
    throw new Error('BAD_JSON');
  }

  // 玩家名：韩文名（中文写法），对话里用韩文名
  const pname = () => { const S = Game.S; return S.nameZh && S.nameZh !== S.name ? `${S.name}（中文写作 ${S.nameZh}，韩文台词里一律用 ${S.name}）` : S.name; };
  function common() {
    return PROMPTS.common.replace(/\{player_name\}/g, pname());
  }
  function examples(arr) {
    return arr.map((e, i) => `【样例 ${i + 1}】\n${e}`).join('\n\n');
  }

  function stateBlock(extra) {
    const S = Game.S;
    const ev = EVENTS['day' + S.day];
    return `【当前状态】
第 ${S.day} 天 / 日期 ${Game.dateStr(S.day)} / 阶段：${SCHEDULE.phaseOf(S.day)}
玩家身份：${S.role === 'civ' ? '素人线' : '员工线'}；玩家名：${pname()}
泡泡订阅：${S.sub ? '是' : '否'}
感情值档位：${Game.affTier()}
曝光值档位：${Game.expTier()}
暧昧值：${Game.ambTier()}
心结：①${S.flags.knot1 ? '已解开' : '未解开'}，②${S.flags.knot2 ? '已解开' : '未解开'}
是否进入他劈腿线：${S.flags.cheat ? '是' : '否'}
今天的固定事件：${ev ? ev.title : '无'}
今天他的行程：${SCHEDULE.todayPlan(S.day)}
现在时间：${UI.clock()}；她现在：${Game.workStatus()}
${S.dates && S.dates.length ? '已经约好的见面：' + S.dates.filter(d => !d.done).map(d => `第${d.day}天 ${d.time} 和${Game.whoName(d.who || '他')} ${d.place}（${d.what || ''}）`).join('；') + '\n' : ''}一直有效的事（不要和这些矛盾）：
${(S.facts || []).map(f => '- ' + f).join('\n') || '- （无）'}
最近发生的事：
${S.recent.slice(-8).map(r => '- ' + r).join('\n') || '- （刚开始）'}
${extra || ''}`;
  }

  function transcript(chatId, n) {
    const msgs = Game.S.chats[chatId].slice(-(n || (chatId === 'he' ? 40 : 20)));
    // 按天分段，让 AI 知道哪些话是哪天说的（避免把三天前的事说成「早上」）
    const today = Game.S.day; let lastDay = null; const out = [];
    msgs.forEach(m => {
      if (m.sep) return;
      if (m.sys) { out.push(`（系统：${m.sys}）`); return; }
      const d = m.day || null;
      if (d && d !== lastDay) { out.push(d === today ? '—— 今天 ——' : `—— 第 ${d} 天（${today - d} 天前）——`); lastDay = d; }
      const who = m.me ? '玩家' : (m.speaker || Game.CHATS[chatId].who);
      const txt = m.type === 'sticker' ? `[表情:${m.sticker}]` : m.type === 'voice' ? `[语音] ${m.ko || ''}（${m.zh || m.note || ''}）` : m.type === 'photo' ? `[照片] ${m.note || ''}` : (m.ko ? `${m.ko}（${m.zh || ''}）` : m.zh);
      out.push(`${who}：${txt}`);
    });
    return out.join('\n');
  }

  // 和他以外的人聊天：把提示词里的 {speaker} / {chat_type} 换成这一个聊天
  function otherSys(chatId) {
    const c = Game.CHATS[chatId];
    const type = { group: '三人群（允在、东旻、玩家）', dongmin: '和东旻私聊', friend: '和郑书娟私聊', siwon: '和柳时元私聊',
      eunji: '和宋恩智私聊', work: '公司工作群', shop: '饭力工坊工作群（白秀珍、吴叡琳和玩家）', brother: '和弟弟지호私聊' }[chatId];
    const speaker = chatId === 'group' ? '徐允在和韩东旻' : chatId === 'work' ? '朴室长和宣传部同事' : chatId === 'shop' ? '白秀珍和吴叡琳' : c.who;
    return common() + '\n\n' + PROMPTS.chatOther.replace(/\{speaker\} 和玩家聊天。\{chat_type\} 是 \{[^}]*\}。/, `${speaker} 和玩家聊天。这是${type}。`)
      + (chatId === 'group' ? STICKER_RULE.replace('表情包：', '表情包（只有允在会发）：') : '');
  }

  const STICKER_RULE = `\n\n表情包：type 为 "sticker" 时，ko 字段只能写这些 id 之一：${Object.keys(CONFIG.STICKERS).join(' / ')}（hungry=배고파, manager=실장 미워, bento=도시락!!, hmph=흥, sleepy=졸려, scared=무서워, noona=누나, miss=보고싶다）。不要太频繁，平均三四轮才发一次。`;

  const API = {
    stripJSON,
    test() { return rawCall('Reply with the single word OK.', 'ping', 20); },
    async chat(chatId, playerText, storyCtx) {
      const S = Game.S;
      let sys, fmt, ex;
      if (chatId === 'he') {
        sys = common() + '\n\n' + PROMPTS.chatHe + STICKER_RULE;
        fmt = PROMPTS.chatHeFormat; ex = PROMPTS.chatHeEx;
      } else {
        sys = otherSys(chatId);
        fmt = PROMPTS.chatOtherFormat; ex = PROMPTS.chatOtherEx;
      }
      sys += `\n\n输出格式：\n${fmt}\n\n${examples(ex)}`;
      const user = stateBlock() + `\n【聊天记录（最近）】\n${transcript(chatId) || '（还没有聊过）'}\n\n【玩家刚发来的话（中文原话）】\n${playerText}`
        + (storyCtx ? `\n\n【这段聊天发生在固定剧情中间。你的回复之后剧情会这样接下去，不要和它矛盾，也不要提前说出后面的内容，只回应玩家这一句，3～5 条以内】\n${storyCtx}` : '');
      return callJSON(sys, user, 1500);
    },

    // 对方主动发消息（换日后、事件后），playerText 为空
    async chatInitiate(chatId, reason) {
      const sys = (chatId === 'he' ? common() + '\n\n' + PROMPTS.chatHe + STICKER_RULE : otherSys(chatId)) +
        `\n\n这一次是对方主动发消息，玩家没有说话，player_ko 留空，delta 全部为 0。\n输出格式：\n${chatId === 'he' ? PROMPTS.chatHeFormat : PROMPTS.chatOtherFormat}`;
      const user = stateBlock() + `\n【聊天记录（最近）】\n${transcript(chatId) || '（还没有聊过）'}\n\n【为什么主动发】${reason}`;
      return callJSON(sys, user, 1000);
    },

    // 分两步：part 'A' = 泡泡 + InstaSnap + 曝光提示（先出来给玩家看）；part 'B' = 论坛 + 粉丝群（围绕 A 的内容讨论，在后台生成）
    async feed(part, a) {
      const S = Game.S;
      const prev = [S.day - 1, S.day - 2].map(d => S.feeds[d]).filter(Boolean).map((f, i) =>
        `前${i + 1}天论坛标题：${(f.forum || []).map(p => p.title_zh).join(' / ')}；泡泡摘要：${(f.bubble || []).flatMap(b => b.messages).slice(0, 4).map(m => m.zh).join(' / ')}`).join('\n');
      const sys = common() + '\n\n' + PROMPTS.feed.replace(/\{day\}/g, S.day) +
        `\n\n输出格式：\n${PROMPTS.feedFormat}\n\n${examples(PROMPTS.feedEx)}`;
      let user = stateBlock(prev ? '【前两天的内容（别重复，话题可以接着发酵）】\n' + prev : '');
      if (part === 'A') {
        user += '\n\n【这次只写四个字段】bubble、instasnap、exposure_hint、alerts；forum 和 fan_group 输出空数组（下一步再写）。';
        return callJSON(sys, user, 3000);
      }
      if (part === 'B') {
        const done = `泡泡：${(a.bubble || []).flatMap(b => b.messages.map(m => `${b.time} ${m.zh || m.note || ''}`)).join(' / ')}\nInstaSnap：${(a.instasnap || []).map(x => `${x.display_name || x.account}：${x.note || ''}｜${x.caption_zh || ''}`).join(' / ')}`;
        user += `\n\n【今天的泡泡和 InstaSnap 已经发出去了，内容如下】\n${done}\n\n【这次只写 forum 和 fan_group 两个字段】论坛和粉丝群围绕上面这些内容讨论（时间要在对应泡泡 / 动态之后）；bubble、instasnap 输出空数组，exposure_hint 写 0，alerts 写空数组。`;
        return callJSON(sys, user, 4000);
      }
      return callJSON(sys, user, 6000);
    },

    async post(where, context, playerText) {
      const sys = common() + '\n\n' + PROMPTS.post.replace(/\{더쿠판[^}]*\}/, where) +
        `\n\n输出格式：\n${PROMPTS.postFormat}\n\n${examples(PROMPTS.postEx)}`;
      const user = stateBlock() + `\n【她发言的地方】${where}\n【那里的内容】\n${context}\n\n【玩家的发言（中文原话）】\n${playerText}`;
      return callJSON(sys, user, 1500);
    },

    // 固定事件选项里的「自己说……」
    async storyFree(ev, before, options, playerText, ctx) {
      ctx = ctx || {};
      const lim = { aff: 0, exp: 0, amb: 0 };
      options.forEach(o => Object.keys(lim).forEach(k => { lim[k] = Math.max(lim[k], Math.abs((o.fx || {})[k] || 0)); }));
      const sys = common() + `\n\n现在是固定剧情事件「${ev.title}」里的一个选择点。玩家没有选固定选项，而是自己说了一句话（中文原话）。
请接着剧情写出 4–10 行后续：旁白用中文，旁白里不要夹韩文；任何人说的话（包括「他发来最后一条：……」这种）都单独写成一行台词，韩文 + 中文翻译。风格、长度、节奏要和下面给出的固定选项后续一致。玩家的话本身也要翻成韩文（player_ko），她对允在说半语。
数值变化范围不能超过本事件固定选项：感情值 ±${lim.aff}，曝光值 ±${lim.exp}，暧昧值 ±${lim.amb}。
如果玩家的话等于完成了某个固定选项的关键做法（例如说出具体哪首歌哪一句唱得好），就在 flags 里写和那个选项一样的标记。
只输出 JSON：
{"player_ko":"","lines":[{"t":"nar","text":""},{"t":"say","who":"他","ko":"","zh":""}],"fx":{"aff":0,"exp":0,"amb":0},"flags":[]}`;
      const opts = options.map((o, i) => `选项${i + 1}「${o.label}」${JSON.stringify(o.fx)} 标记:${(o.flags || []).join(',') || '无'}\n后续示例：${o.after.slice(0, ctx.isLast ? 14 : 6).map(b => b.text || ((b.who || '') + '：' + (b.ko || '') + '（' + (b.zh || '') + '）')).join(' / ')}`).join('\n');
      const tail = ctx.isLast
        ? `\n\n【这是这一场的最后一个选择】后续要把这一场完整收尾（写到这次见面 / 这一晚怎么结束，比如他什么时候走、最后一句话），写 8–14 行，长度和收尾方式参考固定选项的后续。`
        : (ctx.next ? `\n\n【你写完以后，剧情会这样接下去】（不要和它矛盾，也不要提前写出来）\n${ctx.next}` : '');
      const user = stateBlock() + `\n【事件到目前为止】\n${before}\n\n【固定选项】\n${opts}\n\n【玩家自己说的话】\n${playerText}` + tail;
      const j = await callJSON(sys, user, 1500);
      j.fx = j.fx || {};
      Object.keys(lim).forEach(k => { j.fx[k] = Math.max(-lim[k], Math.min(lim[k], j.fx[k] || 0)); });
      return j;
    },

    // 线下见面（邀约）：phase = open / talk / close
    async dateTurn(phase, date, history, playerText) {
      const sys = common() + '\n\n' + PROMPTS.date + `\n\n输出格式：\n${PROMPTS.dateFormat}`;
      const who = date.who || '他', cid = { '他': 'he', '郑书娟': 'friend', '东旻': 'dongmin', '柳时元': 'siwon', '宋恩智': 'eunji', '白秀珍': 'shop' }[who] || 'he';
      const user = stateBlock() + `\n【这次见面的人】${who === '他' ? '徐允在' : Game.whoName(who)}\n【这次见面】${date.place || '她家'}，约的是 ${date.time}（${date.what || ''}）；现在 ${UI.clock()}\n【和这个人最近的聊天】\n${transcript(cid, 14) || '（无）'}\n\n【这次见面到目前为止】\n${history || '（刚开始）'}\n\nphase：${phase}` + (playerText ? `\n【玩家这一轮说的话（中文原话）】\n${playerText}` : '');
      const j = await callJSON(sys, user, 1400);
      j.fx = j.fx || {};
      j.fx.aff = Math.max(-3, Math.min(3, +j.fx.aff || 0)); j.fx.exp = Math.max(0, Math.min(2, +j.fx.exp || 0)); j.fx.amb = Math.max(-3, Math.min(3, +j.fx.amb || 0));
      return j;
    },

    // 玩家在剧情里的固定台词（中文）→ 她会打出来的韩文（对允在说半语，口语）
    async translateKo(list) {
      const sys = `把下面每一句中文翻成韩文。说话的人是 24 岁的韩国女生{player}，在 톡톡 上给比她小一岁的男朋友（或者朋友）发消息：半语、口语、像 2020 年韩国年轻人打字，基本不打句号，保留原话的语气，不要加内容。只输出 JSON：{"ko":["", ...]}，顺序和数量与输入一致。`.replace('{player}', Game.S.name);
      const j = await callJSON(sys, list.map((z, i) => `${i + 1}. ${z}`).join('\n'), 1200);
      return Array.isArray(j.ko) ? j.ko : [];
    },

    // 第 33 天：判断玩家写的帖子
    async judgePost(title, body) {
      const sys = common() + `\n\n玩家用粉丝小号在 더쿠판 发了一篇帖子，目的是把"允在手机壳 / 西兰花贴纸 = 有女朋友"的讨论带偏。
判断：说服力够不够、像不像知情人（知道太多私人细节就是翻车）、语气像不像普通粉丝。
先把标题和正文翻成像韩国网友会写的韩文。只输出 JSON：{"title_ko":"","body_ko":"","result":"成功 或 翻车","reason":"一句中文理由"}`;
      return callJSON(sys, stateBlock() + `\n【标题】${title}\n【正文】${body}`, 800);
    }
  };
  window.API = API;
})();
