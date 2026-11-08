# -*- coding: utf-8 -*-
import json,re,pathlib,html,urllib.parse,subprocess,concurrent.futures,struct
R=pathlib.Path(__file__).resolve().parent.parent;M=R/'material/operator-update';D=R/'dist';read=lambda p:json.loads(p.read_text())
text=read(M/'npc-image-index.json')['parse']['text']['*'];aliases=read(D/'portrait-aliases.json');assets=read(D/'assets.json')
rows=re.split(r'<tr>\s*\n<td>',text)[1:];plans=[];unmatched=[]
extra={'Mantra':'曼特拉','卡门':'卡门','贝纳尔多':'贝纳尔多','维特':'伊斯拉姆·维特','费奥多尔':'费奥多尔','炎国皇帝':'真龙','萨米':'萨米','斯韦特兰纳':'斯韦特兰纳','格特鲁德·斯特罗洛':'格特鲁德','阿利斯泰尔二世':'阿利斯泰尔'}
for name in aliases['missing']:
 if assets.get(name) or assets.get(name+'05.png'):continue
 needle=extra.get(name,name)
 found=[]
 for row in rows:
  label=html.unescape(re.sub('<[^>]+>','',row.split('</td>',1)[0])).strip()
  if needle in label:
   imgs=re.findall(r'<img[^>]+src="([^"]+)"[^>]*',row)
   for url in imgs:
    if 'Avg_' in url or 'avg_' in url:
     thumbnail=html.unescape(url);url=thumbnail.split('?')[0]
     if '/thumb/' in url:url=url.replace('/thumb/','/').rsplit('/',1)[0]
     found.append(dict(name=name,label=label,url=url,thumbnail=thumbnail,file=urllib.parse.unquote(url.rsplit('/',1)[1])));break
 if found:plans.append(found[0])
 else:unmatched.append(name)
(M/'npc-portrait-plan.json').write_text(json.dumps(dict(matches=plans,unmatched=unmatched),ensure_ascii=False,indent=2))
print('matches',[(p['name'],p['label'],p['file']) for p in plans]);print('unmatched',unmatched)

from PIL import Image
import io
errors=[]
def download(p):
 try:
  b=subprocess.run(['curl','-fsSL','--retry','2','--max-time','60',p.get('thumbnail',p['url'])],capture_output=True,check=True).stdout
  im=Image.open(io.BytesIO(b)).convert('RGBA');box=im.getbbox();path='assets/npc-'+p['name']+'.png';(D/path).write_bytes(b)
  x,y,x2,y2=box;w=x2-x;h=y2-y
  assets[p['name']]=dict(path=path,url=p.get('thumbnail',p['url']),source='https://prts.wiki/w/剧情角色一览',checked='2026-11-08',dimensions=list(im.size),focusBox=[x,y,w,min(h,w*1.25)],identityEvidence=p['label']+' → '+p['file'],rights='明日方舟原始剧情素材；PRTS仅作为图像托管与文件名索引')
 except Exception as e:errors.append([p['name'],str(e)])
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:list(pool.map(download,plans))
for name,target in {'Mantra':'真言','费奥多尔':'冻河','斯乔帕':'维伊','别乔克':'折桠'}.items():
 if target in assets:assets[name]=dict(assets[target],identityEvidence='同一人物的代号：'+target+'；游戏角色档案')
(M/'npc-image-errors.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2))
(D/'assets.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n')
print('download errors',errors,flush=True)
