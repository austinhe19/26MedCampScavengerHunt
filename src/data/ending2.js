// "將記憶封回" ending's story pages — shown BEFORE the final terminal-box
// summary screen (see Ending2Screen in EndingScreens.jsx). Extracted verbatim.
const ENDING2_PAGES = [
  {
    segs: [
      { cls: 'quote', text: '「偵測到完整記憶已恢復。請選擇後續處理方式。」\n\n' },
      { cls: 'narr', text: '你盯著手心那六塊發光的記憶，想了大概0.3秒。\n\n這些回憶聽起來就很累。你原本以為找回自己會很感動，結果比較像是不小心點開了國小同學Line群組，才發現自己欠了一堆人情債。' },
    ],
  },
  {
    segs: [
      { cls: 'quote', text: '「封回。」\n\n' },
      { cls: 'quote', text: '「偵測到理性決策。恭喜您，您是本月第 8,472 位選擇封回的使用者！系統已為您節省約 6.2 小時的情緒消化時間，相當於 1.8 部電影，或 3.4 次深夜哭泣。」\n\n' },
      { cls: 'quote', text: '「正在重新校準情緒基準值……」\n\n' },
      { cls: 'quote', text: '「校準完成。祝您有美好的一天！」' },
    ],
  },
  {
    glitch: true, // brief visual glitch right as this page appears, then settles — see IntroScreen
    segs: [
      { cls: 'narr', text: '你眨了眨眼。\n\n咦，你剛剛是不是在想什麼很重要的事？\n\n好像有一本書。還是一個帽子？不對，是機器人。還是……算了，想不起來就是不重要吧。' },
    ],
  },
  {
    segs: [
      { cls: 'narr', text: '你伸了個懶腰，窗外的陽光剛剛好，溫度剛剛好，連你打哈欠的長度好像都被計算得剛剛好。你摸摸口袋，發現裡面有一張皺巴巴的紙條，寫著一串你完全看不懂的NTUHOSPITAL。\n\n你想了想，大概是過期的發票號碼吧，順手揉一揉丟進垃圾桶。\n\n垃圾桶發出一聲很輕快的「叮」，像遊戲過關的音效。' },
    ],
  },
  {
    segs: [
      { cls: 'quote', text: '「今日推薦行程：陽光散步 30 分鐘。系統已為您預約最佳心情濾鏡，色調偏暖，飽和度 +12%。您的本日幸運色是——薄荷綠！」\n\n' },
      { cls: 'narr', text: '反正想不起來的事，大概，也不是什麼重要的事吧。' },
    ],
  },
];

export { ENDING2_PAGES };
