import {CARDS,CHARACTERS,type Card,type CardInfo,type Suit} from './content';
export interface DangerousInfo extends CardInfo {orange?:boolean;loadCost?:number;upgradeCost?:number}
const definitions:Record<string,Omit<DangerousInfo,'file'>>={
 nip:{name:'Глоток',art:'17_cicchetto.png',text:'Восстановите 1 жизнь; за каждые 3 заряда ещё 1. Только в свой ход.',upgradeCost:3},
 arrow:{name:'Стрела',art:'17_freccia.png',text:'Цель сбрасывает настоящий Бэнг! или теряет жизнь. За каждый заряд добавьте другую цель.',upgradeCost:1},
 caravan:{name:'Караван',art:'17_carovana.png',text:'Возьмите 2 карты; за каждые 2 заряда ещё 1.',upgradeCost:2},
 duck:{name:'Пригнись!',art:'17_giulatesta.png',text:'Отмените один выстрел. За 2 заряда верните эту карту в руку.',effect:'miss',upgradeCost:2},
 flintlock:{name:'Кремнёвый пистолет',art:'17_flintlock.png',text:'Выстрел в пределах дальности оружия. Если отменён, можно заплатить 2 заряда и вернуть карту.',effect:'shoot',upgradeCost:2},
 quickshot:{name:'Быстрый выстрел',art:'17_colporapido.png',text:'Выстрел в пределах дальности оружия. За каждый заряд ещё одна другая цель в пределах дальности.',effect:'shoot',upgradeCost:1},
 reloading:{name:'Перезарядка',art:'17_ricarica.png',text:'Распределите 3 заряда между персонажем и своими опасными картами. Максимум 4 на каждой.'},
 rust:{name:'Ржавчина',art:'17_ruggine.png',text:'Все остальные снимают 1 заряд с каждой опасной карты и персонажа. Переместите их на своего персонажа, не больше 4.'},
 squaw:{name:'Скво',art:'17_squaw.png',text:'Сбросьте карту со стола любого игрока. За 2 заряда заберите её в руку.',upgradeCost:2},
 sleeve:{name:'Туз в рукаве',art:'17_assonellamanica.png',orange:true,blue:true,loadCost:2,text:'Потратьте 2 заряда с этой карты: возьмите 1 карту.'},
 bandolier:{name:'Патронташ',art:'17_bandoliera.png',orange:true,blue:true,loadCost:1,text:'Один раз за ход потратьте 1 заряд с этой карты: можно сыграть дополнительный Бэнг!.'},
 beerkeg:{name:'Бочонок пива',art:'17_fustodibirra.png',orange:true,blue:true,loadCost:3,text:'В свой ход потратьте 3 заряда с этой карты: восстановите 1 жизнь.'},
 belltower:{name:'Колокольня',art:'17_campanile.png',orange:true,blue:true,loadCost:1,text:'Потратьте 1 заряд с этой карты: для следующей сыгранной карты все игроки на дистанции 1.'},
 bigfifty:{name:'Большой калибр',art:'17_bigfifty.png',orange:true,blue:true,range:6,loadCost:1,text:'Дальность 6. При настоящем Бэнг! за 1 заряд отключите карты и способность цели до конца выстрела.'},
 bomb:{name:'Бомба',art:'17_bomba.png',orange:true,blue:true,text:'Сыграйте на любого игрока. В начале хода проверка: ♥♦ — передайте другому; ♠♣ — снимите 2 заряда. При истощении взрывается: −2 жизни.'},
 buntline:{name:'Бантлайн',art:'17_buntlinespecial.png',orange:true,blue:true,range:2,loadCost:1,text:'Дальность 2. При Бэнг! за 1 заряд: если выстрел отменён, цель сбрасывает карту с руки.'},
 crate:{name:'Ящик',art:'17_cassa.png',orange:true,blue:true,loadCost:2,text:'Потратьте 2 заряда с этой карты: отмените один выстрел.'},
 doublebarrel:{name:'Двустволка',art:'17_doppiacanna.png',orange:true,blue:true,range:1,loadCost:1,text:'Дальность 1. При Бэнг! ♦ за 1 заряд выстрел нельзя отменить.'},
 lockpick:{name:'Отмычка',art:'17_grimaldello.png',orange:true,blue:true,loadCost:3,text:'За 3 заряда с этой карты заберите случайную карту с руки другого игрока на любой дистанции.'},
 thunderer:{name:'Громобой',art:'17_thunderer.png',orange:true,blue:true,range:3,loadCost:1,text:'Дальность 3. При Бэнг! за 1 заряд немедленно верните сыгранный Бэнг! в руку до ответа цели.'},
 tumbleweed:{name:'Перекати-поле',art:'17_cespuglio.png',orange:true,blue:true,loadCost:1,text:'За 1 заряд с этой карты любой игрок повторяет только что завершённую проверку. Можно вне своего хода.'},
 whip:{name:'Кнут',art:'17_frusta.png',orange:true,blue:true,loadCost:3,text:'За 3 заряда с этой карты сбросьте любую карту со стола.'}
};
for(const [kind,def] of Object.entries(definitions))CARDS[kind]={...def,file:kind,expansion:'armed'};
export const ARMED_CARDS=definitions;
export const isDangerous=(c:Card|string)=>!!definitions[typeof c==='string'?c:c.kind]?.orange;
export const loadCost=(kind:string)=>definitions[kind]?.loadCost??0;
const characters:Record<string,{name:string;hp:number;art:string;text:string}>={
 preacher:{name:'Эл Проповедник',hp:4,art:'17_alpreacher.png',text:'Когда другой игрок играет синюю или оранжевую карту, можно потратить 2 заряда, чтобы взять 1 карту.'},
 bass:{name:'Басс Гривз',hp:4,art:'17_bassgreeves.png',text:'Раз за свой ход можно сбросить карту с руки и добавить 2 заряда на одну свою опасную карту или персонажа.'},
 bloody:{name:'Кровавая Мэри',hp:4,art:'17_bloodymary.png',text:'Каждый раз, когда ваш настоящий Бэнг! отменён, возьмите 1 карту.'},
 frankie:{name:'Фрэнки Кэнтон',hp:4,art:'17_frankiecanton.png',text:'Раз за свой ход можно взять 1 заряд с любой опасной карты или чужого персонажа и положить на своего персонажа.'},
 julie:{name:'Джули Каттер',hp:4,art:'17_juliecutter.png',text:'Когда другой игрок отнял у вас хотя бы 1 жизнь, проверка: ♥♦ — автоматический выстрел в него без ограничения дальности.'},
 mexicali:{name:'Мексикали Кид',hp:4,art:'17_mexicalikid.png',text:'Раз за свой ход можно потратить 2 заряда для дополнительного выстрела в пределах дальности оружия без карты Бэнг!.'},
 abigail:{name:'Мисс Эбигейл',hp:4,art:'17_msabigail.png',text:'Можно игнорировать коричневые карты J, Q, K, A, если вы единственная цель.'},
 ringo:{name:'Рэд Ринго',hp:5,art:'17_redringo.png',text:'Начинаете с 4 зарядами. Раз за свой ход можно переместить до 2 зарядов с персонажа на свои опасные карты.'}
};
for(const [id,c] of Object.entries(characters))CHARACTERS[id]={...c,file:id,expansion:'armed'};
export const ARMED_CHARACTER_IDS=Object.keys(characters);
const rows:[string,Suit,number][]=[['nip','H',5],['arrow','D',5],['bang','H',6],['bang','C',2],['bang','D',2],['bang','D',3],['caravan','S',2],['cat','H',3],['duck','D',3],['flintlock','S',14],['missed','S',13],['quickshot','S',3],['reloading','D',4],['rust','S',9],['squaw','D',3],['sleeve','H',14],['bandolier','H',2],['beerkeg','H',4],['belltower','C',7],['bigfifty','S',12],['bomb','D',7],['buntline','S',11],['crate','H',3],['doublebarrel','C',6],['lockpick','C',2],['thunderer','C',3],['tumbleweed','C',4],['whip','C',5]];
export const armedDeck=():Card[]=>rows.map(([kind,suit,rank],i)=>({id:'armed-'+i,kind,suit,rank}));
