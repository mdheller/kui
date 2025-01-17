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

import { inBrowser } from '@kui-shell/core/core/capabilities'
import registerSidecarMode from '@kui-shell/core/webapp/views/registrar/modes'
import { CapabilityRegistration } from '@kui-shell/core/models/plugin'

import { podMode } from './lib/view/modes/pods'
import { conditionsMode } from './lib/view/modes/conditions'
import { containersMode } from './lib/view/modes/containers'
import { lastAppliedMode } from './lib/view/modes/last-applied'
import registerTabCompletion from './lib/tab-completion'

const debug = Debug('plugins/k8s/preload')

/**
 * This is the capabilities registraion
 *
 */
export const registerCapability: CapabilityRegistration = async () => {
  if (inBrowser()) {
    debug('register capabilities for browser')
    const { restoreAuth } = await import('./lib/model/auth')
    restoreAuth()
  }
}

/**
 * This is the module
 *
 */
export default async () => {
  registerSidecarMode(podMode) // show pods of deployments
  registerSidecarMode(containersMode) // show containers of pods
  registerSidecarMode(conditionsMode) // show conditions of a variety of resource kinds
  registerSidecarMode(lastAppliedMode) // show a last applied configuration tab
  registerTabCompletion()
}
