import caminhos  # noqa: F401  (coloca app/ no sys.path)
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch
from defaults_service import save_defaults

class ProvinceDefaultsTests(unittest.TestCase):
    def test_real_save_keeps_province_edits_and_preserves_cities(self):
        source=Path(__file__).resolve().parents[2]
        app=source/'app'
        original=(app/'dist/world.json').read_bytes()
        world=json.loads(original)
        proposal=json.loads((app/'dist/province-proposal.json').read_text(encoding='utf-8'))
        province=next(p for p in proposal['provinces'] if p['seat']==1240)
        town=next(b for b in world['cities'] if b['i']==1244)
        edits={'format':'silvengard-province-edits-v1','base':proposal['version'],'names':{str(province['i']):'Ducado de revisão'},'cells':[{'i':town['cell'],'province':province['i']}]}
        point={'id':'poi-user-default-test','name':'Santuário de teste','kind':'santuário','description':'Descrição salva com o padrão.','point':[100,200]}
        edition={'format':'silvengard-atlas-v1','exportedAt':'2026-11-07T00:00:00Z','edits':{'cities':{},'states':{}},'provinceEdits':edits,'landmarkEdits':{'format':'silvengard-landmarks-v1','items':[point],'deleted':[]}}
        with tempfile.TemporaryDirectory() as directory:
            base=Path(directory)
            (base/'dist').mkdir();(base/'tools').mkdir()
            for file in (app/'dist').glob('*.js'):shutil.copy2(file,base/'dist'/file.name)
            shutil.copy2(app/'tools/bake-defaults.mjs',base/'tools/bake-defaults.mjs')
            shutil.copy2(app/'dist/province-proposal.json',base/'dist/province-proposal.json')
            (base/'dist/world.json').write_bytes(original)
            with patch('persistent_defaults.find_node',return_value=str(app/'runtime/node.exe')):
                result=save_defaults(base,edition,world['savedDefaults']['id'])
            saved=json.loads((base/'dist/world.json').read_text(encoding='utf-8'))
            self.assertEqual(saved['defaultProvinceEdits'],edits)
            self.assertEqual(next(p for p in saved['landmarks'] if p['id']==point['id']),point)
            self.assertEqual(saved['cities'],world['cities'])
            self.assertEqual(saved['defaultJourneys'],world['defaultJourneys'])
            self.assertEqual(saved['cells'],world['cells'])
            self.assertEqual((base/result['backup']/'world.json').read_bytes(),original)
        self.assertEqual((app/'dist/world.json').read_bytes(),original)

if __name__=='__main__':unittest.main()
