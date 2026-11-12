"""Assemble reviewed local dictionaries. No translation service is contacted.

English/Japanese are editorial translations plus game-ID-aligned official names.
Traditional Chinese uses OpenCC (build-time only). Generated files are checked in.
Usage: python build-locales.py [--allow-incomplete]
"""
import argparse, json, pathlib, re
from opencc import OpenCC
ROOT = pathlib.Path(__file__).resolve().parent.parent
DEST = ROOT / 'dist/locales'
read = lambda p: json.loads(p.read_text())
args = argparse.ArgumentParser()
args.add_argument('--allow-incomplete', action='store_true', help='Development preview only; missing entries remain visible to the runtime audit.')
options = args.parse_args()
source = read(DEST / 'source.json')
files = sorted(DEST.glob('manual-*.json'))
# Official exact titles and names override provisional early drafts. Contextual
# sentences remain whole translations: names are never globally substituted.
priority = ['manual-terms.json', 'manual-title-terms.json', 'manual-corrections.json']
files = [f for f in files if f.name not in priority] + [DEST / f for f in priority if (DEST / f).exists()]
dictionaries = {'en': {}, 'ja': {}}
for file in files:
    for lang, entries in read(file).items():
        if lang in dictionaries:
            dictionaries[lang].update(entries)
# A final source review corrected four gendered sentences after the translation
# shards were frozen. Carry those reviewed translations to the corrected keys.
pronouns = ROOT / 'material/biographies-pronoun-patch.json'
if pronouns.exists():
    for old, new in read(pronouns).items():
        female = '她' in new
        for lang, entries in dictionaries.items():
            if old not in entries or new in entries:
                continue
            value = entries[old]
            if lang == 'en':
                pairs = {'he':'she', 'him':'her', 'his':'her', 'himself':'herself'} if female else {'she':'he', 'her':'his', 'hers':'his', 'herself':'himself'}
                value = re.sub(r'\b(' + '|'.join(pairs) + r')\b', lambda m: pairs[m[0].lower()].capitalize() if m[0][0].isupper() else pairs[m[0].lower()], value, flags=re.I)
            elif female:
                value = re.sub(r'彼(?=[はがをのに])', '彼女', value)
            else:
                value = value.replace('彼女', '彼')
            entries[new] = value
# Only explicitly reviewed proper-name spelling corrections are applied here.
# Never treat a title such as 'Lord of Fiends' as an operator-name replacement.
spelling = ROOT / 'material/i18n/confirmed-name-corrections.json'
if spelling.exists():
    for lang, changes in read(spelling)['replacements'].items():
        for key, value in dictionaries[lang].items():
            for old, new in changes.items():
                value = value.replace(old, new)
            dictionaries[lang][key] = value
missing = {lang: [s for s in source if s not in entries] for lang, entries in dictionaries.items()}
report = ROOT / 'material/i18n/build-missing.json'
report.write_text(json.dumps(missing, ensure_ascii=False, indent=2) + '\n')
for lang, entries in dictionaries.items():
    for key, value in entries.items():
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f'{lang}: empty translation: {key}')
        if sorted(re.findall(r'\{\d+\}', key)) != sorted(re.findall(r'\{\d+\}', value)):
            raise ValueError(f'{lang}: damaged interpolation: {key}')
        if re.search(r'<unk>|\[7\d{2}\]|▁|[\u0e00-\u0e7f]', value):
            raise ValueError(f'{lang}: unexpected draft token: {key}')
if any(missing.values()) and not options.allow_incomplete:
    raise SystemExit('Incomplete editorial translations: ' + ', '.join(f'{k}={len(v)}' for k,v in missing.items()))
for lang, entries in dictionaries.items():
    result = {key: entries[key] for key in source if key in entries}
    (DEST / f'{lang}.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(lang, len(result), '/', len(source), 'missing', len(missing[lang]))
converter = OpenCC('s2twp')
traditional = {key: converter.convert(key) for key in source}
# Autonyms and proper English spellings remain recognizable across all menus.
traditional.update({s:s for s in ['简体中文','繁體中文','English','日本語'] if s in source})
(DEST / 'zh-TW.json').write_text(json.dumps(traditional, ensure_ascii=False, indent=2) + '\n')
metadata = {
    'checked': '2026-11-12', 'sourceCount': len(source),
    'method': 'Editorial English/Japanese translations, official names and story titles aligned by stable game IDs; OpenCC s2twp for Traditional Chinese.',
    'sources': [f.name for f in files],
    'runtime': 'Checked-in static dictionaries. No external translation requests. Visitor nicknames and messages retain their original language.',
    'provisionalNames': 'provisional-names.json',
    'limitations': 'Translations are produced for this fan project, not endorsed by the game publisher. CN content without released EN/JP localization uses provisional site translations.',
    'complete': not any(missing.values())
}
(DEST / 'provenance.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
