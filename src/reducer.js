
import * as types from './types';

const initialState = {
    session_id: "",
    token_id: "",
    error: ""
}
const session = (state = initialState, action) => {
    switch (action.type) {
      case types.GET_SESSION_TOKEN_REQUEST:
        return {
            ...state,
            session_id: "",
            token_id: "",
            error: ""
        }
      case types.GET_SESSION_TOKEN_SUCCESS:
        return {
            ...state,
            session_id: action.payload.session_id,
            token_id: action.payload.token_id
        }

        case types.GET_SESSION_TOKEN_FAILURE:
        return {
            ...state,
            session_id: "",
            token_id: "",
            error: "Could not process"
        }

      default:
        return state
    }
  }
  
  export default session