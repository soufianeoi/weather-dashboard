import os
import pytest
from fastapi.testclient import TestClient

os.environ["OWM_API_KEY"] = "test-key"


@pytest.fixture(autouse=True)
def clear_cache():
    from app import cache
    cache.invalidate()


@pytest.fixture
def app():
    from app import app
    return app


@pytest.fixture
def client(app):
    return TestClient(app)
