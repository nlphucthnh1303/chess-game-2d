## 2025-05-18 - Emojis in WPF Buttons
**Learning:** Emojis inside standard WPF Button content strings (e.g. `🎮 Ván đấu mới`) can result in poor screen reader experiences.
**Action:** Always provide explicit localized strings via `AutomationProperties.Name` on WPF controls that use emojis for iconography, ensuring screen readers announce the intended action cleanly.
