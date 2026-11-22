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
    if cond and 'if' not in b: b['if'] = cond
    cur['blocks'].append(b)

def end_choice():
    global choice, opt
    choice = None; opt = None

stop_settle = False
for raw in lines:
    line = raw.rstrip()
    s = line.strip()
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
            add({'t': 'section', 'text': re.sub(r'^[①-⑩]\s*', '', h)})
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
        cond = header_cond(h)
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
        label = label.strip().strip('「」')
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
open(OUT, 'w', encoding='utf-8').write(
    '// 由 tools/parse_events.py 从「固定文案.md」自动生成，不要手改；改文案请改 md 后重新运行\n'
    'window.EVENTS = ' + json.dumps(events, ensure_ascii=False, indent=1) + ';\n'
    'window.EVENT_ORDER = ' + json.dumps(order, ensure_ascii=False) + ';\n')
for k, v in stats.items(): print(k, v)
