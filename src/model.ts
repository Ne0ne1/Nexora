export const GRANT = 1_000_000;
export const STORAGE_KEY = 'nexora-economics-v1';
export const categories = [
 {name:'Разработка продукта и интеграций',amount:400000,color:'#6d43d4',spend:'Программирование платформы, управление ролями, выполнение поручений и интеграции с моделями.',result:'Работающий сценарий: от поручения до документа с результатом.',check:'Сценарий проходит от начала до конца в тестовой среде. Код и инструкция переданы команде.'},
 {name:'Модели ИИ и облачная инфраструктура',amount:180000,color:'#9980df',spend:'Вычисления, API моделей, серверы и хранение данных в период создания и пилотов.',result:'Среда для работы продукта и учёт потребления ресурсов.',check:'Есть журнал расходов и замер стоимости типового поручения.'},
 {name:'Интерфейс и продуктовый дизайн',amount:120000,color:'#bea9ee',spend:'Пользовательские сценарии, макеты экранов и библиотека интерфейсных компонентов. Программирование учитывается отдельно.',result:'Интерактивный прототип и дизайн-система для разработки.',check:'Основной путь пользователя описан, состояния экранов и компоненты переданы разработке.'},
 {name:'Привлечение и сопровождение пилотов',amount:120000,color:'#eb9960',spend:'Поиск пилотных компаний, подключение, обучение и сбор обратной связи.',result:'Организованные пилоты и записи о потребностях и готовности платить.',check:'Для каждого пилота определены задачи, критерии результата и итоговое решение компании.'},
 {name:'Организационные и юридические расходы',amount:80000,color:'#ddc5ad',spend:'Подготовка договоров, консультации по правам на материалы и организации работы с данными.',result:'Комплект документов и перечень обязательств команды.',check:'Документы проверены специалистом; спорные условия зафиксированы до пилотов.'},
 {name:'Тестирование, безопасность и качество',amount:100000,color:'#a4b7c2',spend:'Проверка сценариев, разграничения доступа, качества ответов и устойчивости. Исправления кода — в статье разработки.',result:'Набор тестов, критерии качества и список устранённых критических дефектов.',check:'Пройден контрольный набор задач; нет открытых критических дефектов перед пилотом.'},
];
export type Params={subscriptions:number;price:number;variableCost:number;fixedCosts:number;feeRate:number;taxReserveRate:number};
export const DEFAULTS:Params={subscriptions:10,price:15000,variableCost:3000,fixedCosts:60000,feeRate:2,taxReserveRate:6};
export const limits:Record<keyof Params,[number,number]>={subscriptions:[0,50],price:[5000,30000],variableCost:[500,10000],fixedCosts:[0,1000000],feeRate:[0,100],taxReserveRate:[0,100]};
export function calculate(p:Params){
 const revenue=p.subscriptions*p.price,variableCosts=p.subscriptions*p.variableCost,paymentFees=revenue*p.feeRate/100,taxReserve=revenue*p.taxReserveRate/100;
 const expenses=variableCosts+paymentFees+taxReserve+p.fixedCosts;
 const contribution=p.price*(1-p.feeRate/100-p.taxReserveRate/100)-p.variableCost;
 return {revenue,variableCosts,paymentFees,taxReserve,expenses,result:revenue-expenses,contribution,breakEven:contribution>0?Math.ceil(p.fixedCosts/contribution):null};
}
export type Model={params:Params;budget:number[]};
export function initial():Model{return {params:{...DEFAULTS},budget:categories.map(c=>c.amount)}}
export function budgetTotals(budget:number[]){const allocated=budget.reduce((a,b)=>a+b,0);return {allocated,remaining:GRANT-allocated}}
export function restore(raw:string|null):Model{
 const base=initial();if(!raw)return base;
 try{const data=JSON.parse(raw);for(const k of Object.keys(DEFAULTS) as (keyof Params)[]){const v=data?.params?.[k];if(typeof v==='number'&&Number.isFinite(v)){base.params[k]=Math.min(limits[k][1],Math.max(limits[k][0],k==='subscriptions'?Math.round(v):v));}}
 if(Array.isArray(data?.budget)&&data.budget.length===categories.length)base.budget=data.budget.map((v:unknown,i:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(10000000,Math.round(v))):categories[i].amount);
 }catch{/* Malformed storage falls back to defaults. */}return base;
}
export const money=(n:number)=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(n);
export const number=(n:number)=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n);
