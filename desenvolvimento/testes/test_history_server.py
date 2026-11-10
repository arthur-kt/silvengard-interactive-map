import caminhos  # noqa: F401  (coloca app/ no sys.path)
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'app'))
from serve import Server, Handler


class HistoryServerTests(unittest.TestCase):
    def test_second_atlas_cannot_bind_to_the_same_port(self):
        with Server(('127.0.0.1', 0), Handler) as first:
            with self.assertRaises(OSError):
                with Server(first.server_address, Handler):
                    pass


if __name__ == '__main__':
    unittest.main()
