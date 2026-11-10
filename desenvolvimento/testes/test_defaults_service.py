import caminhos  # noqa: F401  (coloca app/ no sys.path)
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from defaults_service import save_defaults

class DefaultsServiceTests(unittest.TestCase):
    def test_backup_write_and_stale_tab_rejection(self):
        with tempfile.TemporaryDirectory() as directory:
            base=Path(directory);(base/'dist').mkdir();old={'savedDefaults':{'id':'old'},'cities':[]}
            (base/'dist/world.json').write_text(json.dumps(old),encoding='utf-8')
            edition={'format':'silvengard-atlas-v1','exportedAt':'2026-11-07T00:00:00Z'}
            new={'savedDefaults':{'id':'new','savedAt':edition['exportedAt']},'cities':[{'i':1}]}
            with patch('defaults_service.bake_editions',return_value=new):result=save_defaults(base,edition,'old')
            self.assertEqual(json.loads((base/'dist/world.json').read_text(encoding='utf-8')),new)
            backup=base/result['backup'];self.assertEqual(json.loads((backup/'world.json').read_text(encoding='utf-8')),old)
            self.assertEqual(len(json.loads((base/'saved-author-defaults.json').read_text(encoding='utf-8'))['revisions']),1)
            with self.assertRaises(ValueError):save_defaults(base,edition,'old')

if __name__=='__main__':unittest.main()
