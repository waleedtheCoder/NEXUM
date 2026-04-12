# NEXUM — UI Bug Tracker

> Audited: 2026-04-12


## HIGH — VISIBLE BUGS

### 2. `MarketplaceBrowsingScreen.js` — `topBarTitle` style defined twice (lines 372 & 379)
The second definition silently overwrites the first. `minWidth: 80` is lost, breaking the category title row layout when the title is short.

### 3. `SearchScreen.js` — Filter labels hardcoded English
`FILTER_CONDITIONS` and `FILTER_UNITS` arrays (`'New'`, `'Bulk Wholesale'`, `'kg'`, `'liters'`, etc.) are hardcoded strings. Urdu users always see English in the filter UI.

### 4. `ChatConversationScreen.js` — `"Sending…"` hardcoded English
Optimistic messages set `time: 'Sending…'` regardless of the selected language.

### 5. `ProductDetailScreen.js` — NaN shown on non-numeric quantity input
`parseInt(orderQty, 10)` has no validation. Typing letters causes NaN to appear in the live price calculation with no error feedback.

### 6. `CategoryListingsScreen.js` — Sort labels bypass translation
`'Newest'`, `'Price ↑'`, `'Price ↓'` are hardcoded English. The arrow characters also render incorrectly in RTL (Urdu) layout.

---

## MEDIUM — UX DEGRADATION

### 7. `MarketplaceBrowsingScreen.js` — Saved (heart) state lost on navigation
`saved` is local component state. Navigating away and back resets all saved/hearted items. Needs AsyncStorage or context persistence.

### 8. `SearchScreen.js` — Recent searches lost on app restart
`recents` state is never persisted to AsyncStorage. Search history disappears every time the app restarts.

### 9. `NotificationsScreen.js` — `item.color` used without validation
Notification icon color is taken directly from the API response. An invalid or missing color value causes a crash or broken rendering.

### 10. `MoreMenuScreen.js` — Support email is a dead-end placeholder
Tapping "Support" shows a `comingSoon` alert with the hardcoded string `'support@nexum.pk'`. Users get no actionable help.

### 11. `ProductDetailScreen.js` — Hardcoded `"Rs"` currency and `"units"` text
Neither goes through the translation system. Urdu layout shows mixed English inline with Arabic script.

### 12. `BottomNav.js` — FAB label `"Create"` hardcoded
All other tab labels use `tab.label` from the translations object. The Create FAB label is hardcoded and won't change in Urdu mode.

---

## LOW — MINOR / POLISH

### 13. `RoleSelectionScreen.js` — Multiple hardcoded English strings
"Are you a shopkeeper or supplier?", "Next", and "Skip" all bypass the translation system.

### 14. `ChatConversationScreen.js` — `"✓✓"` read receipt not translatable
Hardcoded double-tick character. Meaningless to screen readers and non-technical users.

### 15. `CreateListingScreen.js` — `console.log()` left in production code
Debug logs present on lines ~63 and ~116. Should be removed before release.

### 16. `CategoryBrowseScreen.js` — Section colors keyed by hardcoded title strings
If the API returns a section name not in the hardcoded map, it silently falls back to a default color, breaking the intended visual hierarchy.

### 17. `HomeScreen.js` — Empty gap in card metadata row
If both `product.timePosted` and `product.time` are undefined, an empty gap renders in the product card metadata row instead of being hidden.
