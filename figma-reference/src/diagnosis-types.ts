export const styleAxes = [
  { code: "G/E", first: "G", second: "E", left: "目標先行", right: "経験探索", color: "#63b5a3" },
  { code: "I/X", first: "I", second: "X", left: "情報比較", right: "体験実感", color: "#8b7cf6" },
  { code: "P/F", first: "P", second: "F", left: "計画重視", right: "柔軟調整", color: "#e99587" },
  {
    code: "S/D",
    first: "S",
    second: "D",
    left: "一人で整理",
    right: "対話で整理",
    color: "#c59b49",
  },
] as const;

export const diagnosisTypes = [
  {
    code: "GIPS",
    name: "じっくり未来設計",
    description: "目標を描き、調べて計画し、一人で整理する。",
  },
  {
    code: "GIPD",
    name: "相談型プランナー",
    description: "目標と情報をもとに、対話して計画を磨く。",
  },
  {
    code: "GIFS",
    name: "堅実な柔軟派",
    description: "目標を持ち、調べながら柔軟に進路を更新する。",
  },
  {
    code: "GIFD",
    name: "対話型の未来設計",
    description: "目標と情報を参考に、人と話して方向を調整する。",
  },
  {
    code: "GXPS",
    name: "実感重視の計画派",
    description: "目標と体験の手応えを結びつけて計画する。",
  },
  {
    code: "GXPD",
    name: "体験共有プランナー",
    description: "体験を大切にし、人と相談しながら計画にする。",
  },
  {
    code: "GXFS",
    name: "感覚重視の柔軟派",
    description: "目標を持ちつつ、自分の感覚で進路を変える。",
  },
  { code: "GXFD", name: "柔軟な対話型", description: "実感と対話を通して柔軟に道を探す。" },
  {
    code: "EIPS",
    name: "選択肢重視の計画派",
    description: "さまざまな未来を情報で比較し、順序立てて試す。",
  },
  {
    code: "EIPD",
    name: "対話で練る将来設計",
    description: "選択肢を調べ、話し合いながら挑戦を計画する。",
  },
  {
    code: "EIFS",
    name: "情報重視の探索派",
    description: "情報を集めながら、自分のペースで可能性を探る。",
  },
  {
    code: "EIFD",
    name: "対話で広げる選択肢",
    description: "調査と対話で選択肢を広げ、柔軟に進む。",
  },
  {
    code: "EXPS",
    name: "体験重視の計画派",
    description: "経験から可能性を探し、試す計画を立てる。",
  },
  {
    code: "EXPD",
    name: "相談しながら挑戦",
    description: "体験を共有しながら次の挑戦を計画する。",
  },
  {
    code: "EXFS",
    name: "マイペースな体験重視",
    description: "経験から学び、自分の判断で柔軟に進む。",
  },
  {
    code: "EXFD",
    name: "対話で探る未来",
    description: "新しい経験と対話から未来の可能性を広げる。",
  },
].map((type, i) => ({ ...type, color: styleAxes[Math.floor(i / 4)].color }));

export const concreteIndicators = [
  { code: "V", name: "将来像", description: "望む暮らしをどれくらい具体的に描けているか" },
  { code: "O", name: "選択肢認識", description: "多様な生き方や選択肢をどれくらい知っているか" },
  { code: "R", name: "実現準備", description: "将来に向けてどれくらい準備しているか" },
] as const;
