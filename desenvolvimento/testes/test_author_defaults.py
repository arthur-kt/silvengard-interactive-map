import caminhos  # noqa: F401  (coloca app/ no sys.path)
import copy
import json
import pathlib
import tempfile
import unittest
from author_defaults import apply_author_defaults


class AuthorDefaultsTests(unittest.TestCase):
    def world(self):
        return {'revision': 9, 'grid': {'columns': 2, 'rows': 1, 'stepX': 4, 'stepY': 4},
                'cells': [{'i': 0, 'p': [2, 2], 'h': 25, 'state': 12, 'biome': 6, 'area': 16, 'c': [1]},
                          {'i': 1, 'p': [6, 2], 'h': 25, 'state': 13, 'biome': 6, 'area': 16, 'c': [0]}],
                'states': [{'i': 12, 'area': 16, 'pole': [2, 2]}, {'i': 13, 'area': 16, 'pole': [6, 2]}],
                'cities': [{'i': 1, 'name': 'Town', 'cell': 0, 'state': 12}]}

    def write(self, folder, world, cells):
        raw = {'format': 'silvengard-map-edits-v1', 'baseRevision': 9, 'grid': world['grid'], 'cells': cells}
        (pathlib.Path(folder)/'author-map-defaults.json').write_text(json.dumps(raw), encoding='utf-8')

    def test_defaults_update_city_area_pole_and_are_repeatable(self):
        world = self.world()
        with tempfile.TemporaryDirectory() as folder:
            self.write(folder, world, [{'i': 0, 'state': 13, 'biome': 1, 'vegetation': 'none', 'woodland': 0}])
            apply_author_defaults(world, folder)
            self.assertEqual(world['cities'][0]['state'], 13)
            self.assertEqual(world['states'][0]['area'], 0)
            self.assertIsNone(world['states'][0]['pole'])
            self.assertEqual(world['states'][1]['area'], 32)
            self.assertEqual(world['cells'][0]['h'], 25)
            expected = copy.deepcopy(world)
            apply_author_defaults(world, folder)
            self.assertEqual(world, expected)

    def test_all_validation_happens_before_any_mutation(self):
        world = self.world()
        expected = copy.deepcopy(world)
        with tempfile.TemporaryDirectory() as folder:
            self.write(folder, world, [{'i': 0, 'state': 13}, {'i': 1, 'biome': 99}])
            with self.assertRaises(ValueError):
                apply_author_defaults(world, folder)
            self.assertEqual(world, expected)

    def test_no_approved_file_preserves_the_reference(self):
        world = self.world()
        expected = copy.deepcopy(world)
        with tempfile.TemporaryDirectory() as folder:
            apply_author_defaults(world, folder)
        self.assertEqual(world, expected)


if __name__ == '__main__':
    unittest.main()
