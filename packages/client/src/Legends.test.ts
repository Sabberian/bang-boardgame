import {it,expect} from 'vitest';
import {legendIntentReady} from './Legends';
it('first legend can claim an eligible feat without another legend target',()=>{expect(legendIntentReady({type:'legend-claim',choice:'border'},[])).toBe(true);});
it('optional claim target does not change mandatory attack targeting',()=>{expect(legendIntentReady({type:'legend-claim'},[],'1')).toBe(true);expect(legendIntentReady({type:'legend-bang',card:'c'},[])).toBe(false);expect(legendIntentReady({type:'legend-bang',card:'c'},[],'1')).toBe(true);});
