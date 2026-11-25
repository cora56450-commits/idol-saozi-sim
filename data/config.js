// 可以手改的配置：显示名、背景、立绘、头像、日程
window.CONFIG = {
  START_DATE: '2020-10-04', // 第 1 天的日期；第 90 天 = 2021-01-01
  TOTAL_DAYS: 90,

  // 文案里的说话人 → 界面显示名
  NAMES: {
    '他': '徐允在', '东旻': '韩东旻', '柳时元': '柳时元', '室长': '朴室长', '宋恩智': '宋恩智',
    '郑书娟': '郑书娟', '论坛': '더쿠판', '粉丝': '粉丝', '粉丝群': '粉丝群', '群主': '달빛수집가',
    '群友 A': '群友 A', '群友 B': '群友 B', '群友 C': '群友 C', '送餐员': '送餐员', '女生': '女生',
    '陌生号码': '陌生号码', '车俊浩': '车俊浩', '弟弟': '弟弟 · 지호', '他爸爸': '他爸爸',
    '白秀珍': '白秀珍', '吴叡琳': '吴叡琳', '秀珍': '白秀珍', '叡琳': '吴叡琳'
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
    work: 'assets/avatar/work.png', brother: 'assets/avatar/brother.png', moon: 'assets/avatar/moon.png',
    shop: 'assets/avatar/shop.png', official: 'assets/avatar/official.png', junho: 'assets/avatar/junho.png',
    sujin: 'assets/avatar/sujin.png', yerin: 'assets/avatar/yerin.png'
  },
  // InstaSnap 上的账号头像：按账号名 / 昵称匹配到上面的头像
  INSTA_AVATAR: [['윤재|允在|yoonjae|yunjae', 'he'], ['동민|东旻|dongmin', 'dongmin'], ['시원|时元|siwon', 'siwon'],
    ['달빛|moon\\.collector', 'moon'], ['서연|书娟|seoyeon|seo\\.', 'friend'], ['은지|恩智|eunji', 'eunji'],
    ['lumiere_official|루미에르|lumière', 'official'], ['준호|俊浩|junho', 'junho']],

  // InstaSnap 配图：只有没有人的景色 / 物品（提示词/1123晚_背景_头像_ins配图提示词.md）。拍到人的动态显示灰框。
  // 每日动态的 API 从这张表里挑图（填 img），照片描述 note 照着 desc 写，保证图文对得上；
  // 没有 img 字段的旧动态 / 剧情动态才按 tags 关键词兜底（要对得很准才配图，否则灰框）
  INSTA_PHOTOS: [
    { img: 'ig_01', desc: '空练习室：整面镜子，木地板上放着一瓶水、一条白毛巾和一顶黑色棒球帽', tags: '练习室地|练习室镜|练舞|练习结束|毛巾|水瓶' },
    { img: 'ig_02', desc: '早上的窗边：白色纱帘、一盆绿植，窗台上一杯热咖啡，阳光照进来', tags: '咖啡杯|窗边|早上的阳光|晨光|窗台' },
    { img: 'ig_03', desc: '夜里咖啡店窗边的小圆桌：一台黑色胶片相机和一盏小灯，窗外是亮着路灯的夜街', tags: '胶片|相机|夜里的街|夜街' },
    { img: 'ig_04', desc: '保姆车后座：座位上放着黑色棒球帽和耳机，车窗外是高速上的夜景和车灯拖影', tags: '保姆车|车窗|移动中|去行程的路上|高速' },
    { img: 'ig_05', desc: '宿舍夜宵：一盒炸鸡、一盘辣炒年糕、两罐可乐，旁边一个游戏手柄', tags: '夜宵|炸鸡|辣炒年糕|外卖|游戏手柄' },
    { img: 'ig_06', desc: '后台化妆台：一圈灯泡的化妆镜、化妆刷，衣架上挂着黑色打歌服', tags: '后台|待机室|化妆台|化妆镜|打歌服|舞台服' },
    { img: 'ig_07', desc: '作曲工作室：两块屏幕上开着编曲软件，下面是电子琴键盘，旁边一杯冰美式', tags: '作曲|作曲室|键盘和屏幕|写歌|编曲|工程文件' },
    { img: 'ig_08', desc: '练习室天花板：一排排白色灯管，什么都没有', tags: '天花板|练习室灯|灯管' },
    { img: 'ig_09', desc: '夜里的汉江大桥：桥上一排路灯，远处是南山塔和高楼灯光，江面有倒影', tags: '汉江|大桥|江边夜景|桥上' },
    { img: 'ig_10', desc: 'LUMIÈRE 回归预告海报：黑底上一朵红玫瑰，写着 COMEBACK 2020.10.19', tags: '回归预告|预告海报|teaser|comeback|玫瑰' },
    { img: 'ig_11', desc: 'LUMIÈRE 回归日程表：黑底白字，从预告片到 10.19 专辑和 MV 发行的时间线', tags: '回归日程|日程表|schedule|时间表|排期|行程海报|行程表' },
    { img: 'ig_12', desc: '床上摊开的实体专辑：黑色和酒红色两个版本、歌词本，一个封着火漆的信封', tags: '专辑|实体专辑|开箱|album' },
    { img: 'ig_13', desc: '待机室桌上的一位奖杯：水晶奖杯旁边一大束红玫瑰', tags: '一位|奖杯|获奖|trophy|1位|拿奖' },
    { img: 'ig_14', desc: '地铁站里的生日应援灯箱：粉色底、红色月亮，写着 HAPPY YUNJAE DAY', tags: '生日应援|应援广告|地铁站|灯箱' },
    { img: 'ig_15', desc: '桌上的白色奶油生日蛋糕，插着一根蜡烛，旁边有派对帽和纸皇冠', tags: '蛋糕|蜡烛|生日派对|派对帽' },
    { img: 'ig_16', desc: '颁奖典礼的大舞台：粉红色灯光和大屏幕，下面是空荡荡的红色观众席', tags: 'MAMA|颁奖典礼|颁奖礼|观众席|无观众' },
    { img: 'ig_17', desc: '窗边的圣诞树和几个红色礼物盒，窗外在下雪', tags: '圣诞|圣诞树|下雪|雪夜' },
    { img: 'ig_18', desc: '新年日出：太阳从首尔的山和高楼后面升起，远处有南山塔', tags: '新年|跨年|日出|元旦|新年快乐' },
    { img: 'ig_19', desc: '片场：导演椅上放着场记板和剧本，旁边是灯架和器材', tags: '剧组|片场|剧本|拍摄现场|场记|网剧' },
    { img: 'ig_20', desc: '办公桌上一只橘猫趴在键盘上睡觉，旁边一杯拿铁和便利贴', tags: '猫|橘猫|摸鱼' },
    { img: 'ig_21', desc: '办公桌俯拍：一杯冰美式、工牌挂绳、笔记本和钢笔、笔记本电脑一角', tags: '冰美式和工牌|工牌|办公桌|加班' },
    { img: 'ig_22', desc: '床上的应援物：星星形状的白色应援棒、一叠小卡、闪亮的卡套', tags: '应援棒|手灯|应援物|小卡' },
    { img: 'ig_23', desc: '汉南洞的夜街：一排亮着灯的店面和行道树，路边停着一辆黑色面包车，没有人', tags: '汉南洞|夜街上的保姆车|街边店面' },
    { img: 'ig_24', desc: '傍晚的天空：粉紫色晚霞，一盏路灯，远处的江和桥', tags: '晚霞|傍晚|黄昏|粉色天空' },
    { img: 'ig_25', desc: '下雨的夜里：窗玻璃上全是雨滴，窗边一杯冒热气的茶', tags: '下雨|雨天|雨夜|窗上的雨' },
    { img: 'ig_26', desc: '夜里的健身房：跑步机、哑铃和水瓶，窗外是城市夜景', tags: '健身|跑步机|哑铃|gym|锻炼|健身房' },
    { img: 'ig_27', desc: '视频签售的桌子：平板上开着视频通话，旁边几支马克笔、一叠专辑和一张签名卡', tags: '签售|视频签售|马克笔|签名' }
  ],

  // 结局 CG（assets/cg/）
  // 结局名（真实歌名）的中文和原唱：结局标题卡、结局卡、拍立得里都会一起显示
  ENDING_NAMES: {
    'Love wins all': { zh: '爱赢过一切', artist: 'IU', kind: '公开' },
    'If You': { zh: '如果你', artist: 'BIGBANG', kind: '被扒分手' },
    '밤편지': { zh: '夜信', artist: 'IU', kind: '地下恋继续' },
    'L.I.E': { zh: '谎言', artist: 'EXID', kind: '他劈腿' },
    '사랑과 전쟁': { zh: '爱与战争', artist: 'Davichi', kind: '你劈腿' },
    '사랑이 잘': { zh: '爱情不太顺', artist: 'IU & 오혁', kind: '和平分手' }
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
    civ: '她在弘大开一家小小的减脂便当工作室「밥심 공방」（饭力工坊），每天 10–19 点在店里（午市 11–14 点最忙），每周一店休；员工是全职白秀珍（27，以前在她家白饭馆后厨帮工）和兼职吴叡琳（21，大学生，负责打包配送），两人不知道她在谈恋爱；LUMIÈRE 的订单是编舞老师推荐来的；她以前是他的粉丝，手机里还留着粉丝小号',
    staff: '她是公司签约的艺人营养师，负责几个团回归期的饮食，能进练习室和后台，工作日 9–18 点在公司；公司里没有人知道他们在交往；她入职前也是粉丝，留着一个粉丝小号'
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
    'day62#2': '他生日那天，她亲手做了一个低糖蛋糕送过去',
    'day64': '第 64 天的 2020 MAMA（坡州，无观众）：他唱了特别舞台的独唱高音，彩排时破过一次音，正式直播唱上去了；LUMIÈRE 那天没拿奖'
  },

  // 剧情开始时手机上的时间（分钟数，01:40 = 100）；剧情里旁白提到时间会自动更新
  EVENT_TIME: { day1: 100 },

  // 音乐（assets/bgm/）：theme 主题/日常，date 约会/开心，sweet 线下甜蜜，tense 曝光/紧张，sad 悲伤/追忆
  BGM_EVENT: {
    day1: 'theme', day3: 'sweet', day7: 'date', day12: 'date', day16: 'date', day20: 'date', day22: 'tense',
    day25: 'sweet', day30: 'tense', day33: 'tense', day35: 'sweet', day40: 'sad', day48: 'theme', day52: 'date',
    day57: 'tense', day60: 'tense', day62: 'date', day64: 'sweet', day66: 'tense', day72: 'tense', day78: 'sweet', day84: 'date', day90: 'tense',
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
    // 2020 MAMA：12 月 6 日，线上无观众，坡州 CJ ENM Contents World
    if (day === 62) return '他的生日：白天网剧拍摄，晚上去公司练 MAMA 特别舞台';
    if (day === 63) return '去坡州 CJ ENM Contents World 做 MAMA 走位彩排，从下午排到深夜';
    if (day === 64) return '2020 MAMA 颁奖礼（线上直播，没有观众）：中午到坡州做最后彩排，下午 6 点直播开始，结束后公司聚餐';
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
