/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const invariant = require('invariant');

const {getStorageKey} = require('../store/RelayStoreUtils');

import type {ConnectionID} from '../store/RelayConnection';
import type {
  RecordProxy,
  RecordSourceProxy,
  RecordSourceSelectorProxy,
  SingularReaderSelector,
} from '../store/RelayStoreTypes';
import type {ReaderLinkedField} from '../util/ReaderNode';
import type {DataID, Variables} from '../util/RelayRuntimeTypes';
import type RelayRecordSourceMutator from './RelayRecordSourceMutator';

/**
 * @internal
 *
 * A subclass of RecordSourceProxy that provides convenience methods for
 * accessing the root fields of a given query/mutation. These fields accept
 * complex arguments and it can be tedious to re-construct the correct sets of
 * arguments to pass to e.g. `getRoot().getLinkedRecord()`.
 */
class RelayRecordSourceSelectorProxy implements RecordSourceSelectorProxy {
  __mutator: RelayRecordSourceMutator;
  __recordSource: RecordSourceProxy;
  _readSelector: SingularReaderSelector;

  constructor(
    mutator: RelayRecordSourceMutator,
    recordSource: RecordSourceProxy,
    readSelector: SingularReaderSelector,
  ) {
    this.__mutator = mutator;
    this.__recordSource = recordSource;
    this._readSelector = readSelector;
  }

  create(dataID: DataID, typeName: string): RecordProxy {
    return this.__recordSource.create(dataID, typeName);
  }

  delete(dataID: DataID): void {
    this.__recordSource.delete(dataID);
  }

  get(dataID: DataID): ?RecordProxy {
    return this.__recordSource.get(dataID);
  }

  getRoot(): RecordProxy {
    return this.__recordSource.getRoot();
  }

  _getRootField(
    selector: SingularReaderSelector,
    fieldName: string,
    plural: boolean,
  ): ReaderLinkedField {
    const field = selector.node.selections.find(
      selection =>
        selection.kind === 'LinkedField' && selection.name === fieldName,
    );
    invariant(
      field && field.kind === 'LinkedField',
      'RelayRecordSourceSelectorProxy#getRootField(): Cannot find root ' +
        'field `%s`, no such field is defined on GraphQL document `%s`.',
      fieldName,
      selector.node.name,
    );
    invariant(
      field.plural === plural,
      'RelayRecordSourceSelectorProxy#getRootField(): Expected root field ' +
        '`%s` to be %s.',
      fieldName,
      plural ? 'plural' : 'singular',
    );
    return field;
  }

  getRootField(fieldName: string): ?RecordProxy {
    const field = this._getRootField(this._readSelector, fieldName, false);
    const storageKey = getStorageKey(field, this._readSelector.variables);
    return this.getRoot().getLinkedRecord(storageKey);
  }

  getPluralRootField(fieldName: string): ?Array<?RecordProxy> {
    const field = this._getRootField(this._readSelector, fieldName, true);
    const storageKey = getStorageKey(field, this._readSelector.variables);
    return this.getRoot().getLinkedRecords(storageKey);
  }

  insertConnectionEdge_UNSTABLE(
    connectionID: ConnectionID,
    args: Variables,
    edge: RecordProxy,
  ): void {
    this.__mutator.appendConnectionEvent_UNSTABLE({
      kind: 'insert',
      args,
      connectionID,
      edgeID: edge.getDataID(),
      request: this._readSelector.owner,
    });
  }
}

module.exports = RelayRecordSourceSelectorProxy;
