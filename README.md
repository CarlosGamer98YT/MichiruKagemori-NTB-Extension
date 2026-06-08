# Michiru Kagemori New Tab Extension

A premium, glassmorphic cyber-neon themed browser extension for **Brave** and **Chrome** that overrides the default New Tab Page (NTP). It features a beautiful, dynamic layout displaying random images of **Michiru Kagemori** (from *BNA: Brand New Animal*) fetched securely from Danbooru and Gelbooru.

---

## Features

- **Cyber-Neon Glassmorphic UI:** Inspired by the aesthetic of *BNA: Brand New Animal*, using curated color palettes (cyan `#00F0FF`, neon pink `#FF007F`, deep dark grey, and backdrop glass blurs).
- **Flicker-Free Transitions:** Utilizes an asynchronous image-decoding pipeline (`img.decode()`) and a deferred z-index swap after a 1-second CSS cross-fade animation, avoiding paint-lag and black flickers.
- **Responsive Adaptive Layout:** Resizes the clock font, search bar, gaps, and shortcut grids using viewport-height media queries (`max-height`). 
- **Scroll Fallback for Secondary Monitors:** Features a scroll-down mechanism (`overflow-y`) for small screens or vertical viewports, ensuring the settings menu and footer elements are never clipped.
- **Dynamic Image Alignment (Contain/Cover):** 
  - **Contain mode (default):** Displays the full, uncropped image, projecting a blurred ambient glow representation of the image on empty margins.
  - **Cover mode:** Scales and crops the image to fill the background.
- **Custom Search & Clock:** Responsive clock with local date format, plus a search bar supporting custom search engine selection (Google, Brave, DuckDuckGo).
- **Editable Shortcuts:** Neon-border tiles that translate upward on hover. Easily add, edit, or delete links stored in your local storage.
- **Privacy & Key Security:** Queries to image boards are only made if user API credentials are configured. Empty credentials trigger a silent abort, keeping your background on a default cyberpunk radial gradient.
- **Custom JSON API Support:** Allows users to input one or more custom API URLs (one per line, such as Safebooru, Moebooru, Yande.re, or mirrors) directly in the settings drawer. The extension fetches and dynamically parses the JSON payload (handling both direct arrays and nested structures like Gelbooru's), extracting image URLs, scores, artists, and source names.
- **Full Localization (i18n):** Translates all UI widgets dynamically in English and Spanish based on browser language settings.

---

## How It Works

1. **Declarative Net Request rules (`rules.json`):** Overrides outgoing headers to modify the `Referer` domain. This successfully bypasses Gelbooru's and Danbooru's hotlinking protection mechanisms.
2. **Caching mechanism:** To respect the rate limit of **10 requests per second**, the extension stores up to 50 images in `chrome.storage.local`. It queries the APIs in batches of 20 images when the cache falls below 5 items.
3. **Safe Search filtering:** Restricts image board fetches using SFW filters (`rating:g` on Danbooru and `rating:general` on Gelbooru) unless the Safe Search switch is manually disabled in the settings panel.

---

## How to Install and Run

Since this is a developer extension, you must load it as an unpacked directory in your browser:

### 1. Enable Developer Mode in your Browser
- **Brave:** Navigate to `brave://extensions/`
- **Chrome:** Navigate to `chrome://extensions/`
- Toggle the **"Developer mode"** switch in the top-right corner.

### 2. Load the Extension
1. Click the **"Load unpacked"** button in the top-left corner.
2. Select the extension directory: `/home/carlos/Documents/antigravity/Michiru-NTB-Extension`.
3. The extension card **"Michiru Kagemori New Tab"** will appear on the dashboard.

### 3. Open a New Tab
- Open a new tab (`Ctrl + T`).
- If Brave/Chrome displays a popup asking *"Is this the new tab page you expected?"*, click **"Keep changes"** to activate it.

### 4. Configure Your API Credentials
1. Click the settings cog icon (⚙️) in the bottom-right corner.
2. Input your **Login/Username** and **API Key** for Danbooru, and/or **User ID** and **API Key** for Gelbooru.
3. Turn the background image switch to **ON** (lightning bolt button ⚡ in the bottom right corner).
4. Save and Apply. The cache will automatically start downloading images in the background and display your first random background.

---

## File Structure

- [manifest.json](manifest.json): Extension configuration, permissions (`storage`, `declarativeNetRequest`), and overrides.
- [rules.json](rules.json): Network rules to modify headers and bypass image CDN blocks.
- [newtab.html](newtab.html): Semantic layout of NTP widgets.
- [newtab.css](newtab.css): Cyberpunk styles, CSS variables, keyframe animations, and media queries.
- [newtab.js](newtab.js): Real-time clock, search redirection, shortcut storage CRUD, API fetches, cache management, and fade transitions.
- [_locales/](_locales/): i18n dictionaries for English and Spanish (will add more languajes soon (you can contribute too)).
- [icons/](icons/): PNG icons generated from vector assets.
