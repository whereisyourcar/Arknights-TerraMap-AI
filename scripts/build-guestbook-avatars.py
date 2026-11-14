"""Legacy v0.9 vector drafts. Current avatars are illustrated WebP files;
see prepare-guestbook-avatars.cjs and material/guestbook-art-v2 instead.
This script only regenerates the archived SVGs, not the current artwork.
"""
from pathlib import Path
P=Path(__file__).resolve().parent.parent/'dist/assets/guestbook'
characters=[
 ('amiya','阿米娅','#765040','#59c5d6','#283f54','bunny'),('kaltsit','凯尔希','#d8e4d9','#6fb684','#234940','cat'),('chen','陈','#345680','#df635c','#293a54','dragon'),('texas','德克萨斯','#43485a','#d9a36d','#29313d','wolf'),('exusiai','能天使','#b74b3b','#e3a566','#3c4151','angel'),('skadi','斯卡蒂','#dddbe5','#cc4b65','#32283d','hat'),('silverash','银灰','#c8d2d8','#92aacc','#334956','cat'),('surtr','史尔特尔','#a7343f','#e7894d','#38303e','horn'),('eyjafjalla','艾雅法拉','#936451','#aa798b','#46333f','sheep'),('w','W','#eee7df','#dc585b','#3e3541','horn')]
for id,name,hair,eye,coat,kind in characters:
 ears=''
 if kind=='bunny':ears=f'<path d="M45 48Q24 6 36 6Q50 8 54 43M68 43Q72 3 85 7Q93 14 78 49" fill="{hair}" stroke="#202d35" stroke-width="3"/><path d="M42 19L49 43M79 20L74 41" stroke="#d09c86" stroke-width="5" stroke-linecap="round"/>'
 if kind in ['cat','wolf']:ears=f'<path d="M33 48L27 17L52 34M76 34L101 17L95 50" fill="{hair}" stroke="#202d35" stroke-width="3"/><path d="M33 26L38 43L48 36M81 36L91 43L95 26" fill="#cc9693"/>'
 if kind in ['horn','dragon']:ears='<path d="M39 39Q20 34 28 15Q29 31 46 30M81 30Q97 31 99 14Q109 35 89 40" fill="#4d4650" stroke="#202d35" stroke-width="3"/>'
 if kind=='sheep':ears='<path d="M38 38C9 22 13 58 35 49M90 38C119 22 115 58 93 49" fill="none" stroke="#533f40" stroke-width="12"/><path d="M29 33C14 32 24 46 31 44M99 33C114 32 104 46 97 44" fill="none" stroke="#b38b68" stroke-width="4"/>'
 halo='<ellipse cx="64" cy="17" rx="26" ry="6" fill="none" stroke="#f6d58a" stroke-width="4"/>' if kind=='angel' else ''
 cap='<path d="M23 39L36 15Q65 9 89 17L105 41Z" fill="#3d2d45" stroke="#202d35" stroke-width="3"/><path d="M19 40Q64 28 109 40L108 49Q64 38 20 49Z" fill="#6b4053"/><path d="M59 20L65 15L72 21L65 29Z" fill="#d4b675"/>' if kind=='hat' else ''
 fringe=f'<path d="M33 61Q22 32 47 30Q72 17 92 39L99 66L82 52L75 40L71 56L55 45L42 59Z" fill="{hair}" stroke="#202d35" stroke-width="2.5" stroke-linejoin="round"/>'
 hairback=f'<path d="M30 54Q26 20 63 27Q99 23 99 58L107 112L91 109L86 89L42 90L35 114L22 108Z" fill="{hair}" stroke="#202d35" stroke-width="3"/>'
 if id=='w':fringe+='<path d="M76 31L93 39L85 57L72 46Z" fill="#bf4852"/>'
 accessory='<path d="M52 111L64 98L77 111L64 123Z" fill="#68bacc"/>' if id=='amiya' else '<path d="M49 105L64 112L79 105" stroke="#d1b879" stroke-width="3" fill="none"/>'
 if id=='texas':accessory+='<path d="M80 77L98 74" stroke="#d2af83" stroke-width="3"/>'
 art=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img"><title>{name} · 原创Q版同人头像</title><defs><clipPath id="clip"><circle cx="64" cy="64" r="62"/></clipPath><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#233e4b"/><stop offset="1" stop-color="#15212c"/></linearGradient></defs><circle cx="64" cy="64" r="63" fill="url(#bg)"/><g clip-path="url(#clip)"><path d="M8 95L111 11M18 121L120 20" stroke="{eye}" opacity=".13" stroke-width="13"/>{halo}{ears}{hairback}<path d="M29 128Q27 93 48 93L79 93Q103 96 101 128" fill="{coat}" stroke="#202d35" stroke-width="3"/><path d="M54 85V100L64 107L75 100V85" fill="#edc5ad"/>{accessory}<ellipse cx="64" cy="63" rx="31" ry="32" fill="#f3d9c5" stroke="#202d35" stroke-width="2.5"/>{fringe}<path d="M39 63Q46 58 54 63M74 63Q82 58 89 63" fill="none" stroke="#393341" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="47" cy="69" rx="6" ry="8" fill="{eye}"/><ellipse cx="81" cy="69" rx="6" ry="8" fill="{eye}"/><ellipse cx="48" cy="68" rx="2.7" ry="5" fill="#25303a"/><ellipse cx="80" cy="68" rx="2.7" ry="5" fill="#25303a"/><circle cx="45" cy="65" r="2" fill="white"/><circle cx="78" cy="65" r="2" fill="white"/><ellipse cx="38" cy="79" rx="6" ry="3" fill="#dc8e8a" opacity=".45"/><ellipse cx="90" cy="79" rx="6" ry="3" fill="#dc8e8a" opacity=".45"/><path d="M58 83Q64 88 70 83" fill="none" stroke="#9e6666" stroke-width="2" stroke-linecap="round"/>{cap}<path d="M8 22L11 14L14 22L21 25L14 28L11 35L8 28L1 25Z" fill="#e0c486" opacity=".8"/></g><circle cx="64" cy="64" r="62" fill="none" stroke="#c4ad76" stroke-width="2"/></svg>'''
 (P/f'avatar-{id}.svg').write_text(art)
print('created',len(characters),'original SVG fan portraits')
