import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import httpx
import uvicorn

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


async def fetch_from_owm(endpoint: str, params: dict):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BASE_URL}/{endpoint}",
            params={**params, "appid": API_KEY, "units": "metric"},
        )
        if resp.status_code != 200:
            detail = resp.json().get("message", "Unknown error")
            raise HTTPException(status_code=resp.status_code, detail=detail)
        return resp.json()


@app.get("/api/weather")
async def get_weather(city: str = Query(...)):
    return await fetch_from_owm("weather", {"q": city})


@app.get("/api/weather/coords")
async def get_weather_by_coords(lat: float = Query(...), lon: float = Query(...)):
    return await fetch_from_owm("weather", {"lat": lat, "lon": lon})


@app.get("/api/forecast")
async def get_forecast(city: str = Query(...)):
    return await fetch_from_owm("forecast", {"q": city})


@app.get("/api/forecast/coords")
async def get_forecast_by_coords(lat: float = Query(...), lon: float = Query(...)):
    return await fetch_from_owm("forecast", {"lat": lat, "lon": lon})


@app.get("/api/air-quality")
async def get_air_quality(lat: float = Query(...), lon: float = Query(...)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.openweathermap.org/data/2.5/air_pollution",
            params={"lat": lat, "lon": lon, "appid": API_KEY},
        )
        if resp.status_code != 200:
            detail = resp.json().get("message", "Unknown error")
            raise HTTPException(status_code=resp.status_code, detail=detail)
        return resp.json()


@app.get("/api/alerts")
async def get_weather_alerts(lat: float = Query(...), lon: float = Query(...)):
    alerts = []
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BASE_URL}/weather",
                params={"lat": lat, "lon": lon, "appid": API_KEY, "units": "metric"},
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


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
