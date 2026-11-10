import caminhos  # noqa: F401  (coloca app/ no sys.path)
import unittest
from pathlib import Path

RAIZ=Path(__file__).resolve().parents[2]
BASE=RAIZ/'app'

class ErrataV43Tests(unittest.TestCase):
    def test_new_errata_corrects_existing_text_without_repeating_cultural_dossiers(self):
        files=list((BASE/'historic_archives').glob('*.md'))
        for p in files:
            text=p.read_text(encoding='utf-8')
            for wrong in ['Cratera do Cron','Wyrmrealm','Garnalus','Terremotos de Balásco']:
                self.assertNotIn(wrong,text,p.name)
            old=(RAIZ/'acervo/backups/v43-before-consumption/historic_archives'/p.name).read_text(encoding='utf-8')
            self.assertEqual(text.count('## Estado: Vitravion'),old.count('## Estado: Vitravion'))
        places=next(p for p in files if 'Estados_Historias' in p.name).read_text(encoding='utf-8')
        self.assertIn('foi educado na região de Winterhelm. Lá formou forte amizade com Rodrick Windbear',places)
        self.assertIn('provocou a manifestação de um avatar dracônico negro de Dravanir',places)


if __name__=='__main__':
    unittest.main()
