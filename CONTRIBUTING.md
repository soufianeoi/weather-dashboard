# Contributing to WeatherVue

First off, thanks for taking the time to contribute! 🎉

## Code of Conduct

Be respectful, inclusive, and constructive. Harassment or toxic behavior will not be tolerated.

## How to Contribute

### 🐛 Report a Bug
1. Check existing [issues](https://github.com/soufianeoi/weather-dashboard/issues) first
2. Open a new issue using the **Bug Report** template
3. Include: steps to reproduce, expected vs actual behavior, screenshots if applicable

### 💡 Suggest a Feature
1. Open a **Feature Request** issue
2. Describe the problem and your proposed solution
3. Explain why it would benefit the project

### 🔧 Submit a Pull Request
1. Fork the repo and create your branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes, following existing code style
3. Ensure tests pass:
   ```bash
   pytest tests/ -v
   ```
4. Commit with a clear message (see [Conventional Commits](https://www.conventionalcommits.org/)):
   ```bash
   git commit -m "feat: add dark mode toggle"
   ```
5. Push and open a PR against `main`

## Development Setup

```bash
pip install -r requirements.txt
echo "OWM_API_KEY=your_key" > .env
python app.py
```

## Code Style

- **Python**: Follow PEP 8, use type hints
- **JavaScript**: ES6+, 2-space indent, no semicolons
- **CSS**: Utility-first with Tailwind; avoid custom CSS when possible
- **Tests**: Write pytest tests for new backend endpoints

## Project Structure

```
weather-dashboard/
├── app.py                  # FastAPI backend
├── index.html              # Main frontend
├── script.js               # Frontend logic
├── tests/
│   ├── conftest.py         # Pytest fixtures
│   └── test_api.py         # API tests
├── e2e/                    # Playwright E2E tests
├── .github/workflows/      # CI/CD pipeline
└── Dockerfile              # Docker config
```

## Need Help?

Open a [Discussion](https://github.com/soufianeoi/weather-dashboard/discussions) or ask in an issue.
