FROM python:3.14-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.14-slim

WORKDIR /app
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

COPY --chown=65534:65534 . .
RUN chmod -R 755 /app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import http.client; http.client.HTTPConnection('localhost', 8000).request('GET', '/api/health'); exit(0 if http.client.HTTPConnection('localhost', 8000).getresponse().status == 200 else 1)"

USER 65534

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
