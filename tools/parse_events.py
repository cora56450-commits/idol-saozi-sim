# 把 固定文案.md 转成 data/events.js
import re, json, sys
SRC = sys.argv[1]; OUT = sys.argv[2]
lines = open(SRC, encoding='utf-8').read().split('\n')
HANGUL = re.compile(r'[가-힣ㄱ-ㆎ]')
FX_KEYS = {'感情': 'aff', '曝光': 'exp', '暧昧': 'amb'}

def split_ko_zh(s):
    s = s.strip()
    if not s.endswith('）'): return s, ''
    depth = 0
    for i in range(len(s) - 1, -1, -1):
        if s[i] == '）': depth += 1
        elif s[i] == '（':
            depth -= 1
            if depth == 0:
                return s[:i].strip(), s[i+1:-1].strip()
    return s, ''

def parse_fx(t):
    fx, flags = {}, []
    for k, v in FX_KEYS.items():
        m = re.search(k + r'\s*([+\-−])\s*(\d+)', t)
        if m: fx[v] = int(m.group(2)) * (-1 if m.group(1) in '-−' else 1)
    for m in re.finditer(r'标记「([^」]+)」', t):
        flags.append({'心结①解开': 'knot1', '心结②解开': 'knot2'}.get(m.group(1), m.group(1)))
    return fx, flags

def header_cond(h):
    pm = re.search(r'第\s*(\d+)\s*天(没)?选了?\s*(\d)', h)
    if pm:
        c = 'pick.day%s%s%s' % (pm.group(1), '!=' if pm.group(2) else '==', pm.group(3))
        if '素人线' in h: c = "role=='civ' && " + c
        if '员工线' in h: c = "role=='staff' && " + c
        return c
    if '没订阅泡泡' in h: return '!sub'
    if '订阅了泡泡' in h: return 'sub'
    if '元旦结算时' in h: return 'day>=90'
    if '中途曝光时' in h: return 'day<90'
    if '员工线' in h: return "role=='staff'"
    if '素人线' in h: return "role=='civ'"
    if '感情值 30 以上' in h: return 'aff>=30'
    if '感情值低于 30' in h: return 'aff<30'
    if '心结未解开' in h: return '!knot1'
    if '心结已解开' in h: return 'knot1'
    m = re.search(r'选\s*(\d)\s*或\s*(\d)', h)
    if m: return 'lastChoice==%s||lastChoice==%s' % (m.group(1), m.group(2))
    return None

def speaker_line(text, default_who, channel):
    """'他：ko（zh）' 之类 → block"""
    m = re.match(r'^([^：「」]{1,14})：(.*)$', text)
    if m:
        who_raw, rest = m.group(1).strip(), m.group(2).strip()
        mm = re.match(r'^(成功|翻车)时接$', who_raw)
        if mm:
            ko, zh = split_ko_zh(rest)
            return {'t': 'say', 'who': '东旻', 'ko': ko, 'zh': zh, 'if': "outcome=='%s'" % mm.group(1)}
        KNOWN = {'他','室长','东旻','送餐员','群友 A','群友 B','群友 C','泡泡','粉丝群','群主','论坛','女生','柳时元','宋恩智','郑书娟','陌生号码','标题','回复 1','回复 2','回复 3','他的私聊','粉丝在下面刷','他私聊你','你','你回','车俊浩','姜恩彩','弟弟','아빠'}
        base = re.sub(r'（.*）$', '', who_raw)
        if base not in KNOWN:
            return {'t': 'nar', 'text': text}
        who, manner = who_raw, ''
        pm = re.match(r'^(.+?)（(.+)）$', who_raw)
        if pm: who, manner = pm.group(1), pm.group(2)
        ch = channel
        if '泡泡' in manner: ch = 'bubble'
        if who in ('你', '你回'):
            return {'t': 'me', 'zh': rest.strip('「」')}
        if rest.startswith('[照片]'):
            return {'t': 'photo', 'who': who, 'text': rest[4:].strip()}
        # 只有符号 / 语气的消息（「!!!!!!」「ㅋㅋㅋ」「……」），不需要翻译
        if re.fullmatch(r'[!?！？.。…~～ㅋㅎㅠㅜ\s]+', rest) and who in ('他','东旻','柳时元','郑书娟','宋恩智','弟弟'):
            b = {'t': 'say', 'who': who, 'ko': rest, 'zh': ''}
            if channel: b['ch'] = channel
            return b
        if HANGUL.search(rest) or (split_ko_zh(rest)[1] and who in ('他','东旻','柳时元','室长','郑书娟','宋恩智','弟弟')):
            ko, zh = split_ko_zh(rest)
            if not zh:
                return {'t': 'nar', 'text': text}
            ALIAS = {'아빠': '他爸爸', '泡泡': '他', '他的私聊': '他', '标题': '论坛', '回复 1': '论坛', '回复 2': '论坛', '回复 3': '论坛', '粉丝在下面刷': '粉丝'}
            if who == '泡泡': ch = 'bubble'
            if who == '他的私聊': ch = 'chat'
            b = {'t': 'say', 'who': ALIAS.get(who, who), 'ko': ko, 'zh': zh}
            if who.startswith('标题'): b['manner'] = '标题'
            if manner and '泡泡' not in manner: b['manner'] = manner
            if ch: b['ch'] = ch
            if who == '他私聊你': b['who'] = '他'; b['ch'] = 'chat'
            return b
        return {'t': 'nar', 'text': text}
    if HANGUL.search(text) and default_who and HANGUL.match(text.lstrip('…!?ㅠㅋ .')[:1] or ' ') is not None:
        ko, zh = split_ko_zh(text)
        if not zh: return {'t': 'nar', 'text': text}
        b = {'t': 'say', 'who': default_who, 'ko': ko, 'zh': zh}
        if channel: b['ch'] = channel
        return b
    return {'t': 'nar', 'text': text}

events = {}; order = []
cur = None; part = None
cond = None; choice = None; opt = None
section_who = None; section_ch = None
rolecond = None; in_flash = False; last_cond = None
mode_root = None  # 'prologue' / 'events' / 'endings' / 'after'

def new_event(eid, title, day, mode, kind="event"):
    global stop_settle; stop_settle = False
    global cur, cond, choice, opt, section_who, section_ch
    cur = {'id': eid, 'day': day, 'title': title, 'mode': mode, 'kind': kind, 'blocks': []}
    events[eid] = cur; order.append(eid)
    cond = None; choice = None; opt = None; section_who = None; section_ch = None

def add(b):
    if cur is None: return
    if opt is not None and b.get('_nested'):
        b.pop('_nested', None); opt['after'].append(b); return
    b.pop('_nested', None)
    c = ' && '.join('(%s)' % x for x in (cond, rolecond) if x)
    if c and 'if' not in b: b['if'] = c
    cur['blocks'].append(b)

def end_choice():
    global choice, opt
    choice = None; opt = None

stop_settle = False
for raw in lines:
    line = raw.rstrip()
    s = line.strip()
    if line.startswith('## ') or line.startswith('### ') or s.startswith('- '):
        rolecond = None
    if (line.startswith('## ') or line.startswith('### ')) and in_flash:
        in_flash = False; add({'t': 'scene', 'mode': 'phone'})
    if line.startswith('## '):
        end_choice()
        h = line[3:]
        if h.startswith('序章'):
            mode_root = 'prologue'; new_event('day1', '序章', 1, 'phone')
        elif h.startswith('结局'): mode_root = 'endings'; cur = None
        elif h.startswith('后日谈'): mode_root = 'after'; cur = None
        else: mode_root = 'events'; cur = None
        continue
    if line.startswith('### '):
        end_choice(); h = line[4:].strip()
        if mode_root == 'prologue':
            cond = None
            section_who = '他' if ('私聊' in h or '泡泡' in h) else None
            section_ch = 'bubble' if '泡泡' in h else ('forum' if '论坛' in h else ('chat' if '私聊' in h else None))
            if '论坛' in h: section_who = '论坛'
            title = re.sub(r'（按身份）', '', re.sub(r'^[①-⑩]\s*', '', h)).strip()
            if '闪回' in h:
                in_flash = True
                add({'t': 'scene', 'mode': 'gal', 'title': '闪回', 'sub': title.split('：')[-1], 'bg': {'civ': 'cg:ev_day1', 'staff': 'corridor'}})
                continue
            add({'t': 'section', 'text': title})
            continue
        m = re.match(r'^第\s*(\d+)\s*天\s*·\s*(.+)$', h)
        if m and mode_root == 'events':
            day = int(m.group(1)); title = m.group(2)
            mode = 'gal' if '线下' in title else 'phone'
            new_event('day%d' % day, title, day, mode); stop_settle = False; continue
        m = re.match(r'^‘(.+?)’\s*·\s*(.+)$', h)
        if m and mode_root in ('endings', 'after'):
            song = m.group(1)
            if mode_root == 'endings': new_event('end:' + song, h, 90, 'gal', 'ending')
            else: new_event('after:' + song, h, 90, 'gal', 'after')
            continue
        continue
    if cur is None or not s or s == '---': continue
    if stop_settle: continue
    nested = raw.startswith('  ') and s.startswith('- ')
    # 粗体标题 / 冒号标题
    bm = re.match(r'^\*\*([^*]+)\*\*[：:]?$', s)
    if bm or (re.match(r'^[^-\d].{0,14}[：:]$', s) and ('员工线' in s or '素人线' in s)) or s.startswith('选项：'):
        h = bm.group(1) if bm else s.rstrip('：:')
        if h.startswith('结算顺序'):
            stop_settle = True; continue
        end_choice()
        if h.startswith('选项'):
            c = header_cond(h)
            choice = {'t': 'choice', 'options': []}
            if c: choice['if'] = c
            add(choice); continue
        if h.strip() == '否则':
            cond = '!(%s)' % last_cond if last_cond else None; continue
        cond = header_cond(h); last_cond = cond
        if h.startswith('结尾') or h.startswith('共同') or h.startswith('东旻的正事'):
            if not header_cond(h): cond = None
        continue
    # 选项条目
    om = re.match(r'^(\d+)\.\s+(.*)$', s) if not raw.startswith(' ') else None
    outm = re.match(r'^- \*\*(成功|翻车)\*\*(.*)$', s) if not raw.startswith(' ') else None
    if om or outm:
        if choice is None:
            choice = {'t': 'choice', 'options': []}; add(choice)
        if om:
            body = om.group(2)
        else:
            body = '**%s**%s' % (outm.group(1), outm.group(2)); choice['outcome'] = True
        label = re.sub(r'\*\*', '', body)
        fxm = re.search(r'（([^（）]*(?:感情|曝光|暧昧|标记|无变化)[^（）]*)）\s*[：:]?\s*(.*)$', label)
        fx, flags = ({}, [])
        tail = ''
        if fxm:
            fx, flags = parse_fx(fxm.group(1)); tail = fxm.group(2)
            label = label[:fxm.start()].strip()
        label = label.strip()
        if label.startswith('「') and label.endswith('」') and label.count('「') == 1: label = label[1:-1]
        opt = {'label': label, 'fx': fx, 'flags': flags, 'after': []}
        if tail: opt['after'].append({'t': 'nar', 'text': tail})
        choice['options'].append(opt); continue
    if nested and opt is not None:
        body = s[2:].strip()
        im = re.match(r'^若暧昧值大于\s*(\d+)[：:](.*)$', body)
        if im:
            opt['_cond'] = 'amb>%s' % im.group(1); body = im.group(2).strip()
        b = speaker_line(body, '他', None)
        if opt.get('_cond'): b['if'] = opt['_cond']
        b['_nested'] = True; add(b); continue
    if s.startswith('- ') and opt is not None and not raw.startswith(' '):
        end_choice()
    if opt is not None and not raw.startswith(' '):
        end_choice()
    tm = re.match(r'^画面暗下。标题出现[：:]\s*(.+)$', s)
    if tm:
        add({'t': 'title', 'text': re.sub(r'\*\*', '', tm.group(1)).strip()}); continue
    rm = re.match(r'^\*\*(素人线|员工线)\*\*[：:]\s*(.+)$', s)
    if rm:
        rolecond = "role=='civ'" if rm.group(1) == '素人线' else "role=='staff'"
        s = rm.group(2)
        if in_flash:
            parts = re.findall(r'[^。！？]*[。！？]」?|[^。！？]+$', s)
            buf = ''
            for x in parts:
                if buf and len(buf) + len(x) > 70: add({'t': 'nar', 'text': buf}); buf = ''
                buf += x
            if buf: add({'t': 'nar', 'text': buf})
            continue
    fm = re.match(r'^事件本身[：:](.*?)。(.*)$', s)
    if fm:
        fx, _ = parse_fx(fm.group(1)); add({'t': 'fx', 'fx': fx})
        if fm.group(2).strip(): add({'t': 'nar', 'text': fm.group(2).strip()})
        continue
    if '伏笔' in s and len(s) < 30:
        add({'t': 'note', 'text': s}); continue
    s = re.sub(r'（若是曝光值[^）]*）', '', s)
    if s.startswith('注：') or s.startswith('注:') or s.startswith('自由输入注意'):
        add({'t': 'note', 'text': s}); continue
    if s.startswith('→') or '自由聊天' in s or '自由回复' in s:
        fc = re.match(r'^(之后自由聊天[^。]*。)(.+)$', s)
        if fc and '自由聊天' not in fc.group(2) and '选项' not in fc.group(2):
            # 「之后自由聊天。凌晨一点，他发来最后一条：……」后半句是剧情，不能吞掉
            add({'t': 'freechat', 'text': fc.group(1)})
            rest = fc.group(2).strip()
            sm = re.match(r'^(.*?他发来最后一条)[：:](.+)$', rest)
            if sm:
                add({'t': 'nar', 'text': sm.group(1) + '：'})
                ko, zh = split_ko_zh(sm.group(2).rstrip('。'))
                add({'t': 'say', 'who': '他', 'ko': ko, 'zh': zh, 'ch': 'chat'} if zh else {'t': 'nar', 'text': sm.group(2)})
            else:
                add({'t': 'nar', 'text': rest})
            continue
        add({'t': 'freechat', 'text': s.lstrip('→ ').strip()}); continue
    if s.startswith('**玩家自由写'):
        add({'t': 'freepost', 'text': re.sub(r'\*\*', '', s)}); continue
    if s.startswith('- '):
        add(speaker_line(s[2:].strip(), section_who, section_ch)); continue
    if s.startswith('> '):
        add({'t': 'nar', 'text': s[2:], 'style': 'quote'}); continue
    add({'t': 'nar', 'text': re.sub(r'\*\*', '', s)})

# 统计
stats = {}
for e in events.values():
    n = len(e['blocks']); c = sum(1 for b in e['blocks'] if b['t'] == 'choice')
    stats[e['id']] = (n, c)
def clean(bs):
    for b in bs:
        if b['t'] == 'choice':
            for o in b['options']:
                o.pop('_cond', None); clean(o['after'])
for e in events.values(): clean(e['blocks'])
# 线下事件里：旁白说到「手机亮了 / 发来」之后的台词是手机消息（不显示立绘），说到「推门进来 / 站在面前」之后又回到面对面
PHONE_ON = re.compile(r'手机(亮|震|响)|发来|发了一|来了一条|又来一条|来消息|消息|已读|回了一|私聊|打字|语音|视频通话|电话')
PHONE_OFF = re.compile(r'回信|写信|信纸|信封|猫眼|门外|敲门|门口|楼梯|他说[：:]|推开|推门|走进|进来|进门|开门|站在|坐在|面前|身边|身后|旁边|对面|抬头|车里|车上|走过来|走廊|后台|见到|看到他|他来了|拉住|握住|抱住')
def mark_phone(bs, on):
    for b in bs:
        if b['t'] == 'nar':
            tx = b.get('text', '')
            if PHONE_OFF.search(tx) and not re.search(r'手机|消息', tx): on = False
            elif PHONE_ON.search(tx): on = True
        elif b['t'] == 'section':
            on = False
        elif b['t'] == 'say' and on and not b.get('ch') and b.get('who') not in ('论坛', '泡泡', '粉丝在下面刷', '标题'):
            b['ch'] = 'chat'
        elif b['t'] == 'me' and on and not b.get('ch'):
            b['ch'] = 'chat'
        elif b['t'] == 'choice':
            for o in b['options']: mark_phone(o.get('after', []), on)
    return on
for e in events.values():
    if e['mode'] == 'gal': mark_phone(e['blocks'], False)

# 「下一条隔了很久才来：고마워 누나（谢谢姐姐）」这类旁白里夹着他的一条消息 → 拆成旁白 + 他的消息
INLINE = re.compile(r'^(.{0,40}?(?:他(?:又)?(?:发|回)(?:来|了)?(?:一条|一句|最后一条)?|下一条[^：:]*))[：:]\s*([^（）]*[가-힣][^（）]*)（([^（）]+)）[。.]?$')
def split_inline(bs):
    out = []
    for b in bs:
        if b['t'] == 'choice':
            for o in b['options']: o['after'] = split_inline(o.get('after', []))
        m = INLINE.match(b.get('text', '')) if b['t'] == 'nar' else None
        if m:
            n = {'t': 'nar', 'text': m.group(1) + '：'}
            s = {'t': 'say', 'who': '他', 'ko': m.group(2).strip(), 'zh': m.group(3).strip(), 'ch': 'chat'}
            if b.get('if'): n['if'] = s['if'] = b['if']
            out += [n, s]
        else:
            out.append(b)
    return out
for e in events.values():
    e['blocks'] = split_inline(e['blocks'])

open(OUT, 'w', encoding='utf-8').write(
    '// 由 tools/parse_events.py 从「固定文案.md」自动生成，不要手改；改文案请改 md 后重新运行\n'
    'window.EVENTS = ' + json.dumps(events, ensure_ascii=False, indent=1) + ';\n'
    'window.EVENT_ORDER = ' + json.dumps(order, ensure_ascii=False) + ';\n')
for k, v in stats.items(): print(k, v)
