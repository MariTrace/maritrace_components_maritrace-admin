import { v4 as uuidv4 } from 'uuid';
import { post_data } from './API_Calls.js';

let session_id = generateGUID();
export let session_user_uuid = "";
export let session_parent_uuid = "";

export function getSessionUserUuid() {
  return session_user_uuid;
}
export function setSessionUserUuid(uuid) {
  session_user_uuid = uuid;
}
export function getSessionParentUuid() {
  return session_parent_uuid;
}
export function setSessionParentUuid(uuid) {
  session_parent_uuid = uuid;
}
function generateGUID() {
  return uuidv4();
}
if (!localStorage.getItem('sessionID')) {
  localStorage.setItem('sessionID', session_id);
}

export async function startSession(){
    const parameters = {
        "session_id": session_id,
        "user_uuid": session_user_uuid,
        "last_pulse": new Date().toISOString()
    }

    const res = await post_data("/adminStartSession", parameters);
    if(res.status.is_successful) {
        localStorage.setItem("session", JSON.stringify({ "session_id": session_id, "user_uuid": session_user_uuid,
             "parent_uuid" : session_parent_uuid}));
            return true;
    }
    return false;
}

export async function foundSession(sessionObject){
    session_id = sessionObject.session_id;
    setSessionUserUuid(sessionObject.user_uuid);
    setSessionParentUuid(sessionObject.parent_uuid);
}
export async function checkSession(){
    const parameters = {
        "session_id": session_id,
        "user_uuid": session_user_uuid,
        "last_pulse": new Date().toISOString()
    }
    const res = await post_data("/adminCheckSession", parameters);
    if(res.status.is_successful) return true;
    return false;
}
export { session_id };