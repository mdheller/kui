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

import { readdir } from 'fs'
import { CommandRegistrar } from '@kui-shell/core/models/command'

import { contentDir } from './util'

import repl = require('@kui-shell/core/core/repl')

/**
 * Sort the available tutorials
 *
 */
const levelToNumber = { Beginner: 0, Intermediate: 1, Advanced: 2 }
const sort = list => {
  return list.sort((a, b) => {
    return (
      (a.sort !== undefined ? a.sort : levelToNumber[a.level]) -
        (b.sort !== undefined ? b.sort : levelToNumber[b.level]) ||
      (a.sort || a.name).localeCompare(b.sort || b.name)
    )
  })
}

/**
 * The tutorials list command handler
 *
 */
const doList = () =>
  new Promise((resolve, reject) => {
    readdir(contentDir, async (err, files) => {
      if (err) {
        reject(err)
      } else {
        const pane = document.querySelector('#tutorialPane')
        const nowPlaying = pane && pane.getAttribute('now-playing')

        const tutorials = (await Promise.all(
          files.map(async name => {
            const { disabled, sort, description, level } = await import(
              '@kui-shell/plugin-tutorials/samples/@tutorials/' +
                name +
                '/package.json'
            )

            if (disabled) {
              // then this tutorial is currently disabled
              return
            }

            const attributes = []

            // add a "level" column
            attributes.push({
              key: 'level',
              value: level,
              css: 'slightly-deemphasize'
            })

            let descriptionForDisplay = description
            if (nowPlaying === name) {
              const descriptionWrapper = document.createElement('div')
              descriptionWrapper.appendChild(
                document.createTextNode(description)
              )

              const isNowPlaying = document.createElement('span')
              isNowPlaying.className = 'red-text semi-bold small-left-pad'
              isNowPlaying.innerText = '(now playing)'
              descriptionWrapper.appendChild(isNowPlaying)

              descriptionForDisplay = descriptionWrapper
            }

            // add a "description" column attributes for the list model
            attributes.push({
              key: 'description',
              value: descriptionForDisplay,
              css: 'sans-serif hide-with-sidecar'
            })

            // here is the entity model for list elements
            return {
              type: 'tutorials',
              name: name.replace(/-/g, ' '),
              nameCss: ['capitalize', 'semi-bold'], // 'sans-serif',
              sort,
              level,
              noSort: true, // we have already sorted the list
              onclick: () => repl.pexec(`tutorial play @tutorials/${name}`),
              attributes
            }
          })
        )).filter(x => x) // filter out any nils due to disabled tutorials

        resolve(sort(tutorials))
      }
    })
  })

/**
 * Usage model for tutorial list
 *
 */
const usage = {
  command: 'tutorials',
  strict: 'tutorials',
  title: 'List tutorials',
  header: 'List available tutorials',
  example: 'tutorials',
  optional: [{ name: 'list', positional: true }]
}

/**
 * Here we register as a listener for commands
 *
 */
export default async (commandTree: CommandRegistrar) => {
  const opts = { usage, noAuthOk: true }

  commandTree.listen(`/tutorial/list`, doList, opts)
  commandTree.listen(`/tutorials/list`, doList, opts)
  commandTree.listen(`/tutorials`, doList, opts)
}
