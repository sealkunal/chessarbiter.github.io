"""
start-server.py
---------------
Starts a local HTTP server for the FIDE Arbiter's Manual website.
Run:  python start-server.py
Then open:  http://localhost:8080
"""

import http.server
import socketserver
import webbrowser
import threading
import os

PORT = 8080

# Serve from the directory this script lives in
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

def open_browser():
    webbrowser.open(f"http://localhost:{PORT}/index.html")

print(f"\n  FIDE Arbiter's Manual – Local Server")
print(f"  ─────────────────────────────────────")
print(f"  Serving at:  http://localhost:{PORT}")
print(f"  Press Ctrl+C to stop.\n")

# Open browser after a short delay so the server is ready
threading.Timer(1.0, open_browser).start()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")
