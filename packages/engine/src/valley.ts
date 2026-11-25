import {CARDS,CHARACTERS,type Card,type CardInfo,type Suit} from './content';
const definitions:Record<string,Omit<CardInfo,'file'>>={
 bounty:{name:'Награда',blue:true,art:'07_taglia.png',text:'На любого игрока. Когда его ранит карта Бэнг!, стрелявший берёт карту.'},
 phantom:{name:'Призрак',blue:true,art:'07_fantasma.png',text:'Верните выбывшего игрока без жизней. Он не получает и не теряет жизни, сбрасывает всю руку в конце хода. Если убрать эту карту, он вновь выбывает.'},
 lemat:{name:'Ле Ма',blue:true,range:1,art:'07_lemat.png',text:'В свой ход можно использовать любую карту руки как Бэнг!, соблюдая обычный лимит.'},
 snake:{name:'Гремучая змея',blue:true,art:'07_serpenteasonagli.png',text:'На любого игрока. После Динамита и Тюрьмы он делает проверку: пики — потеря 1 жизни. Змея остаётся на столе.'},
 shotgun:{name:'Дробовик',blue:true,range:1,art:'07_shotgun.png',text:'Когда вы раните игрока, он сбрасывает одну выбранную карту руки.'},
 aim:{name:'Прицеливание',cost:true,effect:'shoot',distance:0,art:'07_mira.png',text:'Сыграйте вместе с Бэнг!. Попадание отнимает 2 жизни, для защиты достаточно одного Мимо!. Расходует лимит Бэнг!.'},
 backfire:{name:'Ответный огонь',effect:'miss',art:'07_ritornodifiamma.png',text:'Считается Мимо!. Стрелявший в вас получает ответный выстрел.'},
 bandidos:{name:'Бандитос',art:'07_bandidos.png',text:'Все другие игроки выбирают: сбросить 2 карты руки (1, если она единственная) или потерять 1 жизнь.'},
 escape:{name:'Побег',art:'07_fuga.png',text:'Вне своего хода отмените для себя эффект коричневой карты, кроме Бэнг!.'},
 fanning:{name:'Веерный огонь',art:'07_sventagliata.png',text:'Расходует лимит Бэнг!. Выстрелите по цели в пределах оружия и по другому игроку на расстоянии 1 от неё, кроме себя.'},
 lastcall:{name:'Последний стакан',effect:'heal',heal:1,art:'07_ultimogiro.png',text:'Восстановите 1 жизнь в свой ход. Действует и при двух игроках, но не спасает вне хода.'},
 poker:{name:'Покер',art:'07_poker.png',text:'Все другие игроки одновременно сбрасывают по карте руки. Если среди них нет тузов, возьмите до двух из этих карт.'},
 saved:{name:'Спасён!',art:'07_salvo.png',text:'Вне своего хода предотвратите потерю 1 жизни другим игроком. Если он выжил, возьмите до двух выбранных карт из его руки.'},
 tomahawk:{name:'Томагавк',effect:'shoot',distance:2,art:'07_tomahawk.png',text:'Выстрел по игроку на расстоянии не более 2. Не расходует лимит Бэнг!.'},
 tornado:{name:'Торнадо',art:'07_tornado.png',text:'Каждый игрок сбрасывает одну карту руки, если может, и берёт две карты.'},
};
for(const [id,c] of Object.entries(definitions))CARDS[id]={...c,file:'',expansion:'valley'};
const chars:Record<string,[string,number,string,string]>={
 flower:['Чёрный Цветок',4,'blackflower','Раз за свой ход может сыграть трефовую карту как дополнительный Бэнг!.'],
 colorado:['Колорадо Билл',4,'coloradobill','Когда играет Бэнг!, делает проверку. Пики — от этого выстрела нельзя уклониться.'],
 ringer:['Дер Спот',4,'derspot','Раз за свой ход может использовать Бэнг! как Гатлинг, не расходуя лимит Бэнг!.'],
 evelyn:['Эвелин Шебанг',4,'evelynshebang','До добора решает, сколько карт не брать. За каждую пропущенную карту стреляет по разной цели в пределах оружия.'],
 henry:['Генри Блок',4,'henryblock','Тот, кто забирает или сбрасывает его карту, сначала получает выстрел. Автоматическая способность Гринго не вызывает ответ.'],
 jim:['Лимонадный Джим',4,'lemonadejim','Когда другой игрок играет Пиво, может сбросить карту руки и восстановить 1 жизнь.'],
 mick:['Мик Защитник',4,'mickdefender','Может сыграть Мимо!, чтобы отменить для себя эффект коричневой карты, кроме Бэнг!.'],
 tuco:['Туко Францисканер',5,'tucofranziskaner','В фазе добора берёт 2 дополнительные карты, если перед ним нет синих карт.'],
};
export const VALLEY_CHARACTER_IDS=Object.keys(chars);
for(const [id,[name,hp,file,text]] of Object.entries(chars))CHARACTERS[id]={name,hp,file:'',art:`07_${file}.png`,text,expansion:'valley'};
export function valleyDeck():Card[]{return (['bounty:9C','phantom:9S','phantom:10S','lemat:4D','snake:7H','shotgun:KS','aim:6C','backfire:QC','bandidos:QD','escape:3H','fanning:2S','lastcall:8D','poker:JH','saved:5H','tomahawk:AD','tornado:AC']).map((spec,i)=>{const [kind,poker]=spec.split(':');const face=poker.slice(0,-1);return {id:'v'+i,kind,rank:({J:11,Q:12,K:13,A:14} as Record<string,number>)[face]??Number(face),suit:poker.at(-1) as Suit};});}
