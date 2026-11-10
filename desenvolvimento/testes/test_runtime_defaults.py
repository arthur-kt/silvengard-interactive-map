import caminhos  # noqa: F401  (coloca app/ no sys.path)
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from persistent_defaults import find_node

class RuntimeDefaultsTests(unittest.TestCase):
    def test_local_runtime_works_without_node_on_path(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder);(base/'runtime').mkdir();binary=base/'runtime/node.exe';binary.write_bytes(b'test')
            with patch('persistent_defaults.shutil.which',return_value=None):self.assertEqual(find_node(base),str(binary.resolve()))

    def test_installed_node_is_used_when_no_local_runtime_exists(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch('persistent_defaults.shutil.which',return_value='C:/node/node.exe'):self.assertEqual(find_node(folder),'C:/node/node.exe')

    def test_missing_runtime_has_actionable_message(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch('persistent_defaults.shutil.which',return_value=None):
                with self.assertRaisesRegex(RuntimeError,'runtime/node.exe'):find_node(folder)

if __name__=='__main__':unittest.main()
