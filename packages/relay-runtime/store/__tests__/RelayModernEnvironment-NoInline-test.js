/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @emails oncall+relay
 */

'use strict';

const RelayFeatureFlags = require('../../util/RelayFeatureFlags');
const RelayModernEnvironment = require('../RelayModernEnvironment');
const RelayModernStore = require('../RelayModernStore');
const RelayNetwork = require('../../network/RelayNetwork');
const RelayObservable = require('../../network/RelayObservable');
const RelayRecordSource = require('../RelayRecordSource');

const nullthrows = require('nullthrows');

const {graphql, getFragment, getRequest} = require('../../query/GraphQLTag');
const {
  createOperationDescriptor,
} = require('../RelayModernOperationDescriptor');
const {getSingularSelector} = require('../RelayModernSelector');
const {disallowWarnings} = require('relay-test-utils-internal');

disallowWarnings();

const Query = getRequest(graphql`
  query RelayModernEnvironmentNoInlineTestQuery(
    $size: [Int]
    $preset: PhotoSize
  ) {
    me {
      ...RelayModernEnvironmentNoInlineTest_noInline
    }
  }
`);

const NoInlineFragment = getFragment(graphql`
  fragment RelayModernEnvironmentNoInlineTest_noInline on Actor @no_inline {
    ... on User {
      profile_picture: profilePicture2(
        size: $size
        preset: $preset
        fileExtension: PNG
      ) {
        uri
      }
    }
    ...RelayModernEnvironmentNoInlineTest_inner
      @arguments(cond: true, preset: $preset, fileExtension: JPG)
  }
`);

const InnerFragment = getFragment(graphql`
  fragment RelayModernEnvironmentNoInlineTest_inner on User
    @argumentDefinitions(
      cond: {type: "Boolean!"}
      preset: {type: "PhotoSize"}
      fileExtension: {type: "FileExtension"}
    ) {
    ... @include(if: $cond) {
      profile_picture_inner: profilePicture2(
        # accesses a global directly
        size: $size

        # accesses a local that is passed a global
        preset: $preset

        # accesses a local that is passed a constant
        fileExtension: $fileExtension
      ) {
        uri
      }
    }
  }
`);

describe('@no_inline', () => {
  let environment;
  let fetch;
  let store;
  let source;
  let subject;
  let operation;
  let callbacks;

  beforeEach(() => {
    RelayFeatureFlags.ENABLE_PRECISE_TYPE_REFINEMENT = true;
  });
  afterEach(() => {
    RelayFeatureFlags.ENABLE_PRECISE_TYPE_REFINEMENT = false;
  });

  beforeEach(() => {
    fetch = jest.fn((_query, _variables, _cacheConfig) =>
      RelayObservable.create(sink => {
        subject = sink;
      }),
    );
    callbacks = {
      complete: jest.fn(),
      error: jest.fn(),
      next: jest.fn(),
    };
    source = RelayRecordSource.create();
    store = new RelayModernStore(source, {gcReleaseBufferSize: 0});
    environment = new RelayModernEnvironment({
      network: RelayNetwork.create((fetch: $FlowFixMe)),
      store,
    });
    operation = createOperationDescriptor(Query, {size: [1]});
  });

  it('executes and reads back results (fragment type matches)', () => {
    environment.execute({operation}).subscribe(callbacks);
    subject.next({
      data: {
        me: {
          __isActor: 'User',
          id: '1',
          profile_picture: {
            uri: 'https://profile.png',
          },
          profile_picture_inner: {
            uri: 'https://profile.jpg',
          },
        },
      },
      extensions: {
        is_final: true,
      },
    });
    expect(
      (callbacks.error: $FlowFixMe).mock.calls.map(call => call[0].stack),
    ).toEqual([]);
    expect(callbacks.next).toBeCalledTimes(1);
    expect(callbacks.complete).toBeCalledTimes(0);
    subject.complete();
    expect(callbacks.complete).toBeCalledTimes(1);

    const queryData = environment.lookup(operation.fragment);
    expect(queryData.data).toEqual({
      me: {
        __id: '1',
        __fragments: {
          [NoInlineFragment.name]: expect.anything(),
        },
        __fragmentOwner: operation.request,
        __isWithinUnmatchedTypeRefinement: false,
      },
    });

    // noInline fragment data is present
    const selector = nullthrows(
      getSingularSelector(NoInlineFragment, (queryData.data: $FlowFixMe).me),
    );
    const selectorData = environment.lookup(selector);
    expect(selectorData.data).toEqual({
      __id: '1',
      __fragments: {
        [InnerFragment.name]: expect.anything(),
      },
      __fragmentOwner: operation.request,
      __isWithinUnmatchedTypeRefinement: false,
      profile_picture: {
        uri: 'https://profile.png',
      },
    });

    // Inner (normal, inlined) fragment data is present
    const innerSelector = nullthrows(
      getSingularSelector(InnerFragment, (selectorData.data: $FlowFixMe)),
    );
    const innerSelectorData = environment.lookup(innerSelector);
    expect(innerSelectorData.isMissingData).toBe(false);
    expect(innerSelectorData.data).toEqual({
      profile_picture_inner: {
        uri: 'https://profile.jpg',
      },
    });

    // available before a GC
    expect(environment.check(operation)).toEqual({
      fetchTime: null,
      status: 'available',
    });

    // available after GC if the query is retained
    const retain = environment.retain(operation);
    (environment.getStore(): $FlowFixMe).scheduleGC();
    jest.runAllTimers();
    expect(environment.check(operation)).toEqual({
      fetchTime: null,
      status: 'available',
    });

    // missing after being freed plus a GC run
    retain.dispose();
    (environment.getStore(): $FlowFixMe).scheduleGC();
    jest.runAllTimers();
    expect(environment.check(operation)).toEqual({
      status: 'missing',
    });
  });

  it('executes and reads back results (fragment type does not match)', () => {
    environment.execute({operation}).subscribe(callbacks);
    subject.next({
      data: {
        me: {
          id: '1',
          // pretend that the object doesn't implement Actor
          // (so exclude __isActor and other Actor-conditional fields)
        },
      },
      extensions: {
        is_final: true,
      },
    });
    expect(
      (callbacks.error: $FlowFixMe).mock.calls.map(call => call[0].stack),
    ).toEqual([]);
    expect(callbacks.next).toBeCalledTimes(1);
    expect(callbacks.complete).toBeCalledTimes(0);
    subject.complete();
    expect(callbacks.complete).toBeCalledTimes(1);

    const queryData = environment.lookup(operation.fragment);
    expect(queryData.data).toEqual({
      me: {
        __id: '1',
        __fragments: {
          [NoInlineFragment.name]: expect.anything(),
        },
        __fragmentOwner: operation.request,
        __isWithinUnmatchedTypeRefinement: false,
      },
    });

    // Data for the noInline fragment should still be read since reader always
    // attempts to read fragments even if the fragment type doesn't match the
    // record
    const selector = nullthrows(
      getSingularSelector(NoInlineFragment, (queryData.data: $FlowFixMe).me),
    );
    const selectorData = environment.lookup(selector);
    expect(selectorData.data).toEqual({
      __id: '1',
      __fragments: {
        [InnerFragment.name]: expect.anything(),
      },
      __fragmentOwner: operation.request,
      __isWithinUnmatchedTypeRefinement: true, // fragment type didn't match
    });

    // Inner data should be missing bc the type didn't match
    const innerSelector = nullthrows(
      getSingularSelector(InnerFragment, (selectorData.data: $FlowFixMe)),
    );
    const innerSelectorData = environment.lookup(innerSelector);
    expect(innerSelectorData.isMissingData).toBe(false);
    expect(innerSelectorData.data).toEqual({});

    // available before a GC
    expect(environment.check(operation)).toEqual({
      fetchTime: null,
      status: 'available',
    });

    // available after GC if the query is retained
    const retain = environment.retain(operation);
    (environment.getStore(): $FlowFixMe).scheduleGC();
    jest.runAllTimers();
    expect(environment.check(operation)).toEqual({
      fetchTime: null,
      status: 'available',
    });

    // missing after being freed plus a GC run
    retain.dispose();
    (environment.getStore(): $FlowFixMe).scheduleGC();
    jest.runAllTimers();
    expect(environment.check(operation)).toEqual({
      status: 'missing',
    });
  });

  describe('with arguments', () => {
    it('executes and reads back results with no-inline fragments on the same level', () => {
      const QueryWithArgs = getRequest(graphql`
        query RelayModernEnvironmentNoInlineTestWithArgsQuery(
          $size: [Int]
          $preset: PhotoSize
        ) {
          me {
            ...RelayModernEnvironmentNoInlineTestWithArgs_noInline
              @arguments(cond: true)
          }
          username(name: "Zuck") {
            ...RelayModernEnvironmentNoInlineTestWithArgs_noInline
              @arguments(cond: false)
          }
        }
      `);
      const NoInlineFragmentWithArgs = getFragment(graphql`
        fragment RelayModernEnvironmentNoInlineTestWithArgs_noInline on Actor
          @no_inline
          @argumentDefinitions(
            cond: {type: "Boolean!"}
            fileExtension: {type: "FileExtension!", defaultValue: JPG}
          ) {
          ... on User {
            profile_picture: profilePicture2(
              size: $size
              preset: $preset
              fileExtension: PNG
            ) {
              uri
            }
          }
          ...RelayModernEnvironmentNoInlineTest_inner
            @arguments(
              cond: $cond
              preset: $preset
              fileExtension: $fileExtension
            )
        }
      `);
      operation = createOperationDescriptor(QueryWithArgs, {
        size: [1],
      });
      environment.execute({operation}).subscribe(callbacks);

      subject.next({
        data: {
          me: {
            __isActor: 'User',
            id: '1',
            profile_picture: {
              uri: 'https://profile.png',
            },
            profile_picture_inner: {
              uri: 'https://profile.jpg',
            },
          },
          username: {
            __typename: 'User',
            __isActor: 'User',
            id: '2',
            profile_picture: {
              uri: 'https://profile.png',
            },
            profile_picture_inner: {
              uri: 'https://profile.jpg',
            },
          },
        },
        extensions: {
          is_final: true,
        },
      });
      expect(
        (callbacks.error: $FlowFixMe).mock.calls.map(call => call[0].stack),
      ).toEqual([]);
      expect(callbacks.next).toBeCalledTimes(1);
      expect(callbacks.complete).toBeCalledTimes(0);
      subject.complete();
      expect(callbacks.complete).toBeCalledTimes(1);

      const queryData = environment.lookup(operation.fragment);
      expect(queryData.data).toEqual({
        me: {
          __id: '1',
          __fragments: {
            [NoInlineFragmentWithArgs.name]: expect.anything(),
          },
          __fragmentOwner: operation.request,
          __isWithinUnmatchedTypeRefinement: false,
        },
        username: {
          __id: '2',
          __fragments: {
            [NoInlineFragmentWithArgs.name]: expect.anything(),
          },
          __fragmentOwner: operation.request,
          __isWithinUnmatchedTypeRefinement: false,
        },
      });

      // noInline fragment data for `me` and `username` is present
      const selector = nullthrows(
        getSingularSelector(
          NoInlineFragmentWithArgs,
          (queryData.data: $FlowFixMe).me,
        ),
      );
      const selectorData = environment.lookup(selector);
      expect(selectorData.data).toEqual({
        __id: '1',
        __fragments: {
          [InnerFragment.name]: expect.anything(),
        },
        __fragmentOwner: operation.request,
        __isWithinUnmatchedTypeRefinement: false,
        profile_picture: {
          uri: 'https://profile.png',
        },
      });

      const selectorUsername = nullthrows(
        getSingularSelector(
          NoInlineFragmentWithArgs,
          (queryData.data: $FlowFixMe).username,
        ),
      );
      const selectorUsernameData = environment.lookup(selectorUsername);
      expect(selectorUsernameData.data).toEqual({
        __id: '2',
        __fragments: {
          [InnerFragment.name]: expect.anything(),
        },
        __fragmentOwner: operation.request,
        __isWithinUnmatchedTypeRefinement: false,
        profile_picture: {
          uri: 'https://profile.png',
        },
      });

      // Inner (normal, inlined) fragment data is present
      const innerSelector = nullthrows(
        getSingularSelector(InnerFragment, (selectorData.data: $FlowFixMe)),
      );
      const innerSelectorData = environment.lookup(innerSelector);
      expect(innerSelectorData.isMissingData).toBe(false);
      expect(innerSelectorData.data).toEqual({
        profile_picture_inner: {
          uri: 'https://profile.jpg',
        },
      });

      // The inner fragment data for `username` should be empty
      // because the `$cond` on `@include` is `false`
      const innerSelectorUsername = nullthrows(
        getSingularSelector(
          InnerFragment,
          (selectorUsernameData.data: $FlowFixMe),
        ),
      );
      const innerSelectorUsernameData = environment.lookup(
        innerSelectorUsername,
      );
      expect(innerSelectorUsernameData.isMissingData).toBe(false);
      expect(innerSelectorUsernameData.data).toEqual({});

      // available before a GC
      expect(environment.check(operation)).toEqual({
        fetchTime: null,
        status: 'available',
      });

      // available after GC if the query is retained
      const retain = environment.retain(operation);
      (environment.getStore(): $FlowFixMe).scheduleGC();
      jest.runAllTimers();
      expect(environment.check(operation)).toEqual({
        fetchTime: null,
        status: 'available',
      });

      // missing after being freed plus a GC run
      retain.dispose();
      (environment.getStore(): $FlowFixMe).scheduleGC();
      jest.runAllTimers();
      expect(environment.check(operation)).toEqual({
        status: 'missing',
      });
    });

    it('executes and reads back results with nested no-inline fragments', () => {
      const QueryNested = getRequest(graphql`
        query RelayModernEnvironmentNoInlineTestNestedQuery(
          $global_cond: Boolean!
        ) {
          ...RelayModernEnvironmentNoInlineTest_nestedNoInlineParent
            @arguments(cond: true)
        }
      `);

      const NoInlineFragmentNestedParent = getFragment(graphql`
        fragment RelayModernEnvironmentNoInlineTest_nestedNoInlineParent on Query
          @no_inline
          @argumentDefinitions(cond: {type: "Boolean!"}) {
          mark: username(name: "Mark") {
            ...RelayModernEnvironmentNoInlineTest_nestedNoInline
              @arguments(cond: $global_cond)
          }
          zuck: username(name: "Zuck") {
            ...RelayModernEnvironmentNoInlineTest_nestedNoInline
              @arguments(cond: false)
          }
          joe: username(name: "Joe") {
            ...RelayModernEnvironmentNoInlineTest_nestedNoInline
              @arguments(cond: $cond)
          }
        }
      `);
      const NoInlineFragmentNested = getFragment(graphql`
        fragment RelayModernEnvironmentNoInlineTest_nestedNoInline on User
          @no_inline
          @argumentDefinitions(cond: {type: "Boolean!"}) {
          ... @include(if: $cond) {
            name
          }
        }
      `);

      operation = createOperationDescriptor(QueryNested, {
        global_cond: false,
      });
      environment.execute({operation}).subscribe(callbacks);

      subject.next({
        data: {
          mark: {
            __typename: 'User',
            __isActor: 'User',
            id: '1',
            name: 'Zuck',
          },
          zuck: {
            __typename: 'User',
            __isActor: 'User',
            id: '2',
            name: 'Zuck',
          },
          joe: {
            __typename: 'User',
            __isActor: 'User',
            id: '3',
            name: 'Joe',
          },
        },
        extensions: {
          is_final: true,
        },
      });
      expect(
        (callbacks.error: $FlowFixMe).mock.calls.map(call => call[0].stack),
      ).toEqual([]);
      expect(callbacks.next).toBeCalledTimes(1);
      expect(callbacks.complete).toBeCalledTimes(0);
      subject.complete();
      expect(callbacks.complete).toBeCalledTimes(1);

      const queryData = environment.lookup(operation.fragment);
      const selector = nullthrows(
        getSingularSelector(
          NoInlineFragmentNestedParent,
          (queryData.data: $FlowFixMe),
        ),
      );
      const selectorData = environment.lookup(selector);
      expect(selectorData.data).toEqual({
        mark: {
          __id: '1',
          __fragments: {
            [NoInlineFragmentNested.name]: expect.anything(),
          },
          __fragmentOwner: operation.request,
          __isWithinUnmatchedTypeRefinement: false,
        },
        zuck: {
          __id: '2',
          __fragments: {
            [NoInlineFragmentNested.name]: expect.anything(),
          },
          __fragmentOwner: operation.request,
          __isWithinUnmatchedTypeRefinement: false,
        },
        joe: {
          __id: '3',
          __fragments: {
            [NoInlineFragmentNested.name]: expect.anything(),
          },
          __fragmentOwner: operation.request,
          __isWithinUnmatchedTypeRefinement: false,
        },
      });

      // $cond is set to $global_cond which is false
      const selector1 = nullthrows(
        getSingularSelector(
          NoInlineFragmentNested,
          // $FlowFixMe
          selectorData.data.mark,
        ),
      );
      const selector1Data = environment.lookup(selector1);
      expect(selector1Data.isMissingData).toBe(false);
      expect(selector1Data.data).toEqual({});

      // $cond is set to literal false
      const selector2 = nullthrows(
        getSingularSelector(
          NoInlineFragmentNested,
          // $FlowFixMe
          selectorData.data.zuck,
        ),
      );
      const selector2Data = environment.lookup(selector2);
      expect(selector2Data.isMissingData).toBe(false);
      expect(selector2Data.data).toEqual({});

      // $cond is set to local $cond which is true
      const selector3 = nullthrows(
        getSingularSelector(
          NoInlineFragmentNested,
          // $FlowFixMe
          selectorData.data.joe,
        ),
      );
      const selector3Data = environment.lookup(selector3);
      expect(selector3Data.isMissingData).toBe(false);
      expect(selector3Data.data).toEqual({name: 'Joe'});

      // available before a GC
      expect(environment.check(operation)).toEqual({
        fetchTime: null,
        status: 'available',
      });

      // available after GC if the query is retained
      const retain = environment.retain(operation);
      (environment.getStore(): $FlowFixMe).scheduleGC();
      jest.runAllTimers();
      expect(environment.check(operation)).toEqual({
        fetchTime: null,
        status: 'available',
      });

      // missing after being freed plus a GC run
      retain.dispose();
      (environment.getStore(): $FlowFixMe).scheduleGC();
      jest.runAllTimers();
      expect(environment.check(operation)).toEqual({
        status: 'missing',
      });
    });
  });
});
