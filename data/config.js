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
    work: 'assets/avatar/work.png', brother: 'assets/avatar/brother.png', moon: 'assets/avatar/moon.png'
  },
  // InstaSnap 上的账号头像：按账号名 / 昵称匹配到上面的头像
  INSTA_AVATAR: [['윤재|允在|yoonjae|yunjae', 'he'], ['동민|东旻|dongmin', 'dongmin'], ['시원|时元|siwon', 'siwon'],
    ['달빛|moon\\.collector', 'moon'], ['서연|书娟|seoyeon|seo\\.', 'friend'], ['은지|恩智|eunji', 'eunji']],

  // InstaSnap 配图（assets/insta/<img>.jpg）：who 匹配账号/昵称，tags 匹配照片描述，挑最贴的一张；没有合适的就只显示文字
  INSTA_PHOTOS: [
    { img: 'ig_01', who: '윤재|允在|yoonjae|yunjae', tags: '自拍|镜子|练习室|口罩' },
    { img: 'ig_02', who: '윤재|允在|yoonjae|yunjae', tags: '窗|咖啡|阳光|精修|侧脸|杯' },
    { img: 'ig_03', who: '윤재|允在|yoonjae|yunjae', tags: '胶片|相机|手|夜|街' },
    { img: 'ig_04', who: '동민|东旻|dongmin', tags: '丑照|睡|车|保姆车|允在' },
    { img: 'ig_05', who: '동민|东旻|dongmin', tags: '吃|炸鸡|辣炒年糕|宿舍|游戏|手柄|外卖' },
    { img: 'ig_06', who: '동민|东旻|dongmin', tags: '自拍|后台|妆|待机室|比耶' },
    { img: 'ig_07', who: '준호|俊浩|junho', tags: '作曲|工作室|键盘|咖啡|屏幕|美式' },
    { img: 'ig_08', who: '시원|时元|siwon', tags: '天花板|练习室|灯' },
    { img: 'ig_09', who: '시원|时元|siwon', tags: '天空|夜|桥|路灯|汉江|云' },
    { img: 'ig_10', who: 'lumiere|루미에르', tags: '合照|后台|四个人|成员|打歌|舞台服' },
    { img: 'ig_11', who: 'lumiere|루미에르', tags: '预告|海报|行程|回归|teaser|日程' },
    { img: 'ig_12', who: '달빛|moon|站姐|fansite|master', tags: '下班|上班|出勤|退勤|口罩|挥手|路' },
    { img: 'ig_13', who: '달빛|moon|站姐|fansite|master', tags: '舞台|红|灯|唱|耳返|直拍' },
    { img: 'ig_14', who: '은채|恩彩|eunchae', tags: '剧组|剧本|片场|自拍|拍摄' },
    { img: 'ig_15', who: '서연|书娟|seoyeon', tags: '猫|办公|键盘|下班|日常' },
    { img: 'ig_16', who: '은지|恩智|eunji', tags: '咖啡|美式|工牌|公司|办公桌' },
    { img: 'ig_17', who: '.', tags: '应援|手灯|小卡|专辑|周边|应援棒' },
    { img: 'ig_18', who: '.', tags: '目击|偶遇|咖啡店|汉南|模糊|远处|帽子|街' }
  ],

  // 结局 CG（assets/cg/）
  // 结局名（真实歌名）的中文和原唱：结局标题卡、结局卡、拍立得里都会一起显示
  ENDING_NAMES: {
    'Love wins all': { zh: '爱赢过一切', artist: 'IU', kind: '公开' },
    'If You': { zh: '如果你', artist: 'BIGBANG', kind: '被扒分手' },
    '밤편지': { zh: '夜信', artist: 'IU', kind: '地下恋继续' },
    'L.I.E': { zh: '谎言', artist: 'EXID', kind: '他劈腿' },
    '사랑과 전쟁': { zh: '爱与战争', artist: 'Davichi', kind: '你劈腿' },
    '사랑이 잘': { zh: '爱不下去了', artist: 'IU & 오혁', kind: '和平分手' }
  },

  ENDING_CG: {
    'Love wins all': 'assets/cg/end_love.jpg', 'If You': 'assets/cg/end_ifyou.jpg', '밤편지': 'assets/cg/end_night.jpg',
    'L.I.E': 'assets/cg/end_lie.jpg', '사랑과 전쟁': 'assets/cg/end_war.jpg', '사랑이 잘': 'assets/cg/end_part.jpg'
  },

  // 事件 CG：match = 播到含有这段文字的那一行时出现；'事件id#选项序号' = 选了那个选项后出现
  // role 可选，只在某条身份线出现；end 可选，播到含有这段文字的行时 CG 收起（可以用 | 隔开写几种）。文件在 assets/cg/<img>.jpg，缩略图 <img>_s.jpg
  EVENT_CG: [
    { ev: 'day1', role: 'civ', img: 'ev_day1', name: '序章 · 第一次来取餐' },
    { ev: 'day7', match: '猫眼里的人戴着黑色棒球帽', end: '你开了门', img: 'ev_day7', name: '第 7 天 · 猫眼' },
    { ev: 'day25', match: '你把专辑推过去', end: '那天之后|当晚|走出唱片店|回到家', img: 'ev_day25', name: '第 25 天 · 签售会' },
    { ev: 'day52', choice: 1, img: 'ev_day52_1', name: '第 52 天 · 汉江车里' },
    { ev: 'day52', choice: 3, img: 'ev_day52_3', name: '第 52 天 · 凌晨东海' },
    { ev: 'day62', choice: 2, img: 'ev_day62', name: '第 62 天 · 停车场蛋糕' },
    { ev: 'day78', match: '他下台的时候经过你身边', end: '你不确定', img: 'ev_day78', name: '第 78 天 · 后台' },
    { ev: 'day84', choice: 1, img: 'ev_day84_1', name: '第 84 天 · 圣诞' }
  ],

  // 数值平衡（11/23 按 90 天模拟调过，见 tools/balance_sim.py）
  BALANCE: {
    chatAffCap: 2,       // 每天聊天最多加多少感情（减的上限还是 4）
    chatAffFloor: 4,
    chatExpCap: 3,       // 每天聊天最多带来多少曝光
    affDriftEvery: 2,    // 每隔几天感情自然 −1（见不到面、各忙各的）
    expWeeklyDecay: 1,   // 曝光每周自然回落
    love: 85,            // Love wins all 需要的感情值（还要两个心结都解开）
    night: 50,           // 밤편지 需要的感情值，低于它是 사랑이 잘
    cheat: 35            // 第 72 天感情低于它，进他劈腿线
  },

  // 一直有效的事实：开局按身份写入；事件结束后（'dayN'）或选了某个选项后（'dayN#选项序号'）写入。
  // 每次调用 API 都会带上，避免 AI 前后矛盾。可以是字符串，或 {civ, staff} 分身份
  FACTS_START: {
    civ: '她在弘大开一家小小的减脂便当工作室（只有她和一个兼职）；以前是他的粉丝，手机里还留着粉丝小号',
    staff: '她是公司签约的艺人营养师，负责几个团回归期的饮食，能进练习室和后台；公司里没有人知道他们在交往；她入职前也是粉丝，留着一个粉丝小号'
  },
  EVENT_FACTS: {
    'day3': { civ: '第 3 天起，LUMIÈRE 回归期的便当由她的工作室供应（公司经纪组连订六周），他每天中午吃的就是她做的便当',
              staff: '第 3 天她给团员发了回归期饮食表：禁止夜宵、含糖饮料、油炸食品（包括炸鸡）；他每天吃的是她配的餐' },
    'day3#1': '她坚持便当里西兰花照放，他嘴上抱怨，西兰花常偷偷拨给东旻',
    'day3#2': '约定：每周五晚上他可以自己选一顿自由餐（炸鸡最多三块）；每周四晚上十一点他都会发「내일 금요일이다」（明天是周五了）',
    'day3#3': '她把他那份便当里的西兰花偷偷换成了芦笋，东旻已经发现「只有哥的不一样」',
    'day12': '东旻知道他们在交往，是团里唯一知情的人；从这天起有了三人群（允在、东旻、玩家）',
    'day16': '第 16 天回归日零点新歌发布；第二段有他的高音，录音时唱了十二遍，用的是第十一遍',
    'day16#1': '第 16 天新歌一发布她就听了，夸了最后那句假声；他说那句本来是真声，是他录完求着制作人改成假声的',
    'day16#2': '第 16 天新歌发布时她先去粉丝群打卡，过了二十分钟才回他，他闹了点小别扭',
    'day20': '第 20 天 LUMIÈRE 拿了回归后第一个一位；他在获奖感言里说「也想谢谢一直照顾我吃饭的人」，被东旻抢话筒圆了过去，论坛有人开始猜是谁',
    'day20#1': '第 20 天她看完直播回他「你疯了吗」，骂他差点在台上说漏嘴',
    'day20#2': '第 20 天她看完直播回他「……我很开心」',
    'day20#3': '第 20 天那晚她一直没回他的消息（在论坛看情况），他发了很多条问她是不是生气了；之后他会小心翼翼地试探',
    'day22': '第 22 天东旻在直播里认领「照顾他吃饭的人」是自己，一位感言的风波暂时压下去了；但他顺口说了允在「在楼上睡觉」',
    'day25': { civ: '第 25 天她用粉丝小号抽中了线下签售会，去现场见了他（他事先不知道）', staff: '第 25 天签售会她作为工作人员在现场' },
    'day25#1': { civ: '签售会上她在便利贴上写了「不准吃夜宵」，他在签名旁边画了一个饭团，「允在签名画饭团」成了论坛上的小热门' },
    'day25#2': { civ: '签售会上她小声叫了他私下的昵称，他笔都歪了；当晚论坛出现「签售会上有人对允在说半语」的帖子' },
    'day25#3': { civ: '签售会上她全程装作不认识他，他回去的车上发来「今天一次都没对我笑」' },
    'day30': '第 30 天站姐的机场图拍到他手机壳背面贴着她给的「戴厨师帽的西兰花」贴纸（另一张贴在她自己手机上），论坛开始讨论',
    'day30#1': '她让他马上换了手机壳，他换成了纯黑的',
    'day30#2': '她删掉了自己 ins 上那张露出同款贴纸的自拍，把 ins 设成了私密，没告诉他',
    'day30#3': '手机壳的事两人都没管，帖子在热榜挂了好几天才掉下去',
    'day35': '第 35 天他和一个女团成员的年末合作舞台直拍爆了，论坛在磕「两个人的化学反应」（那位前辈有男朋友，只是编舞）',
    'day48': '第 48 天起他进剧组拍网剧，和女演员姜恩彩搭档，要拍两个月',
    'day62#2': '他生日那天，她亲手做了一个低糖蛋糕送过去'
  },

  // 剧情开始时手机上的时间（分钟数，01:40 = 100）；剧情里旁白提到时间会自动更新
  EVENT_TIME: { day1: 100 },

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
    if (day === 16) return '回归日：零点新歌音源发布，白天准备，晚上 8 点线上 Showcase 直播';
    const pick = (arr) => arr[day % arr.length];
    // 回归准备期按天写死，一步步走到第 16 天回归（MV 只在第 1 天拍）
    if (p === '回归准备') return [
      '拍 MV，从早上六点拍到第二天凌晨',
      '拍概念照，中午有一个杂志采访，晚上练舞',
      '上午开会（营养师讲回归期饮食计划），下午到晚上全员合练',
      '上午录音棚补录副歌，下午到晚上合练，凌晨收工',
      '舞蹈合练一整天，晚上声乐课',
      '拍回归预告 teaser 短片，晚上合练',
      '上午练舞，下午难得空出半天',
      '录团综（回归特辑），晚上合练',
      '合练一整天，晚上开回归预热 V LIVE',
      '音源最终确认，下午舞台走位彩排',
      '打歌服试装，晚上合练到凌晨',
      '音乐节目预录走位彩排，晚上录团综',
      '全员合练，凌晨收工',
      '回归 Showcase 彩排一整天',
      '回归前一天：Showcase 最终彩排，晚上说要早睡（其实睡不着）'
    ][day - 1];
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
