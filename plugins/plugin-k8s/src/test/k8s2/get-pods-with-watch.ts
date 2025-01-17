/*
 * Copyright 2019 IBM Corporation
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

import * as common from '@kui-shell/core/tests/lib/common'
import { cli, selectors, AppAndCount } from '@kui-shell/core/tests/lib/ui'
import {
  waitForGreen,
  waitForRed,
  createNS,
  allocateNS,
  deleteNS
} from '@kui-shell/plugin-k8s/tests/lib/k8s/utils'

/** name of the pod */
const podName = 'nginx'

/** source for the resource spec */
const url =
  'https://raw.githubusercontent.com/kubernetes/examples/master/staging/pod'

enum Status {
  Offline = 'red-background',
  Online = 'green-background'
}

/** after a cli.do (res), wait for a table row with the given status */
const waitForStatus = async function(this: common.ISuite, status: Status, res) {
  const selector = await cli.expectOKWithCustom({
    selector: selectors.BY_NAME(podName)
  })(res)
  const expectStatus = `${selector} span:not(.repeating-pulse)`

  if (status === Status.Offline) {
    return waitForRed(this.app, expectStatus)
  } else {
    return waitForGreen(this.app, expectStatus)
  }
}

/** create pod, and expect status eventually to be green */
const createPod = async function(
  this: common.ISuite,
  kubectl: string,
  ns: string
) {
  it(`should create sample pod from URL via ${kubectl}`, async () => {
    const waitForOnline: (
      res: AppAndCount
    ) => Promise<string> = waitForStatus.bind(this, Status.Online)

    try {
      await waitForOnline(
        await cli.do(`${kubectl} create -f ${url} -n ${ns}`, this.app)
      )
    } catch (err) {
      common.oops(this)(err)
    }
  })
}

/** create, then delete; the create table status had better not change */
const createAndDeletePod = function(
  this: common.ISuite,
  kubectl: string,
  ns: string
) {
  it(`should create then delete sample pod from URL via ${kubectl}`, async () => {
    try {
      const waitForOnline: (
        res: AppAndCount
      ) => Promise<string> = waitForStatus.bind(this, Status.Online)
      const waitForOffline: (
        res: AppAndCount
      ) => Promise<string> = waitForStatus.bind(this, Status.Offline)

      const selector1 = await waitForOnline(
        await cli.do(`${kubectl} create -f ${url} -n ${ns}`, this.app)
      )
      const selector2 = await waitForOffline(
        await cli.do(`${kubectl} delete -f ${url} -n ${ns}`, this.app)
      )

      // the first badge.Online selector had better still exist after the delete
      await this.app.client.waitForExist(selector1)

      const selector3 = await waitForOnline(
        await cli.do(`${kubectl} create -f ${url} -n ${ns}`, this.app)
      )

      // that second badge.Offline selector had better still exist after the (second) create
      await this.app.client.waitForExist(selector2)

      // one last delete...
      await waitForOffline(
        await cli.do(`${kubectl} delete -f ${url} -n ${ns}`, this.app)
      )

      // the previous badges had all better still exist after that second delete
      await this.app.client.waitForExist(selector1)
      await this.app.client.waitForExist(selector2)
      await this.app.client.waitForExist(selector3)
    } catch (err) {
      common.oops(this)(err)
    }
  })
}

/** delete pod, and expect status eventually to be red */
const deletePod = function(this: common.ISuite, kubectl: string, ns: string) {
  it(`should delete the sample pod from URL via ${kubectl}`, async () => {
    try {
      const waitForOffline: (
        res: AppAndCount
      ) => Promise<string> = waitForStatus.bind(this, Status.Offline)

      const res = await cli.do(`${kubectl} delete -f ${url} -n ${ns}`, this.app)

      await waitForOffline(res)
      return
    } catch (err) {
      common.oops(this)(err)
    }
  })
}

/** k get pods -w */
const watchPods = function(this: common.ISuite, kubectl: string, ns: string) {
  it(`should watch pods via ${kubectl} get pods -w`, async () => {
    try {
      const waitForOnline: (
        res: AppAndCount
      ) => Promise<string> = waitForStatus.bind(this, Status.Online)
      const waitForOffline: (
        res: AppAndCount
      ) => Promise<string> = waitForStatus.bind(this, Status.Offline)

      const selector1 = await waitForOnline(
        await cli.do(`${kubectl} create -f ${url} -n ${ns}`, this.app)
      )
      const selector2 = await waitForOnline(
        await cli.do(`${kubectl} get pods -w -n ${ns}`, this.app)
      )
      const selector2ButOffline = selector2.replace(
        Status.Online,
        Status.Offline
      )
      const selector3 = await waitForOffline(
        await cli.do(`${kubectl} delete -f ${url} -n ${ns}`, this.app)
      )

      // the create and delete badges had better still exist
      await this.app.client.waitForExist(selector1)
      await this.app.client.waitForExist(selector3)

      // the "online" badge from the watch had better *NOT* exist after the delete
      // (i.e. we had better actually be watching!)
      await this.app.client.waitForExist(selector2, 20000, true)

      // and, conversely, that watch had better eventually show Offline
      await this.app.client.waitForExist(selector2ButOffline)

      // create again
      await waitForOnline(
        await cli.do(`${kubectl} create -f ${url} -n ${ns}`, this.app)
      )

      // the "online" badge from the watch had better now exist again after the create
      // (i.e. we had better actually be watching!)
      await this.app.client.waitForExist(selector2)

      // and, conversely, that watch had better NOT show Offline
      await this.app.client.waitForExist(selector2ButOffline, 20000, true)
    } catch (err) {
      common.oops(this)(err)
    }
  })
}

const synonyms = ['kubectl', 'k']

describe('electron watch pod', function(this: common.ISuite) {
  before(common.before(this))
  after(common.after(this))

  synonyms.forEach(kubectl => {
    const ns: string = createNS()
    const createIt: () => Promise<void> = createPod.bind(this, kubectl, ns)
    const deleteIt: () => void = deletePod.bind(this, kubectl, ns)
    const createAndDeleteIt: () => void = createAndDeletePod.bind(
      this,
      kubectl,
      ns
    )
    const watchIt: () => void = watchPods.bind(this, kubectl, ns)

    //
    // here come the tests
    //
    allocateNS(this, ns)
    createIt()
    deleteIt()
    createAndDeleteIt()
    watchIt()
    deleteNS(this, ns)
  })
})
