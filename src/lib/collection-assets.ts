const collectionAssetBase = "/assets/collection-ui-art-assets-41";

const asset = (fileName: string) => `${collectionAssetBase}/${fileName}`;

export const collectionAssets = {
  background: {
    sunnyCity: asset("bg_sunny_city.webp"),
    lightParticles: asset("bg_light_particles.png")
  },
  hero: {
    cardFrame: asset("hero_card_frame.webp"),
    mapRoute: asset("hero_map_route.png"),
    cityStamp: asset("hero_city_stamp.png"),
    compassLarge: asset("hero_compass_large.png"),
    collectionTileIcon: asset("icon_collection_tile.png")
  },
  progress: {
    cardBg: asset("progress_card_bg.webp"),
    badgeRing: asset("progress_badge_ring.png"),
    ribbon: asset("progress_ribbon.png"),
    statChipBlue: asset("stat_chip_blue.png"),
    statChipGold: asset("stat_chip_gold.png"),
    statChipGreen: asset("stat_chip_green.png"),
    iconMainClue: asset("icon_main_clue.png"),
    iconHiddenEgg: asset("icon_hidden_egg.png"),
    iconArchiveBook: asset("icon_archive_book.png")
  },
  owner: {
    cardBg: asset("owner_card_bg.webp"),
    idBadge: asset("owner_id_badge.png"),
    photoStack: asset("owner_photo_stack.png"),
    stampWatermark: asset("owner_stamp_watermark.png")
  },
  filters: {
    activePill: asset("filter_pill_active.png"),
    defaultPill: asset("filter_pill_default.png"),
    all: asset("icon_filter_all.png"),
    main: asset("icon_filter_main.png"),
    branch: asset("icon_filter_branch.png"),
    hidden: asset("icon_filter_hidden.png"),
    mystery: asset("icon_filter_mystery.png")
  },
  clueCards: {
    unlockedBg: asset("clue_card_unlocked_bg.webp"),
    unlockedImageFrame: asset("clue_card_unlocked_image_frame.png"),
    collectedStamp: asset("stamp_collected.png"),
    unlockedTagPlate: asset("tag_unlocked_plate.png"),
    lockedBg: asset("clue_card_locked_bg.webp"),
    lockedTagPlate: asset("locked_tag_plate.png"),
    lockIconSmall: asset("lock_icon_small.png"),
    lockedBottomBadge: asset("locked_bottom_badge.png")
  },
  nav: {
    barBg: asset("nav_bar_bg.webp"),
    activePanel: asset("nav_active_panel.png"),
    home: asset("icon_nav_home.png"),
    task: asset("icon_nav_task.png"),
    collectionActive: asset("icon_nav_collection_active.png"),
    profile: asset("icon_nav_profile.png")
  }
} as const;
