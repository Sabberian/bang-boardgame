import {CARDS,CHARACTERS,type Card,type CardInfo,type Suit} from './content';
export const TRAIN_RULES_URL='https://www.dvgiochi.com/giochi/BangTheGreatTrainRobbery/download/BANG-TGTR-ENG-rules_WEB.pdf';
export const TRAIN_CATALOG_URL='https://bang.dvgiochi.com/cardslist.php?id=20&lang=en';
const definitions:Record<string,Omit<CardInfo,'file'>>={
 dragoon:{name:'Драгун',blue:true,range:2,art:'27_Dragoon',text:'Дальность 2. В свой ход можно сыграть на один Бэнг! больше.'},
 strongbox:{name:'Сейф',blue:true,art:'28_Strongbox',text:'В конце своего хода после сброса лишних карт возьмите карту, даже если пропустили ход в Тюрьме.'},
 map:{name:'Карта',blue:true,art:'29_Map',text:'Перед добором посмотрите две верхние карты колоды. Одну из них можно сбросить.'},
 refund:{name:'Возмещение',blue:true,art:'30_Refund',text:'Когда другой игрок забирает или сбрасывает другую вашу карту, возьмите карту. Не действует на Ограбление поезда.'},
 switch:{name:'Стрелка',art:'31_Switch',text:'Обменяйте одну свою карту на столе на другую карту на столе.'},
 watertower:{name:'Водонапорная башня',art:'32_WaterTower',text:'Бесплатно возьмите любой вагон из поезда. Не расходует обычную покупку вагона и не позволяет продвинуть поезд.'},
 trainrobbery:{name:'Ограбление поезда',art:'33_TrainRobberyA',text:'Расходует Бэнг! хода. Для каждой своей карты на столе цель выбирает: сбросить её или стать целью отдельного выстрела.'},
 cactus:{name:'Кактус',effect:'miss',art:'34_Cactus',text:'Мимо! Сделайте проверку: червы — восстановите 1 жизнь.'},
 evaded:{name:'Увернулся!',effect:'miss',art:'35_Evaded',text:'Мимо! Возьмите карту, от которой только что уклонились, если она ещё доступна.'},
 mostwanted:{name:'Самые разыскиваемые',art:'36_MostWanted',text:'Каждый игрок делает проверку: пики — потеря 1 жизни. Если погибнут все, побеждают бандиты.'},
 kniferevolver:{name:'Револьвер с ножом',art:'37_KnifeRevolver',text:'Выстрел в пределах оружия, расходует Бэнг! хода. Проверка: валет, дама, король или туз — верните эту карту в руку.'},
 moneybag:{name:'Мешок денег',art:'38_MoneyBag',text:'В свой ход повторите эффект верхней коричневой карты сброса.'},
 fullsteam:{name:'Полный пар',art:'39_FullSteam',text:'Поезд доходит до конца линии. Выберите: отменить эффект локомотива или выполнить его дважды.'},
 nextstop:{name:'Следующая остановка',art:'40_NextStopA',text:'Возьмите карту и продвиньте поезд на одну станцию.'}
};
for(const [id,c] of Object.entries(definitions))CARDS[id]={...c,file:'',art:`20_${c.art}.png`,expansion:'train'};
const chars:Record<string,[string,number,string,string]>={
 benny:['Бенни Буян',4,'19_BennyBrawler','Может покупать любое число вагонов за ход. Бесплатно продвинуть поезд перед покупкой можно только один раз.'],
 evan:['Эван Бэббит',4,'20_EvanBabbit','На карту Бэнг! может сбросить карту той же масти и перенаправить её на другого игрока на расстоянии 1, кроме стрелявшего.'],
 jimmy:['Джимми Техас',4,'21_JimmyTexas','В конце своего хода после сброса лишних карт берёт карту, даже после Тюрьмы.'],
 manuelita:['Мануэлита',4,'22_Manuelita','Когда поезд достигает конца линии, берёт две карты до эффекта локомотива.'],
 sancho:['Санчо',3,'23_Sancho','Раз за свой ход может взять любой вагон поезда бесплатно вместо обычной покупки.'],
 shade:['Шейд О’Коннор',4,'24_ShadeOConnor','Когда поезд движется вне её хода, может сбросить карту руки и взять новую.'],
 blaze:['Сержант Блейз',5,'25_SgtBlaze','Когда его карта или эффект затрагивает нескольких игроков, может исключить одного.'],
 zippy:['Зиппи Рой',5,'26_ZippyRoy','Раз за свой ход может продвинуть поезд на одну станцию.']
};
export const TRAIN_CHARACTER_IDS=Object.keys(chars);
for(const [id,[name,hp,file,text]]of Object.entries(chars))CHARACTERS[id]={name,hp,file:'',art:`20_${file}.png`,text,expansion:'train'};
export function trainDeck():Card[]{return ['dragoon:JS','strongbox:9H','map:3D','refund:3S','switch:6H','watertower:8H','trainrobbery:4D','trainrobbery:JC','cactus:7H','evaded:QC','mostwanted:KS','kniferevolver:5D','moneybag:QC','fullsteam:2S','nextstop:2D','nextstop:KC'].map((spec,i)=>{const [kind,p]=spec.split(':');return{id:`train-${i}`,kind,suit:p.at(-1) as Suit,rank:({A:14,K:13,Q:12,J:11} as Record<string,number>)[p.slice(0,-1)]??Number(p.slice(0,-1))};});}
export const STATIONS:Record<string,{name:string;art:string;text:string}>={
 boom:{name:'Бум-таун',art:'01_Boomtown',text:'Сбросьте Бэнг!'},virginia:{name:'Вирджиния-таун',art:'02_Virginiatown',text:'Сбросьте две любые карты'},creepy:{name:'Крипи-Крик',art:'03_CreepyCreek',text:'Сбросьте пики'},deathwood:{name:'Дедвуд',art:'04_Deathwood',text:'Сбросьте синюю карту'},dodgeville:{name:'Доджвилл',art:'05_Dodgeville',text:'Сбросьте Мимо!'},tombrock:{name:'Томброк',art:'06_Tombrock',text:'Потеряйте одну жизнь, кроме последней'},fort:{name:'Форт-Рот',art:'07_FortWroth',text:'Сбросьте 10, валета, даму, короля или туза'},catico:{name:'Катико',art:'08_Catico',text:'Сбросьте Панику! или Красотку Кэт'},santafe:{name:'Сан-Тафе',art:'09_SanTafe',text:'Сбросьте червы'},miners:{name:'Клятва шахтёра',art:'10_MinersOath',text:'Сбросьте бубны'},yooma:{name:'Юма',art:'11_Yooma',text:'Сбросьте карту от 2 до 9'},frisco:{name:'Фриско',art:'12_Frisco',text:'Сбросьте трефы'},crown:{name:'Краунс-Хоул',art:'13_CrownsHole',text:'Сбросьте Пиво'}
};
for(const s of Object.values(STATIONS))s.art=`20_${s.art}.png`;
export const RAILCARS:Record<string,{name:string;art:string;text:string}>={};
export function railcarDeck():Card[]{return Object.keys(RAILCARS).map(kind=>({id:`rail-${kind}`,kind,suit:'S',rank:0}));}
export const isRailcar=(c:Card)=>!!RAILCARS[c.kind];
const rails:Record<string,[string,string,string]>={
 baggage:['Багажный вагон','03_BaggageCar','Сбросьте: эффект Мимо!, Паники!, Красотки Кэт или дополнительного Бэнг!.'],
 sleeper:['Спальный вагон','04_SleeperCar','Раз за ход можно сбросить другую свою синюю карту, включая вагон, как дополнительный Бэнг!, в том числе в ответ на Дуэль или Индейцев.'],
 caboose:['Тормозной вагон','05_Caboose','Можно сбросить другую свою синюю карту, включая вагон, как Мимо!.'],
 cattle:['Скотовоз','06_CattleTruck','Сбросьте: посмотрите три верхние карты сброса и возьмите одну.'],
 circus:['Цирковой вагон','07_CircusWagon','Сбросьте: каждый другой игрок сбрасывает одну свою карту со стола.'],
 coal:['Угольный вагон','08_CoalHopper','Сбросьте: возьмите карту и сбросьте вагон перед любым игроком.'],
 dining:['Вагон-ресторан','09_DiningCar','В начале хода сделайте проверку: червы — восстановите жизнь.'],
 express:['Экспресс','10_ExpressCar','Сбросьте: немедленно закончите ход, сбросьте всю руку и сыграйте дополнительный. Нельзя получить ещё один дополнительный ход после него.'],ghostcar:['Вагон-призрак','11_GhostCar','На любого игрока, кроме шерифа. После смерти он остаётся в игре без жизней и сбрасывает всю руку в конце хода.'],
 prisoner:['Тюремный вагон','12_PrisonerCar','Карты Дуэль и Индейцы, сыгранные другими игроками, не действуют на вас.'],
 lumber:['Лесовоз','13_LumberFlatcar','На любого игрока. Он видит всех остальных на расстоянии +1.'],
 lounge:['Салон-вагон','14_LoungeCar','Сбросьте: возьмите два вагона из колоды. Один положите перед собой, второй — перед другим игроком.'],
 observation:['Обзорный вагон','15_ObservationCar','Вы видите остальных на расстоянии −1, остальные видят вас на расстоянии +1.'],
 mail:['Почтовый вагон','16_MailCar','Сбросьте: возьмите три карты и отдайте одну из них другому игроку.'],
 passenger:['Пассажирский вагон','17_PassengerCar','Сбросьте: возьмите карту из руки или со стола любого другого игрока.'],
 private:['Личный вагон','18_PrivateCar','Пока ваша рука пуста, вас нельзя выбрать целью карты Бэнг!. Не защищает от других выстрелов.']
};
for(const [id,[name,art,text]]of Object.entries(rails)){const kind=`rail_${id}`;RAILCARS[kind]={name,art:`20_${art}.png`,text};CARDS[kind]={...RAILCARS[kind],file:'',blue:true,expansion:'train'};}
