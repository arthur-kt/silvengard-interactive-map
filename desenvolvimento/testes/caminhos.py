"""Caminhos do repositório, resolvidos a partir de desenvolvimento/testes/."""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
APP = RAIZ / 'app'
DADOS = RAIZ / 'dados'
DOCUMENTOS = RAIZ / 'documentos'
ACERVO = RAIZ / 'acervo'
DESENVOLVIMENTO = RAIZ / 'desenvolvimento'
FERRAMENTAS = DESENVOLVIMENTO / 'ferramentas'

# O programa (serve.py, defaults_service.py, ...) mora em app/;
# os scripts de construção e verificação moram em desenvolvimento/.
for _pasta in (APP, DESENVOLVIMENTO):
    if str(_pasta) not in sys.path:
        sys.path.insert(0, str(_pasta))
