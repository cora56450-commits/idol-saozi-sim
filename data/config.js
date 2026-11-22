// 可以手改的配置：显示名、背景、立绘、头像、日程
window.CONFIG = {
  START_DATE: '2020-10-04', // 第 1 天的日期；第 90 天 = 2021-01-01
  TOTAL_DAYS: 90,

  // 文案里的说话人 → 界面显示名
  NAMES: {
    '他': '徐允在', '东旻': '韩东旻', '柳时元': '柳时元', '室长': '朴室长', '宋恩智': '宋恩智',
    '郑书娟': '郑书娟', '论坛': '더쿠판', '粉丝': '粉丝', '粉丝群': '粉丝群', '群主': '달빛수집가',
    '群友 A': '群友 A', '群友 B': '群友 B', '群友 C': '群友 C', '送餐员': '送餐员', '女生': '女生',
    '陌生号码': '陌生号码', '车俊浩': '车俊浩', '弟弟': '弟弟 · 지호', '他爸爸': '他爸爸'
  },

  // 线下事件背景（文件在 assets/bg/）。可按身份分开：{ civ: 'xx', staff: 'yy' }
  SCENE_BG: {
    day3: { civ: 'kitchen', staff: 'corridor' },
    day7: 'apartment',
    day25: 'fansign',
    day52: 'hanriver',
    day57: { civ: 'kitchen', staff: 'corridor' },
    day62: 'parking',
    day66: { civ: 'bbq', staff: 'corridor' },
    day78: 'backstage',
    day84: 'apartment',
    day90: 'newyear',
    'end:Love wins all': 'newyear', 'end:If You': 'newyear', 'end:밤편지': 'newyear',
    'end:L.I.E': 'newyear', 'end:사랑과 전쟁': 'corridor', 'end:사랑이 잘': 'newyear'
  },
  // 选了某个选项后换背景：'事件id#选项序号(从1开始)'
  CHOICE_BG: { 'day52#3': 'eastsea' },

  // 立绘：所有人按同一个比例尺（每厘米 8.3 像素）显示，头的大小统一，身高按设定。
  // eye / chin = 原图里眼睛、下巴的 y（像素），cx = 脸中心的 x；h = 身高 cm；adj = 头大小微调；dy = 上下微调（屏幕像素）
  SPRITE_SCALE: { pxPerCm: 8.3, baseEyeY: 230, refHeight: 182, centerX: 800 },
  SPRITE_DEFS: {
    yj_casual: {"eye": 205, "chin": 308, "cx": 470, "h": 182, "adj": 1, "dy": 8},
    yj_home: {"eye": 210, "chin": 303, "cx": 420, "h": 182, "adj": 1.06},
    yj_stage: {"eye": 258, "chin": 365, "cx": 450, "h": 182, "adj": 1.04},
    yj_drama: {"eye": 213, "chin": 313, "cx": 470, "h": 182, "adj": 1.14},
    dm_practice: {"eye": 168, "chin": 280, "cx": 420, "h": 174, "adj": 0.9},
    dm_casual: {"eye": 268, "chin": 398, "cx": 300, "h": 174, "adj": 1.0},
    sw_practice: {"eye": 198, "chin": 270, "cx": 460, "h": 180, "adj": 0.75, "dy": 30},
    sw_casual: {"eye": 215, "chin": 298, "cx": 370, "h": 180, "adj": 0.73, "dy": 38},
    jh: {"eye": 175, "chin": 283, "cx": 340, "h": 183, "adj": 1.06},
    sy: {"eye": 205, "chin": 330, "cx": 440, "h": 163, "adj": 0.96, "female": true},
    ej: {"eye": 200, "chin": 325, "cx": 430, "h": 166, "adj": 1.155, "female": true},
    mgr: {"eye": 298, "chin": 420, "cx": 370, "h": 176, "adj": 1.0, "dy": 40}
  },
  // 说话人默认用哪张立绘
  SPRITES: { '他': 'yj_casual', '东旻': 'dm_practice', '柳时元': 'sw_casual', '车俊浩': 'jh', '郑书娟': 'sy', '宋恩智': 'ej', '室长': 'mgr' },
  // 某个事件里换衣服：事件id → { 说话人: 立绘名 }，可以按身份分 { civ: ..., staff: ... }
  EVENT_OUTFIT: {
    day7: { '他': 'yj_casual' },
    day25: { '他': 'yj_stage' },
    day57: { '柳时元': { civ: 'sw_casual', staff: 'sw_practice' } },
    day62: { '他': 'yj_home' },
    day78: { '他': 'yj_stage' },
    day84: { '他': 'yj_home' },
    day90: { '他': 'yj_stage' },
    'end:Love wins all': { '他': 'yj_home' }, 'after:Love wins all': { '他': 'yj_home' },
    'after:사랑과 전쟁': { '柳时元': 'sw_casual' }
  },
  // 便服有表情差分：台词（中文）里出现这些字就换对应表情，从上往下先匹配到的算
  EXPRESSIONS: {
    base: 'yj_casual',
    rules: [
      ['jealous', '吃醋|别的男|不准|哼'],
      ['hurt', '对不起|呜|难过|委屈|可我|讨厌我'],
      ['sleepy', '困|睡|好累|累死|饿死|好饿'],
      ['pout', '能不能|好不好|嘛|求你|陪我|想见'],
      ['annoyed', '啥|切|有病|烦|闭嘴|笑什么|别笑'],
      ['smile', '哈哈|嘿嘿|开心|好耶|太好了|笑'],
      ['serious', '认真|保证|我是说|真的'],
    ]
  },
  // 头像（1:1 圆角，放 assets/avatar/），没放就显示名字首字
  AVATARS: {
    he: 'assets/avatar/yunjae.png', dongmin: 'assets/avatar/dongmin.png', siwon: 'assets/avatar/siwon.png',
    friend: 'assets/avatar/seoyeon.png', eunji: 'assets/avatar/eunji.png', group: 'assets/avatar/group.png',
    work: 'assets/avatar/work.png', brother: 'assets/avatar/brother.png'
  },

  // 结局 CG（assets/cg/）
  ENDING_CG: {
    'Love wins all': 'assets/cg/end_love.jpg', 'If You': 'assets/cg/end_ifyou.jpg', '밤편지': 'assets/cg/end_night.jpg',
    'L.I.E': 'assets/cg/end_lie.jpg', '사랑과 전쟁': 'assets/cg/end_war.jpg', '사랑이 잘': 'assets/cg/end_part.jpg'
  },

  // 事件 CG：match = 播到含有这段文字的那一行时出现；'事件id#选项序号' = 选了那个选项后出现
  // role 可选，只在某条身份线出现。文件在 assets/cg/<img>.jpg，缩略图 <img>_s.jpg
  EVENT_CG: [
    { ev: 'day1', match: '闪回', role: 'civ', img: 'ev_day1', name: '序章 · 第一次来取餐' },
    { ev: 'day7', match: '猫眼里的人戴着黑色棒球帽', img: 'ev_day7', name: '第 7 天 · 猫眼' },
    { ev: 'day25', match: '你把专辑推过去', img: 'ev_day25', name: '第 25 天 · 签售会' },
    { ev: 'day52', choice: 1, img: 'ev_day52_1', name: '第 52 天 · 汉江车里' },
    { ev: 'day52', choice: 3, img: 'ev_day52_3', name: '第 52 天 · 凌晨东海' },
    { ev: 'day62', choice: 2, img: 'ev_day62', name: '第 62 天 · 停车场蛋糕' },
    { ev: 'day78', match: '他下台的时候经过你身边', img: 'ev_day78', name: '第 78 天 · 后台' },
    { ev: 'day84', choice: 1, img: 'ev_day84_1', name: '第 84 天 · 圣诞' }
  ],

  // 音乐（assets/bgm/）：theme 主题/日常，date 约会/开心，sweet 线下甜蜜，tense 曝光/紧张，sad 悲伤/追忆
  BGM_EVENT: {
    day1: 'theme', day3: 'sweet', day7: 'date', day12: 'date', day16: 'date', day20: 'date', day22: 'tense',
    day25: 'sweet', day30: 'tense', day33: 'tense', day35: 'sweet', day40: 'sad', day48: 'theme', day52: 'date',
    day57: 'tense', day60: 'tense', day62: 'date', day66: 'tense', day72: 'tense', day78: 'sweet', day84: 'date', day90: 'tense',
    'end:Love wins all': 'sweet', 'end:If You': 'sad', 'end:밤편지': 'sweet', 'end:L.I.E': 'sad', 'end:사랑과 전쟁': 'sad', 'end:사랑이 잘': 'sad',
    'after:Love wins all': 'date', 'after:If You': 'sad', 'after:밤편지': 'sweet', 'after:L.I.E': 'sad', 'after:사랑과 전쟁': 'sweet', 'after:사랑이 잘': 'sad',
    intro: 'theme'
  },
  // 事件开始时的音效
  SFX_EVENT: { day72: 'shutter', 'end:If You': 'shutter', 'end:L.I.E': 'shutter' },

  // 他私聊能发的表情包（API 用 id）
  STICKERS: {
    hungry: { img: 'assets/ui/st_hungry.png', ko: '배고파' },
    manager: { img: 'assets/ui/st_manager.png', ko: '실장 미워' },
    bento: { img: 'assets/ui/st_bento.png', ko: '도시락!!' },
    hmph: { img: 'assets/ui/st_hmph.png', ko: '흥' },
    sleepy: { img: 'assets/ui/st_sleepy.png', ko: '졸려' },
    scared: { img: 'assets/ui/st_scared.png', ko: '무서워' },
    noona: { img: 'assets/ui/st_noona.png', ko: '누나' },
    miss: { img: 'assets/ui/st_miss.png', ko: '보고싶다' }
  }
};

// 阶段与每日行程（给 API 当上下文）
window.SCHEDULE = {
  phaseOf(day) {
    if (day <= 15) return '回归准备';
    if (day <= 40) return '回归打歌期';
    if (day <= 70) return day >= 48 ? '空档期·拍剧' : '空档期';
    return '年末颁奖季';
  },
  todayPlan(day) {
    const p = this.phaseOf(day);
    const pick = (arr) => arr[day % arr.length];
    if (p === '回归准备') return pick([
      '上午录音，下午到晚上全员合练，凌晨收工',
      '拍 MV，从早上六点拍到深夜',
      '拍概念照，中午有一个杂志采访，晚上练舞',
      '舞蹈合练一整天，晚上声乐课'
    ]);
    if (p === '回归打歌期') return pick([
      '音乐节目打歌：早上预录，下午 3 点彩排，晚上 6 点直播（无观众）',
      '音乐节目打歌，结束后去录综艺，凌晨收工',
      '上午电台节目，下午打歌彩排，晚上 V LIVE 直播',
      '打歌 + 视频签售（线上），晚上回练习室'
    ]);
    if (p === '空档期') return pick([
      '休息日，在家睡到中午',
      '录一个团综，下午就结束',
      '个人声乐练习，晚上空着'
    ]);
    if (p === '空档期·拍剧') return pick([
      '网剧拍摄：凌晨 4 点出门，拍到晚上 10 点',
      '网剧夜戏：下午出门，拍到第二天凌晨',
      '剧组休息半天，下午练歌',
      '网剧外景，在京畿道，回不来首尔'
    ]);
    return pick([
      '年末颁奖典礼彩排，排到深夜',
      '年末特别舞台录制，后台待机很久',
      '杂志年末刊拍摄 + 练舞',
      '跨年舞台合练'
    ]);
  }
};
