## 2026-10-20 - WPF Screen Reader Noise From Emojis
**Learning:** WPF buttons with emojis inside their content (like "🎮 Ván đấu mới" or "↩️ Hoàn nước đi") cause visual delight but create accessibility noise, as screen readers will literally read out the emojis or get confused by them in unexpected ways.
**Action:** Used `AutomationProperties.Name` to provide a clean semantic label for the screen reader that omits the emoji, while adding `ToolTip` properties so sighted users have more context.
