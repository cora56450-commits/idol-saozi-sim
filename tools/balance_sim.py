"""爱豆嫂子模拟器 · 90 天数值模拟（蒙特卡洛）
用法：python3 balance_sim.py [current|proposed]
"""
import json, random, sys, statistics
from collections import Counter

import os
EV = {int(k): v for k, v in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'events_fx.json'))).items()}

PARAMS = {
    'current': dict(start_aff=60, start_exp=10, chat_aff_cap=4, chat_aff_floor=-4, chat_exp_cap=3,
                    hint_cap=2, exp_weekly_decay=3, aff_daily_drift=0, aff_pull=0.0,
                    love_aff=75, night_aff=40, cheat_aff=30, ifyou_exp=85),
}
PARAMS['proposed'] = dict(PARAMS['current'], chat_aff_cap=2, aff_daily_drift=-0.5, exp_weekly_decay=1,
                          love_aff=85, night_aff=50, cheat_aff=35)  # 11/23 采用的这一版

# 玩家类型：选项偏好、每天聊天概率、聊天时 AI 给的感情 / 曝光变化
PLAYERS = {
    '谨慎型': dict(pick='safe', p_chat=0.8, chat_aff=(0, 1, 2, 2), chat_exp=(0, 0, 0, 1)),
    '随便选': dict(pick='random', p_chat=0.6, chat_aff=(-1, 0, 1, 2), chat_exp=(0, 0, 1)),
    '恋爱脑': dict(pick='sweet', p_chat=0.95, chat_aff=(1, 2, 3, 3), chat_exp=(0, 1, 1, 2)),
    '冷淡型': dict(pick='cold', p_chat=0.25, chat_aff=(-3, -2, -1, 0), chat_exp=(0,)),
}

def check(cond, role, S):
    if not cond: return True
    env = dict(role=role, aff=S['aff'], exp=S['exp'], amb=S['amb'], knot1=S['knot1'], knot2=S['knot2'])
    c = cond.replace('&&', ' and ').replace('||', ' or ').replace('!', ' not ').replace(' not =', '!=')
    try: return bool(eval(c, {}, env))
    except Exception: return True

def choose(opts, how, rng):
    score = lambda o: (o['fx'].get('aff', 0), -o['fx'].get('exp', 0))
    if how == 'random': return rng.randrange(len(opts))
    if how == 'safe': return min(range(len(opts)), key=lambda i: (opts[i]['fx'].get('exp', 0), -opts[i]['fx'].get('aff', 0)))
    if how == 'sweet': return max(range(len(opts)), key=lambda i: opts[i]['fx'].get('aff', 0) * 2 + opts[i]['fx'].get('exp', 0))
    if how == 'cold': return min(range(len(opts)), key=lambda i: opts[i]['fx'].get('aff', 0))

def run(P, player, role, rng):
    S = dict(aff=P['start_aff'], exp=P['start_exp'], amb=0, knot1=False, knot2=False, cheat=False)
    clamp = lambda v: max(0, min(100, v))
    peak_exp = S['exp']; tier_days = Counter()
    for d in range(1, 91):
        if d == 72 and S['aff'] < P['cheat_aff']: S['cheat'] = True
        ev = EV.get(d)
        if ev:
            for f in ev['fx']:
                if check(f['if'], role, S):
                    for k, v in f['fx'].items(): S[k] = clamp(S[k] + v)
            for c in ev['ch']:
                if not check(c['if'], role, S): continue
                if d == 33:  # 发帖：结果看写得好不好
                    i = 0 if rng.random() < (0.75 if player['pick'] != 'cold' else 0.5) else 1
                else:
                    i = choose(c['opts'], player['pick'], rng)
                o = c['opts'][i]
                for k, v in o['fx'].items(): S[k] = clamp(S[k] + v)
                for fl in o['flags']: S[fl] = True
        # 每日动态的曝光提示（观察到的分布：0 居多，偶尔 +1 / +2，说漏嘴那天更高）
        h = rng.choices([0, 1, 2, 3], weights=[50, 33, 12, 5])[0]
        S['exp'] = clamp(S['exp'] + min(P['hint_cap'], h))
        # 聊天
        if rng.random() < player['p_chat']:
            S['aff'] = clamp(S['aff'] + max(P['chat_aff_floor'], min(P['chat_aff_cap'], rng.choice(player['chat_aff']))))
            S['exp'] = clamp(S['exp'] + min(P['chat_exp_cap'], rng.choice(player['chat_exp'])))
        S['aff'] = clamp(S['aff'] + P['aff_daily_drift'])
        if d % 7 == 0: S['exp'] = clamp(S['exp'] - P['exp_weekly_decay'])
        peak_exp = max(peak_exp, S['exp'])
        tier_days['安全' if S['exp'] < 30 else '有苗头' if S['exp'] < 60 else '危险' if S['exp'] < 85 else '临界'] += 1
        if S['exp'] >= 100: return 'If You（中途曝光）', S, d, peak_exp, tier_days
    if S['amb'] >= 60: e = '사랑과 전쟁'
    elif S['cheat']: e = 'L.I.E'
    elif S['exp'] >= P['ifyou_exp']: e = 'If You'
    elif S['aff'] >= P['love_aff'] and S['knot1'] and S['knot2']: e = 'Love wins all'
    elif S['aff'] >= P['night_aff']: e = '밤편지'
    else: e = '사랑이 잘'
    return e, S, 90, peak_exp, tier_days

def main(which):
    P = PARAMS[which]
    print(f'==== 参数：{which} ====')
    for name, pl in PLAYERS.items():
        rng = random.Random(42)
        ends = Counter(); affs = []; exps = []; aff40 = []; peaks = []; danger = []
        for _ in range(2000):
            role = rng.choice(['civ', 'staff'])
            e, S, d, pk, td = run(P, pl, role, rng)
            ends[e] += 1; affs.append(S['aff']); exps.append(S['exp']); peaks.append(pk)
            danger.append(td['危险'] + td['临界'])
        # 第 40 天的感情值（单独再跑一遍到 40 天）
        top = ', '.join(f'{k} {v / 20:.0f}%' for k, v in ends.most_common())
        print(f'{name}: 结局 {top}')
        print(f'    第 90 天 感情 中位 {statistics.median(affs):.0f}（{min(affs)}–{max(affs)}） 曝光 中位 {statistics.median(exps):.0f} 峰值中位 {statistics.median(peaks):.0f}  处在危险/临界的天数 中位 {statistics.median(danger):.0f}')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'current')
