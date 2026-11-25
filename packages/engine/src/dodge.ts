import {CARDS,CHARACTERS,type Card,type CardInfo,type Suit} from './content';
const definitions:Record<string,Omit<CardInfo,'file'>>={
 binocular:{name:'Бинокль',blue:true,art:'03_binocolo.png',text:'Другие игроки для вас на 1 ближе. Складывается с Прицелом.'},
 hideout:{name:'Укрытие',blue:true,art:'03_riparo.png',text:'Для других игроков вы на 1 дальше. Складывается с Мустангом.'},
 brawl:{name:'Потасовка',cost:true,effect:'brawl',art:'03_rissa.png',text:'Сбросьте ещё одну карту. У каждого другого игрока выберите карту для сброса.'},
 dodge:{name:'Уклонение',effect:'miss',draw:1,art:'03_schivata.png',text:'Отмените один выстрел в вас и возьмите карту.'},
 punch:{name:'Удар',effect:'shoot',distance:1,art:'03_pugno.png',text:'Один выстрел по игроку на дистанции 1. Не расходует лимит Бэнг!.'},
 ragtime:{name:'Рэгтайм',effect:'steal',cost:true,art:'03_rag_time.png',text:'Сбросьте ещё одну карту. Заберите случайную карту руки или выбранную карту со стола другого игрока на любой дистанции.'},
 springfield:{name:'Спрингфилд',effect:'shoot',cost:true,art:'03_springfield.png',text:'Сбросьте ещё одну карту. Один выстрел по любому другому игроку.'},
 tequila:{name:'Текила',effect:'heal',cost:true,heal:1,art:'03_tequila.png',text:'Сбросьте ещё одну карту. Выбранный живой игрок, включая вас, восстанавливает 1 жизнь.'},
 whisky:{name:'Виски',effect:'heal',cost:true,heal:2,art:'03_whisky.png',text:'Сбросьте ещё одну карту. Восстановите 2 жизни.'},
 bible:{name:'Библия',green:true,effect:'miss',draw:1,art:'03_bibbia.png',text:'Начиная со следующего хода: сбросьте, отмените один выстрел и возьмите карту.'},
 buffalo:{name:'Охотничье ружьё',green:true,effect:'shoot',art:'03_fucile_da_caccia.png',text:'Начиная со следующего хода: сбросьте в свой ход для выстрела по любому другому игроку.'},
 cancan:{name:'Канкан',green:true,effect:'discard',art:'03_can_can.png',text:'Начиная со следующего хода: сбросьте в свой ход и сбросьте выбранную карту другого игрока.'},
 canteen:{name:'Фляга',green:true,effect:'heal',heal:1,art:'03_borraccia.png',text:'Начиная со следующего хода: сбросьте в свой ход и восстановите 1 жизнь.'},
 conestoga:{name:'Фургон',green:true,effect:'steal',art:'03_conestoga.png',text:'Начиная со следующего хода: сбросьте в свой ход и заберите карту другого игрока на любой дистанции.'},
 derringer:{name:'Дерринджер',green:true,effect:'shoot',distance:1,draw:1,art:'03_derringer.png',text:'Начиная со следующего хода: сбросьте в свой ход, выстрелите на дистанцию 1 и возьмите карту.'},
 howitzer:{name:'Гаубица',green:true,effect:'allshoot',art:'03_howitzer.png',text:'Начиная со следующего хода: сбросьте в свой ход для выстрела по каждому другому игроку.'},
 iron:{name:'Железная пластина',green:true,effect:'miss',art:'03_placca_di_ferro.png',text:'Начиная со следующего хода: сбросьте, чтобы отменить один выстрел в вас.'},
 knife:{name:'Нож',green:true,effect:'shoot',distance:1,art:'03_pugnale.png',text:'Начиная со следующего хода: сбросьте в свой ход для выстрела на дистанцию 1.'},
 pepperbox:{name:'Пеппербокс',green:true,effect:'shoot',distance:0,art:'03_pepperbox.png',text:'Начиная со следующего хода: сбросьте в свой ход для выстрела в пределах дальности оружия.'},
 pony:{name:'Пони-экспресс',green:true,effect:'draw',draw:3,art:'03_pony_express.png',text:'Начиная со следующего хода: сбросьте в свой ход и возьмите 3 карты.'},
 sombrero:{name:'Сомбреро',green:true,effect:'miss',art:'03_sombrero.png',text:'Начиная со следующего хода: сбросьте, чтобы отменить один выстрел.'},
 hat:{name:'Сомбреро на десять галлонов',green:true,effect:'miss',art:'03_cappello.png',text:'Начиная со следующего хода: сбросьте, чтобы отменить один выстрел.'},
};
for(const [id,c] of Object.entries(definitions))CARDS[id]={...c,file:'',expansion:'dodge'};
const characters:Record<string,[string,number,string,string]>={
 apache:['Малыш Апач',3,'apache_kid','Неуязвим к бубновым картам других игроков. Карты ответа в дуэли не блокируются.'],
 belle:['Белль Стар',4,'belle_star','В её ход карты на столе других игроков не действуют. Способности персонажей сохраняются.'],
 bill:['Билл Безликий',4,'bill_noface','В начале хода берёт 1 карту плюс по карте за каждую недостающую жизнь.'],
 chuck:['Чак Венгэм',4,'chuck_wengam','В свой ход может потерять 1 жизнь и взять 2 карты. Нельзя потратить последнюю жизнь.'],
 doc:['Док Холидей',4,'doc_holyday','Раз в свой ход сбрасывает две карты для выстрела в пределах оружия, сверх лимита Бэнг!.'],
 elena:['Елена Фуэнте',3,'elena_fuente','Может использовать любую карту руки как Мимо!.'],
 greg:['Грег Диггер',4,'greg_digger','Когда другой игрок выбывает, восстанавливает 2 жизни.'],
 herb:['Херб Хантер',4,'herb_hunter','Когда другой игрок выбывает, берёт 2 карты.'],
 jose:['Хосе Дельгадо',4,'jose_delgado','Дважды за свой ход может сбросить синюю карту руки и взять 2 карты.'],
 molly:['Молли Старк',4,'molly_stark','Вне своего хода берёт карту за добровольно сыгранные Бэнг!, Мимо! и Пиво. Добор за дуэль — после её окончания.'],
 pat:['Пэт Бреннан',4,'pat_brennan','Вместо обеих карт начала хода может взять в руку одну карту со стола любого игрока.'],
 pixie:['Пикси Пит',3,'pixie_pete','В начале хода берёт 3 карты вместо 2.'],
 sean:['Шон Мэллори',3,'sean_mallory','В конце хода может оставить в руке до 10 карт.'],
 joe:['Текила Джо',4,'tequila_joe','Каждое Пиво восстанавливает ему 2 жизни. При двух живых игроках Пиво по-прежнему не действует.'],
 vera:['Вера Кастер',3,'vera_custer','Перед добором выбирает способность другого живого персонажа до следующего выбора.'],
};
export const DODGE_CHARACTER_IDS=Object.keys(characters);
for(const [id,[name,hp,file,text]] of Object.entries(characters))CHARACTERS[id]={name,hp,file:'',art:`03_${file}.png`,text,expansion:'dodge'};
export function dodgeDeck():Card[]{const out:Card[]=[];const add=(kind:string,values:string)=>values.split(' ').forEach(v=>{const m=v.match(/^(\d+|[JQKA])([SHDC])$/)!;out.push({id:`d${out.length}`,kind,rank:({J:11,Q:12,K:13,A:14} as Record<string,number>)[m[1]]??Number(m[1]),suit:m[2] as Suit});});
 add('barrel','AC');add('binocular','10D');add('dynamite','10C');add('hideout','KD');add('mustang','5H');add('remington','6D');add('carabine','5S');add('bang','8S 5C 6C KC');add('beer','6H 6S');add('brawl','JS');add('cat','8C');add('dodge','7D KH');add('store','AS');add('indians','5D');add('missed','8D');add('panic','JH');add('punch','10S');add('ragtime','9H');add('springfield','KS');add('tequila','9C');add('whisky','QD');add('bible','10H');add('buffalo','QC');add('cancan','JC');add('canteen','7H');add('conestoga','9D');add('derringer','7S');add('howitzer','9S');add('iron','AD QS');add('knife','8H');add('pepperbox','AH');add('pony','QD');add('sombrero','7C');add('hat','JD');return out;
}
