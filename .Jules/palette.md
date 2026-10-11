## 2023-10-24 - Screen Reader Support for WPF Buttons with Emojis
**Learning:** In WPF, elements containing emojis or icon-like text content can confuse screen readers. `AutomationProperties.Name` is the standard pattern required to provide a clear, semantic label for assistive technologies, similar to `aria-label` in web development.
**Action:** Always add `AutomationProperties.Name` to WPF interactive elements (like `Button` or `ListBox`) when their visual `Content` includes emojis or lacks descriptive text. Add `ToolTip` for mouse users concurrently.
