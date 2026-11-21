import http.server
import os
import ssl

server = http.server.ThreadingHTTPServer(
    ("0.0.0.0", 8443), http.server.SimpleHTTPRequestHandler
)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(
    os.path.expanduser("~/.local/share/pubgolf-local/cert.pem"),
    os.path.expanduser("~/.local/share/pubgolf-local/key.pem"),
)
server.socket = context.wrap_socket(server.socket, server_side=True)
server.serve_forever()
