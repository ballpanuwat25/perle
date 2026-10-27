# Serves the direction sketches without browser caching, so an edited module is never mixed
# with a stale one on reload.
#   python serve.py <port> <dir>
import sys
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


port, root = int(sys.argv[1]), sys.argv[2]
ThreadingHTTPServer(('', port), partial(NoCache, directory=root)).serve_forever()
