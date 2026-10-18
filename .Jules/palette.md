## 2026-10-18 - Adding Accessible Labels for Emojis in WPF Buttons
**Learning:** When using emojis in button content within WPF (`Content="🎮 Ván đấu mới"`), screen readers may not read them ideally or the intention may not be fully clear. `AutomationProperties.Name` should be paired with these buttons to provide clean semantic labeling for accessibility.
**Action:** Use `AutomationProperties.Name` on interactive UI elements containing emojis in WPF to ensure good screen reader support.
