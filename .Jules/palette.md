## 2024-05-18 - Accessibility for WPF Buttons with Emojis
**Learning:** When using emojis in button content in WPF applications, screen readers may not read them well or correctly. Emojis could confuse users who depend on assistive technologies.
**Action:** Use `AutomationProperties.Name` to provide a clear and localized semantic label for screen readers. In addition, providing a `ToolTip` gives visual users extra context, completing the accessibility improvement.
