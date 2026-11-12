# -*- coding: utf-8 -*-
import json,datetime,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
read=lambda p:json.loads(pathlib.Path(p).read_text())
snapshot=read(root/'material/event-source-snapshot.json')
reviews={v['id']:v for v in snapshot['reviews']};retros=snapshot['retroActList'];index=read(root/'material/event-line-index.json')
# A refresh is an explicit, reproducible source audit, never merely today's clock.
cutoff=snapshot['cutoff'];checked=snapshot['checked']
refresh=read(root/'material/event-refresh-2026-11-12-audit.json')
announcements={v['eventId']:v for v in refresh['announcements']}
base='https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/excel/'
sources=[{'title':'官方 · 曲谱系统内容前瞻','url':'https://www.bilibili.com/opus/1052289926969688064'},{'title':'BWIKI · 曲谱索引','url':index['source']},{'title':'游戏回顾表（公开镜像）','url':base+'story_review_table.json'},{'title':'游戏常驻表（公开镜像）','url':base+'retro_table.json'}]
# Editorial destinations are separate from the game's story-line membership.
cats=[('babel','巴别塔','组织',None,'《方舟》的主题入口：从巴别塔的往事，到罗德岛承接的旅途。此为本站归类，不表示后续事件仍由巴别塔组织主导。'),('rhodes','罗德岛','组织',None,'医疗组织、干员旅途与巴别塔之后的故事。'),('rhine','莱茵生命','组织',None,'科研、伦理和探索未来的愿望，串起哥伦比亚的科技故事。'),('karlan','喀兰贸易','组织',None,'谢拉格故事中的重要组织；不与谢拉格这个国家等同。'),('abyssal','深海猎人','组织',None,'海洋系列的重要角色群体，故事横跨陆地与深海。'),('penguin','企鹅物流','组织',None,'从龙门的日常任务，到与叙拉古往事的交汇。'),('blacksteel','黑钢国际','组织',None,'杰西卡等人的选择与哥伦比亚边疆冲突。'),('reunion','整合运动','组织',None,'感染者处境与乌萨斯相关叙事中的重要力量。'),('dublinn','深池','组织',None,'与塔拉命运相连的组织；并非塔拉地区的同义词。'),('urs us'.replace(' ',''),'乌萨斯','国家／地区','ursus','学生、感染者与帝国之下的生活。'),('laterano','拉特兰','国家／地区','laterano','信仰、律法、共同体与离开圣城的人们。'),('kjerag','谢拉格','国家／地区','kjerag','风雪过境、银心湖列车与雪山降临1101：圣山、传统与现代化的连续叙事。'),('siracusa','叙拉古','国家／地区','siracusa','家族、城市与新秩序的故事。'),('kazimierz','卡西米尔','国家／地区','kazimierz','竞技骑士、感染者和商业秩序的碰撞。'),('yan','炎','国家／地区','yan','岁与人间的相遇，以及各地生活和边疆故事。'),('columbia','哥伦比亚','国家／地区','columbia','科研机构、拓荒城市与现代社会的矛盾。'),('aegir','阿戈尔','国家／地区','aegir','深海文明的视角，与伊比利亚海岸的故事相互关联。'),('iberia','伊比利亚','国家／地区','iberia','海岸聚落、审判庭与旧日航海文明。'),('leithanien','莱塔尼亚','国家／地区','leithanien','从边地城镇到双塔之下，音乐与权力相互牵动。'),('tara','塔拉','国家／地区','victoria','以塔拉人的身份、聚落与未来为主题，保留维多利亚背景。'),('victoria','维多利亚','国家／地区','victoria','主线之外的乡镇、边境与地方社会。'),('sargon','萨尔贡','国家／地区','sargon','雨林、沙漠与历史遗迹中的不同故事。'),('durin','杜林','国家／地区','durin','地下城市与居民的生活。'),('bolivar','玻利瓦尔','国家／地区','bolivar','多索雷斯与更广阔土地上的历史和人们。'),('siesta','汐斯塔','国家／地区',None,'音乐节、火山与迁徙之后的度假城市。'),('higashi','东','国家／地区','higashi','围绕当地城市与文化展开的活动。'),('rim','雷姆必拓','国家／地区','rim','矿业、荒野与公路串联的聚落。'),('sami','萨米','国家／地区','sami','北方森林及其居民的故事。'),('kazdel','卡兹戴尔','国家／地区','kazdel','萨卡兹的故乡，以及离乡者和重建者的经历。'),('minos','米诺斯','国家／地区','minos','英雄传统与舞台叙事。'),('cross','多地见闻','跨地区',None,'多篇、多地或尚不能归入单一国家的故事。不是一个行政地区。')]
categories=[dict(id=i,name=n,kind=k,region=r,description=d) for i,n,k,r,d in cats]
linegroups={'RL':('babel',['rhodes']),'UR':('ursus',[]),'LA':('laterano',[]),'KJ':('kjerag',['karlan']),'SI':('siracusa',[]),'KA':('kazimierz',[]),'SU':('yan',[]),'RH':('columbia',['rhine']),'AE':('aegir',['iberia','abyssal']),'LE':('leithanien',[]),'TA':('tara',['victoria','dublinn']),'ST':('cross',[]),'TS':('cross',[]),'SUP':('bolivar',[]),'COLLAB':('cross',[])}
# Short original reading introductions, not reproduced story dialogue.
notes={
'生于黑夜':'从萨卡兹佣兵的经历切入，连接巴别塔的往事与后来主线中的人物。','遗尘漫步':'跟随凯尔希跨越不同国家的足迹，认识罗德岛之前的漫长旅途。','如我所见':'从不同人物的视角补充罗德岛及这片大地的经历。','巴别塔':'围绕特蕾西娅、博士与凯尔希，回看巴别塔时期的相遇与选择。','追迹日落以西':'从罗德岛干员的旅途延伸出去，继续追问大地、历史与未来。','我们明日见':'以重逢和告别的不同侧面，补充罗德岛相关人物的故事。',
'乌萨斯的孩子们':'切尔诺伯格事件之后，乌萨斯学生在创伤中寻找继续生活的方法。','人们，我们':'接续乌萨斯学生相关叙事，关注个人与共同体的联系。','吾导先路':'围绕拉特兰的会议与故人重逢，展开信仰、法律和身份的冲突。','空想花庭':'一座移动修道院中的共同生活，考验着不同族群彼此接纳的可能。','众生行记':'继续拉特兰系列对信仰、制度与众生处境的讨论。',
'风雪过境':'博士到访谢拉格，置身三族、圣山与改革力量之间的角力。','银心湖列车':'一趟列车之旅，将谢拉格的开放、外交与本地社会连接起来。','雪山降临1101':'谢拉格系列继续前进，技术建设与圣山传统共同面对变革。','叙拉古人':'德克萨斯重返故乡，家族恩怨与新城市的愿景相互交织。','揭幕者们':'在叙拉古新旧秩序的变化中，继续观察人们与家族的选择。','十字路口':'补充叙拉古相关人物在不同道路之间的抉择。',
'玛莉娅·临光':'玛莉娅走进竞技场，直面骑士理想与商业规则之间的距离。','红松林':'从感染者骑士的视角，补全卡西米尔竞技体系之外的生存处境。','长夜临光':'玛嘉烈归来之后，竞技舞台、感染者与骑士传统迎来冲突。','日暮寻路':'延伸卡西米尔相关人物离开竞技舞台之后的经历。','洪炉示岁':'新年中的数段相遇，开启岁系列与人间生活的联系。','画中人':'进入夕的画中世界，在虚实之间看见岁与人的关系。','将进酒':'尚蜀的市井与江湖风波，牵出岁系列的另一段相遇。','登临意':'玉门边关的旧事与当下相遇，将视线转向炎国边疆。','春分':'在炎国乡野的行路与相遇中，补充普通人的命运。','怀黍离':'以田地、农业与生活为切入点，继续岁与人间的故事。','相见欢':'围绕厨艺与团聚展开，延续岁家族与人间烟火的联系。','镜中集':'以短篇形式补充炎国与岁系列的人物见闻。','辞岁行':'岁系列的新一段旅途，继续连接家族与人间。',
'孤岛风云':'一场监狱中的营救，牵出哥伦比亚企业利益与莱茵生命相关人物。','绿野幻梦':'实验与科研伦理交织，聚焦莱茵生命内部的分歧。','孤星':'围绕特里蒙与探索天空的计划，汇集科学家的理想和代价。','未许之地':'延伸哥伦比亚与科研系列，继续追问未来由谁决定。','骑兵与猎人':'格拉尼在维多利亚乡村的任务与斯卡蒂相交，是海洋系列的早期连接点。','覆潮之下':'伊比利亚海岸的聚落中，深海猎人追寻来自海洋的异变。','愚人号':'旧日巨舰、伊比利亚的航海历史与海嗣威胁在海上交汇。','生路':'将视线深入海洋文明，继续阿戈尔与深海猎人的故事。','出苍白海':'沿着海洋系列继续前行，呈现海岸与海中世界的关联。','沃伦姆德的薄暮':'莱塔尼亚边地城镇中的灾难与疑团，牵动感染者和居民之间的裂痕。','尘影余音':'在维谢海姆，音乐、身份与被压迫者的生活相互交织。','崔林特尔梅之金':'来到双塔之城，走近莱塔尼亚权力更替与音乐传统。','照我以火':'苇草与塔拉居民寻找生存之路，重新理解领袖与归属。','挽歌燃烧殆尽':'继续塔拉与维多利亚的故事，追索旧秩序留下的创伤。',
'火蓝之心':'汐斯塔音乐节的热闹背后，是火山危机与城市未来。','密林悍将归来':'嘉维尔回到阿卡胡拉，在雨林部族的重逢中面对新的变化。','多索雷斯假日':'陈与伙伴来到玻利瓦尔的度假城市，卷入竞赛与当地政治。','理想城：长夏狂欢季':'杜林地下城市的夏日生活，与来自地上的访客发生交集。','火山旅梦':'在迁徙之后的汐斯塔，跟随艾雅法拉面对记忆、亲情与旅途。','太阳甩在身后':'深入萨尔贡的沙地与遗迹，从地方故事中观察历史。','墟':'来到东的不夜街区，寻找城市繁华与旧日遗痕之间的联系。','直到大地变成一颗酸橙':'雷姆必拓的公路连接不同聚落，安洁莉娜与同行者各自寻找旅途的终点。','喧闹法则':'企鹅物流在龙门的夜晚卷入一连串追逐与冲突。','不义之财':'杰西卡与黑钢相关人物在哥伦比亚边疆面对雇佣关系与个人选择。','红丝绒':'从舞台和影像的视角展开维多利亚相关故事。','雅赛努斯复仇记':'米诺斯的戏剧与英雄传统，为故事提供新的舞台。','战地秘闻':'数段任务见闻从不同角度展现罗德岛干员的生活。','午间逸话':'短篇合集，透过任务与闲暇时刻认识干员。','踏寻往昔之风':'不同人物与旧事相遇，组成跨地区的短篇见闻。','此地之外':'围绕离乡、旅行与日常相遇展开的短篇合集。','灯火序曲':'从多个人物的片段观察这片大地，不视为单一地区的连续行程。','阴云火花':'维多利亚相关人物的短篇故事，在平常生活中埋下新的变化。','未尽篇章':'补全不同地区人物尚未说完的故事。','眠于树影之中':'北方森林的见闻，将视线引向萨米。','去咧嘴谷':'雷姆必拓荒野中的旅途，聚焦当地居民与行路者。','熔炉“还魂”记':'在卡兹戴尔的生活与重建中，寻找萨卡兹的另一面。','丛林症结':'围绕玻利瓦尔历史与人物记忆展开的故事集。',
'源石尘行动':'彩虹小队来到萨尔贡，与当地居民和罗德岛共同面对危机。','水晶箭行动':'彩虹六号联动的后续故事，舞台来到玻利瓦尔的多索雷斯。','无忧梦呓':'在维多利亚的森林与梦城堡中，联动人物的音乐和梦境与泰拉相遇。'}
overrides={'骑兵与猎人':('victoria',['abyssal','aegir']),'火蓝之心':('siesta',[]),'火山旅梦':('siesta',[]),'密林悍将归来':('sargon',[]),'多索雷斯假日':('bolivar',['yan']),'理想城：长夏狂欢季':('durin',['sargon']),'太阳甩在身后':('sargon',[]),'墟':('higashi',[]),'直到大地变成一颗酸橙':('rim',[]),'喧闹法则':('penguin',['yan']),'不义之财':('blacksteel',['columbia']),'红丝绒':('victoria',[]),'雅赛努斯复仇记':('minos',[]),'阴云火花':('victoria',[]),'眠于树影之中':('sami',[]),'去咧嘴谷':('rim',[]),'熔炉“还魂”记':('kazdel',[]),'源石尘行动':('sargon',['rhodes']),'水晶箭行动':('bolivar',[]),'无忧梦呓':('victoria',[])}
related={'生于黑夜':['kazdel'],'巴别塔':['kazdel'],'遗尘漫步':['sargon','ursus','victoria'],'叙拉古人':['penguin'],'覆潮之下':['iberia','abyssal'],'愚人号':['iberia','abyssal'],'吾导先路':[]}

# Original geographic audit, 2026-09-19; availability refreshed separately. Story region is not inferred solely from its series.
audited={'遗尘漫步': {'summary': '沿着凯尔希跨越萨尔贡、乌萨斯和维多利亚的往事，回望不同时代的冲突与抉择。', 'urls': ['https://wiki.biligame.com/arknights/遗尘漫步']}, '追迹日落以西': {'related': ['victoria'], 'summary': '战后的伦蒂尼姆迎来新的抉择，维娜与格拉斯哥帮重新面对故乡及其未来。', 'script': 'activities/act37side/level_act37side_st01'}, '红丝绒': {'primary': 'columbia', 'related': ['victoria'], 'summary': '蓝卡坞的电影拍摄与猩红剧团的旧事交织，卢西恩走向舞台背后的复仇与真相。', 'script': 'activities/act43side/level_act43side_st01', 'urls': ['https://wiki.biligame.com/arknights/蒂比']}, '雅赛努斯复仇记': {'related': ['sargon'], 'summary': '萨尔贡使节抵达米诺斯城邦雅赛努斯，文物归还与一出戏剧触动战争留下的记忆。', 'script': 'activities/act48side/level_act48side_st01'}, '眠于树影之中': {'related': ['ursus', 'columbia', 'rhine'], 'summary': '麦哲伦从北方科考线走入萨米，在提丰与当地人的引领下接近森林和冰原的秘密。', 'script': 'activities/act15mini/level_act15mini_st02', 'urls': ['https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/story/activities/act15mini/level_act15mini_st01.txt']}, '覆潮之下': {'primary': 'iberia', 'related': ['aegir', 'abyssal'], 'urls': ['https://wiki.biligame.com/arknights/覆潮之下']}, '愚人号': {'primary': 'iberia', 'related': ['aegir', 'abyssal'], 'urls': ['https://wiki.biligame.com/arknights/愚人号']}, '出苍白海': {'primary': 'iberia', 'related': ['aegir'], 'summary': '伊比利亚盐漠中的居民与海盗踏上旅程，重新面对黄金时代的遗产与被禁忌的大海。', 'script': 'activities/act39side/level_act39side_st01', 'urls': ['https://wiki.biligame.com/arknights/出苍白海']}, '熔炉“还魂”记': {'summary': '卡兹戴尔的魂灵熔炉发生异动，妮芙与伙伴寻找意外离开熔炉的先祖魂灵。', 'script': 'activities/act17mini/level_act17mini_st01'}, '人们，我们': {'summary': '圣骏堡的学生与帝国秩序发生冲突，人们在共同的处境中寻找彼此的声音。', 'script': 'activities/act51side/level_act51side_st01'}, '丛林症结': {'summary': '从种植园里的相遇开始，吉莉安与洛伦茨被卷入玻利瓦尔的权力与生存困局。', 'script': 'activities/act21mini/level_act21mini_st01'}, '墟': {'summary': '东的地方社会与旧日遗迹成为新的舞台，人物在传承与变局之间作出选择。', 'script': 'activities/act44side/level_act44side_st01'}, '水晶箭行动': {'script': 'activities/act32side/level_act32side_st01'}, '源石尘行动': {'script': 'activities/act17d0/level_act17d0_01_beg'}, '无忧梦呓': {'script': 'activities/act45side/level_act45side_st01'}, '直到大地变成一颗酸橙': {'script': 'activities/act53side/level_act53side_st01'}}
for title,fix in audited.items():
 if 'summary' in fix:notes[title]=fix['summary']
 if 'primary' in fix:
  overrides[title]=(fix['primary'],fix.get('related',[]))
 elif 'related' in fix:related[title]=list(dict.fromkeys(related.get(title,[])+fix['related']))

# The source index has not established an official score for these new stories.
# Keep their editorial destinations distinct from official musical-line membership.
notes.update({
 '月行水上':'结城理与同伴意外来到拉特兰，在校园生活和志愿实践中认识这座圣城。',
 '昨日海':'伊比利亚与阿戈尔共同打捞沉没的港都，克莱门莎与当地居民面对黄金时代遗留的裂痕。',
 '时间啊，向前！':'圣骏堡政变后，乌萨斯的皇权、军队与民众发生激烈冲突。'
})
overrides.update({'月行水上':('laterano',[]),'昨日海':('iberia',['aegir'])})
linegroups['SUP_ACTIVITY']=('cross',[])
lines=[dict(id=l['id'],title=l['title'],events=l['events'],official=True) for l in index['lines']]
lines += [{'id':'SUP','title':'补充故事集','events':['丛林症结'],'official':False},{'id':'COLLAB','title':'可回顾的联动故事','events':['源石尘行动','水晶箭行动','无忧梦呓','月行水上'],'official':False},{'id':'SUP_ACTIVITY','title':'补充活动目录','events':['昨日海'],'official':False}]
byname={v['name']:v for v in reviews.values() if v['entryType'] in ['ACTIVITY','MINI_ACTIVITY']}
events=[]
for l in lines:
 for order,title in enumerate(l['events']):
  r=byname[title];assert 0<r['startShowTime']<=cutoff
  primary,tags=overrides.get(title,linegroups[l['id']]);tags=list(dict.fromkeys(tags+related.get(title,[])));tags=[t for t in tags if t!=primary]
  retro=next((v for v in retros.values() if r['id'] in v['linkedActId'] and v['startTime']<=cutoff),None)
  events.append(dict(id=r['id'],title=title,line=l['id'],lineTitle=l['title'],order=order,primary=primary,related=tags,summary=notes[title],basis=('依游戏曲谱回忆索引归入该乐章；' if l['official'] else '补充游戏回顾表已开放的条目；')+'国家／组织标签为本站按叙事重心整理，不等同于官方行政分类。',stageAvailable=bool(retro),retroId=retro['retroId'] if retro else None,reviewStart=r['startShowTime'],firstStart=r['startTime'],storyCount=r['storyCount'],collaboration=l['id']=='COLLAB',sources=[{'title':'BWIKI · 活动资料','url':'https://wiki.biligame.com/arknights/'+title},sources[2],sources[3]]))
for event in events:
 fix=audited.get(event['title'],{})
 urls=list(fix.get('urls',[]))
 if fix.get('script'):urls.append('https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/story/'+fix['script']+'.txt')
 known={s['url'] for s in event['sources']}
 event['sources'] += [dict(title='地理与主题复核来源',url=u) for u in urls if u not in known]
for event in events:
 notice=announcements.get(event['id'])
 if notice:event['sources'].append(dict(title='官方 · 活动开放公告',url=notice['url']))
 event['reviewAvailable']=True
 event['availability']='review'

# Official activity windows take precedence over review-table preload times.
activeEvents=[]
for eid,notice in announcements.items():
 r=reviews[eid]
 if not (notice['start']<=cutoff<=notice['end'] and r['startShowTime']>cutoff):continue
 assert eid=='act55side', 'New current activity needs an editorial/source audit'
 activeEvents.append(dict(id=eid,title=r['name'],primary='ursus',related=['reunion'],line='CURRENT',lineTitle='当前活动',order=0,summary=notes[r['name']],synopsis=['故事从费奥多尔逃离圣骏堡后的遭遇切入，展现中央军队溃败、内卫介入与皇权失势的局面。','塔露拉与重组的整合运动在围困与营救中，寻找感染者和普通人共同的未来。'],characters=['塔露拉','九','冻河','米拉娜'],start=notice['start'],end=notice['end'],exchangeEnd=notice['exchangeEnd'],reviewStart=r['startShowTime'],firstStart=notice['start'],storyCount=r['storyCount'],stageAvailable=False,reviewAvailable=False,availability='active',retroId=None,collaboration=False,basis='当前限时活动；尚未开放情报处理室回顾。地区与组织标签按剧情内容整理，未据此推定官方乐章归属。',sources=[dict(title='官方 · 活动开放公告',url=notice['url']),sources[2],dict(title='游戏原文 · 活动序章',url='https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/story/activities/act55side/level_act55side_st01.txt'),dict(title='游戏原文 · 主要人物与行动',url='https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/story/activities/act55side/level_act55side_01_beg.txt')]))

allowed={v['id'] for v in byname.values() if 0<v['startShowTime']<=cutoff}
assert allowed=={e['id'] for e in events},allowed-{e['id'] for e in events}
scope=f'截至核对日，国服情报处理室已到回顾开放时间的活动与故事集共{len(events)}项。13条乐章保留此前核验的曲谱索引；未核定官方乐章的新活动列入补充目录。当前限时活动单列，不计入已开放回顾数量。主线在“主线行迹”查看，集成战略、生息演算及干员密录不在本页范围。回顾仍受账号剧情解锁条件限制，联动旧剧情尤其不保证未参加账号可补解锁。'
active_ids={e['id'] for e in activeEvents}
data=dict(checked=checked,server='CN',scope=scope,sources=sources,categories=categories,lines=[{k:v for k,v in l.items() if k!='events'} for l in lines],events=events,activeEvents=activeEvents,excluded=[dict(id=v['id'],title=v['name'],reviewStart=v['startShowTime'],reviewScheduled=v['startShowTime']<4000000000,reason='回顾表仍为远期占位时间，当前未确认常驻开放。' if v['startShowTime']>=4000000000 else '尚未到剧情回顾开放时间。') for v in byname.values() if v['startShowTime']>cutoff and v['id'] not in active_ids])
(root/'dist/events.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
# The source snapshot is an input and retains its provenance metadata unchanged.
print(len(events),'events',sum(e['stageAvailable'] for e in events),'permanent stages',len(activeEvents),'current activities')
