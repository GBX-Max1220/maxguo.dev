"""Generate the two-page outreach CV from the site's current research data.
Run from any directory with: python scripts/generate-cv.py
Requires reportlab; output: public/Baixin_Guo_CV.pdf.
"""
import json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
p = json.loads((ROOT / 'src/data/research-profile.json').read_text())
OUT = ROOT / 'public/Baixin_Guo_CV.pdf'
pdfmetrics.registerFont(TTFont('CVSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('CVSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
ink = colors.HexColor('#20272d')
muted = colors.HexColor('#56616a')
accent = colors.HexColor('#17665c')
styles = {
 'name': ParagraphStyle('name',fontName='CVSans-Bold',fontSize=23,leading=27,textColor=ink,spaceAfter=6),
 'subtitle': ParagraphStyle('subtitle',fontName='CVSans',fontSize=10,leading=14,textColor=accent,spaceAfter=5),
 'body': ParagraphStyle('body',fontName='CVSans',fontSize=9.2,leading=13,textColor=ink,spaceAfter=5),
 'meta': ParagraphStyle('meta',fontName='CVSans',fontSize=8.5,leading=11,textColor=muted,spaceAfter=5),
 'section': ParagraphStyle('section',fontName='CVSans-Bold',fontSize=11,leading=15,textColor=accent,spaceBefore=12,spaceAfter=7),
 'title': ParagraphStyle('title',fontName='CVSans-Bold',fontSize=10,leading=13,textColor=ink,spaceAfter=3),
 'bullet': ParagraphStyle('bullet',fontName='CVSans',fontSize=9,leading=12.6,leftIndent=10,firstLineIndent=-8,textColor=ink,spaceAfter=4),
}
def clean(s):
 return s.replace('×','x').replace('·',' | ').replace('—','-').replace('–','-').replace('’',"'")
def para(s,style='body'):
 return Paragraph(escape(clean(s)),styles[style])
def section(s): story.append(para(s,'section'))
def work(w):
 bits=[para(w['title']+' | '+w['date'],'title')]
 if w.get('context'): bits.append(para(w['context'],'meta'))
 bits.append(para(w['status'],'meta'))
 for b in w['bullets']:bits.append(para('- '+b,'bullet'))
 if w.get('url'):
  url=w['url']
  if url.startswith('/'):url='https://gbx-max1220.github.io/maxguo.dev'+url
  label='Public artifact' if w['id']!='skillhone' else 'PRs #14, #15, #16'
  bits.append(Paragraph('<link href="'+escape(url,{'"':'&quot;'})+'" color="#17665c">'+label+'</link>',styles['meta']))
 bits.append(Spacer(1,5));story.append(KeepTogether(bits))
def footer(c,doc):
 c.setStrokeColor(colors.HexColor('#d9dfe2'));c.line(42,36,A4[0]-42,36)
 c.setFont('CVSans',8);c.setFillColor(muted)
 c.drawString(42,24,'Baixin (Max) Guo | Research CV | October 2026')
 c.drawRightString(A4[0]-42,24,str(doc.page))
story=[]
story.extend([para('BAIXIN (MAX) GUO','name'),para('Human-Centered AI | Feedback Learning | Reliable AI Agents','subtitle')])
story.append(Paragraph('<link href="mailto:gbx1220max@gmail.com">gbx1220max@gmail.com</link> | <link href="https://gbx-max1220.github.io/maxguo.dev/">Website</link> | <link href="https://github.com/GBX-Max1220">GitHub</link>',styles['meta']))
story.append(para('China | Remote availability from October 2026','meta'))
section('RESEARCH PROFILE')
story.append(para(p['profile']))
story.append(para('Interests: '+p['interests']))
section('RESEARCH COLLABORATIONS')
for w in p['collaborations']:work(w)
section('SELECTED RESEARCH & TECHNICAL WORK')
for w in p['projects'][:2]:work(w)
story.append(PageBreak())
section('SELECTED RESEARCH & TECHNICAL WORK - CONTINUED')
work(p['projects'][2])
for w in p['additional'][:2]:work(w)
work({'id':'thesis','title':'Undergraduate thesis - Chinese LLM evaluation on CBT-Bench','date':'2026','status':'Benchmark evaluation', 'bullets':['Designed fixed zero-shot evaluation across five Chinese LLM services on 442 structured examples, with checkpointing and retry logic.','Reported exact match, partial-overlap, and sample-average F1; bounded findings to benchmark evidence rather than clinical or human-outcome validity.']})
section('EARLIER RESEARCH EXPERIENCE')
work({'id':'usc','title':'Trojan Sports Research Lab, USC Marshall School of Business','date':'Mar 2025 - Mar 2026','status':'Research collaboration | Supervisor: Prof. Lorena Martin','bullets':['Collected, cleaned, visualized, and analyzed multi-source baseball data for research on pitcher workload, pitch characteristics, and injury risk.']})
section('EDUCATION')
story.append(para('Changchun Humanities and Sciences College | 2022-2026','title'))
story.append(para("Bachelor's degree in Applied Psychology"))
section('METHODS & TECHNICAL SKILLS')
story.append(para('Programming: Python; JavaScript/TypeScript; SQL/SQLite; Git/GitHub; pytest; CLI tooling; structured data pipelines.'))
story.append(para('AI and evaluation: LLM/API pipelines; agent prototyping; supervised ML; preference diagnostics; reproducible evaluation; contextual bandits.'))
story.append(para('Research: experimental design; psychometrics; statistical analysis; inter-rater reliability; behavioral-data quality and representation audits.'))
SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=36,bottomMargin=46,title='Baixin (Max) Guo - Research CV',author='Baixin Guo').build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
