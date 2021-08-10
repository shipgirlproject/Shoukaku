// idfk what this is lmao

import { Shoukaku } from './types/Shoukaku';
import * as Constants from './types/Constants';
import * as Libraries from './types/libraries/Libraries';
import { version } from './package.json'

declare module 'shoukaku' {
  export { Shoukaku, Constants, Libraries, version };
}
