import { Shoukaku } from './types/Shoukaku';
import { Utils } from './types/Utils'; 
import { ShoukakuConnection } from './types/guild/ShoukakuConnection';
import { ShoukakuPlayer } from './types/guild/ShoukakuPlayer';
import { ShoukakuRest } from './types/node/ShoukakuRest';
import { ShoukakuSocket } from './types/node/ShoukakuSocket';
import { ShoukakuFilter } from './types/struct/ShoukakuFilter';
import { ShoukakuStats } from './types/struct/ShoukakuStats';

import * as Constants from './types/Constants';
import * as Libraries from './types/libraries/Libraries';

import { version } from './package.json'

declare module 'shoukaku' {
  export { 
    Shoukaku, 
    Utils, 
    ShoukakuConnection, 
    ShoukakuPlayer, 
    ShoukakuRest, 
    ShoukakuSocket, 
    ShoukakuFilter, 
    ShoukakuStats, 
    Constants, 
    Libraries, 
    version 
  };
}
