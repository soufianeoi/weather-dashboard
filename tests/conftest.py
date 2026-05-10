import os

import pytest
from fastapi.testclient import TestClient

os.environ["OWM_API_KEY"] = "test-key"


@pytest.fixture(autouse=True)
def reset_state():
    from app import cache, rate_limiter
    cache.invalidate()
    rate_limiter.clients.clear()


@pytest.fixture
def app():
    from app import app
    return app


@pytest.fixture
def client(app):
    return TestClient(app)
