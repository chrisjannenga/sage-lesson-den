import json, datetime as dt, collections

rows = json.load(open('/home/claude/plan/lessons.json'))

MATH_ORDER = [
 'Place Value & Number Names', 'Rounding & Estimating', 'Add & Subtract Multi-Digit Numbers',
 'Factors & Multiples', 'Multiplication: Facts & 1-Digit Factors', 'Multiplication: 2-Digit Factors',
 'Multiplication: Strategies & Properties', 'Division Basics', 'Division: Strategies & Properties',
 'Word Problems & Multiplicative Comparison', 'Number Patterns', 'Equivalent Fractions',
 'Comparing Fractions', 'Adding & Subtracting Fractions', 'Mixed Numbers & Fraction Word Problems',
 'Multiplying Fractions by Whole Numbers', 'Decimals', 'Line Plots', 'Measurement & Unit Conversions',
 'Measurement, Time & Money Word Problems', 'Area & Perimeter', 'Angles', 'Geometry: Lines, Shapes & Symmetry',
]
ELA_ORDER = [
 'Literature: Story Elements & Characters', 'Grammar: Sentence Structure', 'Word Study: Prefixes & Suffixes',
 'Informational: Text Structure & Details', 'Capitalization', 'Vocabulary: Context Clues & Multiple Meanings',
 'Literature: Theme & Summary', 'Spelling: Plurals & Possessives', 'Reading Practice: Literature Passages',
 'Punctuation', 'Informational: Main Idea & Purpose', 'Word Study: Greek & Latin Roots',
 'Grammar: Pronouns, Verbs, Adjectives & Prepositions', 'Writing: Paragraph Organization',
 'Spelling: Past Tense Verbs', 'Vocabulary: Figurative Language & Idioms',
 'Informational: Text Features & Combining Sources', 'Reading Practice: Informational Passages',
 'Word Study: Compound, Multisyllabic & Word Patterns', 'Writing: Transitions & Linking Words',
 'Spelling: Common Words, Affixes & Sight Words', 'Literature: Poetry, Drama & Illustrations',
 'Vocabulary: Synonyms, Antonyms & Word Choice', 'Writing: Opinion & Supporting Reasons',
 'Spelling: Homophones, Contractions & Comparatives', 'Reference Skills (Alphabetizing & Dictionary)',
 'Writing: Descriptive Details',
]

# IXL order: categories follow the order they first appear in the IXL skill plans
MATH_ORDER = [
 'Word Problems & Multiplicative Comparison', 'Factors & Multiples', 'Number Patterns',
 'Place Value & Number Names', 'Rounding & Estimating', 'Add & Subtract Multi-Digit Numbers',
 'Multiplication: Facts & 1-Digit Factors', 'Multiplication: 2-Digit Factors',
 'Multiplication: Strategies & Properties', 'Division Basics', 'Division: Strategies & Properties',
 'Equivalent Fractions', 'Comparing Fractions', 'Adding & Subtracting Fractions',
 'Mixed Numbers & Fraction Word Problems', 'Multiplying Fractions by Whole Numbers', 'Decimals',
 'Measurement & Unit Conversions', 'Measurement, Time & Money Word Problems', 'Area & Perimeter',
 'Line Plots', 'Angles', 'Geometry: Lines, Shapes & Symmetry',
]
ELA_ORDER = [
 'Literature: Story Elements & Characters', 'Literature: Theme & Summary',
 'Reading Practice: Literature Passages', 'Vocabulary: Context Clues & Multiple Meanings',
 'Vocabulary: Figurative Language & Idioms', 'Literature: Poetry, Drama & Illustrations',
 'Informational: Text Structure & Details', 'Reading Practice: Informational Passages',
 'Informational: Main Idea & Purpose', 'Informational: Text Features & Combining Sources',
 'Word Study: Prefixes & Suffixes', 'Word Study: Greek & Latin Roots',
 'Word Study: Compound, Multisyllabic & Word Patterns', 'Spelling: Past Tense Verbs',
 'Spelling: Plurals & Possessives', 'Spelling: Common Words, Affixes & Sight Words',
 'Writing: Opinion & Supporting Reasons', 'Writing: Transitions & Linking Words',
 'Writing: Paragraph Organization', 'Vocabulary: Synonyms, Antonyms & Word Choice',
 'Writing: Descriptive Details', 'Punctuation', 'Grammar: Sentence Structure', 'Capitalization',
 'Grammar: Pronouns, Verbs, Adjectives & Prepositions',
 'Spelling: Homophones, Contractions & Comparatives', 'Reference Skills (Alphabetizing & Dictionary)',
]

def stream(subject, order):
    by = collections.defaultdict(list)
    for r in rows:
        if r['subject'] == subject:
            by[r['category']].append(r)
    assert set(by) == set(order), (set(by) ^ set(order))
    out = []
    for c in order:
        out += by[c]
    return out

math = stream('Math', MATH_ORDER)
ela = stream('ELA', ELA_ORDER)
assert len(math) == 250 and len(ela) == 200

off = set()
def rng(a, b):
    d = a
    while d <= b:
        off.add(d); d += dt.timedelta(days=1)
rng(dt.date(2026,11,11), dt.date(2026,11,11))
rng(dt.date(2026,11,25), dt.date(2027,1,3))
rng(dt.date(2027,1,18), dt.date(2027,1,18))
rng(dt.date(2027,2,15), dt.date(2027,2,15))
rng(dt.date(2027,3,8), dt.date(2027,3,12))
rng(dt.date(2027,3,26), dt.date(2027,3,26))
rng(dt.date(2027,5,31), dt.date(2027,5,31))

TARGET = {0: 7, 1: 7, 2: 5, 3: 5, 4: 7}
total = 450
days = []
d = dt.date(2026,10,13)
done = 0
mi = ei = 0
while done < total:
    if d.weekday() < 5 and d not in off:
        t = min(TARGET[d.weekday()], total - done)
        new_done = done + t
        m_cum = round(new_done * 250 / 450)
        m = m_cum - mi
        e = t - m
        m = min(m, 250 - mi); e = t - m
        days.append({'date': d.isoformat(), 'weekday': d.strftime('%a'),
                     'math': math[mi:mi+m], 'ela': ela[ei:ei+e]})
        mi += m; ei += e; done = new_done
    d += dt.timedelta(days=1)

assert mi == 250 and ei == 200
for i, x in enumerate(days, 1):
    x['day'] = i

json.dump(days, open('/home/claude/plan/schedule.json','w'), indent=1)
print('school days used:', len(days), 'first', days[0]['date'], 'last', days[-1]['date'])
c = collections.Counter()
for x in days:
    c[(x['weekday'], len(x['math']), len(x['ela']))] += 1
for k, v in sorted(c.items()):
    print(k, v)
print('math/ela finish:', max(i for i,x in enumerate(days) if x['math'])+1, max(i for i,x in enumerate(days) if x['ela'])+1)
for x in days[:6]:
    print(x['date'], x['weekday'], [l['category'] for l in x['math']], [l['category'] for l in x['ela']])
# distinct categories per day
multi = sum(1 for x in days if len({l['category'] for l in x['math']}) > 1)
multi_e = sum(1 for x in days if len({l['category'] for l in x['ela']}) > 1)
print('days where math spans >1 category:', multi, ' ela:', multi_e)
