import json, re
def reply(body):
    d = json.loads(body); sys = d['messages'][0]['content']; user = d['messages'][1]['content']
    if '把下面每一句中文翻成韩文' in sys:
        n = len([l for l in user.split('\n') if re.match(r'^\d+\. ', l)])
        out = {"ko": [f"번역된 말 {i+1}" for i in range(n)]}
    elif '现在是一次线下见面' in sys:
        ph = re.search(r'phase：(\w+)', user).group(1)
        out = {"player_ko": "응", "lines": [{"t": "nar", "text": f"（{ph}）他摘下口罩，把帽子扔在沙发上。"}, {"t": "say", "who": "他", "ko": "오늘 동민이 리허설 때 넘어짐 ㅋㅋ", "zh": "今天东旻彩排的时候摔了哈哈"}], "fx": {"aff": 2, "exp": 0}, "leave": False}
    elif '你要生成游戏里第' in sys:
        out = {"bubble": [{"time": "09:12", "messages": [{"type": "text", "ko": "별들아 굿모닝", "zh": "星星们早安", "note": ""}]}],
               "forum": [{"title_ko": "오늘 윤재 착장", "title_zh": "今天允在的穿搭", "hot": True, "views": 1200, "body_ko": "ㅁㅊ", "body_zh": "疯了", "comments": [{"floor": 1, "author": "무명의 판러", "ko": "ㄹㅇ", "zh": "真的"}]},
                         {"title_ko": "음방 무관중 슬프다", "title_zh": "打歌没观众好难过", "hot": False, "views": 300, "body_ko": "ㅠㅠ", "body_zh": "呜呜", "comments": []}],
               "instasnap": [{"account": "@yunjae_lumiere", "display_name": "윤재", "note": "练习室镜子自拍", "caption_ko": "연습 끝", "caption_zh": "练习结束", "likes": 50321, "comments": [{"account": "@fan1", "ko": "잘생겼다", "zh": "好帅"}]}],
               "fan_group": [{"speaker": "群友 A", "ko": "다들 스밍", "zh": "大家刷流", "time": "10:00"}], "exposure_hint": 0, "alerts": []}
    elif '现在你扮演私下的徐允在' in sys:
        if '【为什么主动发】' in user:
            out = {"player_ko": "", "replies": [{"type": "text", "ko": "누나 나 대기실", "zh": "姐姐我在待机室", "note": ""}], "delta": {}, "flags": [], "date": {}}
        else:
            out = {"player_ko": "오늘 와", "replies": [{"type": "text", "ko": "ㅇㅋ 9시에 갈게", "zh": "好 九点过去", "note": ""}], "delta": {"affection": 1, "exposure": 0}, "flags": ["date_promised"], "date": {"day_offset": 0, "time": "21:00", "place": "她家", "what": "收工后过来"}}
    else:
        out = {"player_ko": "응", "replies": [{"speaker": "白秀珍", "type": "text", "ko": "지은아 오늘 닭가슴살 또 모자라", "zh": "智恩啊 今天鸡胸肉又不够了", "note": ""}], "delta": {}}
    return json.dumps({"choices": [{"message": {"content": json.dumps(out, ensure_ascii=False)}}]})
