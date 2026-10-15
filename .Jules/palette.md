## 2026-10-15 - Enhancing Screen Reader Accessibility for Emojis in WPF
**Learning:** Emojis used in WPF `Button.Content` can result in poor screen reader experiences.
**Action:** Always provide a semantic, non-visual equivalent using `AutomationProperties.Name` and support hover behavior via `ToolTip` for mouse users when emojis are present in interactive elements.