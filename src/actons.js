import * as types from './types'

export function getSessionToken() {
    return {
      type: types.GET_SESSION_TOKEN_REQUEST,
    };
  }