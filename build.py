# Regenerates public/concepts.json and public/llms.txt from public/creators.js. Run after any registry change.
import json, re, subprocess
src = open('public/creators.js', encoding='utf-8').read()
data = json.loads(subprocess.check_output(['node', '-e', 'global.window={};' + src + ';process.stdout.write(JSON.stringify(window.HCP))']))
base = 'https://' + data['entity']['domain'] + '/'
out = {'entity': data['entity']['name'], 'url': base, 'description': 'Concepts from human minds, for humans. Original consumer concepts held, developed and licensed; each available to commission in stages.', 'contact': data['entity']['contact'], 'minds': []}
lines = ['# Human Consumer Products', '', '> Concepts from human minds, for humans. Original consumer concepts held, developed and licensed, each available to commission in defined stages.', '']
for m in data['minds']:
    if not m.get('admitted'): continue
    mm = {'name': m['name'], 'place': m['place'], 'summary': m['line'], 'page': base + '#' + m['slug'], 'back_the_mind': base + '#' + m['slug'] + '--back', 'contact': m['contact'], 'concepts': []}
    lines += ['## ' + m['name'] + ' (' + m['place'] + ')', '', m['line'], '', '- Back the mind: ' + mm['back_the_mind'] + ' (support, not investment)', '- Contact: ' + m['contact'], '']
    for c in m['concepts']:
        u = base + '#' + m['slug'] + '--' + c['id']
        mm['concepts'].append({'code': c['code'], 'title': c['title'], 'status': c['status'], 'stage': c['stage'], 'rights': c['rights'], 'summary': c['summary'], 'demo': u, 'brief': u + '--brief', 'commission': u + '--commission', 'brief_text': {b[0]: b[1] for b in c.get('brief', [])}})
        lines += ['### ' + c['code'] + ' — ' + c['title'], '', c['summary'], '', '- Stage: ' + c['stage'] + '; rights: ' + c['rights'], '- Demonstration: ' + u, '- Brief: ' + u + '--brief', '- Commission terms: ' + u + '--commission', '']
    out['minds'].append(mm)
lines += ['## Commissioning', '', 'Stages: working rig; looks-like works-like prototype; engineering prototype; production partner. Commissioners receive first look, build-review seats, credit and first right to license. Enquiries to the originating mind; state the stage of interest.', '']
open('public/concepts.json', 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=2))
open('public/llms.txt', 'w', encoding='utf-8').write('\n'.join(lines))
print('ok', sum(len(m['concepts']) for m in out['minds']), 'concepts')
