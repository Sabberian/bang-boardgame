/** Fame state is serializable and belongs inside the game's undo snapshot. */
export interface FeatInPlay {kind:string;tokens:Record<string,number>}
export interface LegendsState {deck:string[];discard:string[];feats:FeatInPlay[];fame:Record<string,number>;legendary:string[];retired:string[];performed:string[];claimUsed:string[];boasting?:string}
export interface LegendsHost {shuffle:(cards:string[])=>string[];healToThree:(id:string)=>void;hit:(source:string,target:string)=>void;hp:(id:string)=>number;isSlab:(id:string)=>boolean;alive:(id:string)=>boolean}
export function createLegends(seats:string[],kinds:string[],shuffle:LegendsHost['shuffle']):LegendsState {const deck=shuffle([...kinds]);return {deck,discard:[],feats:[{kind:deck.pop()!,tokens:{}}],fame:Object.fromEntries(seats.map(id=>[id,5])),legendary:[],retired:[],performed:[],claimUsed:[]}}
function reveal(s:LegendsState,h:LegendsHost){if(!s.deck.length)s.deck=h.shuffle(s.discard.splice(0));const kind=s.deck.pop();if(kind)s.feats.push({kind,tokens:{}})}
function transform(s:LegendsState,id:string,h:LegendsHost){if(s.fame[id]===0&&!s.legendary.includes(id)&&!s.retired.includes(id)){s.legendary.push(id);h.healToThree(id)}}
export function legendsStartTurn(s:LegendsState){s.performed=[];s.claimUsed=[];delete s.boasting}
/** Call only after the host has verified the printed feat condition from recorded actions. */
export function performFeat(s:LegendsState,id:string,kind:string,h:LegendsHost):boolean {const f=s.feats.find(f=>f.kind===kind);if(!f||f.tokens[id]||s.legendary.includes(id)||s.retired.includes(id)||!s.fame[id])return false;const n=Math.min(2,s.fame[id]);f.tokens[id]=n;s.fame[id]-=n;if(!s.performed.includes(id))s.performed.push(id);transform(s,id,h);return true}
/** Begin before advancing the turn (also on a skipped Jail turn). */
export function beginBoast(s:LegendsState,id:string,h:LegendsHost):boolean {if(s.boasting||s.performed.includes(id)||s.legendary.includes(id)||s.retired.includes(id)||!s.fame[id])return false;s.boasting=id;reveal(s,h);return true}
export function boastDiscardChoices(s:LegendsState):string[]{if(s.feats.length<=4)return [];const count=(f:FeatInPlay)=>Object.values(f.tokens).reduce((a,b)=>a+b,0);const max=Math.max(...s.feats.map(count));return s.feats.filter(f=>count(f)===max).map(f=>f.kind)}
export function discardBoastFeat(s:LegendsState,kind:string):boolean{if(!s.boasting||!boastDiscardChoices(s).includes(kind))return false;const at=s.feats.findIndex(f=>f.kind===kind);s.discard.push(s.feats.splice(at,1)[0].kind);return true}
export function finishBoast(s:LegendsState,id:string,kind:string,h:LegendsHost):boolean{const f=s.feats.find(f=>f.kind===kind);if(s.boasting!==id||s.feats.length>4||!f||f.tokens[id])return false;f.tokens[id]=1;s.fame[id]--;delete s.boasting;transform(s,id,h);return true}
export function claimTargets(s:LegendsState,id:string,h:LegendsHost):string[]{return s.legendary.filter(t=>t!==id&&h.alive(t)&&(h.hp(t)>1||h.isSlab(id)))}
/** Claim conditions are the same as perform conditions; target is optional. */
export function claimFeat(s:LegendsState,id:string,kind:string,target:string|undefined,h:LegendsHost):boolean{const at=s.feats.findIndex(f=>f.kind===kind);if(at<0||!s.legendary.includes(id)||(target&&!claimTargets(s,id,h).includes(target)))return false;s.claimUsed.push(id);s.discard.push(s.feats.splice(at,1)[0].kind);reveal(s,h);if(target)h.hit(id,target);return true}
export function reviveLegendaryVulture(s:LegendsState,id:string):boolean{if(!s.legendary.includes(id))return false;s.legendary=s.legendary.filter(p=>p!==id);s.retired.push(id);return true}
