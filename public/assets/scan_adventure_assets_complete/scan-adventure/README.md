# Scan Adventure Art Assets

This package contains the complete 30-asset PNG/WebP set for the mobile scan-adventure page.

Usage path suggestion:

src/assets/scan-adventure/
  bg_city_sunny.webp
  deco_top_route.png
  mission_card_pattern.png
  quest_main_deco.png
  quest_hidden_deco.png
  hud_street_demo.webp
  hud_frame_overlay.png
  hud_reticle.png
  hud_radar.png
  hud_compass.png
  marker_main_base.png
  marker_hidden_base.png
  info_panel_deco.png
  action_bar_bg.png
  scan_cta_glow.png
  side_button_bg.png
  sparkle_particles.png
  leaf_foreground.png
  icons/*.png

Notes:
- Text is intentionally not baked into any asset. Render all labels in code.
- PNG assets use real alpha transparency, not checkerboard/fake transparency.
- WebP street/background assets are intentionally opaque.
