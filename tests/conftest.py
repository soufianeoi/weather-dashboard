import os
import pytest
from fastapi.testclient import TestClient

os.environ["OWM_API_KEY"] = "test-key"


@pytest.fixture
def app():
    from app import app
    return app


@pytest.fixture
def client(app):
    return TestClient(app)
