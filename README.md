# WeatherVue — Professional Weather Dashboard

[![CI/CD](https://github.com/soufianeoi/weather-dashboard/actions/workflows/main.yml/badge.svg)](https://github.com/soufianeoi/weather-dashboard/actions/workflows/main.yml)
[![Python](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/release/python-3119/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-00a393.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)](https://docker.com)

> A beautiful, production-ready weather dashboard with real-time data, 5-day forecasts, air quality index, UV index, interactive maps, and multilingual support — all wrapped in a sleek dark/light theme.



## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌤 **Current Weather** | Temperature, humidity, wind, pressure, feels-like, visibility, cloud cover |
| 📅 **5-Day Forecast** | Daily min/max temps, precipitation probability, weather icons |
| ⏰ **Hourly Forecast** | Next 8 hours with temp and rain chance |
| 📊 **Temperature Chart** | Interactive line chart (temp + humidity) via Chart.js |
| 🌧 **POP Chart** | Precipitation probability bar chart for the next 24h |
| 🫁 **Air Quality Index** | AQI level with PM2.5, PM10, O₃, NO₂, SO₂, CO breakdown |
| ☀️ **UV Index** | Conic-gradient gauge with severity levels |
| ⚠️ **Weather Alerts** | Condition-based advisories for extreme heat, cold, wind, storms |
| 🗺 **Interactive Map** | Leaflet map with Radar / Wind / Temp layer toggles |
| 🌍 **Multilingual** | EN, FR, ES, DE, JA — full i18n throughout the UI |
| 🌓 **Dark / Light Theme** | Persisted preference with smooth transitions |
| 🔍 **Autocomplete Search** | City suggestions as you type |
| ⭐ **Favorites & Recents** | Save cities, quick-access chips |
| 📱 **Pull to Refresh** | Touch gesture to reload weather data |
| 🎨 **Animated Icons** | CSS-animated weather icons (sun, clouds, rain, snow, thunder, mist) |
| 📦 **PWA Ready** | Service worker for offline-capable install |
| 🐳 **Docker Support** | One-command deployment with Docker Compose |

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- [OpenWeatherMap API key](https://openweathermap.org/api) (free tier works)

### Local Development
```bash
# Clone
git clone https://github.com/soufianeoi/weather-dashboard.git
cd weather-dashboard

# Setup
pip install -r requirements.txt
echo "OWM_API_KEY=your_key_here" > .env

# Run
python app.py
```

### Docker
```bash
docker compose up --build
```

Then open **http://localhost:8000**.

---

## 🧪 Testing

```bash
pytest tests/ -v
```

## 🛠 Tech Stack

**Backend**
- Python 3.11 / FastAPI / Uvicorn
- httpx (async HTTP client)
- In-memory TTL caching · Rate limiting middleware

**Frontend**
- Vanilla JavaScript (ES6+)
- Tailwind CSS · Chart.js · Leaflet · Lucide Icons

**Infrastructure**
- Docker · Docker Compose
- GitHub Actions (CI: pytest + Docker build)

---

## 📦 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/geocode?q=` | City autocomplete |
| GET | `/api/weather?city=` | Current weather |
| GET | `/api/weather/coords?lat=&lon=` | Weather by coords |
| GET | `/api/forecast?city=` | 5-day forecast |
| GET | `/api/forecast/coords?lat=&lon=` | Forecast by coords |
| GET | `/api/air-quality?lat=&lon=` | Air quality index |
| GET | `/api/uv?lat=&lon=` | UV index |
| GET | `/api/alerts?lat=&lon=` | Weather alerts |

All endpoints accept `lang=en|fr|es|de|ja` for localized responses.

---

## 🌐 One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/template)
[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://www.koyeb.com/deploy)



## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">Powered by <a href="https://openweathermap.org">OpenWeatherMap</a> · Built with ❤️</p>
