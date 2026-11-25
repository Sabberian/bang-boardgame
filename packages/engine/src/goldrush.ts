import {CHARACTERS} from './content';
export interface Equipment {id:string;kind:string}
export const EQUIPMENT:Record<string,{name:string;file:string;cost:number;count:number;permanent?:boolean;text:string}>={
 boots:{name:'Сапоги',file:'stivali',cost:3,count:1,permanent:true,text:'За каждую потерянную жизнь, кроме последней, возьмите карту.'},
 bottle:{name:'Бутылка',file:'bottiglia',cost:2,count:3,text:'Выберите эффект: Паника!, Пиво или дополнительный Бэнг!. Это не розыгрыш соответствующей карты.'},
 calumet:{name:'Калумет',file:'calumet',cost:3,count:1,permanent:true,text:'Бубновые карты других игроков не действуют на вас. Не защищает от ответов в дуэли.'},
 goldpan:{name:'Промывочный лоток',file:'setaccio',cost:3,count:1,permanent:true,text:'В свой ход платите 1 самородок за карту. Не более двух раз за ход.'},
 rush:{name:'Золотая лихорадка',file:'corsa_all_oro',cost:5,count:1,text:'Закончите ход, восстановите все жизни и сразу сыграйте дополнительный ход.'},
 belt:{name:'Патронташ',file:'cinturone',cost:2,count:1,permanent:true,text:'В конце хода можно оставить 8 карт.'},
 horseshoe:{name:'Подкова',file:'ferro_di_cavallo',cost:2,count:1,permanent:true,text:'При проверке откройте на одну карту больше и выберите результат.'},
 charm:{name:'Талисман',file:'talismano',cost:3,count:1,permanent:true,text:'За каждую потерянную жизнь, кроме последней, получите самородок.'},
 pardner:{name:'Подельник',file:'complice',cost:2,count:3,text:'Выберите эффект: Магазин, Дуэль или Красотка Кэт. Это не розыгрыш соответствующей карты.'},
 pickaxe:{name:'Кирка',file:'piccone',cost:4,count:1,permanent:true,text:'При доборе в начале хода берите на одну карту больше.'},
 rhum:{name:'Ром',file:'rum',cost:3,count:2,text:'Проверьте 4 карты: восстановите по жизни за каждую разную масть. Счастливчик и Подкова дают дополнительные карты проверки.'},
 rucksack:{name:'Рюкзак',file:'zaino',cost:3,count:1,permanent:true,text:'Платите 2 самородка за восстановление жизни. Можно спасаться при потере последней жизни.'},
 shot:{name:'Стопка',file:'bicchierino',cost:1,count:3,text:'Выбранный игрок, включая вас, восстанавливает одну жизнь.'},
 union:{name:'Юнион Пасифик',file:'union_pacific',cost:4,count:1,text:'Возьмите 4 карты.'},
 wanted:{name:'Разыскивается',file:'ricercato',cost:2,count:3,permanent:true,text:'Положите перед любым игроком. Убивший его получает дополнительно 2 карты и 1 самородок.'}
};
export function equipmentDeck():Equipment[]{return Object.entries(EQUIPMENT).flatMap(([kind,x])=>Array.from({length:x.count},(_,i)=>({id:`gold-${kind}-${i}`,kind})));}
const characters:Record<string,[string,number,string,string]>={
 don:['Дон Белл',4,'don_bell','В конце обычного хода проверяет карту. Червы или бубны дают дополнительный ход. Не срабатывает после Тюрьмы и в конце дополнительного хода.'],
 dutch:['Датч Уилл',4,'dutch_will','При доборе сбрасывает одну из только что взятых карт по своему выбору и получает самородок.'],
 jacky:['Джеки Мурьета',4,'jacky_murieta','В свой ход платит 2 самородка за дополнительный выстрел Бэнг! без карты. Можно повторять.'],
 josh:['Джош Макклауд',4,'josh_mccloud','В свой ход платит 2 самородка и получает верхнюю карту снаряжения. Повторное постоянное снаряжение сбрасывает.'],
 yto:['Мадам Ито',4,'madame_yto','Берёт карту каждый раз, когда любой игрок, включая её, играет Пиво, в том числе ради самородка.'],
 luzena:['Красотка Лузена',4,'pretty_luzena','Раз за свой ход может купить снаряжение со скидкой в 1 самородок.'],
 raddie:['Рэдди Снейк',4,'raddie_snake','В свой ход может дважды заплатить по 1 самородку, чтобы взять по карте.'],
 simeon:['Симеон Пикос',4,'simeon_picos','За каждую потерянную жизнь получает самородок.']
};
for(const [id,[name,hp,file,text]] of Object.entries(characters))CHARACTERS[id]={name,hp,file:'',art:`04_${file}.png`,text,expansion:'gold'};
export const GOLD_CHARACTER_IDS=Object.keys(characters);

