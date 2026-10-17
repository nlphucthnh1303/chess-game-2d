## 2024-05-24 - Semantic Labels for Emojis
**Learning:** Screen readers will often read out emojis poorly or verbatim in UI buttons (like 🎮 or ↩️). It is critical to provide clear, semantic `AutomationProperties.Name` attributes that translate these actions naturally.
**Action:** Always provide `AutomationProperties.Name` for WPF UI elements that rely on emojis or icons for meaning, and match the application's localization language (e.g. Vietnamese).
