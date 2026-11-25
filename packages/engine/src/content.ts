export type Suit='S'|'H'|'D'|'C';
export interface Card {id:string;kind:string;suit:Suit;rank:number;placed?:number}
export interface CardInfo {name:string;file:string;text:string;blue?:boolean;range?:number;green?:boolean;cost?:boolean;art?:string;expansion?:string;effect?:'miss'|'shoot'|'allshoot'|'steal'|'discard'|'brawl'|'heal'|'draw';distance?:number;draw?:number;heal?:number}
export const CARDS:Record<string,CardInfo>={
 bang:{name:'Бэнг!',file:'bang',text:'Выстрел в другого игрока в пределах дальности оружия. Обычно один за ход.'},
 missed:{name:'Мимо!',file:'mancato',text:'Отменяет один выстрел в вас. Разыгрывается в ответ.'},
 beer:{name:'Пиво',file:'birra',text:'Восстановите 1 жизнь. Можно спастись от смертельного урона. Не действует, если осталось двое.'},
 saloon:{name:'Салун',file:'saloon',text:'Все живые игроки, включая вас, восстанавливают 1 жизнь.'},
 panic:{name:'Паника!',file:'panico',text:'Заберите случайную карту из руки или открытую карту у игрока на дистанции 1.'},
 cat:{name:'Красотка Кэт',file:'catbalou',text:'Сбросьте случайную карту из руки или выбранную открытую карту любого игрока.'},
 duel:{name:'Дуэль',file:'duello',text:'Выбранный игрок первым сбрасывает Бэнг!, затем вы по очереди. Отказавшийся теряет 1 жизнь.'},
 indians:{name:'Индейцы!',file:'indiani',text:'Каждый другой игрок сбрасывает Бэнг! или теряет 1 жизнь.'},
 gatling:{name:'Гатлинг',file:'gatling',text:'Один выстрел в каждого другого игрока, независимо от дистанции. Не расходует лимит Бэнг!.'},
 store:{name:'Магазин',file:'emporio',text:'Откройте по карте на живого игрока. Все по кругу, начиная с вас, забирают одну.'},
 stagecoach:{name:'Дилижанс',file:'diligenza',text:'Возьмите 2 карты из колоды.'},
 wells:{name:'Уэллс Фарго',file:'wellsfargo',text:'Возьмите 3 карты из колоды.'},
 barrel:{name:'Бочка',file:'barile',blue:true,text:'Один раз за выстрел проверьте верхнюю карту. Черва отменяет один выстрел.'},
 jail:{name:'Тюрьма',file:'prigione',blue:true,text:'Положите перед другим игроком, кроме шерифа. В начале его хода: черва — свобода, иначе пропуск. Затем сброс.'},
 dynamite:{name:'Динамит',file:'dinamite',blue:true,text:'В начале следующего хода: пики 2–9 — взрыв и 3 урона; иначе передайте следующему игроку.'},
 mustang:{name:'Мустанг',file:'mustang',blue:true,text:'Другие видят вас на 1 дальше.'},
 scope:{name:'Прицел',file:'mirino',blue:true,text:'Вы видите других на 1 ближе, минимум 1.'},
 volcanic:{name:'Вулканик',file:'volcanic',blue:true,range:1,text:'Дальность 1. Можно разыгрывать любое число Бэнг!.'},
 schofield:{name:'Скофилд',file:'schofield',blue:true,range:2,text:'Дальность выстрела 2.'},
 remington:{name:'Ремингтон',file:'remington',blue:true,range:3,text:'Дальность выстрела 3.'},
 carabine:{name:'Карабин',file:'carabine',blue:true,range:4,text:'Дальность выстрела 4.'},
 winchester:{name:'Винчестер',file:'winchester',blue:true,range:5,text:'Дальность выстрела 5.'},
};
export const CHARACTERS:Record<string,{name:string;hp:number;file:string;text:string;art?:string;expansion?:string}>={
 bart:{name:'Барт Кэссиди',hp:4,file:'bartcassidy',text:'За каждую потерянную жизнь берёт карту. Сначала нужно пережить смертельный урон.'},
 black:{name:'Чёрный Джек',hp:4,file:'blackjack',text:'Показывает вторую взятую в начале хода карту. Если красная, берёт ещё одну.'},
 calamity:{name:'Бедовая Джейн',hp:4,file:'calamityjanet',text:'Может использовать Бэнг! как Мимо! и наоборот.'},
 gringo:{name:'Эль Гринго',hp:3,file:'elgringo',text:'За потерянную жизнь берёт случайную карту у сыгравшего причинившую урон карту, если это другой игрок.'},
 jesse:{name:'Джесси Джонс',hp:4,file:'jessejones',text:'Первую карту в начале хода может взять случайно из чужой руки.'},
 jour:{name:'Джордонне',hp:4,file:'jourdonnais',text:'Встроенная Бочка. С обычной Бочкой даёт две проверки на выстрел.'},
 kit:{name:'Кит Карлсон',hp:4,file:'kitcarlson',text:'В начале хода смотрит 3 карты, оставляет 2, третью возвращает наверх колоды.'},
 lucky:{name:'Счастливчик Дюк',hp:4,file:'luckyduke',text:'При проверке открывает 2 карты и выбирает результат. Обе сбрасываются.'},
 paul:{name:'Пол Регрет',hp:3,file:'paulregret',text:'Другие видят его на 1 дальше. Складывается с Мустангом.'},
 pedro:{name:'Педро Рамирес',hp:4,file:'pedroramirez',text:'Первую карту в начале хода может взять с верха сброса.'},
 rose:{name:'Роза Дулэн',hp:4,file:'rosedoolan',text:'Видит остальных на 1 ближе. Складывается с Прицелом.'},
 sid:{name:'Сид Кетчум',hp:4,file:'sidketchum',text:'В любой момент может сбросить 2 карты руки и восстановить 1 жизнь, в том числе при смертельном уроне.'},
 slab:{name:'Малыш Слэб',hp:4,file:'slab',text:'На его карту Бэнг! нужны два Мимо!. Успешная Бочка считается одним.'},
 suzy:{name:'Сюзи Лафайет',hp:4,file:'suzylafayette',text:'Когда рука пуста, берёт карту. В дуэли ждёт её завершения.'},
 vulture:{name:'Стервятник Сэм',hp:4,file:'vulturesam',text:'Забирает в руку все карты выбывшего игрока.'},
 willy:{name:'Вилли Малыш',hp:4,file:'willythekid',text:'Может разыгрывать любое число Бэнг! за ход.'},
};
export const BASE_CHARACTER_IDS=Object.keys(CHARACTERS);
export type Role='sheriff'|'deputy'|'outlaw'|'renegade';
export const ROLES:Record<Role,{name:string;goal:string;file:string}>={sheriff:{name:'Шериф',goal:'Устранить всех бандитов и ренегата.',file:'sceriffo'},deputy:{name:'Помощник',goal:'Помочь шерифу победить, даже ценой своей жизни.',file:'vice'},outlaw:{name:'Бандит',goal:'Устранить шерифа. Победа общая для всех бандитов.',file:'fuorilegge'},renegade:{name:'Ренегат',goal:'Остаться последним в живых. Шериф должен погибнуть последним.',file:'rinnegato'}};
export const SUITS:Record<Suit,string>={S:'♠',H:'♥',D:'♦',C:'♣'};
export const rank=(n:number)=>({11:'J',12:'Q',13:'K',14:'A'}[n]??String(n));
export function makeDeck(){const deck:Card[]=[];const add=(kind:string,suit:Suit,values:number[])=>values.forEach(rank=>deck.push({id:`c${deck.length}`,kind,suit,rank}));const seq=(a:number,b:number)=>Array.from({length:b-a+1},(_,i)=>a+i);
 add('barrel','S',[12,13]);add('dynamite','H',[2]);add('jail','S',[11,10]);add('jail','H',[4]);add('mustang','H',[8,9]);add('remington','C',[13]);add('carabine','C',[14]);add('schofield','C',[11,12]);add('schofield','S',[13]);add('scope','S',[14]);add('volcanic','S',[10]);add('volcanic','C',[10]);add('winchester','S',[8]);add('bang','S',[14]);add('bang','D',seq(2,14));add('bang','C',seq(2,9));add('bang','H',[12,13,14]);add('beer','H',seq(6,11));add('cat','H',[13]);add('cat','D',[9,10,11]);add('duel','D',[12]);add('duel','S',[11]);add('duel','C',[8]);add('gatling','H',[10]);add('store','C',[9]);add('store','S',[12]);add('indians','D',[13,14]);add('missed','C',seq(10,14));add('missed','S',seq(2,8));add('panic','H',[11,12,14]);add('panic','D',[8]);add('saloon','H',[5]);add('stagecoach','S',[9,9]);add('wells','H',[3]);return deck;}

CHARACTERS.none={name:'Без способности',hp:4,file:'',text:'Похмелье: способности временно отключены.'};
