# Weather Dashboard

A professional weather dashboard built with FastAPI and Tailwind CSS.

## Features

- Current weather with detailed stats (temperature, humidity, wind, pressure, feels like)
- 5-day weather forecast
- Dynamic background gradients based on weather conditions
- Search weather by city name
- Auto-detect location via browser geolocation
- Fully responsive design (mobile, tablet, desktop)

## Tech Stack

- **Backend:** Python with FastAPI
- **Frontend:** HTML5, JavaScript (ES6+), Tailwind CSS
- **Icons:** Lucide Icons
- **API:** OpenWeatherMap

## Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Run the server:

```bash
python app.py
```

3. Open your browser and navigate to:

```
http://localhost:8000
```

## Usage

- Allow location access when prompted to load weather for your current location
- Type a city name in the search bar and press Enter or click the search button
- Click the location pin button to re-detect your location
