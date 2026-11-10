"""Servidor local do Atlas de Silvengard. Atende apenas este computador (127.0.0.1).

Uso:
    python serve.py                 # porta 8765, abre o navegador
    python serve.py --port 8766     # outra porta
    python serve.py --no-browser    # não abre o navegador (usado pelo Silvengard-Atlas.exe)
"""
import argparse
import http.server
import json
import logging
import os
import pathlib
import socket
import socketserver
import sys
import webbrowser
from logging.handlers import RotatingFileHandler

from defaults_service import save_defaults
from persistent_defaults import find_node
from history_archive import build_archive

ROOT = pathlib.Path(__file__).resolve().parent / 'dist'
DEFAULT_PORT = 8765
PORT_FILE = ROOT.parent / 'logs' / 'atlas.port'


def announce(port):
    """Registra porta e PID para o Silvengard-Atlas.exe poder encerrar o servidor."""
    try:
        PORT_FILE.parent.mkdir(exist_ok=True)
        PORT_FILE.write_text(f'porta={port}\npid={os.getpid()}\n', encoding='utf-8')
    except OSError:
        pass


def forget():
    try:
        PORT_FILE.unlink()
    except OSError:
        pass



def log_save_error(error):
    try:
        folder = ROOT.parent / 'logs'
        folder.mkdir(exist_ok=True)
        logger = logging.getLogger('atlas-defaults')
        if not logger.handlers:
            handler = RotatingFileHandler(folder / 'salvamento.log', maxBytes=500000, backupCount=2, encoding='utf-8')
            logger.addHandler(handler)
            logger.setLevel(logging.ERROR)
        logger.exception('Falha ao salvar o padrão: %s', error)
    except OSError:
        pass


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def log_message(self, *args):
        pass

    def allowed_origins(self):
        port = self.server.server_address[1]
        return {f'127.0.0.1:{port}', f'localhost:{port}'}

    def do_GET(self):
        if self.path.split('?', 1)[0] == '/api/history':
            try:
                return self.json_response(200, build_archive(ROOT.parent))
            except (OSError, ValueError):
                return self.json_response(503, {'error': 'Não foi possível ler as histórias em historic_archives. Confira os três documentos Markdown e tente atualizar novamente.'})
        if self.path.split('?', 1)[0] == '/api/defaults':
            try:
                find_node(ROOT.parent)
                ready = True
            except RuntimeError:
                ready = False
            return self.json_response(200, {'available': True, 'root': str(ROOT.parent), 'runtimeReady': ready, 'port': self.server.server_address[1]})
        return super().do_GET()

    def json_response(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path.split('?', 1)[0] != '/api/defaults':
            return self.json_response(404, {'error': 'Não encontrado'})
        hosts = self.allowed_origins()
        host = self.headers.get('Host', '')
        origin = self.headers.get('Origin', '')
        if host not in hosts or origin not in {'http://' + h for h in hosts} or self.headers.get('Sec-Fetch-Site') == 'cross-site':
            return self.json_response(403, {'error': 'Origem não autorizada'})
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            return self.json_response(415, {'error': 'Envie JSON'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 20000000:
                raise ValueError('Tamanho de edição inválido')
            payload = json.loads(self.rfile.read(length))
            result = save_defaults(ROOT.parent, payload['edition'], payload.get('baseId'))
            return self.json_response(200, result)
        except (ValueError, KeyError, TypeError) as error:
            return self.json_response(400, {'error': str(error)})
        except (FileNotFoundError, RuntimeError) as error:
            log_save_error(error)
            return self.json_response(503, {'error': 'O componente de salvamento não está disponível. Confira app/runtime/node.exe e reabra Silvengard-Atlas.exe. Sua edição foi preservada.'})
        except PermissionError as error:
            log_save_error(error)
            return self.json_response(500, {'error': 'O Windows impediu a gravação na pasta do Atlas. Sua edição foi preservada; detalhes em app/logs/salvamento.log.'})
        except Exception as error:
            log_save_error(error)
            return self.json_response(500, {'error': 'Não foi possível concluir a gravação. Sua edição foi preservada; o motivo está em app/logs/salvamento.log.'})


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = sys.platform != 'win32'
    daemon_threads = True

    def server_bind(self):
        if sys.platform == 'win32':
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def main(argv=None):
    parser = argparse.ArgumentParser(description='Atlas de Silvengard — servidor local')
    parser.add_argument('--port', type=int, default=DEFAULT_PORT)
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args(argv)
    port = args.port
    url = f'http://127.0.0.1:{port}/'
    try:
        server = Server(('127.0.0.1', port), Handler)
    except OSError as error:
        print(f'Não foi possível abrir a porta {port}: {error}', file=sys.stderr)
        return 2
    announce(port)
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        forget()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
