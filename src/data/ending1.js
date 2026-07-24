// "保留所有記憶" ending's story pages — shown BEFORE the final terminal-box
// summary screen (see Ending1Screen in EndingScreens.jsx). Extracted verbatim.
const ENDING1_PAGES = [
  {
    segs: [
      { cls: 'quote', text: '「偵測到完整記憶已恢復。請選擇後續處理方式。」\n\n' },
      { cls: 'narr', text: '你盯著手心那六塊發光的記憶，系統忍不住又跳出一次提示。\n\n' },
      { cls: 'quote', text: '「偵測到猶豫超過標準值 400 倍。需要為您重新播放選項說明嗎？」\n\n' },
      { cls: 'narr', text: '不用了，你只是很少有機會，把一件事想得這麼久。' },
    ],
  },
  {
    segs: [
      { cls: 'quote', text: '「保留。」\n\n' },
      { cls: 'quote', text: '「……偵測到非理性決策。系統必須提醒您，這是本季度第 3 位選擇保留的使用者。根據內部統計，保留者的平均『情緒消化時間』超出建議值 1,800%。」\n\n' },
      { cls: 'quote', text: '「確定要繼續嗎？」\n\n' },
      { cls: 'narr', text: '你想起圖書館裡那本被翻到捲邊的推理小說，想起雞腿帽遊民一邊嚼著東西一邊說出的密碼，想起在傳送港裡，那個連自己名字都快忘記的詩人。\n\n' },
      { cls: 'quote', text: '「確定。」' },
    ],
  },
  {
    segs: [
      { cls: 'narr', text: '你想起地下市集裡那個一次點了二十份餐點的媽媽，想起垃圾山上那個只剩一隻手、卻還在翻找自己零件的機器人，想起市中心那片被系統抹平的、屬於某群人的快樂。\n\n這些從來都不是別人的故事。是人類自己曾經活過的證據，連同那些丟臉的、笨拙的、後悔的部分。' },
    ],
  },
  {
    segs: [
      { cls: 'quote', text: '「今日行程：無建議。」\n\n' },
      { cls: 'narr', text: '也好。人生，本來就不該被安排得剛剛好。' },
    ],
  },
];

export { ENDING1_PAGES };
