/*
 * Copyright 2018-19 IBM Corporation
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

import expandHomeDir from '@kui-shell/core/util/home'
import { findFile } from '@kui-shell/core/core/find-file'
const debug = Debug('k8s/util/fetch-file')

import needle = require('needle')

/**
 * Either fetch a remote file or read a local one
 *
 */
export const fetchFile = (url: string): Promise<Buffer[]> => {
  debug('fetchFile', url)

  const urls = url.split(/,/)

  return Promise.all(
    urls.map(async url => {
      if (url.match(/http(s)?:\/\//)) {
        debug('fetch remote', url)
        return needle('get', url, { follow_max: 10 }).then(_ => _.body)
      } else {
        debug('fetch local', url)

        // why the dynamic import? being browser friendly here
        const { readFile } = await import('fs-extra')

        return readFile(findFile(expandHomeDir(url)))
      }
    })
  )
}

/** same as fetchFile, but returning a string rather than a Buffer */
export const fetchFileString = (url: string): Promise<string[]> => {
  return fetchFile(url).then(_ => _.map(_ => _.toString()))
}
