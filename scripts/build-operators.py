# -*- coding: utf-8 -*-
import json,re,pathlib,urllib.request,urllib.parse,concurrent.futures,time,hashlib,subprocess
R=pathlib.Path(__file__).resolve().parent.parent; M=R/'material/operator-update';D=R/'dist'; load=lambda p:json.loads(p.read_text()); save=lambda p,x:p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
c=load(M/'character_table.json');h=load(M/'handbook_info_table.json')['handbookDict'];assets=load(D/'assets.json');tree={x['path'] for x in load(M/'image-tree.json')['tree']};api='https://wiki.biligame.com/arknights/api.php?'
def get(url):
 return subprocess.run(['curl','-fsSL','--retry','2','--max-time','40',url],check=True,capture_output=True).stdout
def wiki(params):return json.loads(get(api+urllib.parse.urlencode(dict(format='json',**params))))
ops=[];missing=[]
for k,v in c.items():
 if not k.startswith('char_') or v.get('isNotObtainable'):continue
 entries=h[k]['storyTextAudio']
 def story(title):
  for e in entries:
   if e['storyTitle']==title:
    for x in e['stories']:
     if not x.get('patchIdList') or k in x['patchIdList']:return re.sub('<[^>]+>','',x['storyText']).strip()
  return ''
 base=story('基础档案')
 def field(label):
  m=re.search('【'+label+'】([^\n]*)',base);return m.group(1).strip() if m else '档案未记载'
 bio=story('客观履历');brief=bio[:160]+('…' if len(bio)>160 else '')
 # Display the game's own archive field without inferring nationality or species.
 op=dict(id=k,name=v['name'],origin=field('出身地') if field('出身地')!='档案未记载' else field('产地'),race=field('种族'),sex=field('性别') if field('性别')!='档案未记载' else field('设定性别'),birthday=field('生日') if field('生日')!='档案未记载' else field('出厂日'),profession=v['profession'],rarity=int(v['rarity'].replace('TIER_','')),description=brief or '该角色的公开档案未提供客观履历。',source='https://wiki.biligame.com/arknights/'+urllib.parse.quote(v['name']),gameSource='https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/excel/handbook_info_table.json')
 op['originLabel']='出身地' if '【出身地】' in base else '产地'
 op['birthdayLabel']='生日' if '【生日】' in base else '出厂日'
 known=assets.get(v['name']) or assets.get(v['name']+'05.png')
 if known and (D/known['path']).exists():op['image']=known['path']
 else:missing.append(op)
 ops.append(op)
# Query exact named portrait files in small batches; prefer current BWIKI assets.
urls={}
for o in missing:
 file='头像_'+o['name']+'.png'; digest=hashlib.md5(file.encode()).hexdigest()
 urls[o['name']]='https://media.prts.wiki/'+digest[0]+'/'+digest[:2]+'/'+urllib.parse.quote(file)
def download(o):
 url=('https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avatars/'+o['id']+'.png') if 'avatars/'+o['id']+'.png' in tree else urls.get(o['name'])
 if not url and 'avatars/'+o['id']+'.png' in tree:url='https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avatars/'+o['id']+'.png'
 if not url:return (o['name'],'no verified portrait')
 try:
  data=get(url)
  if not data.startswith(b'\x89PNG'):return (o['name'],'not PNG')
  path='assets/operator-'+o['id']+'.png';(D/path).write_bytes(data);o['image']=path
  assets[o['name']]=dict(path=path,url=url,source=o['source'],checked='2026-11-08',rights='游戏素材归原权利人',identityEvidence='游戏角色表 '+o['id']+' 对应 '+o['name']+'；同名头像文件')
 except Exception as e:return (o['name'],str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:errors=[e for e in pool.map(download,missing) if e]
for o in ops:
 if o['name'] in ['塔露拉','冻河','国度','怒潮凛冬','奥尔佳','镜匠']:o['newEvent']='时间啊，向前！'
save(D/'operators.json',dict(checked='2026-11-08',cutoffEvent='时间啊，向前！',scope='国服可获得干员条目；异格分别列出，阿米娅职业升变不重复计数。出身地和种族遵循游戏基础档案原文；合作干员不等同于罗德岛正式雇员。',operators=ops));save(D/'assets.json',assets);save(M/'operator-image-errors.json',errors)
print('operators',len(ops),'portraits',sum('image'in x for x in ops),'errors',errors,flush=True)
