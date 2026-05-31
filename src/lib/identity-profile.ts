import type { PlayerRoleCard } from "./types";

export type IdentityProfile = {
  title: string;
  bonus: string;
  hint: string;
};

const profiles: IdentityProfile[] = [
  {
    title: "城市寻物者",
    bonus: "更容易发现被忽略的街角物件、门牌、橱窗和入口招牌。",
    hint: "优先拍清楚门牌、店招、橱窗边角和公共导视信息。"
  },
  {
    title: "街区侦探",
    bonus: "更容易发现矛盾、时间线、证词和细节之间的不一致。",
    hint: "优先观察时间、编号、证词提到的位置和现场不一致的细节。"
  },
  {
    title: "漫游摄影师",
    bonus: "更容易发现构图、光影、颜色和画面边缘里的隐藏线索。",
    hint: "拍摄时保留边缘、反光、色块和有层次的公共画面。"
  },
  {
    title: "夜行记录员",
    bonus: "更容易发现灯光、反射、旧招牌和阴影里的路线提示。",
    hint: "优先观察灯箱、反射面、旧招牌、门口阴影和亮暗交界。"
  }
];

export function getIdentityProfile(role?: Pick<PlayerRoleCard, "roleTitle" | "name"> | null): IdentityProfile {
  const text = `${role?.roleTitle ?? ""}${role?.name ?? ""}`;
  if (/夜|灯|记录员|巡夜/.test(text)) return profiles[3];
  if (/侦探|调查|推理|档案|记录/.test(text)) return profiles[1];
  if (/摄影|相机|影像|拍照|照片/.test(text)) return profiles[2];
  if (/寻物|物件|收集|归还|漫游|城市/.test(text)) return profiles[0];
  return profiles[0];
}
