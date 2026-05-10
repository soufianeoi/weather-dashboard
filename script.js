/* ==================== DOM References ==================== */
var DOM = {
    emptyState: document.getElementById('empty-state'),
    loadingState: document.getElementById('loading-state'),
    skeletonGroup: document.getElementById('skeleton-group'),
    currentWeather: document.getElementById('current-weather'),
    forecastSection: document.getElementById('forecast-section'),
    hourlySection: document.getElementById('hourly-section'),
    chartSection: document.getElementById('chart-section'),
    popChartSection: document.getElementById('pop-chart-section'),
    chipsBar: document.getElementById('chips-bar'),
    favoritesChips: document.getElementById('favorites-chips'),
    recentChips: document.getElementById('recent-chips'),
    cityName: document.getElementById('city-name'),
    weatherDesc: document.getElementById('weather-desc'),
    countryName: document.getElementById('country-name'),
    animatedIconContainer: document.getElementById('animated-icon-container'),
    temperature: document.getElementById('temperature'),
    feelsLike: document.getElementById('feels-like'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    pressure: document.getElementById('pressure'),
    feelsLikeStat: document.getElementById('feels-like-stat'),
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    visibility: document.getElementById('visibility'),
    cloudCover: document.getElementById('cloud-cover'),
    forecastGrid: document.getElementById('forecast-grid'),
    hourlyGrid: document.getElementById('hourly-grid'),
    tempChart: document.getElementById('temp-chart'),
    popChart: document.getElementById('pop-chart'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    locationBtn: document.getElementById('location-btn'),
    starBtn: document.getElementById('star-btn'),
    themeBtn: document.getElementById('theme-btn'),
    themeIcon: document.getElementById('theme-icon'),
    langSelect: document.getElementById('lang-select'),
    unitCelsius: document.getElementById('unit-celsius'),
    unitFahrenheit: document.getElementById('unit-fahrenheit'),
    updateTimestamp: document.getElementById('update-timestamp'),
    aqiSection: document.getElementById('aqi-section'),
    aqiBadge: document.getElementById('aqi-badge'),
    aqiLabel: document.getElementById('aqi-label'),
    aqiDesc: document.getElementById('aqi-desc'),
    aqiGrid: document.getElementById('aqi-grid'),
    uvSection: document.getElementById('uv-section'),
    uvGauge: document.getElementById('uv-gauge'),
    uvValue: document.getElementById('uv-value'),
    uvLabel: document.getElementById('uv-label'),
    uvDesc: document.getElementById('uv-desc'),
    mapSection: document.getElementById('map-section'),
    weatherMap: document.getElementById('weather-map'),
    mapLayerBtns: document.getElementById('map-layer-btns'),
    autocompleteList: document.getElementById('autocomplete-list'),
    body: document.body,
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-message'),
    alertsSection: document.getElementById('alerts-section'),
    refreshIndicator: document.getElementById('refresh-indicator'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    settingsOverlay: document.getElementById('settings-overlay'),
    settingsClose: document.getElementById('settings-close'),
    settingsSave: document.getElementById('settings-save'),
    settingsApiKey: document.getElementById('settings-api-key'),
    settingsDefaultCity: document.getElementById('settings-default-city'),
    settingsRefresh: document.getElementById('settings-refresh'),
    windCompass: document.getElementById('wind-compass'),
    windArrow: document.getElementById('wind-arrow'),
    windDirLabel: document.getElementById('wind-dir-label'),
    shortcutsModal: document.getElementById('shortcuts-modal'),
    shortcutsOverlay: document.getElementById('shortcuts-overlay'),
    shortcutsClose: document.getElementById('shortcuts-close'),
};

/* ==================== Autocomplete ==================== */
var acTimer = null;
var acIndex = -1;
var acItems = [];

function fetchSuggestions(query) {
    if (query.length < 2) { closeAutocomplete(); return; }
    apiFetch('/api/geocode?q=' + encodeURIComponent(query))
        .then(function (data) { renderSuggestions(data); })
        .catch(function () { closeAutocomplete(); });
}

function renderSuggestions(data) {
    DOM.autocompleteList.innerHTML = '';
    acItems = data || [];
    if (acItems.length === 0) { closeAutocomplete(); return; }
    acIndex = -1;
    DOM.searchInput.setAttribute('aria-expanded', 'true');
    DOM.autocompleteList.classList.remove('hidden');
    acItems.forEach(function (item, i) {
        var div = document.createElement('div');
        var label = item.name + (item.state ? ', ' + item.state : '') + ', ' + item.country;
        div.className = 'ac-item flex items-center gap-2 px-4 py-2.5 border-b border-white/5 text-sm';
        div.setAttribute('role', 'option');
        div.setAttribute('id', 'ac-option-' + i);
        div.setAttribute('aria-selected', 'false');
        div.innerHTML = '<i data-lucide="map-pin" class="w-3.5 h-3.5 text-white/40 shrink-0" aria-hidden="true"></i><span class="text-white/80">' + label + '</span>';
        div.addEventListener('click', function () { selectSuggestion(i); });
        div.addEventListener('mouseenter', function () { setAcIndex(i); });
        DOM.autocompleteList.appendChild(div);
    });
    lucide.createIcons();
    DOM.autocompleteList.style.maxHeight = Math.min(acItems.length * 44, 260) + 'px';
}

function setAcIndex(idx) {
    if (acIndex >= 0 && acIndex < acItems.length) {
        var prev = document.getElementById('ac-option-' + acIndex);
        if (prev) prev.setAttribute('aria-selected', 'false');
    }
    acIndex = idx;
    if (idx >= 0 && idx < acItems.length) {
        var curr = document.getElementById('ac-option-' + idx);
        if (curr) {
            curr.setAttribute('aria-selected', 'true');
            curr.scrollIntoView({ block: 'nearest' });
        }
        DOM.searchInput.setAttribute('aria-activedescendant', 'ac-option-' + idx);
    } else {
        DOM.searchInput.setAttribute('aria-activedescendant', '');
    }
}

function selectSuggestion(idx) {
    if (idx < 0 || idx >= acItems.length) return;
    var item = acItems[idx];
    DOM.searchInput.value = item.name;
    closeAutocomplete();
    loadWeatherByCity(item.name);
}

function closeAutocomplete() {
    DOM.autocompleteList.classList.add('hidden');
    DOM.searchInput.setAttribute('aria-expanded', 'false');
    DOM.searchInput.setAttribute('aria-activedescendant', '');
    acIndex = -1;
}

/* ==================== Keyboard Shortcuts ==================== */
function isTyping() {
    var tag = document.activeElement ? document.activeElement.tagName : '';
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

document.addEventListener('keydown', function (e) {
    if (isTyping()) {
        if (document.activeElement === DOM.searchInput) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (acItems.length > 0) setAcIndex(Math.min(acIndex + 1, acItems.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (acItems.length > 0) setAcIndex(Math.max(acIndex - 1, -1));
            } else if (e.key === 'Enter' && acIndex >= 0) {
                e.preventDefault();
                selectSuggestion(acIndex);
            } else if (e.key === 'Escape') {
                closeAutocomplete();
                DOM.searchInput.blur();
            }
        }
        return;
    }
    switch (e.key) {
        case '/':
            e.preventDefault();
            DOM.searchInput.focus();
            DOM.searchInput.select();
            break;
        case 'l':
        case 'L':
            e.preventDefault();
            getLocation();
            break;
        case '?':
            e.preventDefault();
            toggleShortcuts();
            break;
    }
});

function toggleShortcuts() {
    var modal = DOM.shortcutsModal;
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}
DOM.shortcutsOverlay.addEventListener('click', toggleShortcuts);
DOM.shortcutsClose.addEventListener('click', toggleShortcuts);

/* ==================== i18n ==================== */
function t(key, vars) {
    var lang = TRANSLATIONS[LANG] || TRANSLATIONS.en;
    var msg = lang[key] || TRANSLATIONS.en[key] || key;
    if (vars) {
        for (var k in vars) {
            if (vars.hasOwnProperty(k)) {
                msg = msg.replace('{' + k + '}', vars[k]);
            }
        }
    }
    return msg;
}

function applyLang() {
    DOM.langSelect.value = LANG;
    DOM.searchInput.placeholder = t('search');
    DOM.searchBtn.setAttribute('aria-label', t('searchLabel'));
    DOM.locationBtn.setAttribute('aria-label', t('useLocation'));
    DOM.locationBtn.title = t('useLocation');
    var welcomeTitle = document.querySelector('#empty-state h2');
    var welcomeDesc = document.querySelector('#empty-state p');
    if (welcomeTitle) welcomeTitle.textContent = t('welcome');
    if (welcomeDesc) welcomeDesc.textContent = t('welcomeDesc');
    var loadingText = document.querySelector('#loading-state p');
    if (loadingText) loadingText.textContent = t('loading');
    var lblMap = {'lbl-forecast': 'forecast5', 'lbl-hourly': 'hourly', 'lbl-chart': 'chart',
        'lbl-aqi': 'aqi', 'lbl-map': 'map', 'lbl-humidity': 'humidity', 'lbl-wind': 'wind',
        'lbl-pressure': 'pressure', 'lbl-feelslike': 'feelsLike', 'lbl-sunrise': 'sunrise',
        'lbl-sunset': 'sunset', 'lbl-visibility': 'visibility', 'lbl-cloudcover': 'cloudCover',
        'lbl-uv': 'uv', 'lbl-popchart': 'popChart'};
    for (var id in lblMap) {
        if (lblMap.hasOwnProperty(id)) {
            var el = document.getElementById(id);
            if (el) el.textContent = t(lblMap[id]);
        }
    }
    var footer = document.getElementById('lbl-footer');
    if (footer) footer.textContent = t('poweredBy') + ' \u00B7 WeatherVue Dashboard';
    if (cachedWeather) reRenderAll();
}

/* ==================== Config ==================== */
var UNITS = localStorage.getItem('weather-units') || 'metric';
var THEME = localStorage.getItem('weather-theme') || 'dark';
var LANG = localStorage.getItem('weather-lang') || 'en';

var TRANSLATIONS = {
    en: {
        search: 'Search city...', feels: 'Feels like', humidity: 'Humidity', wind: 'Wind',
        pressure: 'Pressure', feelsLike: 'Feels Like', sunrise: 'Sunrise', sunset: 'Sunset',
        visibility: 'Visibility', cloudCover: 'Cloud Cover', forecast5: '5-Day Forecast',
        hourly: 'Hourly Forecast', chart: 'Temperature & Humidity Trend', aqi: 'Air Quality Index',
        uv: 'UV Index', popChart: 'Precipitation Probability (24h)', map: 'Weather Map',
        loading: 'Loading weather data...', welcome: 'Welcome to WeatherVue',
        welcomeDesc: 'Search for a city or allow location access to get started.',
        updatedJust: 'Updated just now', updatedMin: 'Updated 1 min ago',
        updatedMins: 'Updated {n} min ago', updatedHour: 'Updated {n}h ago',
        noData: '--', searchLabel: 'Search for a city', useLocation: 'Use my location',
        toggleFav: 'Toggle favorite', saveFav: 'Save {city} to favorites',
        removeFav: 'Remove {city} from favorites', showWeather: 'Show weather for {city}',
        citySearch: 'Search weather by city', tempUnit: 'Temperature unit',
        poweredBy: 'Powered by OpenWeatherMap', radar: 'Radar', windMap: 'Wind', tempMap: 'Temp',
        pullRefresh: 'Pull down to refresh',
    },
    fr: {
        search: 'Rechercher une ville...', feels: 'Ressenti', humidity: 'Humidité',
        wind: 'Vent', pressure: 'Pression', feelsLike: 'Ressenti', sunrise: 'Lever',
        sunset: 'Coucher', visibility: 'Visibilité', cloudCover: 'Couverture',
        forecast5: 'Prévisions 5 jours', hourly: 'Prévisions horaires',
        chart: 'Température & Humidité', aqi: 'Indice de qualité', uv: 'Indice UV',
        popChart: 'Probabilité précip. (24h)', map: 'Carte météo', loading: 'Chargement...',
        welcome: 'Bienvenue sur WeatherVue',
        welcomeDesc: 'Cherchez une ville ou autorisez la géolocalisation.',
        updatedJust: 'Mis à jour à l\'instant', updatedMin: 'Mis à jour il y a 1 min',
        updatedMins: 'Mis à jour il y a {n} min', updatedHour: 'Mis à jour il y a {n}h',
        noData: '--', searchLabel: 'Rechercher une ville', useLocation: 'Ma position',
        toggleFav: 'Favoris', saveFav: 'Ajouter {city} aux favoris',
        removeFav: 'Retirer {city} des favoris', showWeather: 'Météo pour {city}',
        citySearch: 'Recherche par ville', tempUnit: 'Unité de température',
        poweredBy: 'Données OpenWeatherMap', radar: 'Radar', windMap: 'Vent', tempMap: 'Temp',
        pullRefresh: 'Tirer pour actualiser',
    },
    es: {
        search: 'Buscar ciudad...', feels: 'Sensación', humidity: 'Humedad',
        wind: 'Viento', pressure: 'Presión', feelsLike: 'Sensación', sunrise: 'Amanecer',
        sunset: 'Atardecer', visibility: 'Visibilidad', cloudCover: 'Nubosidad',
        forecast5: 'Pronóstico 5 días', hourly: 'Pronóstico horario',
        chart: 'Temperatura & Humedad', aqi: 'Índice calidad aire', uv: 'Índice UV',
        popChart: 'Prob. precipitación (24h)', map: 'Mapa del tiempo', loading: 'Cargando...',
        welcome: 'Bienvenido a WeatherVue',
        welcomeDesc: 'Busca una ciudad o activa la geolocalización.',
        updatedJust: 'Actualizado ahora', updatedMin: 'Actualizado hace 1 min',
        updatedMins: 'Actualizado hace {n} min', updatedHour: 'Actualizado hace {n}h',
        noData: '--', searchLabel: 'Buscar ciudad', useLocation: 'Mi ubicación',
        toggleFav: 'Favorito', saveFav: 'Guardar {city} en favoritos',
        removeFav: 'Quitar {city} de favoritos', showWeather: 'Ver clima de {city}',
        citySearch: 'Búsqueda por ciudad', tempUnit: 'Unidad temperatura',
        poweredBy: 'Datos de OpenWeatherMap', radar: 'Radar', windMap: 'Viento', tempMap: 'Temp',
        pullRefresh: 'Desliza para actualizar',
    },
    de: {
        search: 'Stadt suchen...', feels: 'Gefühlt', humidity: 'Feuchtigkeit',
        wind: 'Wind', pressure: 'Druck', feelsLike: 'Gefühlt', sunrise: 'Sonnenaufgang',
        sunset: 'Sonnenuntergang', visibility: 'Sichtweite', cloudCover: 'Bewölkung',
        forecast5: '5-Tage-Vorhersage', hourly: 'Stündlich', chart: 'Temperatur & Feuchte',
        aqi: 'Luftqualität', uv: 'UV-Index', popChart: 'Regenwahrsch. (24h)', map: 'Wetterkarte',
        loading: 'Lade Wetterdaten...', welcome: 'Willkommen bei WeatherVue',
        welcomeDesc: 'Suche eine Stadt oder erlaube Standortzugriff.',
        updatedJust: 'Gerade aktualisiert', updatedMin: 'Vor 1 Min. aktualisiert',
        updatedMins: 'Vor {n} Min. aktualisiert', updatedHour: 'Vor {n}h aktualisiert',
        noData: '--', searchLabel: 'Stadt suchen', useLocation: 'Mein Standort',
        toggleFav: 'Favorit', saveFav: '{city} zu Favoriten',
        removeFav: '{city} aus Favoriten', showWeather: 'Wetter für {city}',
        citySearch: 'Suche nach Stadt', tempUnit: 'Temperatureinheit',
        poweredBy: 'Daten von OpenWeatherMap', radar: 'Radar', windMap: 'Wind', tempMap: 'Temp',
        pullRefresh: 'Zum Aktualisieren ziehen',
    },
    ja: {
        search: '都市を検索...', feels: '体感温度', humidity: '湿度', wind: '風速',
        pressure: '気圧', feelsLike: '体感温度', sunrise: '日の出', sunset: '日没',
        visibility: '視程', cloudCover: '雲量', forecast5: '5日間予報', hourly: '時間別予報',
        chart: '気温・湿度グラフ', aqi: '大気質指数', uv: 'UV指数',
        popChart: '降水確率 (24時間)', map: '天気図', loading: '読み込み中...',
        welcome: 'WeatherVueへようこそ',
        welcomeDesc: '都市を検索するか位置情報を許可してください。',
        updatedJust: '更新済み', updatedMin: '1分前更新', updatedMins: '{n}分前更新',
        updatedHour: '{n}時間前更新', noData: '--', searchLabel: '都市を検索',
        useLocation: '現在地を使用', toggleFav: 'お気に入り',
        saveFav: '{city}をお気に入りに追加', removeFav: '{city}をお気に入りから削除',
        showWeather: '{city}の天気', citySearch: '都市で検索', tempUnit: '温度単位',
        poweredBy: 'OpenWeatherMap提供', radar: 'レーダー', windMap: '風', tempMap: '気温',
        pullRefresh: '引いて更新',
    },
};
var FAV_KEY = 'weather-favorites';
var RECENT_KEY = 'weather-recents';
var LAST_CITY_KEY = 'weather-last-city';
var cachedWeather = null;
var cachedForecast = null;
var cachedAirQuality = null;
var cachedAlerts = null;
var cachedUV = null;
var refreshInterval = null;
var updateTimer = null;
var lastUpdateTime = null;

/* ==================== Background Gradients ==================== */
var GRADIENTS = {
    Thunderstorm: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    Drizzle: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    Rain: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    Snow: 'linear-gradient(135deg, #e6e9f0 0%, #a8c0d4 100%)',
    Clear: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
    Clouds: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)',
    Atmosphere: 'linear-gradient(135deg, #4ca1af 0%, #c4e0e5 100%)',
    Night: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
};

function getWeatherGradient(condition, icon) {
    if (!condition) return GRADIENTS.Night;
    var id = condition.id;
    if (id >= 200 && id < 300) return GRADIENTS.Thunderstorm;
    if (id >= 300 && id < 400) return GRADIENTS.Drizzle;
    if (id >= 500 && id < 600) return GRADIENTS.Rain;
    if (id >= 600 && id < 700) return GRADIENTS.Snow;
    if (id >= 700 && id < 800) return GRADIENTS.Atmosphere;
    if (id === 800) return icon && icon.endsWith('n') ? GRADIENTS.Night : GRADIENTS.Clear;
    if (id > 800) return GRADIENTS.Clouds;
    return GRADIENTS.Night;
}

/* ==================== AQI ==================== */
var AQI_LEVELS = {
    1: { label: 'Good', color: '#22c55e', desc: 'Air quality is satisfactory, little risk.' },
    2: { label: 'Fair', color: '#eab308', desc: 'Moderate concern for sensitive individuals.' },
    3: { label: 'Moderate', color: '#f97316', desc: 'Health risk for people with respiratory issues.' },
    4: { label: 'Poor', color: '#ef4444', desc: 'Health effects may be felt by the general public.' },
    5: { label: 'Very Poor', color: '#a855f7', desc: 'Health alert — everyone may be affected.' },
};

var AQI_POLLUTANTS = [
    { key: 'pm2_5', label: 'PM2.5', unit: '\u00B5g/m\u00B3' },
    { key: 'pm10', label: 'PM10', unit: '\u00B5g/m\u00B3' },
    { key: 'o3', label: 'O\u2083', unit: '\u00B5g/m\u00B3' },
    { key: 'no2', label: 'NO\u2082', unit: '\u00B5g/m\u00B3' },
    { key: 'so2', label: 'SO\u2082', unit: '\u00B5g/m\u00B3' },
    { key: 'co', label: 'CO', unit: '\u00B5g/m\u00B3' },
];

function fetchAirQuality(lat, lon) {
    return apiFetch('/api/air-quality?lat=' + lat + '&lon=' + lon);
}

function renderAQI(data) {
    if (!data || !data.list || !data.list[0]) return;
    var aqi = data.list[0].main.aqi;
    var comps = data.list[0].components;
    var level = AQI_LEVELS[aqi] || AQI_LEVELS[1];
    DOM.aqiBadge.textContent = aqi;
    DOM.aqiBadge.style.background = level.color;
    DOM.aqiBadge.style.boxShadow = '0 0 24px ' + level.color + '66';
    DOM.aqiLabel.textContent = level.label;
    DOM.aqiDesc.textContent = level.desc;
    DOM.aqiGrid.innerHTML = '';
    AQI_POLLUTANTS.forEach(function (p, idx) {
        var val = comps[p.key];
        var display = val !== undefined ? val.toFixed(1) : '--';
        var card = document.createElement('div');
        var stagger = Math.min(idx + 1, 10);
        card.className = 'stat-card glass-dark rounded-xl p-3 text-center fade-in stagger-' + stagger;
        card.innerHTML =
            '<p class="text-white/45 text-[10px] uppercase tracking-widest">' + p.label + '</p>' +
            '<p class="text-sm md:text-base font-semibold text-white mt-1">' + display + '</p>' +
            '<p class="text-white/35 text-[9px]">' + p.unit + '</p>';
        DOM.aqiGrid.appendChild(card);
    });
    showElement(DOM.aqiSection);
}

/* ==================== UV Index ==================== */
var UV_LEVELS = [
    { max: 2, label: 'Low', color: '#22c55e', desc: 'No protection required.' },
    { max: 5, label: 'Moderate', color: '#eab308', desc: 'Wear sunscreen and hat.' },
    { max: 7, label: 'High', color: '#f97316', desc: 'Seek shade during midday.' },
    { max: 10, label: 'Very High', color: '#ef4444', desc: 'Avoid being outside.' },
    { max: 99, label: 'Extreme', color: '#a855f7', desc: 'Stay indoors if possible.' },
];

function fetchUV(lat, lon) {
    return apiFetch('/api/uv?lat=' + lat + '&lon=' + lon);
}

function renderUV(data) {
    if (!data || data.value === undefined) { hideElement(DOM.uvSection); return; }
    var val = Math.round(data.value * 10) / 10;
    var level = UV_LEVELS[0];
    for (var i = 0; i < UV_LEVELS.length; i++) {
        if (val <= UV_LEVELS[i].max) { level = UV_LEVELS[i]; break; }
    }
    DOM.uvValue.textContent = val;
    var pct = Math.min(val / 11, 1) * 100;
    DOM.uvGauge.style.background = 'conic-gradient(' + level.color + ' 0% ' + pct + '%, rgba(255,255,255,0.1) ' + pct + '% 100%)';
    DOM.uvLabel.textContent = level.label;
    DOM.uvLabel.style.color = level.color;
    DOM.uvDesc.textContent = level.desc;
    document.getElementById('uv-gauge-inner').textContent = val;
    showElement(DOM.uvSection);
}

/* ==================== Weather Alerts ==================== */
var ALERT_ICONS = {
    extreme_heat: 'sun', heat: 'sun', extreme_cold: 'snowflake', cold: 'snowflake',
    extreme_wind: 'wind', high_wind: 'wind', windy: 'wind', thunderstorm: 'cloud-lightning',
    rain: 'cloud-rain', heavy_snow: 'cloud-snow', low_visibility: 'eye-off',
    reduced_visibility: 'eye-off', low_humidity: 'droplets',
};

function fetchAlerts(lat, lon) {
    return apiFetch('/api/alerts?lat=' + lat + '&lon=' + lon + '&lang=' + LANG);
}

function renderAlerts(data) {
    DOM.alertsSection.innerHTML = '';
    if (!data || !data.alerts || data.alerts.length === 0) { hideElement(DOM.alertsSection); return; }
    data.alerts.forEach(function (alert, idx) {
        var icon = ALERT_ICONS[alert.type] || 'alert-triangle';
        var severityClass = 'alert-' + (alert.severity || 'yellow');
        var card = document.createElement('div');
        var stagger = Math.min(idx + 1, 10);
        card.className = 'flex items-start gap-3 glass rounded-xl md:rounded-2xl p-3 md:p-4 border fade-in stagger-' + stagger + ' ' + severityClass;
        card.setAttribute('role', 'alert');
        card.innerHTML =
            '<div class="mt-0.5 shrink-0"><i data-lucide="' + icon + '" class="w-5 h-5 text-white/80" aria-hidden="true"></i></div>' +
            '<div class="min-w-0">' +
            '<p class="text-sm md:text-base font-semibold text-white">' + alert.title + '</p>' +
            '<p class="text-xs md:text-sm text-white/60 mt-0.5">' + alert.description + '</p></div>';
        DOM.alertsSection.appendChild(card);
    });
    lucide.createIcons();
    showElement(DOM.alertsSection);
}

/* ==================== Weather Map ==================== */
var weatherMapInstance = null;
var mapRadarLayer = null;
var mapWindLayer = null;
var mapTempLayer = null;
var mapMarker = null;
var mapInit = false;
var currentMapLayer = 'radar';
var mapApiKey = null;

function fetchMapConfig() {
    return apiFetch('/api/config').then(function (cfg) { mapApiKey = cfg.tileApiKey; }).catch(function () { mapApiKey = ''; });
}

function initMap(lat, lon, cityName) {
    if (!window.L) return;
    if (!mapApiKey) { return; }
    if (!mapInit) {
        var darkTile = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        weatherMapInstance = L.map(DOM.weatherMap, { center: [lat, lon], zoom: 8, zoomControl: false, attributionControl: true });
        L.tileLayer(darkTile, { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>' }).addTo(weatherMapInstance);
        L.control.zoom({ position: 'bottomright' }).addTo(weatherMapInstance);
        mapInit = true;
    } else {
        weatherMapInstance.setView([lat, lon], 8);
    }
    if (mapMarker) weatherMapInstance.removeLayer(mapMarker);
    var iconHtml = '<div style="background:#f59e0b;width:14px;height:14px;border-radius:50%;border:3px solid rgba(255,255,255,0.8);box-shadow:0 0 16px rgba(245,158,11,0.6)"></div>';
    mapMarker = L.marker([lat, lon], { icon: L.divIcon({ html: iconHtml, iconSize: [14, 14], iconAnchor: [7, 7] }) }).addTo(weatherMapInstance);
    mapMarker.bindPopup('<b>' + cityName + '</b>');
    loadRadarOverlay();
    setTimeout(function () { weatherMapInstance.invalidateSize(); }, 300);
}

function loadRadarOverlay() {
    if (!weatherMapInstance) return;
    fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            var frames = (data.radar.past || []).concat(data.radar.nowcast || []);
            if (frames.length === 0) return;
            var latest = frames[frames.length - 1];
            var tileUrl = 'https://tilecache.rainviewer.com/v2/radar/' + latest.time + '/256/{z}/{x}/{y}/6/1.png';
            if (mapRadarLayer) weatherMapInstance.removeLayer(mapRadarLayer);
            mapRadarLayer = L.tileLayer(tileUrl, { opacity: 0.45, zIndex: 10, maxZoom: 12 }).addTo(weatherMapInstance);
        })
        .catch(function () {});
}

function switchMapLayer(layer) {
    if (!weatherMapInstance) return;
    currentMapLayer = layer;
    [mapRadarLayer, mapWindLayer, mapTempLayer].forEach(function (l) {
        if (l) weatherMapInstance.removeLayer(l);
    });
    if (layer === 'radar') loadRadarOverlay();
    else if (layer === 'wind') loadWindOverlay();
    else if (layer === 'temp') loadTempOverlay();
}

function loadWindOverlay() {
    if (!weatherMapInstance || !mapApiKey) return;
    var windUrl = 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=' + mapApiKey;
    mapWindLayer = L.tileLayer(windUrl, { opacity: 0.5, zIndex: 10, maxZoom: 18 }).addTo(weatherMapInstance);
}

function loadTempOverlay() {
    if (!weatherMapInstance || !mapApiKey) return;
    var tempUrl = 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=' + mapApiKey;
    mapTempLayer = L.tileLayer(tempUrl, { opacity: 0.5, zIndex: 10, maxZoom: 18 }).addTo(weatherMapInstance);
}

DOM.mapLayerBtns && DOM.mapLayerBtns.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-layer]');
    if (!btn) return;
    DOM.mapLayerBtns.querySelectorAll('[data-layer]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    switchMapLayer(btn.getAttribute('data-layer'));
});

/* ==================== DOM Helpers ==================== */
function showElement(el) {
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.classList.add('fade-in');
}

function hideElement(el) {
    el.classList.add('hidden');
    el.classList.remove('fade-in');
}

function showLoading(show) {
    if (show) {
        closeAutocomplete();
        hideElement(DOM.emptyState);
        hideElement(DOM.currentWeather);
        hideElement(DOM.forecastSection);
        hideElement(DOM.hourlySection);
        hideElement(DOM.chartSection);
        hideElement(DOM.popChartSection);
        hideElement(DOM.aqiSection);
        hideElement(DOM.uvSection);
        hideElement(DOM.mapSection);
        hideElement(DOM.alertsSection);
        DOM.skeletonGroup.classList.remove('hidden');
        DOM.loadingState.classList.add('hidden');
    } else {
        DOM.skeletonGroup.classList.add('hidden');
        DOM.loadingState.classList.add('hidden');
    }
}

var toastTimer = null;

function showError(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    DOM.toastMsg.textContent = msg;
    DOM.toast.classList.remove('hidden', 'toast-exit');
    DOM.toast.classList.add('toast-enter');
    lucide.createIcons();
    toastTimer = setTimeout(function () {
        DOM.toast.classList.remove('toast-enter');
        DOM.toast.classList.add('toast-exit');
        setTimeout(function () { DOM.toast.classList.add('hidden'); }, 300);
    }, 4000);
}

/* ==================== API ==================== */
async function apiFetch(url) {
    var customKey = localStorage.getItem('weather-api-key');
    if (customKey) {
        url += (url.indexOf('?') === -1 ? '?' : '&') + 'appid=' + encodeURIComponent(customKey);
    }
    var res = await fetch(url);
    if (!res.ok) {
        var err = await res.json().catch(function () { return {}; });
        throw new Error(err.detail || 'Failed to fetch weather data');
    }
    return res.json();
}

function fetchWeather(city) {
    return apiFetch('/api/weather?city=' + encodeURIComponent(city) + '&lang=' + LANG);
}
function fetchWeatherByCoords(lat, lon) {
    return apiFetch('/api/weather/coords?lat=' + lat + '&lon=' + lon + '&lang=' + LANG);
}
function fetchForecast(city) {
    return apiFetch('/api/forecast?city=' + encodeURIComponent(city) + '&lang=' + LANG);
}
function fetchForecastByCoords(lat, lon) {
    return apiFetch('/api/forecast/coords?lat=' + lat + '&lon=' + lon + '&lang=' + LANG);
}

/* ==================== Animated Weather Icons ==================== */
function getWeatherIconType(condition) {
    if (!condition) return 'cloud';
    var id = condition.id;
    if (id >= 200 && id < 300) return 'thunder';
    if (id >= 300 && id < 400) return 'rain';
    if (id >= 500 && id < 600) return 'rain';
    if (id >= 600 && id < 700) return 'snow';
    if (id >= 700 && id < 800) return 'mist';
    if (id === 800) return 'sun';
    if (id > 800) return 'cloud';
    return 'cloud';
}

function getNightIconType(condition, icon) {
    if (!condition) return 'night';
    var id = condition.id;
    if (id === 800 && icon && icon.endsWith('n')) return 'night';
    return getWeatherIconType(condition);
}

function getStars() {
    var positions = ['top:10%;left:15%', 'top:8%;left:55%', 'top:22%;left:80%', 'top:35%;left:10%', 'top:5%;left:35%', 'top:30%;left:70%'];
    var delays = ['0s', '-0.7s', '-1.4s', '-0.3s', '-1.1s', '-0.5s'];
    var html = '';
    for (var i = 0; i < 6; i++) { html += '<span style="' + positions[i] + ';animation-delay:' + delays[i] + '"></span>'; }
    return html;
}

function getSunRays() {
    var html = '<div class="awi-rays">';
    for (var i = 0; i < 8; i++) { var angle = (i / 8) * 360; html += '<span style="transform:rotate(' + angle + 'deg)"></span>'; }
    return html + '</div>';
}

function createAnimatedWeatherIcon(condition, iconCode) {
    var type = getNightIconType(condition, iconCode);
    if (type === 'sun') return '<div class="awi awi-sun" style="width:100%;height:100%"><div class="awi-body"></div>' + getSunRays() + '</div>';
    if (type === 'night') return '<div class="awi awi-night" style="width:100%;height:100%"><div class="awi-moon"></div><div class="awi-moon-shadow"></div><div class="awi-stars">' + getStars() + '</div></div>';
    if (type === 'cloud') return '<div class="awi awi-cloud" style="width:100%;height:100%"><div class="awi-body"></div><div class="awi-body"></div><div class="awi-body"></div></div>';
    if (type === 'rain') return '<div class="awi awi-rain" style="width:100%;height:100%"><div class="awi-cloud-body"></div><div class="awi-cloud-body"></div><div class="awi-drops"><span></span><span></span><span></span></div></div>';
    if (type === 'snow') return '<div class="awi awi-snow" style="width:100%;height:100%"><div class="awi-cloud-body"></div><div class="awi-cloud-body"></div><div class="awi-flakes"><span></span><span></span><span></span></div></div>';
    if (type === 'thunder') return '<div class="awi awi-thunder" style="width:100%;height:100%"><div class="awi-cloud-body"></div><div class="awi-cloud-body"></div><div class="awi-bolt"></div></div>';
    if (type === 'mist') return '<div class="awi awi-mist" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center"><span></span><span></span><span></span></div>';
    return '<div class="awi awi-cloud" style="width:100%;height:100%"><div class="awi-body"></div><div class="awi-body"></div><div class="awi-body"></div></div>';
}

/* ==================== Units Conversion ==================== */
function isImperial() { return UNITS === 'imperial'; }
function formatTemp(celsius) { if (isImperial()) return Math.round(celsius * 9 / 5 + 32); return Math.round(celsius); }
function tempUnit() { return isImperial() ? '°F' : '°C'; }
function formatSpeed(ms) { if (isImperial()) return (ms * 2.237).toFixed(1) + ' mph'; return ms + ' m/s'; }
function formatVisibility(km) { if (isImperial()) return (km * 0.621).toFixed(1) + ' mi'; return km.toFixed(1) + ' km'; }
function formatPressure(hPa) { if (isImperial()) return Math.round(hPa * 0.02953) + ' inHg'; return hPa + ' hPa'; }
function getUnitLabel() { return isImperial() ? 'imperial' : 'metric'; }

/* ==================== Wind Direction ==================== */
function getWindDirection(deg) {
    var dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
}
function getWindArrowHTML(deg) { return '<span class="wind-arrow" style="transform:rotate(' + deg + 'deg);display:inline-block">&#8593;</span>'; }

/* ==================== Favorites & Recent ==================== */
function getFavorites() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; } }
function setFavorites(list) { localStorage.setItem(FAV_KEY, JSON.stringify(list)); }
function isFavorite(city) { return getFavorites().indexOf(city) !== -1; }
function toggleFavorite(city) { var list = getFavorites(); var idx = list.indexOf(city); if (idx === -1) list.push(city); else list.splice(idx, 1); setFavorites(list); renderChips(); updateStarButton(city); }
function updateStarButton(city) { if (isFavorite(city)) { DOM.starBtn.classList.add('active'); DOM.starBtn.title = 'Remove from favorites'; DOM.starBtn.setAttribute('aria-label', 'Remove ' + city + ' from favorites'); DOM.starBtn.setAttribute('aria-pressed', 'true'); } else { DOM.starBtn.classList.remove('active'); DOM.starBtn.title = 'Save to favorites'; DOM.starBtn.setAttribute('aria-label', 'Save ' + city + ' to favorites'); DOM.starBtn.setAttribute('aria-pressed', 'false'); } }
function getRecents() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) { return []; } }
function setRecents(list) { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); }
function addRecent(city) { var list = getRecents(); var idx = list.indexOf(city); if (idx !== -1) list.splice(idx, 1); list.unshift(city); if (list.length > 5) list = list.slice(0, 5); setRecents(list); localStorage.setItem(LAST_CITY_KEY, city); renderChips(); }
function renderChips() {
    var favs = getFavorites();
    var recents = getRecents();
    DOM.favoritesChips.innerHTML = '';
    DOM.recentChips.innerHTML = '';
    favs.forEach(function (city) {
        var chip = document.createElement('button');
        chip.className = 'recent-chip flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white/70 text-xs border border-white/10 hover:text-white';
        chip.setAttribute('aria-label', 'Show weather for ' + city);
        chip.innerHTML = '<i data-lucide="star" class="w-3 h-3 fill-yellow-300 text-yellow-300" aria-hidden="true"></i>' + city;
        chip.addEventListener('click', function () { loadWeatherByCity(city); });
        DOM.favoritesChips.appendChild(chip);
    });
    var shownRecents = recents.filter(function (c) { return favs.indexOf(c) === -1; });
    shownRecents.forEach(function (city) {
        var chip = document.createElement('button');
        chip.className = 'recent-chip flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-white/50 text-xs border border-white/5 hover:text-white/80 hover:bg-white/10';
        chip.setAttribute('aria-label', 'Show weather for ' + city);
        chip.innerHTML = '<i data-lucide="clock" class="w-3 h-3" aria-hidden="true"></i>' + city;
        chip.addEventListener('click', function () { loadWeatherByCity(city); });
        DOM.recentChips.appendChild(chip);
    });
    if (favs.length > 0 || shownRecents.length > 0) { DOM.chipsBar.classList.remove('hidden'); DOM.chipsBar.classList.add('flex'); } else { DOM.chipsBar.classList.add('hidden'); }
    lucide.createIcons();
}

/* ==================== Auto-refresh & Timestamp ==================== */
function startAutoRefresh() {
    stopAutoRefresh();
    refreshInterval = setInterval(function () {
        if (cachedWeather) {
            var city = DOM.cityName.textContent.split(',')[0].trim();
            if (city && city !== '--') loadWeatherByCity(city, true);
        }
    }, 600000);
}
function stopAutoRefresh() { if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null; } if (updateTimer) { clearInterval(updateTimer); updateTimer = null; } }
function startUpdateTimer() { if (updateTimer) clearInterval(updateTimer); lastUpdateTime = Date.now(); updateTimestampDisplay(); updateTimer = setInterval(updateTimestampDisplay, 60000); }
function updateTimestampDisplay() { if (!lastUpdateTime) { DOM.updateTimestamp.innerHTML = ''; return; } var diff = Math.round((Date.now() - lastUpdateTime) / 60000); var text = ''; if (diff < 1) text = 'Updated just now'; else if (diff === 1) text = 'Updated 1 min ago'; else if (diff < 60) text = 'Updated ' + diff + ' min ago'; else text = 'Updated ' + Math.round(diff / 60) + 'h ago'; DOM.updateTimestamp.innerHTML = '<span class="live-dot"></span>' + text; }

/* ==================== Formatting ==================== */
function formatTime(ts) { return new Date(ts * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
function formatHour(date) { return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }); }
function formatShortDate(date) { return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }

/* ==================== Chart ==================== */
var chartInstance = null;
var chartData = null;
var popChartInstance = null;

function renderChart(forecastData) {
    if (!forecastData || !forecastData.list) return;
    if (!window.Chart) return;
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    chartData = forecastData;
    showElement(DOM.chartSection);
    requestAnimationFrame(function () {
        try {
            var points = forecastData.list;
            var step = Math.max(1, Math.floor(points.length / 12));
            var filtered = points.filter(function (_, i) { return i % step === 0 || i === points.length - 1; });
            var labels = filtered.map(function (item) { return new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' }); });
            var temps = filtered.map(function (item) { return formatTemp(item.main.temp); });
            var hums = filtered.map(function (item) { return item.main.humidity; });
            var ctx = DOM.tempChart.getContext('2d');
            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Temperature (' + tempUnit() + ')', data: temps, borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.08)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: '#fbbf24', spanGaps: false },
                        { label: 'Humidity (%)', data: hums, borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.08)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: '#38bdf8', yAxisID: 'y1', spanGaps: false },
                    ],
                },
                options: {
                    responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
                    interaction: { intersect: false, mode: 'index' },
                    plugins: { legend: { labels: { color: 'rgba(255,255,255,0.55)', font: { family: 'Inter', size: 11 }, boxWidth: 14, padding: 16 } }, tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', titleFont: { family: 'Inter' }, bodyFont: { family: 'Inter' } } },
                    scales: { x: { ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 }, maxTicksLimit: 10, maxRotation: 0 }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { beginAtZero: false, ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.06)' } }, y1: { position: 'right', beginAtZero: true, max: 100, ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 } }, grid: { display: false } } },
                },
            });
        } catch (e) { console.warn('Chart render error:', e); }
    });
}

/* ==================== Precipitation Probability Chart ==================== */
function renderPOPChart(forecastData) {
    if (!forecastData || !forecastData.list) return;
    if (!window.Chart) return;
    if (popChartInstance) { popChartInstance.destroy(); popChartInstance = null; }
    var entries = forecastData.list.slice(0, 8);
    showElement(DOM.popChartSection);
    requestAnimationFrame(function () {
        try {
            var labels = entries.map(function (item) { return formatHour(new Date(item.dt * 1000)); });
            var pops = entries.map(function (item) { return Math.round((item.pop || 0) * 100); });
            var colors = pops.map(function (p) {
                if (p >= 70) return 'rgba(239,68,68,0.7)';
                if (p >= 40) return 'rgba(251,191,36,0.7)';
                return 'rgba(56,189,248,0.6)';
            });
            var ctx = DOM.popChart.getContext('2d');
            popChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'POP (%)', data: pops, backgroundColor: colors, borderColor: colors.map(function (c) { return c.replace('0.7', '1').replace('0.6', '1'); }), borderWidth: 1, borderRadius: 4,
                    }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
                    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', titleFont: { family: 'Inter' }, bodyFont: { family: 'Inter' }, callbacks: { label: function (ctx) { return ctx.parsed.y + '%'; } } } },
                    scales: { x: { ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 } }, grid: { display: false } }, y: { beginAtZero: true, max: 100, ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 }, callback: function (val) { return val + '%'; } }, grid: { color: 'rgba(255,255,255,0.06)' } } },
                },
            });
        } catch (e) { console.warn('POP chart render error:', e); }
    });
}

/* ==================== Forecast Processing ==================== */
function processForecast(data) {
    var days = {};
    data.list.forEach(function (item) {
        var date = new Date(item.dt * 1000);
        var key = formatShortDate(date);
        if (!days[key]) { days[key] = { midday: null, min: Infinity, max: -Infinity, pop: 0 }; }
        days[key].min = Math.min(days[key].min, item.main.temp);
        days[key].max = Math.max(days[key].max, item.main.temp);
        days[key].pop = Math.max(days[key].pop, item.pop || 0);
        var existing = days[key].midday;
        if (!existing || Math.abs(date.getHours() - 13) < Math.abs(new Date(existing.dt * 1000).getHours() - 13)) { days[key].midday = item; }
    });
    var result = [];
    var entries = Object.entries(days);
    for (var i = 0; i < Math.min(5, entries.length); i++) {
        var pair = entries[i];
        result.push([pair[0], pair[1].midday, Math.round(pair[1].min), Math.round(pair[1].max), Math.round(pair[1].pop * 100)]);
    }
    return result;
}

function getHourlyForecast(data) { return data.list.slice(0, 8); }

/* ==================== UI Updates ==================== */
function updateBackground(condition, icon) { DOM.body.style.background = getWeatherGradient(condition, icon); DOM.body.style.backgroundSize = 'cover'; DOM.body.style.backgroundAttachment = 'fixed'; }

function updateWindCompass(deg, speed) {
    var arrow = DOM.windArrow;
    if (arrow) arrow.setAttribute('transform', 'rotate(' + deg + ' 32 32)');
    var speedStr = formatSpeed(speed);
    DOM.windSpeed.textContent = speedStr;
    var dirLabel = DOM.windDirLabel;
    if (dirLabel) dirLabel.textContent = getWindDirection(deg || 0) + ' (' + Math.round(deg || 0) + '°)';
}

function updateCurrentWeather(data) {
    var w = data.weather[0];
    DOM.cityName.textContent = data.name + ', ' + data.sys.country;
    DOM.countryName.textContent = data.sys.country;
    DOM.weatherDesc.textContent = w.description;
    DOM.animatedIconContainer.innerHTML = createAnimatedWeatherIcon(w, w.icon);
    DOM.temperature.textContent = formatTemp(data.main.temp) + tempUnit();
    DOM.feelsLike.textContent = formatTemp(data.main.feels_like);
    DOM.feelsLikeStat.textContent = formatTemp(data.main.feels_like) + tempUnit();
    DOM.humidity.textContent = data.main.humidity + '%';
    updateWindCompass(data.wind.deg || 0, data.wind.speed);
    DOM.pressure.textContent = formatPressure(data.main.pressure);
    DOM.sunrise.textContent = formatTime(data.sys.sunrise);
    DOM.sunset.textContent = formatTime(data.sys.sunset);
    var visKm = (data.visibility / 1000);
    DOM.visibility.textContent = formatVisibility(visKm);
    DOM.cloudCover.textContent = (data.clouds ? data.clouds.all : '--') + '%';
    updateBackground(w, w.icon);
    updateStarButton(data.name);
    showElement(DOM.currentWeather);
}

function updateForecastUI(processed) {
    DOM.forecastGrid.innerHTML = '';
    processed.forEach(function (row, idx) {
        var day = row[0], item = row[1], tMin = row[2], tMax = row[3], pop = row[4];
        var temp = formatTemp(item.main.temp);
        var icon = item.weather[0].icon;
        var desc = item.weather[0].description;
        var card = document.createElement('div');
        var stagger = Math.min(idx + 1, 10);
        card.className = 'forecast-card glass-dark rounded-xl md:rounded-2xl p-3 md:p-5 text-center min-w-[130px] md:min-w-[155px] flex-shrink-0 fade-in stagger-' + stagger;
        var popHtml = '';
        if (pop > 0) { popHtml = '<div class="flex items-center justify-center gap-1 mt-1.5"><i data-lucide="droplets" class="w-3 h-3 text-blue-300"></i><span class="text-blue-200/70 text-[10px] md:text-xs font-medium">' + pop + '%</span></div>'; }
        card.innerHTML =
            '<p class="text-white/65 text-[11px] md:text-sm font-medium mb-1.5 md:mb-2">' + day + '</p>' +
            '<img src="https://openweathermap.org/img/wn/' + icon + '@2x.png" alt="' + desc + '" class="w-9 h-9 md:w-12 md:h-12 mx-auto">' +
            '<p class="text-lg md:text-xl font-bold text-white mt-1">' + temp + tempUnit() + '</p>' +
            '<p class="text-white/40 text-[10px] md:text-xs"><span class="text-orange-300">' + formatTemp(tMin) + '\u00B0</span> / <span class="text-blue-300">' + formatTemp(tMax) + '\u00B0</span></p>' +
            popHtml +
            '<p class="text-white/45 text-[10px] md:text-xs capitalize mt-1 truncate max-w-[120px] md:max-w-[140px] mx-auto">' + desc + '</p>';
        DOM.forecastGrid.appendChild(card);
    });
    showElement(DOM.forecastSection);
}

function renderHourlyForecast(forecastData) {
    DOM.hourlyGrid.innerHTML = '';
    var entries = getHourlyForecast(forecastData);
    var now = Date.now() / 1000;
    entries.forEach(function (item, idx) {
        var date = new Date(item.dt * 1000);
        var isPast = item.dt < now;
        var hourLabel = formatHour(date);
        var temp = formatTemp(item.main.temp);
        var icon = item.weather[0].icon;
        var pop = (item.pop || 0) * 100;
        var card = document.createElement('div');
        var stagger = Math.min(idx + 1, 10);
        card.className = 'hourly-card glass-dark rounded-xl p-3 md:p-4 text-center flex-shrink-0 fade-in stagger-' + stagger + (isPast ? ' opacity-50' : '');
        var popHtml = pop > 0 ? '<p class="text-blue-200/70 text-[10px] mt-0.5">' + Math.round(pop) + '%</p>' : '';
        card.innerHTML = '<p class="text-white/60 text-[10px] md:text-xs font-medium">' + hourLabel + '</p>' +
            '<img src="https://openweathermap.org/img/wn/' + icon + '.png" alt="" class="w-8 h-8 md:w-10 md:h-10 mx-auto my-0.5">' +
            '<p class="text-sm md:text-base font-semibold text-white">' + temp + tempUnit() + '</p>' + popHtml;
        DOM.hourlyGrid.appendChild(card);
    });
    showElement(DOM.hourlySection);
}

function reRenderAll() {
    if (!cachedWeather || !cachedForecast) return;
    updateCurrentWeather(cachedWeather);
    updateForecastUI(processForecast(cachedForecast));
    renderHourlyForecast(cachedForecast);
    renderChart(cachedForecast);
    renderPOPChart(cachedForecast);
    if (cachedAirQuality) renderAQI(cachedAirQuality);
    if (cachedAlerts) renderAlerts(cachedAlerts);
    if (cachedUV) renderUV(cachedUV);
}

function toggleUnits(target) {
    if (target === 'celsius' && UNITS === 'metric') return;
    if (target === 'fahrenheit' && UNITS === 'imperial') return;
    UNITS = target === 'celsius' ? 'metric' : 'imperial';
    localStorage.setItem('weather-units', UNITS);
    DOM.unitCelsius.classList.toggle('active', UNITS === 'metric');
    DOM.unitFahrenheit.classList.toggle('active', UNITS === 'imperial');
    DOM.unitCelsius.setAttribute('aria-pressed', UNITS === 'metric' ? 'true' : 'false');
    DOM.unitFahrenheit.setAttribute('aria-pressed', UNITS === 'imperial' ? 'true' : 'false');
    reRenderAll();
}

/* ==================== Main Load Functions ==================== */
async function loadWeatherByCity(city, silent) {
    showLoading(true);
    try {
        var results = await Promise.all([fetchWeather(city), fetchForecast(city)]);
        cachedWeather = results[0];
        cachedForecast = results[1];
        updateCurrentWeather(cachedWeather);
        updateForecastUI(processForecast(cachedForecast));
        renderHourlyForecast(cachedForecast);
        renderChart(cachedForecast);
        renderPOPChart(cachedForecast);
        try { cachedAirQuality = await fetchAirQuality(cachedWeather.coord.lat, cachedWeather.coord.lon); renderAQI(cachedAirQuality); } catch (_) {}
        try { cachedAlerts = await fetchAlerts(cachedWeather.coord.lat, cachedWeather.coord.lon); renderAlerts(cachedAlerts); } catch (_) { cachedAlerts = null; }
        try { cachedUV = await fetchUV(cachedWeather.coord.lat, cachedWeather.coord.lon); renderUV(cachedUV); } catch (_) { cachedUV = null; }
        initMap(cachedWeather.coord.lat, cachedWeather.coord.lon, cachedWeather.name);
        showElement(DOM.mapSection);
        hideElement(DOM.emptyState);
        showLoading(false);
        addRecent(cachedWeather.name);
        startAutoRefresh();
        startUpdateTimer();
        lucide.createIcons();
    } catch (err) {
        showLoading(false);
        if (DOM.currentWeather.classList.contains('hidden')) showElement(DOM.emptyState);
        if (!silent) showError(err.message);
    }
}

async function loadWeatherByCoords(lat, lon) {
    showLoading(true);
    try {
        var results = await Promise.all([fetchWeatherByCoords(lat, lon), fetchForecastByCoords(lat, lon), fetchAirQuality(lat, lon)]);
        cachedWeather = results[0];
        cachedForecast = results[1];
        cachedAirQuality = results[2];
        updateCurrentWeather(cachedWeather);
        updateForecastUI(processForecast(cachedForecast));
        renderHourlyForecast(cachedForecast);
        renderChart(cachedForecast);
        renderPOPChart(cachedForecast);
        renderAQI(cachedAirQuality);
        try { cachedAlerts = await fetchAlerts(lat, lon); renderAlerts(cachedAlerts); } catch (_) { cachedAlerts = null; }
        try { cachedUV = await fetchUV(lat, lon); renderUV(cachedUV); } catch (_) { cachedUV = null; }
        initMap(lat, lon, cachedWeather.name);
        showElement(DOM.mapSection);
        hideElement(DOM.emptyState);
        showLoading(false);
        addRecent(cachedWeather.name);
        startAutoRefresh();
        startUpdateTimer();
        lucide.createIcons();
    } catch (err) {
        showLoading(false);
        if (DOM.currentWeather.classList.contains('hidden')) showElement(DOM.emptyState);
        showError(err.message);
    }
}

/* ==================== Geolocation ==================== */
function getLocation() {
    if (!navigator.geolocation) { showError('Geolocation is not supported by your browser'); return; }
    showLoading(true);
    navigator.geolocation.getCurrentPosition(
        function (pos) { loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude); },
        function (err) { showLoading(false); showElement(DOM.emptyState); if (err.code === err.PERMISSION_DENIED) showError('Location access denied. Search for a city instead.'); else showError('Could not detect location: ' + err.message); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
    );
}

/* ==================== Pull-to-Refresh ==================== */
var touchStartY = 0;
var pulling = false;
var pullDistance = 0;
var PULL_THRESHOLD = 80;

document.addEventListener('touchstart', function (e) {
    if (window.scrollY > 0) return;
    touchStartY = e.touches[0].clientY;
    pulling = true;
    pullDistance = 0;
}, { passive: true });

document.addEventListener('touchmove', function (e) {
    if (!pulling) return;
    if (window.scrollY > 0) { pulling = false; return; }
    var dy = e.touches[0].clientY - touchStartY;
    if (dy > 0) {
        pullDistance = Math.min(dy * 0.4, PULL_THRESHOLD);
        if (DOM.refreshIndicator) {
            DOM.refreshIndicator.style.transform = 'translateY(' + pullDistance + 'px)';
            DOM.refreshIndicator.style.opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);
            DOM.refreshIndicator.textContent = pullDistance >= PULL_THRESHOLD ? t('pullRefresh') : '';
        }
    }
}, { passive: true });

document.addEventListener('touchend', function () {
    if (!pulling) return;
    pulling = false;
    if (pullDistance >= PULL_THRESHOLD) {
        if (DOM.refreshIndicator) { DOM.refreshIndicator.style.transform = ''; DOM.refreshIndicator.style.opacity = '0'; }
        var city = localStorage.getItem(LAST_CITY_KEY);
        if (city) loadWeatherByCity(city, false);
        else getLocation();
    } else {
        if (DOM.refreshIndicator) { DOM.refreshIndicator.style.transform = ''; DOM.refreshIndicator.style.opacity = '0'; }
    }
}, { passive: true });

/* ==================== Event Listeners ==================== */
DOM.searchBtn.addEventListener('click', function () { var city = DOM.searchInput.value.trim(); if (city) { closeAutocomplete(); loadWeatherByCity(city); } });
DOM.searchInput.addEventListener('input', function () { if (acTimer) clearTimeout(acTimer); var q = DOM.searchInput.value.trim(); if (q.length < 2) { closeAutocomplete(); return; } acTimer = setTimeout(function () { fetchSuggestions(q); }, 300); });
DOM.searchInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' && acIndex < 0) { var city = DOM.searchInput.value.trim(); if (city) { closeAutocomplete(); loadWeatherByCity(city); } } if (e.key === 'Escape') { closeAutocomplete(); DOM.searchInput.blur(); } });
DOM.searchInput.addEventListener('blur', function () { setTimeout(closeAutocomplete, 200); });
DOM.locationBtn.addEventListener('click', getLocation);
DOM.starBtn.addEventListener('click', function () { var name = DOM.cityName.textContent; if (name && name !== '--') { var parts = name.split(','); toggleFavorite(parts[0].trim()); } });
DOM.unitCelsius.addEventListener('click', function () { toggleUnits('celsius'); });
DOM.unitFahrenheit.addEventListener('click', function () { toggleUnits('fahrenheit'); });

/* ==================== Theme Toggle ==================== */
function applyTheme(theme) {
    THEME = theme;
    localStorage.setItem('weather-theme', theme);
    if (theme === 'light') { document.documentElement.classList.add('light-theme'); DOM.themeIcon.setAttribute('data-lucide', 'sun'); } else { document.documentElement.classList.remove('light-theme'); DOM.themeIcon.setAttribute('data-lucide', 'moon'); }
    lucide.createIcons();
}
DOM.themeBtn.addEventListener('click', function () { applyTheme(THEME === 'dark' ? 'light' : 'dark'); });

/* ==================== Settings Modal ==================== */
function loadSettings() {
    var apiKey = localStorage.getItem('weather-api-key') || '';
    var defaultCity = localStorage.getItem('weather-default-city') || '';
    var refresh = localStorage.getItem('weather-refresh') || '10';
    DOM.settingsApiKey.value = apiKey;
    DOM.settingsDefaultCity.value = defaultCity;
    DOM.settingsRefresh.value = refresh;
}

function saveSettings() {
    localStorage.setItem('weather-api-key', DOM.settingsApiKey.value.trim());
    localStorage.setItem('weather-default-city', DOM.settingsDefaultCity.value.trim());
    localStorage.setItem('weather-refresh', DOM.settingsRefresh.value);
    closeSettings();
    var refreshMin = parseInt(DOM.settingsRefresh.value, 10);
    stopAutoRefresh();
    if (refreshMin > 0) {
        refreshInterval = setInterval(function () {
            if (cachedWeather) {
                var city = DOM.cityName.textContent.split(',')[0].trim();
                if (city && city !== '--') loadWeatherByCity(city, true);
            }
        }, refreshMin * 60000);
    }
    showToast('Settings saved');
}

function openSettings() {
    loadSettings();
    DOM.settingsModal.classList.remove('hidden');
    DOM.settingsModal.classList.add('flex');
}

function closeSettings() {
    DOM.settingsModal.classList.add('hidden');
    DOM.settingsModal.classList.remove('flex');
}

DOM.settingsBtn.addEventListener('click', openSettings);
DOM.settingsOverlay.addEventListener('click', closeSettings);
DOM.settingsClose.addEventListener('click', closeSettings);
DOM.settingsSave.addEventListener('click', saveSettings);

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        if (!DOM.settingsModal.classList.contains('hidden')) closeSettings();
        if (!DOM.shortcutsModal.classList.contains('hidden')) toggleShortcuts();
    }
});

function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    DOM.toastMsg.textContent = msg;
    DOM.toast.classList.remove('hidden', 'toast-exit');
    DOM.toast.classList.add('toast-enter');
    lucide.createIcons();
    toastTimer = setTimeout(function () {
        DOM.toast.classList.remove('toast-enter');
        DOM.toast.classList.add('toast-exit');
        setTimeout(function () { DOM.toast.classList.add('hidden'); }, 300);
    }, 3000);
}

/* ==================== Language Selector ==================== */
DOM.langSelect.addEventListener('change', function () { LANG = this.value; localStorage.setItem('weather-lang', LANG); applyLang(); });

/* ==================== PWA ==================== */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js');
    });
    var offlineBanner = document.getElementById('offline-banner');
    navigator.serviceWorker.addEventListener('message', function (e) {
        if (e.data && e.data.type === 'offline') {
            offlineBanner.classList.remove('hidden');
            offlineBanner.classList.add('flex');
            setTimeout(function () { offlineBanner.classList.add('hidden'); offlineBanner.classList.remove('flex'); }, 8000);
        }
    });
}

/* ==================== Init ==================== */
function init() {
    applyTheme(THEME);
    applyLang();
    if (UNITS === 'imperial') { DOM.unitCelsius.classList.remove('active'); DOM.unitFahrenheit.classList.add('active'); }
    renderChips();
    loadSettings();
    fetchMapConfig().then(function () {
        var lastCity = localStorage.getItem('weather-default-city') || localStorage.getItem(LAST_CITY_KEY);
        if (lastCity) loadWeatherByCity(lastCity);
        else getLocation();
    });
}

init();
lucide.createIcons();
