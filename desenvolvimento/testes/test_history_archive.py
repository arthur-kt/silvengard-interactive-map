import caminhos  # noqa: F401  (coloca app/ no sys.path)
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest
import sys

BASE = Path(__file__).resolve().parents[2] / 'app'
sys.path.insert(0, str(BASE))
spec = importlib.util.spec_from_file_location('history_archive', BASE / 'history_archive.py')
archive = importlib.util.module_from_spec(spec)
spec.loader.exec_module(archive)


class HistoryArchiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = archive.build_archive(BASE)
        cls.records = {r['id']: r for r in cls.data['records']}
        cls.sections = {s['id']: s for s in cls.data['sections']}

    def test_all_authored_places_are_linked_once(self):
        self.assertEqual(self.data['warnings'], [])
        self.assertEqual(len(self.records), len(self.data['records']))
        for kind, count in [('state', 19), ('province', 67), ('city', 152)]:
            self.assertEqual(sum(r['kind'] == kind for r in self.records.values()), count)
        world = json.loads((BASE / 'dist/world.json').read_text(encoding='utf-8'))
        self.assertEqual({r['target']['id'] for r in self.records.values() if r['kind'] == 'city'},
                         {b['i'] for b in world['cities'] if not b.get('excluded')})

    def test_duplicate_gugacon_is_disambiguated_by_state(self):
        a, b = self.records['city:33'], self.records['city:14']
        self.assertEqual((a['stateId'], b['stateId']), (12, 47))
        self.assertNotEqual(a['sections'], b['sections'])

    def test_chronology_preserves_uncertainty_and_eras(self):
        events = self.data['events']
        self.assertEqual(len(events), 38)
        self.assertEqual({e['era'] for e in events}, {1, 2, 3, 4})
        self.assertTrue(all(e['date'] == 'Tempo mítico' for e in events if e['era'] == 1))
        self.assertTrue(any(e['date'].startswith('c.') for e in events))
        self.assertTrue(any(e['date'] == '1277 AQD' for e in events))
        independent = next(e for e in events if e['title'].startswith('Independência reconhecida'))
        self.assertIn('city:33', independent['links'])
        self.assertNotIn('city:14', independent['links'])
        # The word "draconata" alone must not manufacture a Drácon map link.
        self.assertNotIn('state:20', independent['links'])

    def test_technical_appendices_are_not_world_narrative(self):
        world = self.records['world']
        self.assertTrue(all(self.sections[key]['line'] < 760 for key in world['sections']))
        self.assertTrue(all(self.sections[key]['line'] >= 760 for key in self.records['appendices']['sections']))

    def test_all_text_is_preserved_in_sections(self):
        for key, name in archive.FILES.items():
            text = (BASE / 'historic_archives' / name).read_text(encoding='utf-8-sig')
            rebuilt = ''.join(s['markdown'] for s in self.data['sections'] if s['document'] == key)
            for line in text.splitlines():
                if line.strip() and not line.startswith('#'):
                    self.assertIn(line, rebuilt)

    def test_refresh_reads_changed_markdown_without_baking_map(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / 'historic_archives').mkdir()
            (folder / 'dist').mkdir()
            for name in archive.FILES.values():
                shutil.copy2(BASE / 'historic_archives' / name, folder / 'historic_archives' / name)
            for name in ['world.json', 'province-proposal.json']:
                shutil.copy2(BASE / 'dist' / name, folder / 'dist' / name)
            source = folder / 'historic_archives' / archive.FILES['places']
            source.write_text(source.read_text(encoding='utf-8') + '\nUm novo registro de memória.\n', encoding='utf-8')
            updated = archive.build_archive(folder)
            self.assertNotEqual(updated['revision'], self.data['revision'])
            self.assertIn('Um novo registro de memória.', '\n'.join(s['markdown'] for s in updated['sections']))
            self.assertEqual((folder / 'dist/world.json').read_bytes(), (BASE / 'dist/world.json').read_bytes())

    def test_state_reading_has_only_its_narrative_not_place_directories(self):
        for record in self.records.values():
            if record['kind'] != 'state':
                continue
            self.assertTrue(record['chapters'], record['name'])
            for section_id in record['chapters']:
                section = self.sections[section_id]
                self.assertFalse(section['title'].startswith(('Cidade:', 'Província:')))
                self.assertFalse(section['displayHidden'])
                self.assertNotIn('OBSERVAÇÃO EDITORIAL', section['displayTitle'])
        elucitor = self.records['state:13']
        text = '\n'.join(self.sections[i]['displayMarkdown'] for i in elucitor['chapters'])
        self.assertIn('Lucius Lucien', text)
        self.assertNotIn('Localização e perfil:', text)
        self.assertNotIn('Referência administrativa do Atlas', elucitor['intro'])

    def test_city_and_province_do_not_inherit_each_others_directory(self):
        for record in self.records.values():
            if record['kind'] not in ('city', 'province'):
                continue
            for section_id in record['chapters']:
                section = self.sections[section_id]
                if section['title'].startswith(('Cidade:', 'Província:')):
                    self.assertIn(section_id, record['sections'])

    def test_local_chronology_is_interactive_without_invented_dates(self):
        timeline = self.records['state:12']['timeline']
        local = [event for event in timeline if event.get('local')]
        self.assertGreater(len(local), 10)
        self.assertTrue(any(e['date'] == 'Era dos impérios' for e in local))
        self.assertTrue(any('Rodrick' in e['title'] for e in local))
        self.assertTrue(self.records['state:17']['timeline'])

    def test_player_prose_removes_drafting_notes_but_preserves_mysteries(self):
        from history_presentation import clean_prose, hidden_title
        self.assertTrue(hidden_title('XVI. GRAFIAS OFICIAIS E INFORMAÇÕES A CONFIRMAR'))
        self.assertTrue(hidden_title('3. A DEFINIR'))
        text = clean_prose('Arthur foi educado em Winterhelm [nome a confirmar]. O destino de Brutus permanece um mistério.\n\nNota a confirmar: escolher o nome.\n\nConsultar o arquivo `example.md`.')
        self.assertIn('Arthur foi educado em Winterhelm', text)
        self.assertIn('O destino de Brutus permanece um mistério.', text)
        self.assertNotIn('a confirmar', text)
        self.assertNotIn('example.md', text)


if __name__ == '__main__':
    unittest.main()
