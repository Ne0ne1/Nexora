export type Row = { period: 'previous' | 'current'; segment: string; orders: number; revenue: number };
export type Task = { id: string; title: string; owner: string; date: string; done: string; status: 'К работе' | 'В работе' | 'Готово' };
export type Job = { id: string; title: string; kind: string; budget: number; rows: Row[]; step: number; tasks: Task[]; created: string; company: string };
export const example = 'Разберитесь, почему снизилась выручка, подготовьте план продвижения на следующую неделю с бюджетом 20 000 ₽ и распределите задачи';
export const demoCSV = 'period,segment,orders,revenue\nprevious,Текстиль,80,160000\nprevious,Декор,60,90000\nprevious,Посуда,60,150000\ncurrent,Текстиль,55,99000\ncurrent,Декор,65,97500\ncurrent,Посуда,50,117500';
export function parseCSV(text: string): Row[] {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const delim = lines[0]?.includes(';') ? ';' : ',';
  if (lines[0] !== ['period','segment','orders','revenue'].join(delim)) throw new Error('Заголовки должны быть: period,segment,orders,revenue. Скачайте шаблон CSV.');
  if (lines.length < 3 || lines.length > 1001) throw new Error('Нужны данные двух периодов, не более 1000 строк.');
  const seen = new Set<string>();
  const rows = lines.slice(1).map((line, i): Row => {
    const fields = line.split(delim).map(s=>s.trim());
    const [period,segment,orders,revenue] = fields;
    if (fields.length !== 4 || !['previous','current'].includes(period) || !segment || segment.length > 80 || !/^\d+$/.test(orders) || !/^\d+(\.\d{1,2})?$/.test(revenue) || +orders > 10000000 || +revenue > 100000000000 || (+orders === 0 && +revenue !== 0)) throw new Error(`Строка ${i+2}: проверьте период, сегмент и неотрицательные числа. При 0 заказов выручка должна быть 0.`);
    const key = `${period}:${segment}`;
    if (seen.has(key)) throw new Error(`Строка ${i+2}: сегмент «${segment}» повторяется в одном периоде.`);
    seen.add(key); return {period: period as Row['period'],segment,orders:+orders,revenue:+revenue};
  });
  if (!rows.some(r=>r.period==='previous') || !rows.some(r=>r.period==='current')) throw new Error('Добавьте оба периода: previous и current.');
  return rows;
}
export const money = (n:number) => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(n);
export const num = (n:number) => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
export function delta(a:number,b:number) { return a === 0 ? (b === 0 ? '0%' : 'нет базы') : `${b>=a?'+':''}${num((b-a)/a*100)}%`; }
export function analyze(rows:Row[]) {
  const total = (p:string) => { const r=rows.filter(r=>r.period===p);const revenue=r.reduce((s,v)=>s+v.revenue,0);const orders=r.reduce((s,v)=>s+v.orders,0);return {revenue,orders,average:orders?revenue/orders:0}; };
  const segments = [...new Set(rows.map(r=>r.segment))].map(segment=>{const a=rows.find(r=>r.segment===segment&&r.period==='previous')?.revenue||0;const b=rows.find(r=>r.segment===segment&&r.period==='current')?.revenue||0;return {segment,a,b,change:b-a};}).sort((a,b)=>a.change-b.change);
  return {previous:total('previous'),current:total('current'),segments};
}
export function promotion(job:Job) {
  const a=analyze(job.rows);const target=a.segments.find(s=>s.change<0)?.segment||a.segments[0].segment;
  const first=Math.floor(job.budget*.5),second=Math.floor(job.budget*.3);
  return [{title:`Вернуть интерес к категории «${target}»`,channel:'VK · ретаргетинг',budget:first,detail:`Подборка из 5 товаров категории «${target}» для посетителей магазина. Проверить наличие и цены до запуска.`,criterion:'Кампания запущена, UTM-метки проверены; через 48 часов собраны переходы и заказы.'},{title:'Показать товары в повседневной жизни',channel:'Telegram · размещение',budget:second,detail:'Одна публикация в локальном канале о доме. Согласовать макет и запросить статистику аудитории.',criterion:'Пост опубликован; сохранены ссылка, охват и переходы.'},{title:'Вернуть покупателей в магазин',channel:'CRM · рассылка',budget:job.budget-first-second,detail:'Письмо с тремя готовыми сочетаниями товаров для клиентов, согласившихся на рассылку.',criterion:'Рассылка отправлена по разрешённой базе; собраны открытия, клики и заказы.'}];
}
export function weekDates(reference?:string) {const d=reference?new Date(reference):new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+((8-d.getDay())%7||7));return Array.from({length:7},(_,i)=>{const x=new Date(d);x.setDate(x.getDate()+i);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;});}
export function createTasks(job:Job):Task[] {return promotion(job).map((a,i)=>({id:crypto.randomUUID(),title:a.title,owner:['Ахмед · маркетинг','Ахмед · маркетинг','Иса · руководитель'][i],date:weekDates(job.created)[i*2],done:a.criterion,status:'К работе'}));}
export function createJob(rows:Row[],budget=20000,title=example,kind='Команда',company='Линия — учебный интернет-магазин товаров для дома.'):Job {const job:Job={id:crypto.randomUUID(),title,kind,budget,rows:structuredClone(rows),step:0,tasks:[],created:new Date().toISOString(),company};job.tasks=createTasks(job);return job;}
export const artifacts=['Отчёт по продажам','План продвижения','Контент-план','Задачи на неделю'];
export const events=['Прочитана таблица продаж','Рассчитаны выручка, заказы и средний чек','Сопоставлены категории; создан отчёт','Отчёт передан маркетологу','Распределён бюджет по трём действиям','Созданы контент-план и примеры публикаций','План передан координатору','Созданы задачи, сроки и критерии готовности','Комплект результатов сохранён'];
export const contentPlan = (job:Job) => ['Подборка недели: '+promotion(job)[0].title,'Как сочетать текстиль, декор и посуду','Подборка товаров в локальном канале','Короткое видео: один стол — три настроения','Письмо: детали, которые делают дом уютнее','Ответы на вопросы о доставке и уходе','Итоги недели: оценить переходы и заказы'].map((title,i)=>({title,date:weekDates(job.created)[i],channel:['VK','VK','Telegram','VK','Email','Telegram','Аналитика'][i]}));
export const posts=(job:Job)=>[`Иногда для нового настроения достаточно одной детали. Мы собрали любимые товары категории «${analyze(job.rows).segments[0].segment}» — посмотрите, что подойдёт вашему дому. Актуальные цены и наличие — в каталоге «Линии».`,`Ваш дом, ваши маленькие ритуалы. Собрали три идеи для уютного вечера: мягкий текстиль, любимая чашка и немного света. Откройте подборку «Линии» и сохраните то, что вам близко.`];
export function markdown(job:Job,index:number) { const a=analyze(job.rows);let body='';if(index===0) body=`Выручка: ${money(a.previous.revenue)} → ${money(a.current.revenue)} (${delta(a.previous.revenue,a.current.revenue)}).\nЗаказы: ${a.previous.orders} → ${a.current.orders}.\nСредний чек: ${money(a.previous.average)} → ${money(a.current.average)}.\n\n| Категория | До | После | Изменение |\n|---|---:|---:|---:|\n`+a.segments.map(s=>`| ${s.segment} | ${s.a} | ${s.b} | ${s.change} |`).join('\n')+'\n\nФакт: '+observation(job)+'\n\nГипотезы: изменение трафика, наличия или конверсии. Причина не доказана; нужны данные по каналам, остаткам и посещениям.';
if(index===1) body=`Бюджет: ${money(job.budget)}\n\n`+promotion(job).map(p=>`## ${p.title}\n${p.channel} · ${money(p.budget)}\n${p.detail}`).join('\n\n')+'\n\nОжидание роста продаж — предположение, не гарантия. Оценить стоимость заказа после 48 часов; не масштабировать неэффективные размещения.';
if(index===2) body=contentPlan(job).map(p=>`- ${p.date} · ${p.channel}: ${p.title}`).join('\n')+'\n\n'+posts(job).map((p,i)=>`## Публикация ${i+1}\n${p}`).join('\n\n');
if(index===3) body=job.tasks.map(t=>`## ${t.title}\n${t.owner} · ${t.date} · ${t.status}\nГотово, когда: ${t.done}`).join('\n\n');
return `# ${artifacts[index]}\n\nЛиния · учебные данные · демонстрационный режим\n\nПоручение: ${job.title}\n\nКонтекст компании: ${job.company||"Линия — учебный магазин"}\n\n${body}\n`;}
export function observation(job:Job){const a=analyze(job.rows),s=a.segments.find(s=>s.change<0);return s?`Наибольшее снижение — «${s.segment}»: ${money(s.change)}. Общая выручка изменилась на ${delta(a.previous.revenue,a.current.revenue)}.`:`Падение выручки по категориям не обнаружено. Общая динамика: ${delta(a.previous.revenue,a.current.revenue)}.`;}
export function csvExport(job:Job,index:number){const a=analyze(job.rows);const rows:unknown[][]=index===0?[['segment','previous','current','change'],...a.segments.map(s=>[s.segment,s.a,s.b,s.change])]:index===1?[['action','channel','budget'],...promotion(job).map(p=>[p.title,p.channel,p.budget])]:index===2?[['date','channel','content'],...contentPlan(job).map(p=>[p.date,p.channel,p.title])]:[['task','owner','date','status','acceptance'],...job.tasks.map(t=>[t.title,t.owner,t.date,t.status,t.done])];return '\uFEFF'+rows.map(r=>r.map(c=>'"'+String(c).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"').join(',')).join('\r\n');}
export function download(name:string,text:string,type='text/plain'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
