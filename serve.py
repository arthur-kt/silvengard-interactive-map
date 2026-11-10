import http.server,webbrowser,pathlib,socketserver,socket,sys,json,logging
from logging.handlers import RotatingFileHandler
from defaults_service import save_defaults
from persistent_defaults import find_node
from history_archive import build_archive
ROOT=pathlib.Path(__file__).resolve().parent/'dist'
def log_save_error(error):
 try:
  folder=ROOT.parent/'logs';folder.mkdir(exist_ok=True)
  logger=logging.getLogger('atlas-defaults')
  if not logger.handlers:
   handler=RotatingFileHandler(folder/'salvamento.log',maxBytes=500000,backupCount=2,encoding='utf-8');logger.addHandler(handler);logger.setLevel(logging.ERROR)
  logger.exception('Falha ao salvar o padrão: %s',error)
 except OSError:pass
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*args):pass
 def do_GET(self):
  if self.path.split('?',1)[0]=='/api/history':
   try:return self.json_response(200,build_archive(ROOT.parent))
   except (OSError,ValueError) as error:return self.json_response(503,{'error':'Não foi possível ler as histórias em historic_archives. Confira os três documentos Markdown e tente atualizar novamente.'})
  if self.path=='/api/defaults':
   try:runtime=find_node(ROOT.parent);ready=True
   except RuntimeError:runtime=None;ready=False
   return self.json_response(200,{'available':True,'root':str(ROOT.parent),'runtimeReady':ready})
  return super().do_GET()
 def json_response(self,status,data):
  body=json.dumps(data,ensure_ascii=False).encode('utf-8');self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
 def do_POST(self):
  if self.path!='/api/defaults':return self.json_response(404,{'error':'Não encontrado'})
  host=self.headers.get('Host','');origin=self.headers.get('Origin','')
  if host not in ['127.0.0.1:8765','localhost:8765'] or origin not in ['http://127.0.0.1:8765','http://localhost:8765'] or self.headers.get('Sec-Fetch-Site')=='cross-site':return self.json_response(403,{'error':'Origem não autorizada'})
  if self.headers.get('Content-Type','').split(';')[0]!='application/json':return self.json_response(415,{'error':'Envie JSON'})
  try:
   length=int(self.headers.get('Content-Length','0'))
   if not 0<length<=20000000:raise ValueError('Tamanho de edição inválido')
   payload=json.loads(self.rfile.read(length));result=save_defaults(ROOT.parent,payload['edition'],payload.get('baseId'))
   return self.json_response(200,result)
  except (ValueError,KeyError,TypeError) as error:return self.json_response(400,{'error':str(error)})
  except (FileNotFoundError,RuntimeError) as error:
   log_save_error(error);return self.json_response(503,{'error':'O componente de salvamento não está disponível. Confira runtime/node.exe e reabra Abrir-Atlas.cmd. Sua edição foi preservada.'})
  except PermissionError as error:
   log_save_error(error);return self.json_response(500,{'error':'O Windows impediu a gravação na pasta do Atlas. Sua edição foi preservada; detalhes em logs/salvamento.log.'})
  except Exception as error:
   log_save_error(error);return self.json_response(500,{'error':'Não foi possível concluir a gravação. Sua edição foi preservada; o motivo está em logs/salvamento.log.'})
class Server(socketserver.ThreadingTCPServer):
 allow_reuse_address=sys.platform!='win32'
 def server_bind(self):
  if sys.platform=='win32':self.socket.setsockopt(socket.SOL_SOCKET,socket.SO_EXCLUSIVEADDRUSE,1)
  super().server_bind()
if __name__=='__main__':
 try:server=Server(('127.0.0.1',8765),Handler)
 except OSError:
  webbrowser.open('http://127.0.0.1:8765');raise SystemExit()
 if '--no-browser' not in sys.argv:webbrowser.open('http://127.0.0.1:8765')
 server.serve_forever()
