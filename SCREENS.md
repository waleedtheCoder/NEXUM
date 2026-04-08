# NEXUM — Screen Functionality Reference

This document describes every screen in the NEXUM frontend. For each screen it covers:
- **Purpose** — what the screen does and who uses it
- **Implementation** — key state, logic, and UI patterns
- **Backend connection** — which API endpoints are called
- **Data sent** — request bodies and query parameters
- **Data received** — response shapes used by the screen
- **Navigation** — how the user arrives and where they can go next

---

## Table of Contents

### App Launch & Onboarding
1. [SplashScreen](#1-splashscreen)
2. [WelcomeScreen](#2-welcomescreen)
3. [RoleSelectionScreen](#3-roleselectionscreen)
4. [LocationsScreen](#4-locationsscreen)

### Authentication
5. [AuthOptionsScreen](#5-authoptionsscreen)
6. [LoginScreen / EmailLoginScreen](#6-loginscreen--emailloginscreen)
7. [SignUpScreen](#7-signupscreen)
8. [OTPVerificationScreen](#8-otpverificationscreen)
9. [ForgotPasswordScreen](#9-forgotpasswordscreen)
10. [ResetPasswordScreen](#10-resetpasswordscreen)
11. [SavedAccountLoginScreen](#11-savedaccountloginscreen)

### Marketplace & Browsing
12. [HomeScreen](#12-homescreen)
13. [MarketplaceBrowsingScreen](#13-marketplacebrowsingscreen)
14. [CategoryBrowseScreen](#14-categorybrowsescreen)
15. [CategorySelectionScreen](#15-categoryselectionscreen)
16. [CategoryListingsScreen](#16-categorylistingsscreen)
17. [SearchScreen](#17-searchscreen)
18. [SavedListingsScreen](#18-savedlistingsscreen)

### Product & Supplier
19. [ProductDetailScreen](#19-productdetailscreen)
20. [SupplierProfileScreen](#20-supplierprofilescreen)

### Orders
21. [OrderHistoryScreen](#21-orderhistoryscreen)
22. [OrderDetailScreen](#22-orderdetailscreen)
23. [IncomingOrdersScreen](#23-incomingordersscreen)

### Chat & Messaging
24. [ChatListScreen](#24-chatlistscreen)
25. [ChatConversationScreen](#25-chatconversationscreen)

### Notifications
26. [NotificationsScreen](#26-notificationsscreen)

### Shopkeeper Account
27. [AccountTabScreen](#27-accounttabscreen)
28. [AccountSettingsScreen](#28-accountsettingsscreen)
29. [GuestAccountScreen](#29-guestaccountscreen)
30. [ShopkeeperDashboardScreen](#30-shopkeeperdashboardscreen)
31. [SupplierNetworkScreen](#31-suppliernetworkscreen)
32. [SavedListingsScreen](#18-savedlistingsscreen) *(see above)*
33. [RestockRemindersScreen](#33-restockremindersscreen)
34. [EditProfileScreen](#34-editprofilescreen)
35. [MoreMenuScreen](#35-moremenuscreen)

### Supplier Screens
36. [SellTabScreen](#36-selltabscreen)
37. [MyListingsScreen](#37-mylistingsscreen)
38. [MyListingsManagementScreen](#38-mylistingsmanagementscreen)
39. [CreateListingScreen](#39-createlistingscreen)
40. [SupplierAccountScreen](#40-supplieraccountscreen)
41. [BecomeSupplierScreen](#41-becomesupplierscreen)

### Utility
42. [NoInternetScreen](#42-nointernetscreen)

---

## 1. SplashScreen

**Purpose:** Entry point of the app. Displays the NEXUM logo while `UserContext` restores the session from storage.

**Implementation:**
- Waits for `isLoading` from `UserContext` to become `false` (session restore complete).
- After a 1.5 s delay, navigates to `MainApp` (the bottom-tab navigator) regardless of auth state — the tab screens handle their own auth gates.

**Backend connection:** None. Session restoration happens in `UserContext` using `AsyncStorage`.

**Data sent:** Nothing.

**Data received:** Nothing.

**Navigation:** → `MainApp` (unconditional reset after load)

---

## 2. WelcomeScreen

**Purpose:** First-run onboarding screen shown to new users who have not seen it before. Explains the app in English or Urdu.

**Implementation:**
- A language toggle switches between English and Urdu (RTL layout).
- Tapping **Continue** writes `has_seen_onboarding = 'true'` to `AsyncStorage` so this screen is never shown again, then navigates to `RoleSelection`.

**Backend connection:** None.

**Data sent:** `has_seen_onboarding` key to `AsyncStorage` only.

**Data received:** Nothing.

**Navigation:** → `RoleSelection`

---

## 3. RoleSelectionScreen

**Purpose:** Step 1 of the post-signup onboarding flow. Lets a new user choose whether they are a **Shopkeeper** or **Supplier**. Also reachable after OTP verification on signup.

**Implementation:**
- Two large option cards: Shopkeeper / Supplier.
- Tapping **Next** calls `setUserRole(selected)` on `UserContext` (persists to `AsyncStorage`), then goes to `Locations`.
- **Skip** also goes to `Locations` without saving a role.

**Backend connection:** None — role is stored locally and sent with login/signup calls.

**Data sent:** Nothing to backend.

**Data received:** Nothing.

**Navigation:** → `Locations`

---

## 4. LocationsScreen

**Purpose:** Step 2 of onboarding. User selects their city/cities of operation from a static list of 10 Pakistani cities.

**Implementation:**
- Cities are filtered by a search input.
- Multi-select: tapping a city toggles it on/off.
- **Continue** saves `selected_locations` as a JSON array to `AsyncStorage`, then navigates to `MainApp` (full reset).

**Backend connection:** None.

**Data sent:** `selected_locations` key to `AsyncStorage` only.

**Data received:** Nothing.

**Navigation:** → `MainApp` (full stack reset)

---

## 5. AuthOptionsScreen

**Purpose:** Login/signup entry screen, accessible from the guest account screen or when a protected action is attempted. Shows options to continue with email or phone, and a link to sign up.

**Implementation:**
- Bilingual (English / Urdu toggle).
- Both "Continue with Email" and "Continue with Number" buttons both navigate to `Login` (phone login is not separately implemented yet).
- "Sign Up" links to `SignUp`.

**Backend connection:** None.

**Data sent:** Nothing.

**Data received:** Nothing.

**Navigation:** → `Login` · → `SignUp`

---

## 6. LoginScreen / EmailLoginScreen

**Route name:** `Login`
**Note:** `EmailLoginScreen.js` is an alias that simply re-exports `LoginScreen`.

**Purpose:** Authenticates an existing user with email and password.

**Implementation:**
- Collects email and password (with show/hide toggle).
- Calls `loginWithBackend({ email, password, role })` from `authApi`.
- On success, calls `login(session_id, userData, role, { idToken, refreshToken })` on `UserContext`, then resets the stack to `MainApp`.

**Backend connection:** `POST /api/users/auth/login/`

**Data sent:**
```json
{ "email": "user@example.com", "password": "...", "role": "shopkeeper" }
```

**Data received:**
```json
{
  "session_id": "...",
  "id_token": "...",
  "refresh_token": "...",
  "user": { "uid": "...", "email": "...", "name": "...", "role": "SHOPKEEPER", "phone_number": "...", "email_verified": true, "profile_image_url": "..." }
}
```

**Navigation:** → `MainApp` (on success) · → `ForgotPassword` · → `SignUp`

---

## 7. SignUpScreen

**Purpose:** Creates a new account. Enforces password strength rules in real time before sending an OTP.

**Implementation:**
- Collects name, email, password, confirm password.
- Validates 5 password rules live (length, upper, lower, number, special char) using a `PasswordRule` sub-component.
- Calls `signupWithBackend({ name, email, password, role })` from `authApi`.
- On success (OTP sent by backend), navigates to `OTPVerification` passing `{ email, flow: 'signup', name, password, role }`.

**Backend connection:** `POST /api/users/auth/signup/`

**Data sent:**
```json
{ "name": "Ahmed Khan", "email": "user@example.com", "password": "...", "role": "shopkeeper" }
```

**Data received:**
```json
{ "message": "OTP sent", "flow": "signup", "email": "user@example.com" }
```

**Navigation:** → `OTPVerification` (with signup params) · → `Login`

---

## 8. OTPVerificationScreen

**Purpose:** Validates a 4-digit OTP sent to the user's email. Used for both **signup completion** and **password reset**.

**Implementation:**
- 4 auto-advancing digit inputs (refs for focus management and backspace handling).
- 60-second countdown; **Resend OTP** becomes active after expiry.
- Calls `verifyOtpWithBackend({ email, flow, otp })` from `authApi`.
- **Signup flow:** on success, receives a full auth response, calls `login(...)` on `UserContext`, then resets to `RoleSelection`.
- **Reset flow:** navigates to `ResetPassword` passing `{ email, otp }`.

**Backend connection:**
- Verify: `POST /api/users/auth/verify-otp/`
- Resend (reset only): `POST /api/users/auth/forgot-password/`

**Data sent (verify):**
```json
{ "email": "user@example.com", "flow": "signup", "otp": "1234" }
```

**Data received (signup flow):** Same shape as login response (full auth session).
**Data received (reset flow):** `{ "message": "OTP verified" }`

**Navigation:** → `RoleSelection` (signup success) · → `ResetPassword` (reset success)

---

## 9. ForgotPasswordScreen

**Purpose:** Initiates a password reset by sending an OTP to the user's registered email.

**Implementation:**
- Single email input.
- Calls `forgotPasswordWithBackend({ email })`.
- On success, navigates to `OTPVerification` with `{ email, flow: 'reset' }`.

**Backend connection:** `POST /api/users/auth/forgot-password/`

**Data sent:**
```json
{ "email": "user@example.com" }
```

**Data received:**
```json
{ "message": "OTP sent", "flow": "reset", "email": "user@example.com" }
```

**Navigation:** → `OTPVerification` (reset flow)

---

## 10. ResetPasswordScreen

**Purpose:** Sets a new password after OTP verification. Requires `{ email, otp }` from route params.

**Implementation:**
- Two password fields (new + confirm) with show/hide toggles.
- 4 live password rules (length, number, letter, special char).
- Calls `resetPasswordWithBackend({ email, otp, newPassword })`.
- On success, shows an alert and resets the stack to `Login`.

**Backend connection:** `POST /api/users/auth/reset-password/`

**Data sent:**
```json
{ "email": "user@example.com", "otp": "1234", "new_password": "NewPass@1" }
```

**Data received:**
```json
{ "message": "Password reset successful." }
```

**Navigation:** → `Login` (on success)

---

## 11. SavedAccountLoginScreen

**Purpose:** Quick re-login screen shown when a guest taps a protected action. Reads the last-used email from `AsyncStorage` and shows a pre-filled account card, then prompts for the password.

**Implementation:**
- Loads `saved_email` and `saved_name` from `AsyncStorage` on mount.
- Tapping the saved account card reveals a password input.
- Calls `loginWithBackend({ email, password })` on submit.
- On success, calls `login(...)` on `UserContext` and goes back.

**Backend connection:** `POST /api/users/auth/login/`

**Data sent / received:** Same as `LoginScreen`.

**Navigation:** → goes back after successful login · → `AuthOptions` (if no saved account or user wants a different account)

---

## 12. HomeScreen

**Purpose:** Main landing screen for shopkeepers. Shows a promotional banner, quick navigation icons, category chips, and featured listings.

**Implementation:**
- Three parallel `useEffect` calls on mount: one for promotions, one for categories, one for featured listings.
- Promotions drive a hero banner at the top and a "Special Offers" tile list at the bottom.
- Category chips are horizontal-scrolling cards from the API.
- Featured listings are horizontal-scrolling product cards.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `getPromotions()` | `GET /api/listings/promotions/` |
| `getCategories()` | `GET /api/listings/categories/` |
| `getListings({ featured: true })` | `GET /api/listings/?featured=true` |

**Data sent:** Query params `featured=true` for featured listings. No auth required.

**Data received:**
- Promotions: `[{ id, listingId, title, subtitle, badge, discountedPrice, originalPrice, imageUrl }]`
- Categories: `[{ id, section, name, icon, count }]`
- Featured listings: `[{ id, title, price, location, time, isFeatured, imageUrl, category }]`

**Navigation:** → `Search` · → `ProductDetail` (banner/card tap) · → `MarketplaceBrowsing` (category/view-all tap)

---

## 13. MarketplaceBrowsingScreen

**Purpose:** Full paginated product listing with sort filters (Newest, Price ↑, Price ↓), inline search, grid/list view toggle, and heart (save) buttons.

**Implementation:**
- `fetchProducts()` is triggered on mount and whenever the active sort chip changes.
- Search uses a 400 ms debounce (`searchTimer` ref) before firing a new fetch.
- Heart button calls `toggleSaveListing()` with optimistic state (a `Set` of saved IDs managed locally — not synced from backend on load).
- Supports both grid (2 columns) and list view modes, toggled by a button pair.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `getListings({ sort, q })` | `GET /api/listings/?sort=newest&q=...` |
| `toggleSaveListing(id, willSave, authArgs)` | `POST` or `DELETE /api/listings/<id>/save/` |

**Data sent:**
- `sort`: `newest` / `price_asc` / `price_desc`
- `q`: search string (optional)
- Save toggle: `{}` (POST) or no body (DELETE), requires `idToken`/`sessionId`

**Data received:** Array of listing card objects.

**Navigation:** → `ProductDetail` (card tap) · back via header

---

## 14. CategoryBrowseScreen

**Purpose:** Hierarchical category directory grouped by section (e.g., FOOD & GROCERY, SNACKS & BEVERAGES). Used for browsing by category.

**Implementation:**
- Fetches all categories, groups them by `section` field into a `SectionList`.
- Each row taps through to `CategoryListings` passing the category name.

**Backend connection:** `GET /api/listings/categories/`

**Data sent:** Nothing.

**Data received:** `[{ id, section, name, icon }]`

**Navigation:** → `CategoryListings` (passing `{ category: item.name }`)

---

## 15. CategorySelectionScreen

**Purpose:** Dark-themed modal-style screen where a supplier picks a category **before** creating a listing. Separates the first 6 categories as "Popular".

**Implementation:**
- Same `getCategories()` call as CategoryBrowseScreen, but groups into Popular / All sections.
- Tapping a row navigates to `CreateListing` with the chosen category name.

**Backend connection:** `GET /api/listings/categories/`

**Data received:** `[{ id, section, name, icon }]`

**Navigation:** → `CreateListing` (passing `{ category: name }`)

---

## 16. CategoryListingsScreen

**Purpose:** Shows all active listings filtered by a specific category, with sort chips.

**Implementation:**
- `route.params.category` is the category name passed from `CategoryBrowseScreen` or `HomeScreen`.
- Calls `getListings({ category, sort })` on mount and when sort changes.
- Grid layout using the shared `ProductCard` component.

**Backend connection:** `GET /api/listings/?category=<name>&sort=<value>`

**Data sent:** `category` and `sort` as query params. No auth required.

**Data received:** Array of listing card objects.

**Navigation:** → `ProductDetail` (card tap)

---

## 17. SearchScreen

**Purpose:** Full-text search with keyword history, trending chips, and advanced filters (price range, condition, unit).

**Implementation:**
- Recent searches stored locally in state (max 5, de-duplicated).
- Trending chips loaded from `getTrendingSearch()` on mount with static fallbacks.
- Submitting a query calls `doSearch(text, filters)` which builds URL params.
- **Filter modal:** a bottom sheet with price min/max inputs, condition chips, unit chips. Active filters shown with an orange dot on the filter button. Applying filters re-runs the search if already submitted.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `getTrendingSearch()` | `GET /api/listings/search/trending/` |
| `searchListings(q, { price_min, price_max, condition, unit })` | `GET /api/listings/search/?q=...&price_min=...&condition=...&unit=...` |

**Data sent:** All as query parameters — `q` (required), `price_min`, `price_max`, `condition`, `unit`.

**Data received:**
- Trending: `{ popularProducts: [...], popularSuppliers: [...] }`
- Search: `{ results: [ListingCard, ...] }`

**Navigation:** → `ProductDetail` (result card tap)

---

## 18. SavedListingsScreen

**Purpose:** Shows all listings the logged-in shopkeeper has saved (hearted). Auth-gated.

**Implementation:**
- Redirects to `GuestAccount` if not logged in.
- Reloads on every focus via `useFocusEffect`.
- Supports pull-to-refresh.
- Heart button on each card calls `toggleSaveListing(id, false)` to **unsave** with optimistic removal (card disappears immediately, reverts on error).
- `unsavingIds` Set tracks in-flight unsave operations to disable duplicate taps.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `getSavedListings(authArgs)` | `GET /api/listings/saved/` |
| `toggleSaveListing(id, false, authArgs)` | `DELETE /api/listings/<id>/save/` |

**Data sent:** Auth headers (`idToken` / `sessionId`). No body.

**Data received:** `[{ id, title, price, location, time, isFeatured, imageUrl }]`

**Navigation:** → `ProductDetail` (card tap) · → `MarketplaceBrowsing` (empty state CTA)

---

## 19. ProductDetailScreen

**Purpose:** Full product detail view with image carousel, details table, description, seller info card, and action buttons (Call, Chat, Place Order). The primary conversion screen.

**Implementation:**
- Receives a `product` stub via `route.params`. If the stub lacks `details`/`seller`/`images`, fetches the full listing detail on mount.
- Image carousel supports multiple images with dot indicators.
- **Save/unsave:** heart icon in top-right, optimistic toggle via `toggleSaveListing`.
- **Call:** opens `tel:` URL with seller's phone number.
- **Chat:** calls `startConversation({ listingId, message })`, navigates to `ChatConversation`.
- **Place Order:** opens a bottom-sheet modal. Quantity stepper (tap +/–), optional notes, live total. Confirms via `placeOrder(...)`.
- Tapping the seller card navigates to `SupplierProfile`.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `getListingDetail(id)` | `GET /api/listings/<id>/` |
| `toggleSaveListing(id, bool, authArgs)` | `POST`/`DELETE /api/listings/<id>/save/` |
| `startConversation({ listingId, message, ...authArgs })` | `POST /api/chat/start/` |
| `placeOrder({ listing_id, quantity, notes }, authArgs)` | `POST /api/orders/place/` |

**Data sent:**
- Order: `{ listing_id: number, quantity: number, notes: string }`
- Chat start: `{ listing_id: number, message: string }`

**Data received:**
- Listing detail: `{ id, title, price, location, timePosted, images, details: [{label, value}], description, seller: { id, name, initials, rating, sales, phone } }`
- Order: `OrderSerializer` shape
- Chat: `{ conversation: { id, username, productTitle, ... }, created: boolean }`

**Navigation:** → `ChatConversation` · → `SupplierProfile` · → `OrderHistory` (post-order alert)

---

## 20. SupplierProfileScreen

**Purpose:** Public profile page for a supplier. Shows their avatar, ratings, stats, real reviews, and active listings grid.

**Implementation:**
- Receives `supplierId` from `route.params`.
- Fetches profile and reviews **in parallel** using `Promise.all`.
- Rating row shows real star ratings computed from reviews; displays "No reviews yet" if `rating` is `null`.
- Reviews section shows buyer name, star rating, review date (formatted from ISO `createdAt`), and review text.
- Listings displayed in a 2-column `FlatList` with a `ListHeaderComponent` containing the profile card and reviews.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `getSupplierProfile(supplierId, authArgs)` | `GET /api/users/supplier/<id>/` |
| `getSupplierReviews(supplierId)` | `GET /api/orders/reviews/?supplier_id=<id>` |

**Data sent:** `supplierId` in URL. No body.

**Data received:**
- Profile: `{ id, name, initials, avatarColor, rating, totalReviews, totalListings, listings: [ListingCard] }`
- Reviews: `{ avgRating, totalReviews, reviews: [{ id, buyerName, rating, text, createdAt }] }`

**Navigation:** → `ProductDetail` (listing card tap)

---

## 21. OrderHistoryScreen

**Purpose:** Shows a shopkeeper's full purchase history, ordered newest-first. Reloads on every screen focus.

**Implementation:**
- `useFocusEffect` triggers `getOrders(authArgs)` each time the screen comes into focus.
- Each `OrderCard` displays product image, name, supplier, quantity, date, total price, and a colour-coded status badge.
- Tapping a card navigates to `OrderDetail` passing the full order object (fast path — no re-fetch needed).

**Backend connection:** `GET /api/orders/`

**Data sent:** Auth headers only.

**Data received:**
```json
[{ "id": "1", "productName": "Basmati Rice", "supplierName": "...", "quantity": 50,
   "unit": "kg", "unitPrice": "8800.00", "totalPrice": "440000.00",
   "imageUrl": "...", "status": "pending", "statusLabel": "Pending", "orderDate": "2 days ago",
   "notes": "", "hasReview": false }]
```

**Navigation:** → `OrderDetail` (card tap, passes `{ order: item }`)

---

## 22. OrderDetailScreen

**Purpose:** Full detail view of a single order with a status timeline, cancel button (pending orders), and a review modal (delivered orders).

**Implementation:**
- Accepts either a pre-loaded `order` object (fast path from `OrderHistoryScreen`) or just `orderId` (fetches from backend).
- **Status timeline:** animated step indicator for pending → confirmed → shipped → delivered. Shows cancelled banner if cancelled.
- **Cancel order:** Alert confirmation → `cancelOrder(order.id, authArgs)` → updates local state.
- **Leave a Review:** shown on delivered orders where `order.hasReview === false`. Opens a modal with a 5-star picker and optional text field. Calls `createReview(order.id, { rating, text }, authArgs)`. Shows "Review submitted" badge after success.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `getOrderDetail(orderId, authArgs)` | `GET /api/orders/<id>/` |
| `cancelOrder(orderId, authArgs)` | `PATCH /api/orders/<id>/` with `{ status: 'cancelled' }` |
| `createReview(orderId, { rating, text }, authArgs)` | `POST /api/orders/<id>/review/` |

**Data sent:**
- Cancel: `{ "status": "cancelled" }`
- Review: `{ "rating": 4, "text": "Great product!" }`

**Data received:**
- Order: Full `OrderSerializer` shape including `hasReview: boolean`
- Review: `{ id, rating, text, createdAt }`

**Navigation:** Back only.

---

## 23. IncomingOrdersScreen

**Purpose:** Supplier's management view of all orders placed on their listings. Allows status progression and cancellation.

**Implementation:**
- `useFocusEffect` loads `getIncomingOrders(authArgs)` each visit.
- Pull-to-refresh supported.
- Each `OrderCard` shows product name, buyer name, quantity, unit, date, total, and a colour-coded status badge.
- **Action buttons** appear based on current status:
  - `pending` → Confirm / Cancel
  - `confirmed` → Mark Shipped / Cancel
  - `shipped` → Mark Delivered
  - `delivered` / `cancelled` → no actions
- Tapping an action button calls `updateOrderStatus(order.id, nextStatus, authArgs)` with optimistic local update.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `getIncomingOrders(authArgs)` | `GET /api/orders/incoming/` |
| `updateOrderStatus(orderId, status, authArgs)` | `PATCH /api/orders/<id>/` |

**Data sent (status update):**
```json
{ "status": "confirmed" }
```

**Data received:**
```json
[{ "id": "5", "productName": "Wheat Flour", "buyerName": "Ali Shop", "quantity": 100,
   "unit": "kg", "totalPrice": "55000.00", "orderDate": "1 hour ago",
   "status": "pending", "notes": "Deliver by Friday" }]
```

**Navigation:** Back to `SupplierAccount`.

---

## 24. ChatListScreen

**Purpose:** Lists all conversations the logged-in user is part of. Supports filtering by All / Buying / Selling / Favourites tabs and inline search.

**Implementation:**
- `useFocusEffect` reloads conversations each time the screen is focused.
- Filter chips pass a `type` param (`buying`, `selling`, `favourites`) to `getConversations()`.
- Client-side search filters on `chat.username` and `chat.productTitle`.
- Each `ChatItem` shows an avatar (coloured initial), username, product title, last message preview, unread dot, and timestamp.

**Backend connection:** `GET /api/chat/?type=<value>`

**Data sent:** `type` query param (`buying`, `selling`, or `favourites`). Auth headers.

**Data received:**
```json
[{ "id": 3, "username": "Ali Rice Mills", "productTitle": "Basmati 25kg",
   "type": "buying", "isFavourite": false, "timestamp": "10:32 AM",
   "secondaryDetail": "Last message preview", "isUnread": true,
   "avatarColor": "#F59E0B", "avatarInitial": "A" }]
```

**Navigation:** → `ChatConversation` (passing `{ chat: item }`)

---

## 25. ChatConversationScreen

**Purpose:** Full one-to-one chat view with a message list, quick-reply chips (empty conversations), typing indicator, and a message input bar.

**Implementation:**
- **Polling:** fetches messages every 3 seconds via `setInterval`. The interval is set up only after the initial load completes.
- **`authArgsRef`:** a ref keeps auth tokens up-to-date without recreating the interval on token refresh.
- **Optimistic send:** message appears immediately with a `pending: true` flag and `time: 'Sending…'` while the API call is in flight. Removed on error.
- **Typing indicator:** `handleTyping` debounces sending of typing signals (fires `sendTypingSignal` at most once every 2.5 s while typing). `fetchMessages` parses `other_is_typing` from the server response and shows a `"[username] is typing…"` bubble. Typing timer is cleaned up on unmount.
- **Quick replies:** 4 preset message buttons shown only when the conversation has no messages.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `getMessages(convId, authArgs)` | `GET /api/chat/<id>/messages/` |
| `sendMessage(convId, text, authArgs)` | `POST /api/chat/<id>/messages/send/` |
| `sendTypingSignal(convId, authArgs)` | `POST /api/chat/<id>/typing/` |

**Data sent:**
- Send: `{ "message": "What is the price?" }`
- Typing: `{}` (empty body)

**Data received:**
```json
{
  "messages": [{ "id": 1, "text": "Hello", "time": "10:32 AM", "mine": true }],
  "other_is_typing": false
}
```

**Navigation:** Back to `ChatList`.

---

## 26. NotificationsScreen

**Purpose:** Notification inbox with filter tabs: All, Unread, Inquiries, Alerts. Allows marking individual or all notifications as read.

**Implementation:**
- `useFocusEffect` reloads notifications each visit.
- Filter tabs do client-side filtering (Unread = `!n.read`, Inquiries = `type === 'inquiry'`, Alerts = other types).
- Tapping a notification calls `markNotificationRead(id, authArgs)` with an optimistic update (sets `read: true` locally before the API confirms). If the notification has a `conversationId`, navigates to `ChatConversation`.
- "Mark all read" button calls `markAllNotificationsRead(authArgs)` and updates all local items.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `getNotifications(authArgs)` | `GET /api/notifications/` |
| `markNotificationRead(id, authArgs)` | `POST /api/notifications/<id>/read/` |
| `markAllNotificationsRead(authArgs)` | `POST /api/notifications/mark-all-read/` |

**Data sent:** Auth headers. No body for mark-read calls.

**Data received:**
```json
[{ "id": 7, "title": "New order received", "body": "Ali Shop ordered 50kg of Wheat Flour.",
   "time": "2 hours ago", "type": "order", "read": false,
   "color": "#3B82F6", "icon": "bag-check-outline" }]
```

**Navigation:** → `ChatConversation` (if notification has `conversationId`)

---

## 27. AccountTabScreen

**Purpose:** Smart router for the Account bottom tab. Renders the correct account screen based on auth and role state — no UI of its own.

**Logic:**
- Not logged in → `GuestAccountScreen`
- Logged in as SUPPLIER → `SupplierAccountScreen`
- Logged in as SHOPKEEPER (or no role) → `AccountSettingsScreen`

**Backend connection:** None.

---

## 28. AccountSettingsScreen

**Purpose:** Shopkeeper's account dashboard. Shows their profile card, a menu of features (Saved Listings, Supplier Network, Restock Reminders, etc.), and a recent orders section.

**Implementation:**
- `useFocusEffect` loads the last 3 orders for the "Recent Orders" section.
- Profile card shows name, email, role badge, and a pencil icon to `EditProfile`.
- Menu items navigate to their respective screens; items with `screen: null` show a "Coming Soon" alert.
- Recent order rows are tappable → `OrderDetail`.
- **Logout** button calls `logout()` on `UserContext` and resets to `MainApp`.

**Backend connection:** `GET /api/orders/`

**Data sent:** Auth headers.

**Data received:** Array of order summaries (same as `OrderHistoryScreen`).

**Navigation:** → `EditProfile` · → `SavedListings` · → `SupplierNetwork` · → `RestockReminders` · → `MarketplaceBrowsing` · → `OrderDetail` · → `ShopkeeperDashboard`

---

## 29. GuestAccountScreen

**Purpose:** Placeholder Account screen shown to unauthenticated users. Prompts them to sign in.

**Implementation:**
- Purely static. Shows a warehouse illustration, a description message, and two buttons: **Sign In** and **Create Account**.
- Explore items (static list) navigate to public screens.

**Backend connection:** None.

**Navigation:** → `AuthOptions` (Sign In) · → `SignUp` (Create Account) · → `MarketplaceBrowsing`

---

## 30. ShopkeeperDashboardScreen

**Purpose:** A shopkeeper-mode dashboard accessible by suppliers who want to browse as a buyer, and by shopkeepers who might want to register as a supplier. Shows recent orders and a menu of buying features.

**Implementation:**
- `useFocusEffect` loads recent orders (last 3).
- Menu items include: Browse Marketplace, My Orders, Saved Listings, Supplier Network, Restock Reminders.
- Role-based CTA at the bottom:
  - Supplier sees "Switch to Supplier Mode" → navigates back to `SupplierAccount`.
  - Shopkeeper sees "Register as Supplier" → navigates to `BecomeSupplier`.

**Backend connection:** `GET /api/orders/`

**Navigation:** → `MarketplaceBrowsing` · → `OrderHistory` · → `SavedListings` · → `SupplierNetwork` · → `RestockReminders` · → `BecomeSupplier` or `SupplierAccount`

---

## 31. SupplierNetworkScreen

**Purpose:** Shows the shopkeeper's saved/favourited suppliers. Allows removing a supplier from the network and tapping through to their profile.

**Implementation:**
- `useFocusEffect` reloads the network list each visit.
- Heart button on each card calls `toggleFavouriteSupplier(supplierId, false, authArgs)` to remove with optimistic update (card disappears instantly, reverts on error).
- Empty state CTA navigates to `MarketplaceBrowsing` to discover new suppliers.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `getSupplierNetwork(authArgs)` | `GET /api/users/network/` |
| `toggleFavouriteSupplier(supplierId, false, authArgs)` | `POST /api/users/network/toggle/` |

**Data sent (toggle):**
```json
{ "supplier_id": 42 }
```

**Data received:**
```json
[{ "id": "42", "name": "Bismillah Rice Mills", "initials": "BR",
   "avatarColor": "#F59E0B", "totalListings": 8 }]
```

**Navigation:** → `SupplierProfile` (card tap)

---

## 33. RestockRemindersScreen

**Purpose:** Lets shopkeepers set reminders for products they frequently restock. Synced with the backend — not stored locally.

**Implementation:**
- `useFocusEffect` loads reminders on each visit.
- **Add reminder:** a bottom-sheet modal with a product name input, suggestion chips (filtered to exclude already-added products), quantity number input, and a unit picker (dropdown chips).
- **Toggle active/inactive:** `Switch` component calls `updateReminder(id, { active: bool }, authArgs)` with optimistic toggle (reverts on error).
- **Delete:** Alert confirmation → `deleteReminder(id, authArgs)` with optimistic removal.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `getReminders(authArgs)` | `GET /api/users/reminders/` |
| `createReminder(data, authArgs)` | `POST /api/users/reminders/` |
| `updateReminder(id, { active }, authArgs)` | `PATCH /api/users/reminders/<id>/` |
| `deleteReminder(id, authArgs)` | `DELETE /api/users/reminders/<id>/` |

**Data sent (create):**
```json
{ "product": "Basmati Rice", "quantity": "50", "unit": "kg", "active": true }
```

**Data received:**
```json
[{ "id": 1, "product": "Basmati Rice", "quantity": "50", "unit": "kg", "active": true }]
```

**Navigation:** Back only.

---

## 34. EditProfileScreen

**Purpose:** Allows both shopkeepers and suppliers to edit their full name, phone number, and profile photo.

**Implementation:**
- Pre-fills all fields from `UserContext`.
- **isDirty** check: Save button and bottom CTA are disabled unless at least one field has changed.
- **Photo upload:** tapping the avatar opens `expo-image-picker`. The picked image is shown immediately as a preview. An upload call to the backend runs in the background; a spinner overlays the preview. Only the returned URL is saved in the payload.
- **Save:** sends only the changed fields in the PATCH body. On success, calls `updateUser(...)` on `UserContext` so the name change reflects everywhere immediately.
- Email is shown as read-only with a "Managed by Firebase" lock badge.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `uploadProfileImage(file, { idToken, sessionId })` | `POST /api/users/profile/image/` |
| `updateProfile(payload, authArgs)` | `PATCH /api/users/profile/` |

**Data sent (update):**
```json
{ "name": "Ahmed Khan", "phone_number": "0300-1234567", "profile_image_url": "https://..." }
```

**Data received:**
- Image upload: `{ "imageUrl": "https://..." }`
- Profile update: Full profile object

**Navigation:** Back (auto-navigates after 600 ms success delay).

---

## 35. MoreMenuScreen

**Purpose:** Secondary settings screen accessible from the gear icon in `AccountSettingsScreen`. Contains theme toggle (light/dark) and navigation shortcuts.

**Implementation:**
- Feature cards navigate to: `EditProfile`, `MarketplaceBrowsing`, `SavedListings`, `OrderHistory`, `RestockReminders`.
- Language selector modal (UI only — does not change anything in the backend).
- **Dark mode toggle:** a `Switch` that calls `toggleTheme()` from `useTheme()`, persisted via `AsyncStorage`.

**Backend connection:** None.

**Navigation:** → `EditProfile` · → `SavedListings` · → `OrderHistory` · → `RestockReminders`

---

## 36. SellTabScreen

**Purpose:** Smart router for the Sell bottom tab. No UI of its own.

**Logic:**
- Logged in as SUPPLIER → renders `MyListingsScreen` directly.
- Otherwise → renders `SellPrompt` (a static screen prompting non-suppliers to sign up or become a supplier).

**Navigation (SellPrompt):** → `AuthOptions` · → `BecomeSupplier`

---

## 37. MyListingsScreen

**Purpose:** Supplier's listing management hub. Shows their listings grouped by status tab (Active, Pending, Removed) with pull-to-refresh.

**Implementation:**
- `useFocusEffect` reloads all listings on each visit.
- Three tabs filter the locally-loaded list by `listing.status`.
- Each `ListingCard` (shared component) shows a "Manage" button → `MyListingsManagement`.
- FAB (floating action button) / header "+" → `CategorySelection` to start a new listing.

**Backend connection:** `GET /api/listings/my/`

**Data sent:** Auth headers. No query params (all statuses returned, filtered client-side).

**Data received:**
```json
[{ "id": "12", "productName": "Basmati Rice 25kg", "description": "...",
   "category": "Rice & Grains", "quantity": "500", "unit": "kg",
   "minOrderQty": 25, "pricePerUnit": "8800.00", "totalValue": "4400000",
   "status": "active", "imageUrl": "...", "postedDate": "3 days ago",
   "location": "Lahore", "views": 142, "inquiries": 7, "promotion": null }]
```

**Navigation:** → `MyListingsManagement` · → `CategorySelection`

---

## 38. MyListingsManagementScreen

**Purpose:** Detailed management panel for a single listing. Allows publishing, editing, promoting, and deleting the listing.

**Implementation:**
- Receives a full `listing` object via `route.params`.
- Displays all listing details: image, title, category, price, quantity, min order, status, views, inquiries.
- **Publish (pending → active):** calls `updateListing(id, { status: 'active' }, authArgs)`.
- **Edit:** navigates to `CreateListing` in edit mode, passing `existingListing`.
- **Promote:** opens a modal with a discount % input (1–99). Calls `setListingPromotion(id, pct, authArgs)`. Shows the discounted price alongside the original. Active promotion can be removed with `removeListingPromotion(id, authArgs)`.
- **Delete:** Alert confirmation → `deleteListing(id, authArgs)` → navigates back.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `updateListing(id, { status }, authArgs)` | `PATCH /api/listings/<id>/manage/` |
| `setListingPromotion(id, pct, authArgs)` | `POST /api/listings/<id>/promote/` |
| `removeListingPromotion(id, authArgs)` | `DELETE /api/listings/<id>/promote/` |
| `deleteListing(id, authArgs)` | `DELETE /api/listings/<id>/manage/` |

**Data sent:**
- Publish: `{ "status": "active" }`
- Promotion: `{ "discount_percent": 20 }`

**Data received:**
- Promotion set: `{ "discountPercent": 20, "discountedPrice": "7040.00", "originalPrice": "8800.00" }`

**Navigation:** → `CreateListing` (edit mode) · back after delete

---

## 39. CreateListingScreen

**Purpose:** Form for creating a new listing or editing an existing one.

**Implementation:**
- Pre-fills all fields from `route.params.existingListing` when `editMode: true`.
- **Image:** `expo-image-picker` opens the gallery. Local URI shown immediately; upload runs in background to `POST /api/listings/upload-image/`. A spinner overlays the image; an "Uploaded" badge appears on success. Submit is blocked if the image is picked but not yet uploaded.
- **Fields:** Product name, description, price (Rs), quantity, **min. order quantity**, unit (chip selector), condition (chip selector), location.
- **Validation:** all required fields checked, price must be numeric, quantity must be integer.
- **Submit:** builds payload with all fields; `imageUrl` included only if upload succeeded. Calls `createListing` or `updateListing` depending on mode.

**Backend connections:**
| Call | Endpoint |
|------|----------|
| `uploadListingImage(file, { idToken, sessionId })` | `POST /api/listings/upload-image/` |
| `createListing(payload, authArgs)` | `POST /api/listings/create/` |
| `updateListing(id, payload, authArgs)` | `PATCH /api/listings/<id>/manage/` |

**Data sent:**
```json
{
  "productName": "Basmati Rice 25kg",
  "description": "Premium long grain rice...",
  "price": 8800,
  "quantity": 500,
  "minOrderQty": 25,
  "unit": "kg",
  "condition": "Bulk Wholesale",
  "location": "Lahore Wholesale Market",
  "category": "Rice & Grains",
  "imageUrl": "https://..."
}
```

**Data received:** `MyListingSerializer` shape.

**Navigation:** → `Sell` (after create) · back (after edit)

---

## 40. SupplierAccountScreen

**Purpose:** Supplier's account dashboard. Shows performance metrics, recent inquiries, and a menu of supplier features.

**Implementation:**
- `useFocusEffect` loads `getSupplierDashboard(authArgs)` on each visit.
- **Performance tiles:** 4 metric cards with value, label, and colour (e.g., Active Listings, Total Orders, This Month Revenue, Avg Response Time).
- **Recent Inquiries:** list of recent chat-based inquiries with buyer name and product.
- Menu items navigate to: `Sell` (My Listings), `IncomingOrders`, `EditProfile` (Business Profile), plus "Coming Soon" items (Payout, Verified Badge, Promote, Invite).
- **Dark mode toggle switch** in the header.
- **Switch to Shopkeeper View** navigates to `ShopkeeperDashboard`.
- **Logout** calls `logout()` on `UserContext`.

**Backend connection:** `GET /api/listings/supplier/dashboard/`

**Data sent:** Auth headers.

**Data received:**
```json
{
  "performance": [
    { "value": "12", "label": "Active Listings", "color": "#00A859" },
    { "value": "38", "label": "Total Orders",    "color": "#3B82F6" },
    { "value": "N/A", "label": "Avg Response",   "color": "#F59E0B" }
  ],
  "recent_inquiries": [{ "id": 1, "buyerName": "Ali Shop", "productTitle": "Basmati Rice", "time": "2h ago" }]
}
```

**Navigation:** → `Sell` · → `IncomingOrders` · → `EditProfile` · → `ShopkeeperDashboard`

---

## 41. BecomeSupplierScreen

**Purpose:** Marketing screen shown to shopkeepers who tap "Register as Supplier". Explains the benefits of becoming a supplier.

**Implementation:**
- Fully static content — 5 benefit cards with icons, titles, and descriptions.
- **Get Started** button shows an Alert: "Coming Soon — The supplier registration flow is being finalized. Stay tuned!"
- No API calls made.

**Backend connection:** None.

**Navigation:** Back only.

---

## 42. NoInternetScreen

**Purpose:** Shown by the app's connectivity check wrapper when there is no internet connection. Prompts the user to check their connection.

**Implementation:** Purely static — icon, title, subtitle. No interactions.

**Backend connection:** None.

**Navigation:** None (displayed as an overlay by the connectivity wrapper).

---