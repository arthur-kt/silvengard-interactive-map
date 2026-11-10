// Caminhos do repositório para os testes: o programa mora em app/.
import fs from 'node:fs';

export const RAIZ = new URL('../../', import.meta.url);
export const PAI = new URL('../../../', import.meta.url); // pasta RPG (Mapas/, Emblemas e mapas/)

// Procura o arquivo nos lugares previstos da nova estrutura, em ordem.
const LOCAIS = ['', 'app/', 'app/dist/', 'dados/', 'documentos/', 'acervo/', 'acervo/edicoes/', 'acervo/revisoes/',
  'acervo/referencias/', 'desenvolvimento/ferramentas/', 'app/historic_archives/'];

export function caminho(relativo) {
  for (const local of LOCAIS) {
    const url = new URL(local + relativo, RAIZ);
    if (fs.existsSync(url)) return url;
  }
  return new URL(relativo, RAIZ);
}

export function caminhoPai(relativo) {
  return new URL(relativo, PAI);
}

export const lerJSON = (relativo) => JSON.parse(fs.readFileSync(caminho(relativo), 'utf8'));
export const lerTexto = (relativo) => fs.readFileSync(caminho(relativo), 'utf8');
