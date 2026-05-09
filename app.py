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

API_KEY = os.getenv("OWM_API_KEY", "5c6e0524b72ac1a94e87619078bbdc76")
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


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
