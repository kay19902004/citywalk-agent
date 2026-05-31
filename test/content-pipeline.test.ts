import { strict as assert } from "node:assert";
import test from "node:test";
import { decodeStoryFile, extractStoryModules, isReadableChinese } from "../src/lib/content-pipeline";

test("filters mojibake-heavy text before extraction", () => {
  const unreadable = "ɱ�˻��䣺�����ڵ�����\n������ѡ����Ĵ𰸡�";

  assert.equal(isReadableChinese(unreadable), false);
});

test("decodes utf16le story text and keeps readable Chinese", () => {
  const source = "旧邮局门口，一封没有寄出的信被重新发现。";
  const buffer = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(source, "utf16le")]);

  const decoded = decodeStoryFile(buffer);

  assert.equal(decoded.encoding, "utf16le");
  assert.equal(decoded.readable, true);
  assert.match(decoded.text, /旧邮局/);
});

test("extracts tagged story modules without copying long source passages", () => {
  const text = [
    "旧邮局门口，一封没有寄出的信被重新发现。",
    "女孩在咖啡馆等了很久，后来去了桥边。",
    "书店老板说她留下过一张旧照片。",
    "最后，这些线索指向一个没有完成的约定。"
  ].join("\n");

  const modules = extractStoryModules({ text, sourcePath: "sample.txt", author: "测试作者" });

  assert.ok(modules.length >= 4);
  assert.ok(modules.some((item) => item.module_type === "location_scene" && item.location_tags.includes("邮局")));
  assert.ok(modules.some((item) => item.module_type === "plot_seed" && item.genres.includes("轻推理")));
  assert.ok(modules.every((item) => item.summary.length <= 90));
});

test("extracts reusable story building blocks from source prose", () => {
  const text = [
    "退休邮递员说，旧邮局里有一封寄错地址的信。",
    "书店老板隐瞒了真正收件人的名字，只留下旧照片和咖啡小票。",
    "女孩原以为朋友失约，后来发现他是在桥边保护她的弟弟。",
    "最后她选择寄出那封信，也原谅了迟到十年的误会。"
  ].join("\n");

  const modules = extractStoryModules({ text, sourcePath: "rich-source.txt" });
  const allFacets = modules.flatMap((item) => [
    ...(item.facets?.characters ?? []),
    ...(item.facets?.conflicts ?? []),
    ...(item.facets?.twists ?? []),
    ...(item.facets?.clueInterfaces ?? []),
    ...(item.facets?.endings ?? [])
  ]);

  assert.ok(modules.some((item) => item.module_type === "character" && item.title.includes("退休邮递员")));
  assert.ok(modules.some((item) => item.module_type === "conflict" && item.title.includes("错误地址")));
  assert.ok(modules.some((item) => item.module_type === "turning_point" && item.title.includes("保护")));
  assert.ok(modules.some((item) => item.module_type === "clue" && item.produces.includes("可观察证物")));
  assert.ok(allFacets.includes("书店老板"));
  assert.ok(allFacets.includes("旧照片"));
  assert.ok(modules.every((item) => item.summary.length <= 110));
});

test("extracts light inspiration from filename instead of flattening everything into letters", () => {
  const text = [
    "她跟着手机导航进入商场，路线在同一层反复折返。",
    "电梯数字跳动，直播间里有人说今晚只有找到出口的人才能离开。",
    "朋友的定位明明就在附近，却像被另一个地图系统藏起来。"
  ].join("\n");

  const modules = extractStoryModules({ text, sourcePath: "荔枝汽水水作品集/恐怖导航.txt", author: "荔枝汽水水" });
  const allFacets = modules.flatMap((item) => [
    item.title,
    ...(item.facets?.motifs ?? []),
    ...(item.facets?.conflicts ?? []),
    ...(item.facets?.clueInterfaces ?? []),
    ...(item.facets?.sceneFunctions ?? [])
  ]);

  assert.ok(allFacets.includes("导航异常"));
  assert.ok(allFacets.includes("路线失控"));
  assert.ok(allFacets.includes("异常导航"));
  assert.ok(modules.some((item) => item.genres.includes("都市怪谈")));
  assert.ok(!modules.every((item) => item.title.includes("迟到的信")));
  assert.ok(modules.length <= 8);
  assert.ok(modules.every((item) => item.summary.length <= 110));
});
