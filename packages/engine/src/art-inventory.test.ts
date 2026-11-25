import {it,expect} from 'vitest';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import './game';
import {CARDS,CHARACTERS,ROLES} from './content';
import {LEGEND_CHARACTERS,FEATS} from './legends';
import {STATIONS} from './train';
import {EVENTS} from './events';
it('every registered playing card, character, role, feat and station has local artwork',()=>{
 const paths=[...Object.values(CARDS).map(x=>x.art??`01_${x.file}.png`),...Object.values(CHARACTERS).filter(x=>x.file||x.art).map(x=>x.art??`01_${x.file}.png`),...Object.values(ROLES).map(x=>`01_${x.file}.png`),...Object.values(LEGEND_CHARACTERS).map(x=>x.art.replace('/art/','')),...Object.values(FEATS).map(x=>x.art.replace('/art/','')),...Object.values(STATIONS).map(x=>x.art),...Object.values(EVENTS).map(x=>x.art??`05_${x.file}.png`)];
 const missing=paths.filter(p=>!existsSync(resolve('packages/client/public/art',p)));expect(missing).toEqual([]);
});
