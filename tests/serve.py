"""Local preview at the same /pocket-arcade/ prefix used by Pages."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(Path(__file__).resolve().parents[1]),**kwargs)
    def do_GET(self):
        if not self.path.startswith('/pocket-arcade/'):
            self.send_error(404); return
        self.path=self.path[len('/pocket-arcade'):]
        super().do_GET()
ThreadingHTTPServer(('127.0.0.1',8030),Handler).serve_forever()
