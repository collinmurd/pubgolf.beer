# Pub Golf placeholder

A static, dependency-free virtual pint. Tilt a phone to slosh the beer and tip it back to drink.

## Run with Docker

```sh
docker build -t pubgolf-placeholder .
docker run -d --name pubgolf-placeholder -p 127.0.0.1:8080:8080 pubgolf-placeholder
```

Point your reverse proxy at port 8080 and serve the site over HTTPS. Motion sensors require a secure context, and iOS asks for permission when the visitor taps **Enable tilt**. Sensor support and permissions vary by browser.

For local development, serve this directory with any static HTTP server, for example `python3 -m http.server 8080`. Use HTTPS when testing motion on a phone.

For local HTTPS, generate a certificate for your LAN IP with `mkcert` at `~/.local/share/pubgolf-local/cert.pem` and its key at `~/.local/share/pubgolf-local/key.pem`, and trust the mkcert root certificate on your phone. Then run `python3 serve_https.py` from this directory and open `https://<your-lan-ip>:8443` on your phone.
