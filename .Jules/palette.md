## 2025-05-18 - WPF Accessibility for Emojis
**Learning:** In WPF, screen readers may misinterpret or awkwardly announce emojis used inside button content. It is important to provide clean semantic labels for screen readers when using icon-like content (like emojis) that isn't purely decorative.
**Action:** Use `AutomationProperties.Name` on interactive elements (like buttons with emojis) to provide clear, semantic labels for screen readers.
