import {CHARACTERS} from './content';
export const PROMO_CHARACTER_IDS=['annie','claus','johnny','uncle','emiliano'];
const data:Record<string,{name:string;hp:number;art:string;text:string}>={
 annie:{name:'Энни Версари',hp:4,art:'22_bonus-annie.png',text:'Может использовать любую карту руки как Бэнг!, соблюдая обычную дальность и лимит выстрелов.'},
 claus:{name:'Клаус Святой',hp:3,art:'22_bonus-ClausTheSaint.png',text:'При доборе берёт на одну карту больше числа игроков, оставляет себе две и дарит по одной каждому другому игроку.'},
 johnny:{name:'Джонни Киш',hp:4,art:'22_bonus-johnny-kisch.png',text:'Когда выкладывает карту перед собой, все остальные карты в игре с таким названием сбрасываются.'},
 uncle:{name:'Дядюшка Уилл',hp:4,art:'22_bonus-UncleWill.png',text:'Один раз в свой ход может сыграть любую карту руки как Магазин.'},
 emiliano:{name:'Эмилиано',hp:4,art:'22_bonus-emiliano.png',text:'Когда его Бэнг! отменяют картой Мимо!, забирает эту карту Мимо!. Когда сам отменяет Бэнг! картой Мимо!, забирает этот Бэнг!.'},
};
for(const [id,d] of Object.entries(data))CHARACTERS[id]={...d,file:id,expansion:'promos'};
