import hashlib
import json
import os
import time
from collections import OrderedDict
from datetime import datetime, timezone
from functools import wraps

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response

load_dotenv()

app = FastAPI(title="Weather Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("OWM_API_KEY")
if not API_KEY:
    raise RuntimeError("OWM_API_KEY environment variable is not set")
BASE_URL = "https://api.openweathermap.org/data/2.5"

# ===================== Rate Limiter =====================
class RateLimiter:
    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.clients: OrderedDict[str, list[float]] = OrderedDict()

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        cutoff = now - self.window
        if client_ip not in self.clients:
            self.clients[client_ip] = []
        self.clients[client_ip] = [t for t in self.clients[client_ip] if t > cutoff]
        if len(self.clients[client_ip]) >= self.max_requests:
            return False
        self.clients[client_ip].append(now)
        return True

rate_limiter = RateLimiter(max_requests=60, window_seconds=60)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        client_ip = request.client.host if request.client else "unknown"
        if not rate_limiter.is_allowed(client_ip):
            return JSONResponse(status_code=429, content={"detail": "Too many requests. Try again in 60 seconds."})
    return await call_next(request)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"
    if not response.headers.get("Content-Security-Policy"):
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; "
            "img-src 'self' https://openweathermap.org https://tile.openstreetmap.org https://*.basemaps.cartocdn.com https://tilecache.rainviewer.com https://tile.openweathermap.org https://raw.githubusercontent.com data:; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' https://api.openweathermap.org https://api.rainviewer.com https://tilecache.rainviewer.com; "
            "frame-ancestors 'none'"
        )
        response.headers["Content-Security-Policy"] = csp
    return response


# ===================== TTL Cache =====================
class TTLCache:
    def __init__(self, ttl_seconds: int = 300, maxsize: int = 128):
        self.ttl = ttl_seconds
        self.maxsize = maxsize
        self._cache: OrderedDict[str, tuple[float, object]] = OrderedDict()

    def _make_key(self, *args, **kwargs) -> str:
        raw = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
        return hashlib.md5(raw.encode()).hexdigest()

    def get(self, key: str):
        if key not in self._cache:
            return None
        expires, value = self._cache[key]
        if time.time() > expires:
            del self._cache[key]
            return None
        self._cache.move_to_end(key)
        return value

    def set(self, key: str, value: object):
        if len(self._cache) >= self.maxsize:
            self._cache.popitem(last=False)
        self._cache[key] = (time.time() + self.ttl, value)

    def invalidate(self, prefix: str = ""):
        if prefix:
            self._cache = OrderedDict((k, v) for k, v in self._cache.items() if not k.startswith(prefix))
        else:
            self._cache.clear()

cache = TTLCache(ttl_seconds=300, maxsize=128)


def cached(ttl_override: int = None):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            effective_ttl = ttl_override if ttl_override is not None else cache.ttl
            old_ttl = cache.ttl
            cache.ttl = effective_ttl
            try:
                key = cache._make_key(func.__name__, *args, **kwargs)
                cached_val = cache.get(key)
                if cached_val is not None:
                    return cached_val
                result = await func(*args, **kwargs)
                cache.set(key, result)
                return result
            finally:
                cache.ttl = old_ttl
        return wrapper
    return decorator


@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/")
async def root():
    return FileResponse("index.html")


@app.get("/script.js")
async def script():
    return FileResponse("script.js")


@app.get("/manifest.json")
async def manifest():
    return FileResponse("manifest.json")


@app.get("/sw.js")
async def service_worker():
    return FileResponse("sw.js")


@app.get("/icons/{filename}")
async def icon(filename: str):
    return FileResponse(f"icons/{filename}")


@app.get("/api/geocode")
async def geocode(q: str = Query(...)):
    if len(q.strip()) < 2:
        return []
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.openweathermap.org/geo/1.0/direct",
            params={"q": q, "limit": 5, "appid": API_KEY},
        )
        if resp.status_code != 200:
            return []
        return resp.json()


def _resolve_api_key(appid: str = None) -> str:
    return appid if appid else API_KEY


async def fetch_from_owm(endpoint: str, params: dict, lang: str = "en", appid: str = None):
    key = _resolve_api_key(appid)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BASE_URL}/{endpoint}",
            params={**params, "appid": key, "units": "metric", "lang": lang},
        )
        if resp.status_code != 200:
            detail = resp.json().get("message", "Unknown error")
            raise HTTPException(status_code=resp.status_code, detail=detail)
        return resp.json()


@app.get("/api/weather")
@cached(ttl_override=300)
async def get_weather(city: str = Query(...), lang: str = Query(default="en"), appid: str = Query(default=None)):
    return await fetch_from_owm("weather", {"q": city}, lang=lang, appid=appid)


@app.get("/api/weather/coords")
@cached(ttl_override=300)
async def get_weather_by_coords(lat: float = Query(...), lon: float = Query(...), lang: str = Query(default="en"), appid: str = Query(default=None)):
    return await fetch_from_owm("weather", {"lat": lat, "lon": lon}, lang=lang, appid=appid)


@app.get("/api/forecast")
@cached(ttl_override=300)
async def get_forecast(city: str = Query(...), lang: str = Query(default="en"), appid: str = Query(default=None)):
    return await fetch_from_owm("forecast", {"q": city}, lang=lang, appid=appid)


@app.get("/api/forecast/coords")
@cached(ttl_override=300)
async def get_forecast_by_coords(lat: float = Query(...), lon: float = Query(...), lang: str = Query(default="en"), appid: str = Query(default=None)):
    return await fetch_from_owm("forecast", {"lat": lat, "lon": lon}, lang=lang, appid=appid)


@app.get("/api/air-quality")
@cached(ttl_override=300)
async def get_air_quality(lat: float = Query(...), lon: float = Query(...), appid: str = Query(default=None)):
    key = _resolve_api_key(appid)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.openweathermap.org/data/2.5/air_pollution",
            params={"lat": lat, "lon": lon, "appid": key},
        )
        if resp.status_code != 200:
            detail = resp.json().get("message", "Unknown error")
            raise HTTPException(status_code=resp.status_code, detail=detail)
        return resp.json()


@app.get("/api/uv")
@cached(ttl_override=600)
async def get_uv_index(lat: float = Query(...), lon: float = Query(...), appid: str = Query(default=None)):
    key = _resolve_api_key(appid)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.openweathermap.org/data/2.5/uvi",
            params={"lat": lat, "lon": lon, "appid": key},
        )
        if resp.status_code != 200:
            try:
                resp2 = await client.get(
                    "https://api.openweathermap.org/data/3.0/onecall",
                    params={"lat": lat, "lon": lon, "appid": key, "exclude": "minutely,hourly,daily,alerts"},
                )
                if resp2.status_code == 200:
                    data = resp2.json()
                    return {"value": data.get("current", {}).get("uvi", 0)}
            except Exception:
                pass
            raise HTTPException(status_code=resp.status_code, detail="UV data unavailable")
        return resp.json()


WEATHER_EMOJI = {
    200: "⛈", 201: "⛈", 202: "⛈", 210: "🌩", 211: "🌩", 212: "🌩", 221: "🌩", 230: "⛈", 231: "⛈", 232: "⛈",
    300: "🌦", 301: "🌦", 302: "🌦", 310: "🌦", 311: "🌦", 312: "🌦", 313: "🌦", 314: "🌦", 321: "🌦",
    500: "🌧", 501: "🌧", 502: "🌧", 503: "🌧", 504: "🌧", 511: "🌧", 520: "🌧", 521: "🌧", 522: "🌧", 531: "🌧",
    600: "🌨", 601: "🌨", 602: "🌨", 611: "🌨", 612: "🌨", 613: "🌨", 615: "🌨", 616: "🌨", 620: "🌨", 621: "🌨", 622: "🌨",
    701: "🌫", 711: "🌫", 721: "🌫", 731: "🌫", 741: "🌫", 751: "🌫", 761: "🌫", 762: "🌫", 771: "💨", 781: "🌪",
    800: "☀️", 801: "🌤", 802: "⛅", 803: "☁️", 804: "☁️",
}

BADGE_COLORS = {
    800: ("#f59e0b", "#fef3c7"),
    801: ("#f59e0b", "#fef3c7"),
    802: ("#6b7280", "#e5e7eb"),
    803: ("#6b7280", "#e5e7eb"),
    804: ("#4b5563", "#d1d5db"),
    500: ("#3b82f6", "#dbeafe"),
    501: ("#3b82f6", "#dbeafe"),
    502: ("#2563eb", "#bfdbfe"),
    600: ("#0ea5e9", "#e0f2fe"),
    601: ("#0ea5e9", "#e0f2fe"),
    200: ("#8b5cf6", "#ede9fe"),
    211: ("#8b5cf6", "#ede9fe"),
    701: ("#14b8a6", "#ccfbf1"),
    741: ("#14b8a6", "#ccfbf1"),
}

BADGE_DEFAULT_COLOR = ("#64748b", "#e2e8f0")


def _badge_color(weather_id: int):
    if weather_id in BADGE_COLORS:
        return BADGE_COLORS[weather_id]
    if 200 <= weather_id < 300:
        return BADGE_COLORS.get(200)
    if 300 <= weather_id < 400:
        return BADGE_COLORS.get(500)
    if 500 <= weather_id < 600:
        return BADGE_COLORS.get(500)
    if 600 <= weather_id < 700:
        return BADGE_COLORS.get(600)
    if 700 <= weather_id < 800:
        return BADGE_COLORS.get(701)
    if 800 <= weather_id < 900:
        return BADGE_COLORS.get(802)
    return BADGE_DEFAULT_COLOR


async def _badge_data(city: str, lat: float = None, lon: float = None, lang: str = "en", appid: str = None):
    if lat is not None and lon is not None:
        data = await fetch_from_owm("weather", {"lat": lat, "lon": lon}, lang=lang, appid=appid)
    else:
        data = await fetch_from_owm("weather", {"q": city}, lang=lang, appid=appid)
    w = data["weather"][0]
    wid = w["id"]
    emoji = WEATHER_EMOJI.get(wid, "☀️")
    desc = w["description"]
    temp = round(data["main"]["temp"])
    city_label = data["name"]
    # Truncate long city names
    if len(city_label) > 16:
        city_label = city_label[:14] + "…"
    return emoji, city_label, temp, desc, wid


def _build_badge_svg(emoji: str, city: str, temp: int, desc: str, wid: int):
    color, bg = _badge_color(wid)
    left = f"{emoji} {city}"
    right = f"{temp}°C {desc}"
    cw = 7.5
    left_w = max(70, int(len(left) * cw) + 18)
    right_w = max(60, int(len(right) * cw) + 18)
    total_w = left_w + right_w
    h = 20
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{total_w}" height="{h}">
  <linearGradient id="s" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="r"><rect width="{total_w}" height="{h}" rx="3"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="{left_w}" height="{h}" fill="#334155"/>
    <rect x="{left_w}" width="{right_w}" height="{h}" fill="{color}"/>
    <rect width="{total_w}" height="{h}" fill="url(#s)"/>
    <text x="{left_w / 2}" y="14" text-anchor="middle" fill="#fff" font-family="system-ui,Segoe UI,sans-serif" font-size="11" font-weight="600">{left}</text>
    <text x="{left_w + right_w / 2}" y="14" text-anchor="middle" fill="#fff" font-family="system-ui,Segoe UI,sans-serif" font-size="11" font-weight="600">{right}</text>
  </g>
</svg>"""
    return svg


@app.get("/api/badge")
@cached(ttl_override=300)
async def weather_badge(city: str = Query(...), lang: str = Query(default="en"), appid: str = Query(default=None)):
    try:
        emoji, city_label, temp, desc, wid = await _badge_data(city, lang=lang, appid=appid)
        svg = _build_badge_svg(emoji, city_label, temp, desc, wid)
        return Response(content=svg, media_type="image/svg+xml")
    except HTTPException:
        svg = _build_badge_svg("⚠", "Error", 0, "N/A", 0)
        return Response(content=svg, media_type="image/svg+xml", status_code=200)


@app.get("/api/badge/coords")
@cached(ttl_override=300)
async def weather_badge_coords(lat: float = Query(...), lon: float = Query(...), lang: str = Query(default="en"), appid: str = Query(default=None)):
    try:
        emoji, city_label, temp, desc, wid = await _badge_data(None, lat=lat, lon=lon, lang=lang, appid=appid)
        svg = _build_badge_svg(emoji, city_label, temp, desc, wid)
        return Response(content=svg, media_type="image/svg+xml")
    except HTTPException:
        svg = _build_badge_svg("⚠", "Error", 0, "N/A", 0)
        return Response(content=svg, media_type="image/svg+xml", status_code=200)


@app.get("/api/alerts")
@cached(ttl_override=300)
async def get_weather_alerts(lat: float = Query(...), lon: float = Query(...), lang: str = Query(default="en"), appid: str = Query(default=None)):
    key = _resolve_api_key(appid)
    alerts = []
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BASE_URL}/weather",
                params={"lat": lat, "lon": lon, "appid": key, "units": "metric", "lang": lang},
            )
            if resp.status_code != 200:
                return {"alerts": []}
            data = resp.json()
            main = data.get("main", {})
            wind = data.get("wind", {})
            weather = data.get("weather", [{}])[0]
            temp = main.get("temp", 20)
            feels_like = main.get("feels_like", 20)
            wind_speed = wind.get("speed", 0)
            weather_id = weather.get("id", 800)
            visibility = data.get("visibility", 10000)

            if temp >= 40:
                alerts.append({"type": "extreme_heat", "severity": "red", "title": "Extreme Heat", "description": f"Temperature of {temp:.0f}°C — take precautions, stay hydrated."})
            elif temp >= 35:
                alerts.append({"type": "heat", "severity": "orange", "title": "Heat Advisory", "description": f"High temperature of {temp:.0f}°C (feels like {feels_like:.0f}°C)."})
            if temp <= -15:
                alerts.append({"type": "extreme_cold", "severity": "red", "title": "Extreme Cold", "description": f"Temperature of {temp:.0f}°C — risk of frostbite."})
            elif temp <= -5:
                alerts.append({"type": "cold", "severity": "orange", "title": "Cold Advisory", "description": f"Low temperature of {temp:.0f}°C — dress warmly."})
            if wind_speed >= 25:
                alerts.append({"type": "extreme_wind", "severity": "red", "title": "Extreme Wind", "description": f"Wind speeds of {wind_speed:.0f} m/s — dangerous conditions."})
            elif wind_speed >= 15:
                alerts.append({"type": "high_wind", "severity": "orange", "title": "High Wind", "description": f"Wind speeds of {wind_speed:.0f} m/s — secure loose objects."})
            elif wind_speed >= 10:
                alerts.append({"type": "windy", "severity": "yellow", "title": "Windy", "description": f"Wind speeds of {wind_speed:.0f} m/s — breezy conditions."})
            if 200 <= weather_id < 300:
                alerts.append({"type": "thunderstorm", "severity": "orange", "title": "Thunderstorm", "description": "Thunderstorm expected — seek shelter indoors."})
            if 500 <= weather_id < 600:
                alerts.append({"type": "rain", "severity": "yellow", "title": "Heavy Rain", "description": "Rainfall expected — watch for flooding."})
            if weather_id == 602 or weather_id == 601:
                alerts.append({"type": "heavy_snow", "severity": "orange", "title": "Heavy Snow", "description": "Heavy snowfall expected — travel with caution."})
            if visibility < 1000:
                alerts.append({"type": "low_visibility", "severity": "orange", "title": "Low Visibility", "description": f"Visibility reduced to {visibility}m — drive carefully."})
            elif visibility < 5000:
                alerts.append({"type": "reduced_visibility", "severity": "yellow", "title": "Reduced Visibility", "description": f"Visibility at {visibility}m — be cautious."})
            if main.get("humidity", 50) < 15:
                alerts.append({"type": "low_humidity", "severity": "yellow", "title": "Very Dry", "description": "Humidity below 15% — stay hydrated."})
    except Exception:
        pass
    return {"alerts": alerts}


@app.get("/api/cache/invalidate")
async def invalidate_cache(secret: str = Query(...)):
    if secret != os.getenv("CACHE_SECRET", "dev-secret"):
        raise HTTPException(status_code=403, detail="Invalid secret")
    cache.invalidate()
    return {"status": "ok", "message": "Cache cleared"}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
