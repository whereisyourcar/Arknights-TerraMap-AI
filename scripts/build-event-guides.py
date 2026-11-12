"""Merge the separately reviewed activity guides into the generated catalogue."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
read=lambda p:json.loads(p.read_text())
catalog=read(root/'dist/events.json')
biographies=read(root/'dist/biographies.json')
known=set(biographies['people'])|set(biographies.get('aliases',{}))
guides={}
for suffix in ['a','b','new']:
 path=root/f'material/events-enrichment-{suffix}.json'
 if path.exists():
  entries=read(path)
  assert not guides.keys()&entries.keys(),f'Duplicate guide IDs in {suffix}'
  guides.update(entries)
for event in catalog['events']:
 assert event['id'] in guides,f'Missing guide: {event["title"]}'
 guide=guides[event['id']]
 assert len(guide['synopsis'])==2 and all(len(x)>15 for x in guide['synopsis']),event['title']
 assert guide['characters'] and len(guide['characters'])<=4,event['title']
 assert set(guide['characters'])<=known,(event['title'],set(guide['characters'])-known)
 assert guide['sources'] and all(s['url'].startswith('https://') for s in guide['sources'])
 event.update(synopsis=guide['synopsis'],characters=guide['characters'])
 sources={s['url']:s for s in event['sources']+guide['sources']}
 event['sources']=list(sources.values())
catalog['guideChecked']='2026-11-12'
(root/'dist/events.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
print('Enriched',len(catalog['events']),'activity stories')
