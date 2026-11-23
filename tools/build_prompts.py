# 从「API提示词.md」抽出提示词 → js/prompts.js
import re, json, sys
t = open(sys.argv[1], encoding='utf-8').read()
bs = [b for _, b in re.findall(r'```(\w*)\n(.*?)```', t, re.S)]
P = {
 'stateTemplate': bs[0], 'common': bs[1],
 'chatHe': bs[2], 'chatHeFormat': bs[3], 'chatHeEx': [bs[4], bs[5]],
 'chatOther': bs[6], 'chatOtherFormat': bs[7], 'chatOtherEx': [bs[8], bs[9]],
 'feed': bs[10], 'feedFormat': bs[11], 'feedEx': [bs[12]],
 'post': bs[14], 'postFormat': bs[15], 'postEx': [bs[16]],
 'date': bs[17], 'dateFormat': bs[18],
}
open(sys.argv[2], 'w', encoding='utf-8').write(
 '// 由 tools/build_prompts.py 从「API提示词.md」生成；改提示词请改 md 后重新运行\nwindow.PROMPTS = ' +
 json.dumps(P, ensure_ascii=False, indent=1) + ';\n')
print('ok', {k: (len(v) if isinstance(v, str) else len(v)) for k, v in P.items()})
