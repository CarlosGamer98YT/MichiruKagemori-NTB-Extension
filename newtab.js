/* ==========================================================================
   LÓGICA PRINCIPAL: EXTENSIÓN DE NUEVA PESTAÑA MICHIRU KAGEMORI
   ========================================================================== */

// CONFIGURACIÓN DE APIS POR DEFECTO (Se pueden sobreescribir en Configuración)
const DEFAULT_DANBOORU_LOGIN = '';
const DEFAULT_DANBOORU_API_KEY = '';
const DEFAULT_GELBOORU_USER_ID = '';
const DEFAULT_GELBOORU_API_KEY = '';

// Motores de Búsqueda
const SEARCH_ENGINES = {
  google: {
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: '🌐'
  },
  brave: {
    name: 'Brave',
    url: 'https://search.brave.com/search?q=',
    icon: '🦁'
  },
  ddg: {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    icon: '🦆'
  }
};

// Accesos Directos por Defecto
const DEFAULT_SHORTCUTS = [
  { id: 'sc1', name: 'YouTube', url: 'https://www.youtube.com' },
  { id: 'sc2', name: 'GitHub', url: 'https://www.github.com' },
  { id: 'sc3', name: 'Twitter / X', url: 'https://twitter.com' },
  { id: 'sc4', name: 'Reddit', url: 'https://www.reddit.com' },
  { id: 'sc5', name: 'Discord', url: 'https://discord.com' }
];

// Valores por Defecto de Configuración
const DEFAULT_SETTINGS = {
  sources: {
    danbooru: true,
    gelbooru: true
  },
  safeSearch: true,
  searchEngine: 'google',
  blur: 0,
  opacity: 30,
  imageFit: 'contain',
  customTags: '',
  bgEnabled: true,
  // Credenciales editables
  danbooruUsername: DEFAULT_DANBOORU_LOGIN,
  danbooruApiKey: DEFAULT_DANBOORU_API_KEY,
  gelbooruUserId: DEFAULT_GELBOORU_USER_ID,
  gelbooruApiKey: DEFAULT_GELBOORU_API_KEY
};

// Estado global en memoria de la pestaña
let currentSettings = { ...DEFAULT_SETTINGS };
let currentImage = null;
let isFetchingImages = false; // Candado para evitar peticiones simultáneas
let loadRetries = 0; // Contador de fallos consecutivos al cargar imágenes de fondo

// Elementos del DOM
const elClockTime = document.getElementById('clock-time');
const elClockDate = document.getElementById('clock-date');
const elSearchForm = document.getElementById('search-form');
const elSearchInput = document.getElementById('search-input');
const elCurrentEngineBtn = document.getElementById('current-engine-btn');
const elCurrentEngineIcon = document.getElementById('current-engine-icon');
const elEngineDropdown = document.getElementById('engine-dropdown');
const elShortcutsGrid = document.getElementById('shortcuts-grid');

const elBgActive = document.getElementById('bg-active');
const elBgNext = document.getElementById('bg-next');

let activeLayer = elBgActive;
let inactiveLayer = elBgNext;

// Inicializar z-indices de las capas de fondo
elBgActive.style.zIndex = '-2';
elBgNext.style.zIndex = '-3';

const elImageSourceBadge = document.getElementById('image-source-badge');
const elImageScore = document.getElementById('image-score');
const elImageArtistLink = document.getElementById('image-artist-link');
const elImageViewOriginal = document.getElementById('image-view-original');

const elRefreshBtn = document.getElementById('refresh-btn');
const elRefreshIcon = document.getElementById('refresh-icon');
const elSettingsBtn = document.getElementById('settings-btn');
const elSettingsDrawer = document.getElementById('settings-drawer');
const elCloseSettingsBtn = document.getElementById('close-settings-btn');
const elSaveSettingsBtn = document.getElementById('save-settings-btn');
const elToggleBgBtn = document.getElementById('toggle-bg-btn');

// Ajustes del Drawer
const elSourceDanbooru = document.getElementById('source-danbooru');
const elSourceGelbooru = document.getElementById('source-gelbooru');
const elSafeSearchToggle = document.getElementById('safe-search-toggle');
const elBlurSlider = document.getElementById('blur-slider');
const elBlurValue = document.getElementById('blur-value');
const elOpacitySlider = document.getElementById('opacity-slider');
const elOpacityValue = document.getElementById('opacity-value');
const elFitSelect = document.getElementById('fit-select');
const elCustomTagsInput = document.getElementById('custom-tags-input');
const elCacheCount = document.getElementById('cache-count');
const elClearCacheBtn = document.getElementById('clear-cache-btn');

// Inputs de Credenciales en el Drawer
const elDanbooruUsername = document.getElementById('danbooru-username-input');
const elDanbooruApiKey = document.getElementById('danbooru-api-key-input');
const elGelbooruUserId = document.getElementById('gelbooru-user-id-input');
const elGelbooruApiKey = document.getElementById('gelbooru-api-key-input');

// Dialog de Accesos Directos
const elShortcutDialog = document.getElementById('shortcut-dialog');
const elShortcutForm = document.getElementById('shortcut-form');
const elShortcutName = document.getElementById('shortcut-name');
const elShortcutUrl = document.getElementById('shortcut-url');
const elCancelShortcutBtn = document.getElementById('cancel-shortcut-btn');
const elDeleteShortcutBtn = document.getElementById('delete-shortcut-btn');
const elShortcutDialogTitle = document.getElementById('shortcut-dialog-title');

let editingShortcutId = null;

// ==========================================================================
// 1. RELOJ Y FECHA
// ==========================================================================

function updateClock() {
  const now = new Date();
  
  // Hora formato HH:MM:SS
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  elClockTime.textContent = `${hours}:${minutes}:${seconds}`;

  // Fecha formato: "Viernes, 5 de Junio" / "Friday, June 5"
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  const locale = (typeof chrome !== 'undefined' && chrome.i18n) ? chrome.i18n.getUILanguage() : 'es-ES';
  let dateStr = now.toLocaleDateString(locale, options);
  // Capitalizar la primera letra
  dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  elClockDate.textContent = dateStr;
}

// Iniciar reloj
updateClock();
setInterval(updateClock, 1000);

// ==========================================================================
// 2. MOTORES DE BÚSQUEDA Y NAVEGACIÓN
// ==========================================================================

function setupSearch() {
  // Manejar submit del buscador
  elSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = elSearchInput.value.trim();
    if (!query) return;

    const engine = SEARCH_ENGINES[currentSettings.searchEngine] || SEARCH_ENGINES.google;
    window.location.href = engine.url + encodeURIComponent(query);
  });

  // Mostrar/ocultar selector de motores
  elCurrentEngineBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elEngineDropdown.classList.toggle('hidden');
  });

  // Cerrar dropdown al hacer click fuera
  document.addEventListener('click', () => {
    elEngineDropdown.classList.add('hidden');
  });

  // Cambiar motor de búsqueda
  elEngineDropdown.querySelectorAll('.engine-option').forEach(option => {
    option.addEventListener('click', async (e) => {
      const selectedEngine = e.currentTarget.getAttribute('data-engine');
      currentSettings.searchEngine = selectedEngine;
      
      // Guardar
      await chrome.storage.local.set({ settings: currentSettings });
      updateSearchEngineUI();
    });
  });
}

function updateSearchEngineUI() {
  const engine = SEARCH_ENGINES[currentSettings.searchEngine] || SEARCH_ENGINES.google;
  elCurrentEngineIcon.textContent = engine.icon;
  elSearchInput.placeholder = `Buscar en ${engine.name}...`;
}

// ==========================================================================
// 3. ACCESOS DIRECTOS (CRUD)
// ==========================================================================

async function loadShortcuts() {
  const data = await chrome.storage.local.get('shortcuts');
  const shortcuts = data.shortcuts || DEFAULT_SHORTCUTS;
  renderShortcuts(shortcuts);
}

function renderShortcuts(shortcuts) {
  elShortcutsGrid.innerHTML = '';
  
  shortcuts.forEach(sc => {
    const tile = document.createElement('a');
    tile.href = sc.url;
    tile.className = 'shortcut-tile glass-panel';
    tile.setAttribute('data-id', sc.id);

    // Obtener letra inicial
    const initial = sc.name.charAt(0);

    tile.innerHTML = `
      <button type="button" class="shortcut-edit-btn" title="Editar enlace">✏️</button>
      <div class="shortcut-icon-wrapper">
        <span class="shortcut-letter">${initial}</span>
      </div>
      <span class="shortcut-name">${sc.name}</span>
    `;

    // Manejar edición
    tile.querySelector('.shortcut-edit-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openShortcutModal(sc);
    });

    elShortcutsGrid.appendChild(tile);
  });

  // Añadir botón de "+" si son menos de 10
  if (shortcuts.length < 10) {
    const addTile = document.createElement('div');
    addTile.className = 'shortcut-tile add-shortcut';
    addTile.innerHTML = `
      <div class="shortcut-icon-wrapper">
        <span class="shortcut-add-plus">+</span>
      </div>
      <span class="shortcut-name">Añadir</span>
    `;
    addTile.addEventListener('click', () => openShortcutModal());
    elShortcutsGrid.appendChild(addTile);
  }
}

function openShortcutModal(shortcut = null) {
  if (shortcut) {
    // Modo edición
    editingShortcutId = shortcut.id;
    elShortcutDialogTitle.textContent = (typeof chrome !== 'undefined' && chrome.i18n)
      ? chrome.i18n.getMessage('editShortcutTitle')
      : 'Editar Acceso Directo';
    elShortcutName.value = shortcut.name;
    elShortcutUrl.value = shortcut.url;
    elDeleteShortcutBtn.classList.remove('hidden');
  } else {
    // Modo creación
    editingShortcutId = null;
    elShortcutDialogTitle.textContent = (typeof chrome !== 'undefined' && chrome.i18n)
      ? chrome.i18n.getMessage('addShortcutTitle')
      : 'Añadir Acceso Directo';
    elShortcutName.value = '';
    elShortcutUrl.value = 'https://';
    elDeleteShortcutBtn.classList.add('hidden');
  }
  elShortcutDialog.showModal();
}

function setupShortcutsDialog() {
  // Cancelar
  elCancelShortcutBtn.addEventListener('click', () => {
    elShortcutDialog.close();
  });

  // Form submit (Guardar / Crear)
  elShortcutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = elShortcutName.value.trim();
    let url = elShortcutUrl.value.trim();

    // Validar protocolo
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    const data = await chrome.storage.local.get('shortcuts');
    let shortcuts = data.shortcuts || [...DEFAULT_SHORTCUTS];

    if (editingShortcutId) {
      // Editar existente
      shortcuts = shortcuts.map(sc => sc.id === editingShortcutId ? { ...sc, name, url } : sc);
    } else {
      // Crear nuevo
      const newShortcut = {
        id: 'sc_' + Date.now(),
        name,
        url
      };
      shortcuts.push(newShortcut);
    }

    await chrome.storage.local.set({ shortcuts });
    elShortcutDialog.close();
    renderShortcuts(shortcuts);
  });

  // Eliminar
  elDeleteShortcutBtn.addEventListener('click', async () => {
    if (!editingShortcutId) return;

    const data = await chrome.storage.local.get('shortcuts');
    let shortcuts = data.shortcuts || [];
    shortcuts = shortcuts.filter(sc => sc.id !== editingShortcutId);

    await chrome.storage.local.set({ shortcuts });
    elShortcutDialog.close();
    renderShortcuts(shortcuts);
  });
}

// ==========================================================================
// 4. CLIENTE API Y SISTEMA DE CACHÉ DE IMÁGENES
// ==========================================================================

// Mezclador aleatorio (Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Filtra formatos inválidos (videos, zips, etc)
function isValidImage(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || 
         lower.endsWith('.webp') || lower.endsWith('.gif');
}

// Llama a Danbooru y recupera posts
async function fetchDanbooruBatch(tags, safeSearch) {
  try {
    let tagsList = [];
    if (tags && tags.trim() !== '') {
      tagsList = tags.split(/[\s+]+/);
    } else {
      // Búsqueda OR de ambas etiquetas por defecto
      tagsList = ['~kagemori_michiru', '~michiru_kagemori'];
    }
    
    if (safeSearch) {
      tagsList.push('rating:g'); // rating:g es General/Safe en Danbooru
    }
    tagsList.push('order:random');
    
    const tagsQuery = tagsList.map(t => encodeURIComponent(t)).join('%20');
    
    const login = currentSettings.danbooruUsername || DEFAULT_DANBOORU_LOGIN;
    const apiKey = currentSettings.danbooruApiKey || DEFAULT_DANBOORU_API_KEY;
    
    // Solo permitir consulta si se han proporcionado credenciales
    if (!login || !apiKey) {
      console.log('Danbooru: No se han configurado credenciales. Omitiendo consulta.');
      return [];
    }
    
    let url = `https://danbooru.donmai.us/posts.json?tags=${tagsQuery}&limit=20&login=${encodeURIComponent(login)}&api_key=${encodeURIComponent(apiKey)}`;
    console.log('Fetching Danbooru:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EverythingMichiruExtension/2.0'
      }
    });
    if (!response.ok) throw new Error(`Danbooru respondió con status ${response.status}`);
    
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    // Normalizar
    return data
      .filter(post => isValidImage(post.large_file_url || post.file_url))
      .map(post => ({
        id: post.id,
        source: 'danbooru',
        image_url: post.large_file_url || post.file_url,
        original_url: post.file_url,
        rating: post.rating, // 'g', 's', 'q', 'e'
        score: post.score || 0,
        artist: post.tag_string_artist ? post.tag_string_artist.replace(/_/g, ' ') : 'Desconocido',
        source_link: post.source || `https://danbooru.donmai.us/posts/${post.id}`
      }));
  } catch (err) {
    console.error('Error cargando Danbooru:', err);
    return [];
  }
}

// Llama a Gelbooru y recupera posts
async function fetchGelbooruBatch(tags, safeSearch) {
  try {
    let tagsList = [];
    if (tags && tags.trim() !== '') {
      tagsList = tags.split(/[\s+]+/);
    } else {
      tagsList = ['michiru_kagemori'];
    }
    
    if (safeSearch) {
      tagsList.push('rating:general'); // rating:general es Safe en Gelbooru
    }
    tagsList.push('sort:random');
    
    const tagsQuery = tagsList.map(t => encodeURIComponent(t)).join('%20');
    
    const userId = currentSettings.gelbooruUserId || DEFAULT_GELBOORU_USER_ID;
    const apiKey = currentSettings.gelbooruApiKey || DEFAULT_GELBOORU_API_KEY;
    
    // Solo permitir consulta si se han proporcionado credenciales
    if (!userId || !apiKey) {
      console.log('Gelbooru: No se han configurado credenciales. Omitiendo consulta.');
      return [];
    }
    
    let url = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${tagsQuery}&limit=20&api_key=${encodeURIComponent(apiKey)}&user_id=${encodeURIComponent(userId)}`;
    console.log('Fetching Gelbooru:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Gelbooru respondió con status ${response.status}`);
    
    const data = await response.json();
    // En Gelbooru, la lista de posts viene en la propiedad "post"
    if (!data || !Array.isArray(data.post)) return [];

    // Normalizar
    return data.post
      .filter(post => isValidImage(post.sample_url || post.file_url))
      .map(post => ({
        id: post.id,
        source: 'gelbooru',
        image_url: post.sample_url || post.file_url,
        original_url: post.file_url,
        rating: post.rating, // 'safe', 'questionable', 'explicit'
        score: post.score || 0,
        artist: post.owner || 'Desconocido', // En gelbooru a veces no viene artista separado, usamos owner
        source_link: post.source || `https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`
      }));
  } catch (err) {
    console.error('Error cargando Gelbooru:', err);
    return [];
  }
}

// Rellenar el caché local
async function refillCache() {
  if (isFetchingImages) return;
  isFetchingImages = true;
  console.log('Iniciando recarga del caché...');

  try {
    const data = await chrome.storage.local.get('image_cache');
    let cache = data.image_cache || [];

    // Si ya hay suficientes imágenes, no hacemos petición
    if (cache.length >= 10) {
      isFetchingImages = false;
      return;
    }

    const { sources, safeSearch, customTags } = currentSettings;
    let newImages = [];

    // Procesar búsquedas de etiquetas
    // Danbooru y Gelbooru usan tags ligeramente distintas. Si el usuario ingresó tags customizadas, las usamos tal cual
    // Si están vacías, usamos las predeterminadas.
    let danbooruTags = customTags ? customTags : 'kagemori_michiru';
    let gelbooruTags = customTags ? customTags : 'michiru_kagemori';

    const promises = [];
    if (sources.danbooru) promises.push(fetchDanbooruBatch(danbooruTags, safeSearch));
    if (sources.gelbooru) promises.push(fetchGelbooruBatch(gelbooruTags, safeSearch));

    const results = await Promise.all(promises);
    results.forEach(res => {
      newImages = newImages.concat(res);
    });

    if (newImages.length === 0) {
      console.log('No se pudieron obtener imágenes nuevas. ¿Sin internet?');
      isFetchingImages = false;
      return;
    }

    // Mezclar las nuevas imágenes
    shuffleArray(newImages);

    // Evitar duplicados comparando IDs y Orígenes
    const existingKeys = new Set(cache.map(img => `${img.source}_${img.id}`));
    const uniqueNew = newImages.filter(img => !existingKeys.has(`${img.source}_${img.id}`));

    cache = cache.concat(uniqueNew);
    
    // Limitar el caché máximo a 50
    if (cache.length > 50) {
      cache = cache.slice(0, 50);
    }

    await chrome.storage.local.set({ image_cache: cache });
    console.log(`Caché recargado con éxito. Total actual: ${cache.length}`);
    elCacheCount.textContent = cache.length;
  } catch (e) {
    console.error('Error al rellenar el caché:', e);
  } finally {
    isFetchingImages = false;
  }
}

// Consumir una imagen del caché
async function getNextImageFromCache() {
  const data = await chrome.storage.local.get('image_cache');
  let cache = data.image_cache || [];

  if (cache.length === 0) {
    // Si el caché está vacío, intentamos hacer un fetch rápido e instantáneo
    await refillCache();
    // Leer otra vez
    const freshData = await chrome.storage.local.get('image_cache');
    cache = freshData.image_cache || [];
  }

  if (cache.length === 0) {
    return null; // Aún vacío (sin red)
  }

  // Extraer el primer elemento
  const nextImg = cache.shift();
  
  // Guardar el caché actualizado
  await chrome.storage.local.set({ image_cache: cache });
  elCacheCount.textContent = cache.length;

  // Disparar recarga en segundo plano si queda poco
  if (cache.length < 5) {
    refillCache();
  }

  return nextImg;
}

// ==========================================================================
// 5. TRANSICIONES DE FONDO E INTERFAZ
// ==========================================================================

// Limpia las imágenes de fondo de una capa
function clearBackgroundImages(layer) {
  layer.style.backgroundImage = 'none';
  layer.style.background = '';
  layer.style.backgroundColor = '';
  const ambient = layer.querySelector('.bg-ambient');
  const foreground = layer.querySelector('.bg-foreground');
  if (ambient && foreground) {
    ambient.style.backgroundImage = 'none';
    foreground.style.backgroundImage = 'none';
  }
}

// Resetea todas las capas a su estado base y limpia z-indices
function resetBackgroundLayers() {
  clearBackgroundImages(elBgActive);
  clearBackgroundImages(elBgNext);
  elBgActive.style.zIndex = '-2';
  elBgNext.style.zIndex = '-3';
  activeLayer = elBgActive;
  inactiveLayer = elBgNext;
  elBgActive.style.opacity = '1';
  elBgNext.style.opacity = '0';
}

// Aplica el efecto de cross-fade entre las dos capas de fondo sin parpadeos negros
function setBackgroundImage(imageUrl) {
  // Pre-cargar y decodificar la imagen en memoria para evitar parpadeos y lag de renderizado
  elRefreshIcon.classList.add('spinning');
  elRefreshBtn.disabled = true;

  const img = new Image();
  img.src = imageUrl;
  
  img.decode().then(() => {
    loadRetries = 0; // Resetear intentos al cargar con éxito
    
    // 1. Limpiar e insertar la nueva imagen en la capa inactiva (que está oculta con opacity 0)
    clearBackgroundImages(inactiveLayer);
    
    const ambient = inactiveLayer.querySelector('.bg-ambient');
    const foreground = inactiveLayer.querySelector('.bg-foreground');
    if (ambient && foreground) {
      ambient.style.backgroundImage = `url('${imageUrl}')`;
      foreground.style.backgroundImage = `url('${imageUrl}')`;
    } else {
      inactiveLayer.style.backgroundImage = `url('${imageUrl}')`;
    }
    
    // 2. Iniciar la transición de opacidad (cross-fade) sin cambiar z-indices de inmediato.
    // La capa inactiva (detrás, z-index -3) pasa a opacity 1.
    // La capa activa (delante, z-index -2) pasa a opacity 0.
    inactiveLayer.style.opacity = '1';
    activeLayer.style.opacity = '0';
    
    // 3. Esperar a que la transición CSS de 1 segundo se complete antes de hacer el cambio de z-index
    setTimeout(() => {
      // Ahora que la capa inactiva está totalmente visible (opacity 1) y la activa invisible (opacity 0),
      // traemos la inactiva al frente (zIndex -2) y enviamos la activa al fondo (zIndex -3).
      // Como una es completamente transparente y la otra completamente opaca, este cambio es imperceptible visualmente.
      inactiveLayer.style.zIndex = '-2';
      activeLayer.style.zIndex = '-3';
      
      // Intercambiar las referencias de las capas activa e inactiva para el próximo refresco
      const temp = activeLayer;
      activeLayer = inactiveLayer;
      inactiveLayer = temp;
      
      // Detener animación del botón de refresco
      elRefreshIcon.classList.remove('spinning');
      elRefreshBtn.disabled = false;
    }, 1000);
  }).catch(err => {
    console.error('Fallo al decodificar la imagen de fondo:', imageUrl, err);
    loadRetries++; // Incrementar reintentos
    elRefreshIcon.classList.remove('spinning');
    elRefreshBtn.disabled = false;
    // Si falla, intentamos cargar otra
    loadNextImage();
  });
}

function updateImageMetadataUI(img) {
  if (!img) {
    // Mostrar metadatos offline
    elImageSourceBadge.textContent = (typeof chrome !== 'undefined' && chrome.i18n)
      ? chrome.i18n.getMessage('sourceOffline')
      : 'Desconectado';
    elImageSourceBadge.className = 'image-source-badge';
    elImageScore.textContent = '';
    elImageArtistLink.textContent = 'Michiru Kagemori';
    elImageArtistLink.href = '#';
    elImageViewOriginal.classList.add('hidden');
    return;
  }

  // Origen
  elImageSourceBadge.textContent = img.source;
  elImageSourceBadge.className = `image-source-badge ${img.source}`;
  
  // Puntuación
  elImageScore.textContent = `★ ${img.score}`;
  
  // Artista
  const artistName = (img.artist === 'Desconocido' || img.artist === 'Unknown')
    ? ((typeof chrome !== 'undefined' && chrome.i18n) ? chrome.i18n.getMessage('unknownArtist') : 'Desconocido')
    : img.artist;
  elImageArtistLink.textContent = artistName;
  if (img.source === 'danbooru') {
    elImageArtistLink.href = `https://danbooru.donmai.us/posts?tags=${encodeURIComponent(img.artist.replace(/ /g, '_'))}`;
  } else {
    elImageArtistLink.href = `https://gelbooru.com/index.php?page=post&s=list&tags=${encodeURIComponent(img.artist.replace(/ /g, '_'))}`;
  }

  // Enlace original
  elImageViewOriginal.href = img.original_url;
  elImageViewOriginal.classList.remove('hidden');
}

// Aplica el estado de habilitación del fondo (ON/OFF)
function applyBackgroundState() {
  if (currentSettings.bgEnabled) {
    elToggleBgBtn.classList.remove('off');
    elToggleBgBtn.title = "Apagar imágenes de fondo (ON)";
    document.getElementById('image-info-widget').classList.remove('hidden');
    elRefreshBtn.disabled = false;
    elRefreshBtn.style.opacity = '1';
    elRefreshBtn.style.pointerEvents = 'auto';
  } else {
    elToggleBgBtn.classList.add('off');
    elToggleBgBtn.title = "Encender imágenes de fondo (OFF)";
    document.getElementById('image-info-widget').classList.add('hidden');
    elRefreshBtn.disabled = true;
    elRefreshBtn.style.opacity = '0.5';
    elRefreshBtn.style.pointerEvents = 'none';
    
    // Aplicar degradado cyberpunk por defecto
    resetBackgroundLayers();
    elBgActive.style.backgroundColor = 'var(--clr-bg-deep)';
    elBgActive.style.background = 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, rgba(255,0,127,0.06) 100%), var(--clr-bg-deep)';
  }
}

// Carga la siguiente imagen
async function loadNextImage() {
  if (!currentSettings.bgEnabled) {
    applyBackgroundState();
    return;
  }

  // Si hemos fallado demasiadas veces seguidas, mostramos el degradado por defecto
  if (loadRetries >= 3) {
    console.warn('Demasiados fallos al cargar imágenes. Usando fondo por defecto.');
    currentImage = null;
    updateImageMetadataUI(null);
    
    resetBackgroundLayers();
    elBgActive.style.backgroundColor = 'var(--clr-bg-deep)';
    elBgActive.style.background = 'radial-gradient(circle, rgba(0,240,255,0.08) 0%, rgba(255,0,127,0.08) 100%), var(--clr-bg-deep)';
    elRefreshIcon.classList.remove('spinning');
    elRefreshBtn.disabled = false;
    
    loadRetries = 0; // reset
    return;
  }

  const nextImg = await getNextImageFromCache();
  
  if (nextImg) {
    currentImage = nextImg;
    setBackgroundImage(nextImg.image_url);
    updateImageMetadataUI(nextImg);
  } else {
    // Si no hay imagen, usar el fondo por defecto (Cyberpunk Gradient / Logo)
    currentImage = null;
    updateImageMetadataUI(null);
    resetBackgroundLayers();
    elBgActive.style.backgroundColor = 'var(--clr-bg-deep)';
    // Agregar un gradiente por defecto
    elBgActive.style.background = 'radial-gradient(circle, rgba(0,240,255,0.08) 0%, rgba(255,0,127,0.08) 100%), var(--clr-bg-deep)';
    elRefreshIcon.classList.remove('spinning');
    elRefreshBtn.disabled = false;
  }
}

// ==========================================================================
// 6. CONTROLADORES DEL PANEL DE CONFIGURACIÓN
// ==========================================================================

function setupSettingsPanel() {
  // Abrir Ajustes
  elSettingsBtn.addEventListener('click', () => {
    // Cargar valores actuales en los controles del formulario
    elSourceDanbooru.checked = currentSettings.sources.danbooru;
    elSourceGelbooru.checked = currentSettings.sources.gelbooru;
    elSafeSearchToggle.checked = currentSettings.safeSearch;
    elBlurSlider.value = currentSettings.blur;
    elBlurValue.textContent = `${currentSettings.blur}px`;
    elOpacitySlider.value = currentSettings.opacity;
    elOpacityValue.textContent = `${currentSettings.opacity}%`;
    elFitSelect.value = currentSettings.imageFit || 'contain';
    elCustomTagsInput.value = currentSettings.customTags;

    // Credenciales
    elDanbooruUsername.value = currentSettings.danbooruUsername || '';
    elDanbooruApiKey.value = currentSettings.danbooruApiKey || '';
    elGelbooruUserId.value = currentSettings.gelbooruUserId || '';
    elGelbooruApiKey.value = currentSettings.gelbooruApiKey || '';

    // Abrir drawer
    elSettingsDrawer.classList.remove('hidden');
    // Forzar reflow para animación
    elSettingsDrawer.offsetHeight;
    elSettingsDrawer.classList.add('active');
  });

  // Cerrar Ajustes
  const closeDrawer = () => {
    elSettingsDrawer.classList.remove('active');
    setTimeout(() => {
      elSettingsDrawer.classList.add('hidden');
    }, 400); // Mismo tiempo que transición CSS
  };

  elCloseSettingsBtn.addEventListener('click', closeDrawer);

  // Guardar Ajustes
  elSaveSettingsBtn.addEventListener('click', async () => {
    const isDanbooru = elSourceDanbooru.checked;
    const isGelbooru = elSourceGelbooru.checked;

    // Validar que al menos una fuente esté activa
    if (!isDanbooru && !isGelbooru) {
      const errorMsg = (typeof chrome !== 'undefined' && chrome.i18n)
        ? chrome.i18n.getMessage('errorSelectSource')
        : 'Debes seleccionar al menos una fuente de imágenes (Danbooru o Gelbooru).';
      alert(errorMsg);
      return;
    }

    const newCustomTags = elCustomTagsInput.value.trim();
    const newSafeSearch = elSafeSearchToggle.checked;
    const danUsername = elDanbooruUsername.value.trim();
    const danApiKey = elDanbooruApiKey.value.trim();
    const gelUserId = elGelbooruUserId.value.trim();
    const gelApiKey = elGelbooruApiKey.value.trim();

    // Detectar si hubo cambios críticos que invaliden el caché actual
    const tagsChanged = currentSettings.customTags !== newCustomTags;
    const safeSearchChanged = currentSettings.safeSearch !== newSafeSearch;
    const sourcesChanged = currentSettings.sources.danbooru !== isDanbooru || 
                           currentSettings.sources.gelbooru !== isGelbooru;
    const credentialsChanged = currentSettings.danbooruUsername !== danUsername ||
                               currentSettings.danbooruApiKey !== danApiKey ||
                               currentSettings.gelbooruUserId !== gelUserId ||
                               currentSettings.gelbooruApiKey !== gelApiKey;

    // Actualizar configuración local
    currentSettings = {
      sources: {
        danbooru: isDanbooru,
        gelbooru: isGelbooru
      },
      safeSearch: newSafeSearch,
      searchEngine: currentSettings.searchEngine, // Preservar motor de búsqueda
      blur: parseInt(elBlurSlider.value),
      opacity: parseInt(elOpacitySlider.value),
      imageFit: elFitSelect.value,
      customTags: newCustomTags,
      bgEnabled: currentSettings.bgEnabled, // Preservar estado del fondo
      danbooruUsername: danUsername,
      danbooruApiKey: danApiKey,
      gelbooruUserId: gelUserId,
      gelbooruApiKey: gelApiKey
    };

    // Guardar en chrome.storage
    await chrome.storage.local.set({ settings: currentSettings });

    // Aplicar estilos visuales de inmediato
    applyVisualSettings();

    // Si cambiaron las etiquetas, el filtro, las fuentes o las credenciales, vaciamos el caché y hacemos fetch nuevo
    if (tagsChanged || safeSearchChanged || sourcesChanged || credentialsChanged) {
      console.log('Se detectaron cambios que invalidan el caché. Vaciando caché antiguo...');
      await chrome.storage.local.set({ image_cache: [] });
      await refillCache();
      loadNextImage();
    }

    closeDrawer();
  });

  // Escuchar Sliders para previsualización en tiempo real
  elBlurSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    elBlurValue.textContent = `${val}px`;
    document.documentElement.style.setProperty('--bg-blur', `${val}px`);
  });

  elOpacitySlider.addEventListener('input', (e) => {
    const val = e.target.value;
    elOpacityValue.textContent = `${val}%`;
    document.documentElement.style.setProperty('--bg-overlay-opacity', val / 100);
  });

  elFitSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'cover') {
      document.body.classList.add('fit-cover');
    } else {
      document.body.classList.remove('fit-cover');
    }
  });

  // Vaciar Caché
  elClearCacheBtn.addEventListener('click', async () => {
    const confirmMsg = (typeof chrome !== 'undefined' && chrome.i18n)
      ? chrome.i18n.getMessage('confirmClearCache')
      : '¿Seguro que quieres vaciar el caché de imágenes? Se descargarán nuevas.';
    if (confirm(confirmMsg)) {
      await chrome.storage.local.set({ image_cache: [] });
      elCacheCount.textContent = '0';
      await refillCache();
      loadNextImage();
    }
  });

  // Botón manual de Siguiente Imagen
  elRefreshBtn.addEventListener('click', () => {
    loadNextImage();
  });
}

function applyVisualSettings() {
  document.documentElement.style.setProperty('--bg-blur', `${currentSettings.blur}px`);
  document.documentElement.style.setProperty('--bg-overlay-opacity', currentSettings.opacity / 100);
  
  if (currentSettings.imageFit === 'cover') {
    document.body.classList.add('fit-cover');
  } else {
    document.body.classList.remove('fit-cover');
  }
}

// Traduce la interfaz según el idioma del usuario
function translateHTML() {
  const isExtensionContext = typeof chrome !== 'undefined' && chrome.i18n;
  if (!isExtensionContext) return;

  document.title = chrome.i18n.getMessage('tabTitle') || document.title;

  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.textContent = message;
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.placeholder = message;
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.title = message;
    }
  });
}

// ==========================================================================
// 7. INICIALIZACIÓN DE LA EXTENSIÓN
// ==========================================================================

async function init() {
  // Traducir la página antes de mostrar contenido
  translateHTML();

  // Cargar configuración de almacenamiento
  const data = await chrome.storage.local.get(['settings', 'image_cache']);
  
  if (data.settings) {
    currentSettings = { ...DEFAULT_SETTINGS, ...data.settings };
  } else {
    currentSettings = { ...DEFAULT_SETTINGS };
    await chrome.storage.local.set({ settings: currentSettings });
  }

  // Actualizar UI del buscador
  updateSearchEngineUI();

  // Aplicar configuraciones visuales (Desenfoque, opacidad)
  applyVisualSettings();

  // Aplicar estado del fondo (ON/OFF)
  applyBackgroundState();

  // Botón toggle de fondo ON/OFF
  elToggleBgBtn.addEventListener('click', async () => {
    currentSettings.bgEnabled = !currentSettings.bgEnabled;
    await chrome.storage.local.set({ settings: currentSettings });
    applyBackgroundState();
    
    // Si se acaba de activar, cargar la primera imagen de inmediato
    if (currentSettings.bgEnabled) {
      loadNextImage();
    }
  });

  // Configurar listeners del panel de ajustes
  setupSettingsPanel();

  // Configurar buscador
  setupSearch();

  // Inicializar accesos directos
  await loadShortcuts();
  setupShortcutsDialog();

  // Mostrar conteo inicial del caché en los ajustes
  const cache = data.image_cache || [];
  elCacheCount.textContent = cache.length;

  // Cargar la primera imagen de fondo (si el fondo está activo)
  if (currentSettings.bgEnabled) {
    await loadNextImage();
  }

  // Rellenar caché si está vacío o bajo (independiente de si está ON u OFF para estar listo cuando se active)
  if (cache.length < 5) {
    refillCache();
  }
}

// Ejecutar inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', init);
