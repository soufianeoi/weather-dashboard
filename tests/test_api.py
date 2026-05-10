from unittest.mock import AsyncMock, MagicMock, patch



class TestHealth:
    def test_health_endpoint(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "timestamp" in data


class TestStaticFiles:
    def test_root_returns_index(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert "html" in resp.headers["content-type"]

    def test_script_js(self, client):
        resp = client.get("/script.js")
        assert resp.status_code == 200

    def test_manifest(self, client):
        resp = client.get("/manifest.json")
        assert resp.status_code == 200

    def test_service_worker(self, client):
        resp = client.get("/sw.js")
        assert resp.status_code == 200


SAMPLE_WEATHER = {
    "name": "London",
    "sys": {"country": "GB"},
    "weather": [{"id": 800, "main": "Clear", "description": "clear sky", "icon": "01d"}],
    "main": {"temp": 15, "feels_like": 13, "humidity": 72, "pressure": 1012},
    "wind": {"speed": 5, "deg": 200},
    "visibility": 10000,
    "clouds": {"all": 10},
    "coord": {"lat": 51.5, "lon": -0.1},
}

SAMPLE_FORECAST = {
    "list": [
        {
            "dt": 1700000000,
            "main": {"temp": 12, "feels_like": 10, "humidity": 65, "pressure": 1013},
            "weather": [{"id": 802, "main": "Clouds", "description": "scattered clouds", "icon": "03d"}],
            "wind": {"speed": 4, "deg": 180},
            "pop": 0.1,
        }
    ]
}

SAMPLE_AQI = {
    "list": [{
        "main": {"aqi": 2},
        "components": {"pm2_5": 10, "pm10": 20, "o3": 30, "no2": 15, "so2": 5, "co": 200},
    }]
}


def _mock_async_get(mock_client_class, status_code, json_data):
    """Configure mock so that asyncclient.get returns a response with given status/json."""
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.json.return_value = json_data
    mock_client_class.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_resp)
    return mock_client_class


class TestGeocode:
    def test_geocode_short_query_returns_empty(self, client):
        resp = client.get("/api/geocode", params={"q": "a"})
        assert resp.status_code == 200
        assert resp.json() == []

    @patch("app.httpx.AsyncClient")
    def test_geocode_success(self, mock_client_class, client):
        _mock_async_get(mock_client_class, 200, [
            {"name": "London", "country": "GB", "lat": 51.5, "lon": -0.1}
        ])
        resp = client.get("/api/geocode", params={"q": "London"})
        assert resp.status_code == 200
        assert resp.json()[0]["name"] == "London"

    @patch("app.httpx.AsyncClient")
    def test_geocode_api_error_returns_empty(self, mock_client_class, client):
        _mock_async_get(mock_client_class, 401, {})
        resp = client.get("/api/geocode", params={"q": "London"})
        assert resp.status_code == 200
        assert resp.json() == []


class TestWeather:
    @patch("app.httpx.AsyncClient")
    def test_get_weather_success(self, mock_client_class, client):
        _mock_async_get(mock_client_class, 200, SAMPLE_WEATHER)
        resp = client.get("/api/weather", params={"city": "London"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "London"

    @patch("app.httpx.AsyncClient")
    def test_get_weather_not_found(self, mock_client_class, client):
        _mock_async_get(mock_client_class, 404, {"message": "city not found"})
        resp = client.get("/api/weather", params={"city": "Nowhere"})
        assert resp.status_code == 404
        assert resp.json()["detail"] == "city not found"


class TestForecast:
    @patch("app.httpx.AsyncClient")
    def test_get_forecast_success(self, mock_client_class, client):
        _mock_async_get(mock_client_class, 200, SAMPLE_FORECAST)
        resp = client.get("/api/forecast", params={"city": "London"})
        assert resp.status_code == 200
        assert "list" in resp.json()

    @patch("app.httpx.AsyncClient")
    def test_get_forecast_by_coords(self, mock_client_class, client):
        _mock_async_get(mock_client_class, 200, {"list": []})
        resp = client.get("/api/forecast/coords", params={"lat": 51.5, "lon": -0.1})
        assert resp.status_code == 200


class TestAirQuality:
    @patch("app.httpx.AsyncClient")
    def test_air_quality_success(self, mock_client_class, client):
        _mock_async_get(mock_client_class, 200, SAMPLE_AQI)
        resp = client.get("/api/air-quality", params={"lat": 51.5, "lon": -0.1})
        assert resp.status_code == 200
        assert resp.json()["list"][0]["main"]["aqi"] == 2


class TestWeatherByCoords:
    @patch("app.httpx.AsyncClient")
    def test_weather_by_coords(self, mock_client_class, client):
        _mock_async_get(mock_client_class, 200, SAMPLE_WEATHER)
        resp = client.get("/api/weather/coords", params={"lat": 51.5, "lon": -0.1})
        assert resp.status_code == 200
        assert resp.json()["name"] == "London"


class TestAlerts:
    @patch("app.httpx.AsyncClient")
    def test_alerts_normal_weather(self, mock_client_class, client):
        _mock_async_get(mock_client_class, 200, {
            "main": {"temp": 20, "feels_like": 18, "humidity": 50},
            "wind": {"speed": 5, "deg": 180},
            "weather": [{"id": 800, "main": "Clear", "description": "clear sky"}],
            "visibility": 10000,
        })
        resp = client.get("/api/alerts", params={"lat": 51.5, "lon": -0.1})
        assert resp.status_code == 200
        assert resp.json()["alerts"] == []

    @patch("app.httpx.AsyncClient")
    def test_alerts_extreme_heat(self, mock_client_class, client):
        _mock_async_get(mock_client_class, 200, {
            "main": {"temp": 42, "feels_like": 44, "humidity": 20},
            "wind": {"speed": 3, "deg": 180},
            "weather": [{"id": 800, "main": "Clear", "description": "clear sky"}],
            "visibility": 10000,
        })
        resp = client.get("/api/alerts", params={"lat": 51.5, "lon": -0.1})
        assert resp.status_code == 200
        alerts = resp.json()["alerts"]
        assert len(alerts) >= 1
        assert any(a["type"] == "extreme_heat" for a in alerts)

    @patch("app.httpx.AsyncClient")
    def test_alerts_high_wind(self, mock_client_class, client):
        _mock_async_get(mock_client_class, 200, {
            "main": {"temp": 15, "feels_like": 12, "humidity": 60},
            "wind": {"speed": 20, "deg": 200},
            "weather": [{"id": 500, "main": "Rain", "description": "heavy rain"}],
            "visibility": 8000,
        })
        resp = client.get("/api/alerts", params={"lat": 51.5, "lon": -0.1})
        assert resp.status_code == 200
        alerts = resp.json()["alerts"]
        assert any(a["type"] == "high_wind" for a in alerts)
        assert any(a["type"] == "rain" for a in alerts)
