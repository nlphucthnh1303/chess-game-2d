## 2024-05-19 - Added Screen Reader Automation Properties for WPF Emojis
**Learning:** In WPF, components like `Button` with pure text contents that include Emojis (e.g. `🎮 Ván đấu mới`) might have varying success being read clearly by screen readers. `AutomationProperties.Name` is the WPF equivalent of ARIA labels, and adding it explicitly clarifies the semantic purpose without visually changing the button content.
**Action:** Always verify if interactive controls, especially those with non-standard text characters, have `AutomationProperties.Name` set for screen reader compatibility.
