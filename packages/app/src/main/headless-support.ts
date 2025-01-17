/*
 * Copyright 2018 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Debug from 'debug'

import { print } from './headless-pretty-print'
const debug = Debug('core/main/headless-support')

/**
 * This supports commads streaming their output to the console
 *
 * @see repl.ts for use of createOutputStream
 * @see cli.ts for the webapp implementation
 *
 */
export const streamTo = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (response: any) => {
    debug('streaming response', response)
    print(response)
  }
}
