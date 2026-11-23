import json, datetime as dt, collections, re
rows = json.load(open('../data/lessons.json'))
def parse(fn, strip=False):
    out=[]; cat=None
    for ln in open(fn):
        ln=ln.rstrip('\n')
        if ln.startswith('## '): cat=ln[3:]; cat=re.sub(r'^[A-Z]\. ','',cat); continue
        if ln.strip():
            c,n=ln.split('|',1); out.append({'code':c,'name':n,'category':cat})
    return out
sci=parse('../data/sci_raw.txt'); soc=parse('../data/ss_raw.txt')
SS_DONE={'read-and-create-timelines-with-bce-and-ce'}
dm=set(open('../data/done_math.txt').read().strip().split(',')); de=set(open('../data/done_ela.txt').read().strip().split(','))
exec(open('schedule_old.py').read()[open('schedule_old.py').read().rindex('MATH_ORDER = ['):open('schedule_old.py').read().index('def stream')])
def st(subj,order,done):
    by=collections.defaultdict(list)
    for r in rows:
        if r['subject']==subj and r['code'] not in done: by[r['category']].append(r)
    return [r for c in order for r in by[c]]
streams={'m':st('Math',MATH_ORDER,dm),'e':st('ELA',ELA_ORDER,de),'s':sci,'h':[x for x in soc if x['code'] not in SS_DONE]}
print({k:len(v) for k,v in streams.items()}, sum(len(v) for v in streams.values()))
# Mesa district calendar
off=set()
def rng(a,b):
    d=dt.date(*a)
    while d<=dt.date(*b): off.add(d); d+=dt.timedelta(1)
for a,b in [((2026,11,25),(2026,11,27)),((2026,12,18),(2027,1,1)),((2027,1,18),)*2,((2027,2,15),)*2,((2027,3,8),(2027,3,12)),((2027,3,26),)*2,((2027,5,31),)*2]: rng(a,b)
sd=[];d=dt.date(2026,11,23)
while d<=dt.date(2027,5,27):
    if d.weekday()<5 and d not in off: sd.append(d)
    d+=dt.timedelta(1)
W={0:10,1:10,2:7,3:7,4:10}; wt=sum(W[x.weekday()] for x in sd)
idx={k:0 for k in streams}; cw=0; days=[]; N=sum(len(v) for v in streams.values()); done_n=0
for i,x in enumerate(sd,1):
    cw+=W[x.weekday()]
    t=round(N*cw/wt)-done_n; done_n+=t
    day={'d':x.isoformat(),'n':i,'w':x.strftime('%a')}; take={k:0 for k in streams}
    for _ in range(t):
        k=max((k for k in streams if idx[k]+take[k]<len(streams[k])), key=lambda k: len(streams[k])*cw/wt-(idx[k]+take[k]))
        take[k]+=1
    for k,v in streams.items():
        chunk=v[idx[k]:idx[k]+take[k]]; idx[k]+=take[k]
        day[k]=[[l['code'],l['name'],l['category']] for l in chunk]
    days.append(day)
assert all(idx[k]==len(streams[k]) for k in streams)
# tasks
PROMPTS=["Retell what happened in the chapters you read, in your own words.","Pick a character. What do they want, and what is getting in their way?","Predict what will happen next, and give two clues from the book that support it.","Describe your favorite scene so well that someone who has not read it can picture it.","Find a new or tricky word. Write what it means and use it in a sentence.","Compare two cats in the story: how are they alike and how are they different?","Write about a choice a character made. Would you have done the same? Why?","Describe the setting. What does the Clan's territory look and feel like?"]
bym=collections.defaultdict(list)
for x in sd: bym[x.strftime('%Y-%m')].append(x)
lastofmonth={v[-1] for k,v in bym.items() if k!='2026-11'}
byweek=collections.defaultdict(list)
for x in sd: byweek[x-dt.timedelta(x.weekday())].append(x)
lastofweek={v[-1]:i for i,(k,v) in enumerate(sorted(byweek.items()))}
for day in days:
    x=dt.date.fromisoformat(day['d']); t=[['read-'+day['d'],'Read your Warrior Cats book for 30 minutes','Daily reading']]
    if x in lastofweek:
        t.append(['write-'+day['d'],'Weekly writing: write and submit something for your book report. '+PROMPTS[lastofweek[x]%len(PROMPTS)],'Weekly writing'])
    if x in lastofmonth:
        t.append(['report-'+x.strftime('%Y-%m'),'Submit your '+x.strftime('%B')+' book report','Monthly book report'])
    day['r']=t
json.dump(days,open('../data/schedule.json','w'),separators=(',',':'))
c=collections.Counter(); 
for day in days: c[(day['w'],sum(len(day[k]) for k in 'mehs'))]+=1
print(len(days),sorted(c.items())); print(sum(len(d['r']) for d in days),'reading/writing tasks;', len(lastofmonth),'monthly', len(lastofweek),'weekly')
print(sorted(x.isoformat() for x in lastofmonth))
tot=sum(sum(len(d[k]) for k in 'mehs') for d in days); print('avg',tot/len(days))
