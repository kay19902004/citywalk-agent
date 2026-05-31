import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { StoryModule } from "./types";

export type DecodeResult = {
  text: string;
  encoding: "utf8" | "utf16le" | "unknown";
  readable: boolean;
  reason?: string;
};

const locationLexicon = [
  ["邮局", ["邮局", "邮筒", "信箱"]],
  ["书店", ["书店", "书架", "旧书", "诗集"]],
  ["咖啡馆", ["咖啡馆", "咖啡", "热饮", "杯垫"]],
  ["桥", ["桥", "河边", "河岸", "步道"]],
  ["地铁站", ["地铁", "站台", "刷卡", "公交"]],
  ["公园", ["公园", "长椅", "树影", "广场"]],
  ["便利店", ["便利店", "小票", "夜班"]],
  ["电影院", ["影院", "电影院", "票根", "座位"]],
  ["商场", ["商场", "扶梯", "电梯", "楼层", "导视", "柜台"]],
  ["直播间", ["直播", "弹幕", "主播", "观众"]],
  ["玉器铺", ["玉器", "玉器铺", "古董", "当铺"]],
  ["导航路线", ["导航", "定位", "路线", "偏航", "地图"]]
] as const;

const eventLexicon = [
  ["迟到的信", ["信", "邮", "寄", "地址"]],
  ["旧照片", ["照片", "合照", "相片"]],
  ["未完成的约定", ["约定", "等", "没来", "失约"]],
  ["错过的路线", ["路口", "路线", "导航", "迷路"]],
  ["遗失物归还", ["钥匙", "包裹", "旧物", "归还"]],
  ["导航异常", ["导航", "偏航", "定位", "地图", "路线反复"]],
  ["商场困局", ["商场", "楼层", "电梯", "扶梯", "出口"]],
  ["错认任务", ["误认", "错认", "接头", "任务", "身份"]],
  ["奇物委托", ["玉器", "灵珠", "古董", "符", "命格"]],
  ["直播谜局", ["直播", "弹幕", "观众", "镜头"]],
  ["异类传说", ["鬼", "怪", "美人鱼", "人鱼", "吸血鬼", "狐", "妖"]]
] as const;

const characterLexicon = [
  ["退休邮递员", ["退休邮递员", "老邮递员", "邮递员", "邮差"]],
  ["书店老板", ["书店老板", "旧书店老板", "老板"]],
  ["咖啡馆店主", ["咖啡馆老板", "咖啡馆店主", "店主", "服务员"]],
  ["即将离开的女孩", ["女孩", "她", "离开城市"]],
  ["真正收件人", ["收件人", "真正收件人"]],
  ["被保护的人", ["弟弟", "保护他", "保护她", "保护"]]
] as const;

const conflictLexicon = [
  ["错误地址", ["寄错地址", "错误地址", "没有地址", "地址"]],
  ["隐瞒关系", ["隐瞒", "没有说", "保守秘密", "秘密"]],
  ["失约误会", ["失约", "没来", "误会", "等了很久"]],
  ["时间线矛盾", ["时间", "小票", "票根", "刷卡"]],
  ["旧物归还", ["归还", "旧物", "包裹", "钥匙"]],
  ["路线失控", ["导航", "偏航", "绕回", "迷路", "路线"]],
  ["错认身份", ["错认", "误认", "接头人", "身份"]],
  ["空间困局", ["商场", "出口", "楼层", "逃", "循环"]],
  ["亲密关系裂缝", ["离婚", "丈夫", "妻子", "男友", "女友", "家人"]],
  ["命运被篡改", ["命格", "重生", "系统", "诅咒", "复活"]]
] as const;

const twistLexicon = [
  ["真正收件人另有其人", ["真正收件人", "不是写给", "另一个人"]],
  ["被保护的人另有其人", ["保护她的弟弟", "保护弟弟", "保护的人"]],
  ["等待并非失约", ["不是没来", "不是失约", "来了两次"]],
  ["误会被解开", ["原谅", "误会", "和解"]],
  ["迟到的真相", ["迟到十年", "十年前", "迟到"]]
] as const;

const clueLexicon = [
  ["未寄出的信", ["信", "信封", "邮戳"]],
  ["旧照片", ["旧照片", "照片", "合照"]],
  ["咖啡小票", ["咖啡小票", "小票", "账单"]],
  ["票根", ["票根", "电影票", "座位"]],
  ["语音/留言", ["语音", "留言", "录音"]],
  ["路牌/门牌", ["路牌", "门牌", "方向牌"]],
  ["异常导航", ["导航", "定位", "偏航", "地图"]],
  ["楼层导视牌", ["楼层", "导视", "扶梯", "电梯"]],
  ["直播回放", ["直播", "弹幕", "回放", "镜头"]],
  ["奇物编号", ["玉器", "灵珠", "符", "命格", "古董"]],
  ["聊天记录", ["聊天", "消息", "微信", "短信"]]
] as const;

const filenameInspirationLexicon = [
  {
    pattern: /恐怖导航|导航/,
    motifs: ["导航异常"],
    conflicts: ["路线失控"],
    clueInterfaces: ["异常导航"],
    sceneFunctions: ["路线偏移/系统提示"],
    genres: ["都市怪谈", "轻推理"],
    emotions: ["紧张", "好奇"],
    worldTags: ["导航系统异常", "现实路线被重写"],
    actionTasks: ["核对错误路线", "找出偏航原因"],
    endingStakes: ["走出循环"]
  },
  {
    pattern: /商场大逃杀|商场/,
    motifs: ["商场困局"],
    conflicts: ["空间困局", "错认身份"],
    clueInterfaces: ["楼层导视牌"],
    sceneFunctions: ["商场谜局/限时选择"],
    genres: ["都市奇遇", "轻推理"],
    emotions: ["紧张", "荒诞"],
    worldTags: ["封闭商业空间", "限时路线"],
    actionTasks: ["拼合楼层线索", "确认正确出口"],
    endingStakes: ["解除误会"]
  },
  {
    pattern: /灵灵玉器铺|玉器|灵珠|命格|符/,
    motifs: ["奇物委托"],
    conflicts: ["命运被篡改"],
    clueInterfaces: ["奇物编号"],
    sceneFunctions: ["奇物店委托/真假鉴别"],
    genres: ["都市奇幻", "轻推理"],
    emotions: ["神秘", "好奇"],
    worldTags: ["奇物店", "民俗传说"],
    actionTasks: ["鉴别奇物来历", "归还错位命运"],
    endingStakes: ["恢复秩序"]
  },
  {
    pattern: /直播间|直播/,
    motifs: ["直播谜局"],
    conflicts: ["公众视线下的误导"],
    clueInterfaces: ["直播回放"],
    sceneFunctions: ["弹幕证词/镜头盲区"],
    genres: ["都市悬疑", "轻推理"],
    emotions: ["紧张", "好奇"],
    worldTags: ["直播视角", "群体围观"],
    actionTasks: ["核对直播时间线", "找出镜头盲区"],
    endingStakes: ["停止误导"]
  },
  {
    pattern: /美人鱼|人鱼|吸血鬼|万鬼|鬼屋|回魂|婴灵/,
    motifs: ["异类传说"],
    conflicts: ["传说背后的现实误会"],
    clueInterfaces: ["传说残页"],
    sceneFunctions: ["传闻验证/现实还原"],
    genres: ["都市怪谈", "奇幻"],
    emotions: ["神秘", "紧张"],
    worldTags: ["城市传说", "异类视角"],
    actionTasks: ["验证传闻源头", "还原现实动机"],
    endingStakes: ["公开或保留传说"]
  },
  {
    pattern: /离婚|丈夫|妻子|男友|恋爱脑|情深|错盏/,
    motifs: ["亲密关系裂缝"],
    conflicts: ["亲密关系裂缝"],
    clueInterfaces: ["聊天记录"],
    sceneFunctions: ["关系证词/选择压力"],
    genres: ["情感轻推理", "现实关系"],
    emotions: ["酸涩", "遗憾"],
    worldTags: ["亲密关系", "现实困境"],
    actionTasks: ["核对双方说法", "判断隐瞒动机"],
    endingStakes: ["和解或告别"]
  }
] as const;

const endingLexicon = [
  ["寄出迟到的信", ["寄出", "寄信", "送达"]],
  ["留下新留言", ["留下", "留言"]],
  ["公开真相", ["公开", "真相"]],
  ["选择释怀", ["原谅", "释怀", "和解"]]
] as const;

export function isReadableChinese(text: string): boolean {
  const sample = text.slice(0, 5000);
  const chinese = sample.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  const replacement = sample.match(/\uFFFD/g)?.length ?? 0;
  const mojibake = sample.match(/[�ɱѡ˻����]/g)?.length ?? 0;
  const visible = sample.replace(/\s/g, "").length || 1;

  return chinese / visible > 0.12 && replacement / visible < 0.02 && mojibake / visible < 0.08;
}

export function decodeStoryFile(buffer: Buffer): DecodeResult {
  let encoding: DecodeResult["encoding"] = "utf8";
  let text = buffer.toString("utf8");

  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    encoding = "utf16le";
    text = buffer.subarray(2).toString("utf16le");
  } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    encoding = "unknown";
    text = "";
  }

  const readable = isReadableChinese(text);
  return {
    text: normalizeText(text),
    encoding,
    readable,
    reason: readable ? undefined : "Text appears to be mojibake, binary, or not Chinese prose."
  };
}

export function extractStoryModules(input: {
  text: string;
  sourcePath: string;
  author?: string;
}): StoryModule[] {
  const cleaned = normalizeText(input.text);
  const sourceTitle = path.basename(input.sourcePath, path.extname(input.sourcePath));
  const filenameText = sourceTitle.replace(/[《》【】\[\]（）()]/g, " ");
  const inspiration = detectFilenameInspiration(filenameText);
  const detectionText = `${filenameText}\n${cleaned}`;
  const modules: StoryModule[] = [];
  const sourceId = slug(input.sourcePath);
  const locationTags = detectLocations(detectionText);
  const eventTags = unique([...inspiration.motifs, ...detectEvents(detectionText)]);
  const characters = detectByLexicon(detectionText, characterLexicon);
  const conflicts = unique([...inspiration.conflicts, ...detectByLexicon(detectionText, conflictLexicon)]);
  const twists = detectByLexicon(detectionText, twistLexicon);
  const clueInterfaces = unique([...inspiration.clueInterfaces, ...detectByLexicon(detectionText, clueLexicon)]);
  const endings = detectByLexicon(detectionText, endingLexicon);
  const emotions = unique([...inspiration.emotions, ...detectEmotions(detectionText)]).slice(0, 4);
  const genres = unique([...inspiration.genres, ...detectGenres(detectionText, locationTags, eventTags)]).slice(0, 4);
  const excerpt = summarize(locationTags, eventTags, emotions);
  const facets = {
    characters,
    conflicts,
    twists,
    clueInterfaces,
    endings,
    sceneFunctions: unique([...inspiration.sceneFunctions, ...sceneFunctionsFor(locationTags)]),
    motifs: eventTags,
    relationships: detectRelationships(detectionText),
    dilemmas: detectDilemmas(detectionText),
    worldTags: inspiration.worldTags,
    actionTasks: inspiration.actionTasks,
    endingStakes: inspiration.endingStakes,
    sourceTitles: [sourceTitle]
  };

  if (eventTags.length > 0) {
    modules.push(makeModule({
      id: `${sourceId}-plot`,
      module_type: "plot_seed",
      title: eventTags[0],
      summary: excerpt,
      sourcePath: input.sourcePath,
      author: input.author,
      genres,
      emotions,
      location_tags: locationTags,
      requires: ["玩家身份", "明确任务"],
      produces: ["第一个线索", "下一站目标"],
      forbidden: ["复用长段原文", "改变硬事实", "引导危险行动"],
      hardness: "hard",
      facets
    }));
  }

  for (const character of characters.slice(0, 3)) {
    modules.push(makeModule({
      id: `${sourceId}-char-${slug(character)}`,
      module_type: "character",
      title: `${character}角色原型`,
      summary: `角色原型：${character}可承担委托、见证、误导或情感回收功能。`,
      sourcePath: input.sourcePath,
      author: input.author,
      genres,
      emotions,
      location_tags: locationTags,
      requires: ["出场动机", "与主线关系"],
      produces: [`${character}证词`, "人物关系线索"],
      forbidden: ["照搬原角色完整经历"],
      hardness: "hard",
      facets
    }));
  }

  for (const conflict of conflicts.slice(0, 2)) {
    modules.push(makeModule({
      id: `${sourceId}-conflict-${slug(conflict)}`,
      module_type: "conflict",
      title: `${conflict}冲突`,
      summary: `冲突类型：${conflict}，适合制造阶段问题、误会或路线推进阻碍。`,
      sourcePath: input.sourcePath,
      author: input.author,
      genres,
      emotions,
      location_tags: locationTags,
      requires: ["至少一个角色", "可核对证物"],
      produces: ["阶段推理问题", "下一站动机"],
      forbidden: ["不可无因反转"],
      hardness: "hard",
      facets
    }));
  }

  for (const twist of twists.slice(0, 2)) {
    modules.push(makeModule({
      id: `${sourceId}-twist-${slug(twist)}`,
      module_type: "turning_point",
      title: `${twist}转折`,
      summary: `转折：${twist}，用于第三站或终点前改变玩家对人物动机的理解。`,
      sourcePath: input.sourcePath,
      author: input.author,
      genres,
      emotions,
      location_tags: locationTags,
      requires: ["前置信息差", "已解锁证物"],
      produces: ["动机重估", "结局选择压力"],
      forbidden: ["提前剧透终局"],
      hardness: "hard",
      facets
    }));
  }

  for (const clue of clueInterfaces.slice(0, 3)) {
    modules.push(makeModule({
      id: `${sourceId}-clue-${slug(clue)}`,
      module_type: "clue",
      title: `${clue}线索接口`,
      summary: `线索接口：${clue}，可改写为安全观察、线上备份或证物卡。`,
      sourcePath: input.sourcePath,
      author: input.author,
      genres,
      emotions,
      location_tags: locationTags,
      requires: ["地点触发", "玩家观察"],
      produces: ["可观察证物", "答题关键词"],
      forbidden: ["要求接触私人财物"],
      hardness: "soft",
      facets
    }));
  }

  for (const location of locationTags.slice(0, 3)) {
    modules.push(makeModule({
      id: `${sourceId}-loc-${slug(location)}`,
      module_type: "location_scene",
      title: `${location}场景`,
      summary: `${location}适合承载发现、回忆或转折线索。`,
      sourcePath: input.sourcePath,
      author: input.author,
      genres,
      emotions,
      location_tags: [location],
      requires: ["玩家到达或触发线上替代"],
      produces: [`${location}线索`, "路线推进"],
      forbidden: ["进入私人空间", "打扰路人"],
      hardness: "soft",
      facets
    }));
  }

  modules.push(makeModule({
    id: `${sourceId}-emotion`,
    module_type: "emotion_curve",
    title: `${emotions.join(" / ")}情绪曲线`,
    summary: `可用作 ${emotions.join("、")} 的城市漫游节奏。`,
    sourcePath: input.sourcePath,
    author: input.author,
    genres,
    emotions,
    location_tags: locationTags,
    requires: ["起点事件"],
    produces: ["情绪递进", "结局回收"],
    forbidden: ["突兀反转"],
    hardness: "soft",
    facets
  }));

  if (modules.length < 4) {
    modules.push(makeModule({
      id: `${sourceId}-ending`,
      module_type: "ending",
      title: "选择式结局",
      summary: "玩家根据线索选择送达、留下或转交，结局回应开头任务。",
      sourcePath: input.sourcePath,
      author: input.author,
      genres,
      emotions,
      location_tags: locationTags,
      requires: ["关键线索"],
      produces: ["完成心愿", "自我和解"],
      forbidden: ["无反馈结局"],
      hardness: "hard",
      facets
    }));
  }

  return compactModules(modules, 8);
}

export async function scanStoryLibrary(rootDir: string, maxFiles = 80): Promise<{
  modules: StoryModule[];
  scanned: number;
  accepted: number;
  rejected: Array<{ path: string; reason: string }>;
}> {
  const files = await listTxtFiles(rootDir);
  const rejected: Array<{ path: string; reason: string }> = [];
  const modules: StoryModule[] = [];
  let accepted = 0;

  for (const filePath of files.filter((file) => !file.includes("citywalk-agent")).slice(0, maxFiles)) {
    const buffer = await readFile(filePath);
    const decoded = decodeStoryFile(buffer);
    if (!decoded.readable) {
      rejected.push({ path: path.relative(rootDir, filePath), reason: decoded.reason ?? "unreadable" });
      continue;
    }
    accepted += 1;
    modules.push(...extractStoryModules({
      text: decoded.text,
      sourcePath: path.relative(rootDir, filePath),
      author: path.basename(path.dirname(filePath)).replace(/作品集?|作品/g, "")
    }));
  }

  return { modules, scanned: Math.min(files.length, maxFiles), accepted, rejected };
}

async function listTxtFiles(rootDir: string): Promise<string[]> {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.name.startsWith(".") || entry.name === "node_modules") return [];
    if (entry.isDirectory()) return listTxtFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".txt") ? [fullPath] : [];
  }));
  return nested.flat();
}

function normalizeText(text: string): string {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/[\u034F\u200B-\u200F]/g, "")
    .replace(/小.?虎.?bot.*?靠谱.*?/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detectLocations(text: string): string[] {
  return locationLexicon
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([tag]) => tag);
}

function detectEvents(text: string): string[] {
  return eventLexicon
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([tag]) => tag);
}

function detectByLexicon(text: string, lexicon: readonly (readonly [string, readonly string[]])[]): string[] {
  return lexicon
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([tag]) => tag);
}

function sceneFunctionsFor(locations: string[]): string[] {
  const functions = new Set<string>();
  if (locations.includes("邮局")) functions.add("接收委托/发现旧信");
  if (locations.includes("书店")) functions.add("查找名字/夹页线索");
  if (locations.includes("咖啡馆")) functions.add("证词冲突/等待痕迹");
  if (locations.includes("桥")) functions.add("情绪反转/告别回忆");
  if (locations.includes("地铁站")) functions.add("时间线核对");
  if (locations.includes("公园")) functions.add("结局选择/自我和解");
  return [...functions];
}

function detectEmotions(text: string): string[] {
  const emotions = new Set<string>();
  if (/雨|旧|十年|曾经|回忆|照片|信/.test(text)) emotions.add("怀旧");
  if (/等|约定|错过|没来|离开/.test(text)) emotions.add("遗憾");
  if (/笑|惊喜|礼物|找到/.test(text)) emotions.add("轻快");
  if (/桥|河|告别|最后/.test(text)) emotions.add("释然");
  if (/迷路|导航|秘密|陌生/.test(text)) emotions.add("好奇");
  return [...emotions].slice(0, 4).length ? [...emotions].slice(0, 4) : ["好奇", "温暖"];
}

function detectGenres(text: string, locations: string[], events: string[]): string[] {
  const genres = new Set<string>(["城市漫游"]);
  if (events.some((event) => ["迟到的信", "旧照片", "未完成的约定"].includes(event))) genres.add("轻推理");
  if (/信|照片|约定|旧/.test(text)) genres.add("治愈");
  if (/钥匙|包裹|宝藏|寻找/.test(text)) genres.add("寻宝");
  if (locations.includes("地铁站") || locations.includes("便利店")) genres.add("都市奇遇");
  if (/导航|商场|直播|鬼|怪|命格|灵珠|玉器/.test(text)) genres.add("都市怪谈");
  if (/离婚|丈夫|妻子|恋爱|男友|女友/.test(text)) genres.add("情感轻推理");
  return [...genres].slice(0, 4);
}

function detectFilenameInspiration(filename: string): {
  motifs: string[];
  conflicts: string[];
  clueInterfaces: string[];
  sceneFunctions: string[];
  genres: string[];
  emotions: string[];
  worldTags: string[];
  actionTasks: string[];
  endingStakes: string[];
} {
  const matched = filenameInspirationLexicon.filter((item) => item.pattern.test(filename));
  return {
    motifs: unique(matched.flatMap((item) => item.motifs)),
    conflicts: unique(matched.flatMap((item) => item.conflicts)),
    clueInterfaces: unique(matched.flatMap((item) => item.clueInterfaces)),
    sceneFunctions: unique(matched.flatMap((item) => item.sceneFunctions)),
    genres: unique(matched.flatMap((item) => item.genres)),
    emotions: unique(matched.flatMap((item) => item.emotions)),
    worldTags: unique(matched.flatMap((item) => item.worldTags)),
    actionTasks: unique(matched.flatMap((item) => item.actionTasks)),
    endingStakes: unique(matched.flatMap((item) => item.endingStakes))
  };
}

function detectRelationships(text: string): string[] {
  const relationships = new Set<string>();
  if (/父|母|爸爸|妈妈|女儿|儿子|家人|亲属/.test(text)) relationships.add("家庭关系");
  if (/丈夫|妻子|男友|女友|恋人|前任|离婚/.test(text)) relationships.add("亲密关系");
  if (/朋友|同学|旧友|闺蜜/.test(text)) relationships.add("旧友关系");
  if (/老板|店主|顾客|服务员|主播|观众/.test(text)) relationships.add("陌生人委托");
  return [...relationships].slice(0, 4);
}

function detectDilemmas(text: string): string[] {
  const dilemmas = new Set<string>();
  if (/隐瞒|秘密|保密|真相/.test(text)) dilemmas.add("公开真相还是保留秘密");
  if (/离开|告别|错过|失约/.test(text)) dilemmas.add("追回关系还是完成告别");
  if (/救|保护|牺牲|危险/.test(text)) dilemmas.add("保护他人还是说出事实");
  if (/错认|误会|误认|冤/.test(text)) dilemmas.add("纠正误会还是顺势调查");
  if (/导航|路线|出口|商场|循环/.test(text)) dilemmas.add("相信系统还是相信现场观察");
  return [...dilemmas].slice(0, 4);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function compactModules(modules: StoryModule[], max: number): StoryModule[] {
  const priority: StoryModule["module_type"][] = [
    "plot_seed",
    "character",
    "conflict",
    "turning_point",
    "clue",
    "location_scene",
    "emotion_curve",
    "ending"
  ];
  const picked: StoryModule[] = [];
  for (const type of priority) {
    const candidates = modules.filter((item) => item.module_type === type && !picked.includes(item));
    const preferredPattern = type === "turning_point" ? /保护|导航|商场|错认/ : /导航|商场|错认/;
    const module = candidates.find((item) => preferredPattern.test(item.title))
      ?? candidates[0];
    if (module) picked.push(module);
  }
  for (const module of modules) {
    if (picked.length >= max) break;
    if (!picked.includes(module)) picked.push(module);
  }
  return picked.slice(0, max);
}

function summarize(locations: string[], events: string[], emotions: string[]): string {
  const event = events[0] ?? "城市线索";
  const place = locations.length ? locations.slice(0, 3).join("、") : "安全公共点位";
  const mood = emotions.length ? emotions.slice(0, 3).join("、") : "好奇、温暖";
  return `抽象素材：围绕${event}，适合在${place}展开${mood}的轻量互动。`;
}

function makeModule(input: Omit<StoryModule, "source_path"> & { sourcePath: string }): StoryModule {
  const { sourcePath, ...rest } = input;
  return { ...rest, source_path: sourcePath, summary: rest.summary.slice(0, 110) };
}

function slug(value: string): string {
  return createHash("sha1").update(value).digest("base64url").slice(0, 14);
}

if (process.argv[1]?.endsWith("content-pipeline.ts")) {
  const root = path.resolve(process.cwd(), "..");
  scanStoryLibrary(root, 120).then((result) => {
    console.log(JSON.stringify({
      scanned: result.scanned,
      accepted: result.accepted,
      rejected: result.rejected.length,
      modules: result.modules.slice(0, 12)
    }, null, 2));
  });
}
