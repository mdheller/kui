/*
 * Copyright 2017 IBM Corporation
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

import * as assert from 'assert'

import {
  ISuite,
  before as commonBefore,
  after as commonAfter,
  oops,
  localDescribe
} from '@kui-shell/core/tests/lib/common'
import * as ui from '@kui-shell/core/tests/lib/ui'
const { cli, keys } = ui

localDescribe('Text search', function(this: ISuite) {
  before(commonBefore(this))
  after(commonAfter(this))

  // 2 matches test
  it('should add grumble to the repl', () =>
    cli
      .do('grumble', this.app)
      .then(cli.expectError(404))
      .catch(oops(this)))
  it('should add another grumble to the repl', () =>
    cli
      .do('grumble', this.app)
      .then(cli.expectError(404))
      .catch(oops(this)))
  it('should add bojangles to the repl', () =>
    cli
      .do('bojangles', this.app)
      .then(cli.expectError(404))
      .catch(oops(this)))

  it('should open the search bar when cmd+f is pressed', async () => {
    await this.app.client.keys([ui.ctrlOrMeta, 'f'])
    await this.app.client.waitForVisible('#search-bar')
  })

  it('should not close the search bar if pressing esc outside of search input', async () => {
    await this.app.client.click(ui.selectors.CURRENT_PROMPT_BLOCK)
    await this.app.client.keys(keys.ESCAPE)
    await this.app.client.waitForVisible('#search-bar')
  })

  it('should focus on search input when search input is pressed', async () => {
    await this.app.client.waitUntil(async () => {
      await this.app.client.click('#search-input')
      const hasFocus = await this.app.client.hasFocus('#search-input')
      return hasFocus
    })
  })

  it('should close the search bar if pressing esc in search input', async () => {
    await this.app.client.setValue('#search-input', keys.ESCAPE)
    await this.app.client.waitForVisible('#search-bar', 2000, true) // reverse: true
  })

  // re-open, so that we can test the close button
  // !!! Notes: some odd chrome or chromedriver bugs: if you click on
  // the close button, then chrome/chromedriver/whatever refuses to
  // accept any input; both setValue on the INPUT and the ctrlOrMeta+F
  // fail
  /* it('should open the search bar when cmd+f is pressed', async () => {
    await this.app.client.keys([ui.ctrlOrMeta, 'f'])
    await this.app.client.waitForVisible('#search-bar')
  })

  it('should close the search bar if clicking the close button', async () => {
    await new Promise(resolve => setTimeout(resolve, 5000))
    await this.app.client.click('#search-close-button')
    await this.app.client.waitForVisible('#search-bar', 2000, true) // reverse: true
    await this.app.client.waitUntil(async () => {
      const hasFocus = await this.app.client.hasFocus(ui.selectors.CURRENT_PROMPT)
      return hasFocus
    })
  }) */

  it('should find 2 matches for grumble', async () => {
    try {
      this.app.client.keys([ui.ctrlOrMeta, 'f'])
      await this.app.client.waitForVisible('#search-bar')
      await this.app.client.waitUntil(() =>
        this.app.client.hasFocus('#search-input')
      )
      await this.app.client.waitUntil(async () => {
        await this.app.client.setValue('#search-input', `grumble${keys.ENTER}`)
        const txt = await this.app.client.getText('#search-found-text')
        return txt === '2 matches' // two executions, no tab title match
      })
    } catch (err) {
      oops(this)(err)
    }
  })

  // 1 match test
  it('should close the search bar if clicking the close button', () =>
    this.app.client
      .click('#search-close-button')
      .then(() => this.app.client.waitForVisible('#search-bar', 2000, true)) // reverse: true
      .catch(oops(this)))
  it('should find 1 match for bojangles', () =>
    this.app.client
      .keys([ui.ctrlOrMeta, 'f'])
      .then(() => this.app.client.waitForVisible('#search-bar'))
      .then(() => this.app.client.hasFocus('#search-input'))
      .then(r => assert.ok(r, 'assert if search-input is focused'))
      .then(() =>
        this.app.client.waitUntil(async () => {
          await this.app.client.setValue(
            '#search-input',
            `bojangles${keys.ENTER}`
          )
          const txt = await this.app.client.getText('#search-found-text')
          return txt === '2 matches' // one execution, plus tab title match
        })
      )
      .catch(oops(this)))

  // no matches test
  it('should close the search bar if clicking the close button', () =>
    this.app.client
      .click('#search-close-button')
      .then(() => this.app.client.waitForVisible('#search-bar', 2000, true)) // reverse: true
      .catch(oops(this)))
  // re-open, so that we can test entering text and hitting enter
  it('should find nothing when searching for waldo', () =>
    this.app.client
      .keys([ui.ctrlOrMeta, 'f'])
      .then(() => this.app.client.waitForVisible('#search-bar'))
      .then(() => this.app.client.hasFocus('#search-input'))
      .then(r => assert.ok(r, 'assert if search-input is focused'))
      .then(() =>
        this.app.client.waitUntil(async () => {
          await this.app.client.setValue('#search-input', `waldo${keys.ENTER}`)
          const txt = await this.app.client.getText('#search-found-text')
          return txt === 'no matches'
        })
      )
      .catch(oops(this)))

  // paste test
  it('should close the search bar if clicking the close button', () =>
    this.app.client
      .click('#search-close-button')
      .then(() => this.app.client.waitForVisible('#search-bar', 2000, true)) // reverse: true
      .catch(oops(this)))
  it('should paste into the text search box', () =>
    this.app.client
      .keys([ui.ctrlOrMeta, 'f'])
      .then(() => this.app.client.waitForVisible('#search-bar'))
      .then(() => this.app.client.hasFocus('#search-input'))
      .then(r => assert.ok(r, 'assert if search-input is focused'))
      .then(() => this.app.electron.clipboard.writeText('grumble'))
      .then(() => this.app.client.execute(() => document.execCommand('paste')))
      .then(() => this.app.client.getValue('#search-input'))
      .then(actual => assert.strictEqual(actual, 'grumble')) // paste made it to #search-input?
      .catch(oops(this)))
})
