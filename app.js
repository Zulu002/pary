const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const date = s => new Date(`${s}T12:00:00`);
function monday(d){const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x;}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function moscowNow(now=new Date()){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));return {day:`${p.year}-${p.month}-${p.day}`,minutes:+p.hour*60 + +p.minute};}
const minutes = s => {const [h,m]=s.split(':').map(Number);return h*60+m;};
function currentState(data,now){const today=data.lessons.filter(l=>l.date===now.day);const active=today.find(l=>now.minutes>=minutes(data.bells[l.pair].start)&&now.minutes<minutes(data.bells[l.pair].end));const next=data.lessons.find(l=>l.date>now.day||(l.date===now.day&&minutes(data.bells[l.pair].start)>now.minutes));return {active,next};}

const $=s=>document.querySelector(s);
let data,week=monday(date(moscowNow().day)),selected=null;
const format=(d,opts)=>new Intl.DateTimeFormat('ru-RU',opts).format(d);
const short=d=>format(d,{day:'numeric',month:'short'}).replace(' г.','');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderNow(){const now=moscowNow(),{active,next}=currentState(data,now);let html;
 if(active){const bell=data.bells[active.pair],left=minutes(bell.end)-now.minutes;html=`<div class="status"><i class="dot"></i> СЕЙЧАС · ${active.pair} ПАРА</div><h2>${esc(active.subject)}</h2><p>${esc(active.room?`Ауд. ${active.room}`:'Аудитория не указана')} · ${bell.start}–${bell.end}<br>До конца ${left} мин.</p><div class="progress"><span style="width:${(60-left)/60*100}%"></span></div>`;}
 else if(next){const bell=data.bells[next.pair],same=next.date===now.day;html=`<div class="status"><i class="dot"></i> ${same?'СЛЕДУЮЩАЯ ПАРА':'БЛИЖАЙШЕЕ ЗАНЯТИЕ'}</div><h2>${esc(next.subject)}</h2><p>${same?`Через ${minutes(bell.start)-now.minutes} мин.`:short(date(next.date))} · ${bell.start}–${bell.end}<br>${esc(next.room?`Ауд. ${next.room}`:'Аудитория не указана')}</p>`;}
 else html='<div class="status">✦ УСТАНОВОЧНАЯ СЕССИЯ ЗАВЕРШЕНА</div><h2>Можно выдохнуть.</h2><p>Занятий после 4 декабря в этом расписании нет.<br>Экзаменационная сессия: 1–10 февраля 2027.</p>';
 $('#now').innerHTML=html;
}
function render(){const now=moscowNow(),end=addDays(week,6),weekKey=key(week),current=key(monday(date(now.day))),items=data.lessons.filter(l=>l.date>=weekKey&&l.date<=key(end));
 $('#range').textContent=`${short(week)} — ${short(end)}`;
 $('#week-label').textContent=weekKey===current?'ЭТА НЕДЕЛЯ':`${week.getFullYear()} · ${weekKey<current?'ПРОШЕДШАЯ НЕДЕЛЯ':'СЛЕДУЮЩИЕ НЕДЕЛИ'}`;
 $('#count').textContent=`${items.length} ${items.length%10===1&&items.length%100!==11?'занятие':items.length%10>=2&&items.length%10<=4&&!(items.length%100>=12&&items.length%100<=14)?'занятия':'занятий'}`;
 $('#weekdays').innerHTML=Array.from({length:7},(_,i)=>{const d=addDays(week,i),k=key(d);return `<button class="day-tab ${k===now.day?'today':''} ${selected===k?'selected':''} ${items.some(l=>l.date===k)?'':'empty'}" data-day="${k}" aria-label="${format(d,{weekday:'long',day:'numeric',month:'long'})}" aria-pressed="${selected===k}">${format(d,{weekday:'short'})}<strong>${d.getDate()}</strong><i></i></button>`;}).join('');
 const visible=selected?items.filter(l=>l.date===selected):items;
 if(!visible.length){const outside=key(end)<data.startDate||weekKey>data.endDate;$('#schedule').innerHTML=`<div class="empty-state"><div class="symbol">✳</div><h3>${outside?'Здесь пока нет расписания':selected?'День без пар':'Неделя без пар'}</h3><p>${outside?'В файле есть занятия с 5 ноября по 4 декабря 2026.':'Можно отдохнуть и заняться своими делами.'}</p>${outside?'<button id="session-jump" class="icon" aria-label="К началу сессии">↗</button>':''}</div>`;$('#session-jump')?.addEventListener('click',()=>{week=monday(date(data.startDate));selected=null;render();});}
 else $('#schedule').innerHTML=[...new Set(visible.map(l=>l.date))].map(day=>`<section class="day-section" id="day-${day}"><h3 class="day-title">${format(date(day),{weekday:'long'})}<span>${short(date(day))}</span>${day===now.day?'<span class="today-badge">Сегодня</span>':''}</h3>${visible.filter(l=>l.date===day).map(l=>{const b=data.bells[l.pair],active=day===now.day&&now.minutes>=minutes(b.start)&&now.minutes<minutes(b.end),past=day<now.day||(day===now.day&&now.minutes>=minutes(b.end));return `<article class="lesson color-${l.color} ${active?'active':past?'past':''}" ${active?'aria-current="true"':''}><div class="time">${b.start}<small>${b.end} · ${l.pair} пара</small></div><div><h4>${esc(l.subject)}</h4><div class="meta"><span class="type">${esc(l.type)}</span>${esc(l.teacher)}</div>${active?'<span class="active-tag">● ИДЁТ СЕЙЧАС</span>':''}</div><div class="room">${esc(l.room?(/Спортзал/.test(l.room)?l.room:`Ауд. ${l.room}`):'Аудитория не указана')}</div></article>`;}).join('')}</section>`).join('');
 document.querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>{selected=selected===b.dataset.day?null:b.dataset.day;render();}));
 renderNow();
}
let weekTransition;
function move(n){
 clearTimeout(weekTransition);
 const list=$('#schedule');
 list.classList.remove('week-enter');
 list.style.setProperty('--slide-from',n>0?'24px':'-24px');
 list.classList.add('week-leave');
 weekTransition=setTimeout(()=>{
  week=addDays(week,n*7);selected=null;render();
  list.classList.remove('week-leave');
  list.classList.add('week-enter');
 },matchMedia('(prefers-reduced-motion: reduce)').matches?0:130);
}
$('#prev').onclick=()=>move(-1);$('#next').onclick=()=>move(1);$('#today').onclick=()=>{week=monday(date(moscowNow().day));selected=null;render();};
let touch;
$('.calendar').addEventListener('touchstart',e=>{if(e.touches.length===1)touch={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
$('.calendar').addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);touch=null;},{passive:true});
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);});
try{document.body.classList.toggle('dark',localStorage.getItem('theme')==='dark');}catch{}
$('#theme').onclick=()=>{document.body.classList.toggle('dark');try{localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light');}catch{}};

function loadData(value){
 if(!value || !Array.isArray(value.lessons) || !Array.isArray(value.bells) || value.bells.length!==5) throw new Error('Неверный формат расписания');
 for(const l of value.lessons){if(!/^\d{4}-\d{2}-\d{2}$/.test(l.date)||!Number.isInteger(l.pair)||!value.bells[l.pair]||typeof l.subject!=='string')throw new Error('Некорректное занятие');}
 for(const b of value.bells){if(!/^\d{2}:\d{2}$/.test(b.start)||!/^\d{2}:\d{2}$/.test(b.end))throw new Error('Некорректное время');}
 data=value;
 render();
}
(async()=>{
 try{
  let value=JSON.parse($('#schedule-data').textContent);
  if(location.protocol!=='file:'){try{const r=await fetch('./schedule.json');if(r.ok)value=await r.json();}catch{}}
  loadData(value);setInterval(()=>{if(data)render();},30000);
 }catch(e){$('#now').textContent='Не удалось прочитать расписание. Обновите страницу.';}
})();
