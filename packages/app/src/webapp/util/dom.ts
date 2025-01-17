/*
 * Copyright 2017-18 IBM Corporation
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

/**
 * Clean out the given DOM node
 *
 */
export const removeAllDomChildren = (node: Node) => {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

/**
 * Look up an HTML element
 *   note: ParentNode is a common parent of Element and Document
 */
export const element = (
  id: string,
  parent: ParentNode = document
): HTMLElement => {
  return parent.querySelector(id) as HTMLElement
}
