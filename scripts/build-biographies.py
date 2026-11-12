#!/usr/bin/env python3
"""Publish explicitly reviewed character profiles without generating prose.

Earlier drafts split short resumes on commas to fill three sentences. That can
turn subordinate clauses into apparently complete but meaningless sentences.
All records are now authored in material/biographies-editorial.json: additions
must supply three reviewed sentences and sources before this build succeeds.
"""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
read = lambda path: json.loads((ROOT / path).read_text())
editorial = read('material/biographies-editorial.json')
operators = read('dist/operators.json')['operators']
people, aliases = editorial['people'], editorial['aliases']
for operator in operators:
    profile = people.get(operator['name'])
    if not profile:
        raise ValueError('A reviewed biography is required: ' + operator['name'])
    if profile.get('operatorId') != operator['id']:
        raise ValueError('Operator identity mismatch: ' + operator['name'])
for name, profile in people.items():
    sentences = profile.get('sentences', [])
    if len(sentences) != 3 or any(not s.strip() for s in sentences):
        raise ValueError('Three authored sentences are required: ' + name)
    if len(set(sentences)) != 3:
        raise ValueError('Duplicate sentences: ' + name)
    if not profile.get('sources'):
        raise ValueError('Sources are required: ' + name)
for alias, name in aliases.items():
    if alias in people or name not in people:
        raise ValueError('Conflicting or unresolved alias: ' + alias)
    if alias not in people[name].get('aliases', []):
        raise ValueError('Alias missing from target profile: ' + alias)
result = {key: editorial[key] for key in ('checked', 'sourceSnapshot', 'policy')}
result.update(people=people, aliases=aliases)
(ROOT / 'dist/biographies.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(f'{len(people)} canonical profiles, {len(aliases)} aliases')
