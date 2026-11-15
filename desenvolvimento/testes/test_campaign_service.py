"""Run: python -m unittest desenvolvimento/testes/test_campaign_service.py"""
import json
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / 'app'))
from campaign_service import (
    CampaignInputError, CampaignConflict, clean, create_campaign, delete_campaign,
    list_campaigns, read_campaign, update_campaign, folder,
)


class CampaignServiceTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.temp.name)
        self.sample = {
            'title': 'Crônicas de Dragonfall', 'year': '1277 AQD',
            'party': {'name': 'Grupo de aventureiros', 'journeyPartyId': '', 'members': []},
            'npcs': [], 'events': []
        }

    def tearDown(self):
        self.temp.cleanup()

    def test_roundtrip_and_backups(self):
        created = create_campaign(self.root, self.sample)
        self.assertEqual(len(list_campaigns(self.root)['campaigns']), 1)
        self.assertEqual(read_campaign(self.root, created['id'])['title'], self.sample['title'])
        content = dict(created)
        content['events'] = [{'id': 'session-1', 'title': 'A chegada', 'when': '1277 AQD', 'body': 'Começo da história.'}]
        saved = update_campaign(self.root, created['id'], content, created['_revision'])
        self.assertEqual(len(saved['events']), 1)
        self.assertNotEqual(saved['_revision'], created['_revision'])
        with self.assertRaises(CampaignConflict):
            update_campaign(self.root, created['id'], content, created['_revision'])
        archived = delete_campaign(self.root, created['id'], saved['_revision'])
        self.assertTrue((folder(self.root) / archived['backup']).is_file())
        self.assertEqual(len(list_campaigns(self.root)['campaigns']), 0)
        self.assertEqual(len(list((folder(self.root)/'.backups'/created['id']).glob('*.json'))), 2)

    def test_external_edits_detected(self):
        created = create_campaign(self.root, self.sample)
        document = folder(self.root) / f"{created['id']}.json"
        old = created['_revision']
        outside = json.loads(document.read_text(encoding='utf-8'))
        outside['title'] = 'Outro nome escrito no editor externo'
        document.write_text(json.dumps(outside, ensure_ascii=False), encoding='utf-8')
        reread = read_campaign(self.root, created['id'])
        self.assertNotEqual(old, reread['_revision'])
        self.assertEqual(reread['title'], outside['title'])
        with self.assertRaises(CampaignConflict):
            update_campaign(self.root, created['id'], created, old)

    def test_validation_rejects_bad_payloads(self):
        with self.assertRaises(CampaignInputError):
            clean({**self.sample, 'id': '../arquivo'})
        with self.assertRaises(CampaignInputError):
            clean({**self.sample, 'id': 'ok', 'events': [{'id':'e','title':'x'}] * 2})
        with self.assertRaises(CampaignInputError):
            clean({**self.sample, 'id': 'ok', 'npcs': [{'id':'p','name':'NPC'}] * 2})


if __name__ == '__main__':
    unittest.main()
