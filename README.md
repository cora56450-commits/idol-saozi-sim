# 爱豆嫂子模拟器 · 游戏程序

## 怎么打开

双击 `index.html`，用 Chrome 打开就能玩。不需要装任何东西。

第一次进游戏：点桌上的**专辑 → 设置**，填 API：

| 接口类型 | 接口地址 | 模型（例子） |
|---|---|---|
| OpenAI 兼容 | `https://api.openai.com/v1`、`https://api.deepseek.com/v1` 或中转站地址（到 /v1 为止） | `gpt-4o-mini`、`deepseek-chat` |
| Anthropic | 留空 | `claude-sonnet-5-5` 之类 |

不填 API 也能玩：固定事件照常播放，论坛 / 泡泡 / InstaSnap 显示一份离线样例，聊天会提示没设置 API。

如果某个接口在浏览器里报跨域错误（CORS），换中转站，或者在这个文件夹里开终端运行 `python3 -m http.server 8000`，再打开 http://localhost:8000 。

**调试面板**：游戏里按 `Shift + D`，能看到三个隐藏数值、心结和劈腿线，能加减数值、跳到任意一天、重播当天事件。

## 玩法流程

1. 标题 → 开局（名字、素人 / 员工、要不要订阅泡泡）
2. 每天：有固定事件先播事件 → 生成当天的泡泡 / 论坛 / InstaSnap / 粉丝群（调用 C）→ 他主动发一条消息 → 桌面自由活动
3. 桌面：手机 = 手机；专辑 = 菜单（存档 / 读档 / 设置 / 回标题）；便签 = 今日行程；拍立得 = 结局回想；**便当 = 结束这一天**
4. 第 90 天事件后结算；曝光值任何时候到 100 立刻进 ‘If You’

线下事件（标题里带「线下」）用 gal 对话框播放；其他事件在手机里一条条弹出。每个选项列表最后都有「自己说……」，会调用 API 写后续，数值不超过本事件固定选项的范围。

## 文件夹

```
index.html          入口
css/style.css       全部样式
js/state.js         数值、条件判断、存档（localStorage）
js/api.js           API 调用（四种调用 + 自由选项 + 第 33 天帖子判定）
js/prompts.js       提示词（由 tools/build_prompts.py 生成）
js/ui.js            缩放、桌面、弹窗、横幅、设置、调试面板
js/story.js         固定事件播放器
js/phone.js         手机：TOKTOK / BLINK / 더쿠판 / InstaSnap
js/main.js          每天的流程、结算、结局
data/events.js      固定事件（由 tools/parse_events.py 从「固定文案.md」生成）
data/config.js      可以手改：显示名、背景、立绘、头像、结局 CG、表情包、每日行程
assets/ui/          切好的 UI 素材
assets/bg/          线下场景背景 + 手机壁纸
assets/desk/        桌面（素人线 / 员工线）
assets/char/        立绘（还没放）
assets/avatar/      聊天头像（还没放）
assets/cg/          结局 CG（还没放）
assets/bgm/         音乐（还没放）
tools/              转换脚本
```

## 改文案 / 改提示词以后

改了「文档/固定文案.md」：

```
python3 tools/parse_events.py ../文档/固定文案.md data/events.js
```

改了「文档/API提示词.md」：

```
python3 tools/build_prompts.py ../文档/API提示词.md js/prompts.js
```

## 放美术素材

文件名对上就会自动显示，没放的地方不会报错：

- 立绘：`assets/char/yunjae_casual.png`、`dongmin_practice.png`、`siwon_practice.png`、`seoyeon.png`、`eunji.png`、`manager.png`（透明 PNG）。要换套装 / 加表情差分，在 `data/config.js` 的 `SPRITES` 里改。
- 头像（1:1）：`assets/avatar/yunjae.png`、`dongmin.png`、`siwon.png`、`seoyeon.png`、`eunji.png`、`group.png`、`work.png`
- 结局 CG：`assets/cg/end_love.jpg`、`end_ifyou.jpg`、`end_night.jpg`、`end_lie.jpg`、`end_war.jpg`、`end_part.jpg`
- 标题字：`assets/ui/title_logo.png`（放了就替换掉现在的文字标题）

## 还没做

- BGM、音效（`assets/bgm/` 留好了位置，设置里的音量滑条还没接上）
- 事件里的 CG 显示（现在只有结局卡用 CG）；立绘的表情切换
- 打字机效果、快进、回看记录
- 员工线桌上工牌的点击功能
- 每日动态（调用 C）一次要生成很多内容，用便宜模型时可能偶尔格式出错，出错会提示并用离线样例代替
- 没做手机端适配
