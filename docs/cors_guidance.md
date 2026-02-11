# CORS guidance for Intent Normaliser

Allow the web client origin in the normaliser service, typically:
- `http://localhost:5173` for local development
- your deployed web origin for production

Required headers/methods:
- Allow method `POST` for `/v1/normalise`
- Allow headers `Content-Type` and optional `x-api-key`
- Return `Access-Control-Allow-Origin` for the requesting origin
