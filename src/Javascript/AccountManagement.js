import { post_data, get_page_content } from '../Javascript/API_Calls.js';
import { session_id, session_user_uuid, session_parent_uuid } from '../Javascript/session.js';
import * as G from '../Javascript/General.js';
import * as N from '../Javascript/Notifications.js';
import { Form, Button } from "react-bootstrap";
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState, store } from "../Redux/store";
import * as AMS from '../Redux/Slices/AccountManagementSlices';

//const [activeTab, setActiveTab] = useState('');
//const dispatch = useDispatch<AppDispatch>;
//const userAccountsOriginal = useSelector(state => state.userAccounts.accounts);

export async function getAllParents(get_archived = false, parent_uuid = "6ad06cfb-85aa-425d-bde6-eff63ac33211"){
    const parameters = {
        "parent_uuids":[parent_uuid],
        "get_all":true,
        "get_archived": get_archived
    }

    const res = await post_data("/get_MariTraceParentAccountDetails", parameters);
    try {
        const parents = res.map((item: any) => formatParentAccount(item)).sort((a, b) => a.name.localeCompare(b.name));
        if(get_archived) return await combineAccountsData(parents, store.getState().userAccounts.archivedAccounts);
        else return await combineAccountsData(parents, store.getState().userAccounts.activeAccounts);
    } catch (ex) {
        return [];
    }
}
export async function getAllUsers(get_archived = false, parent_uuid = "6ad06cfb-85aa-425d-bde6-eff63ac33211", user_account_uuid = []){
    const parameters = {
        "user_account_uuids":user_account_uuid,
        "parent_account_uuids":[parent_uuid],
        "get_all":true,
        "get_archived": get_archived
    }

    const resUsers = await post_data("/get_MariTraceUserAccount", parameters);
    const resUsersSettings = await getAllUserSettings(get_archived, parent_uuid, user_account_uuid);
    try{
        const users = resUsers.map((item: any) => formatUserAccount(item));
        const userSettings = resUsersSettings.map((item: any) => formatUserSettings(item));

        return await combineUserAccountsData(users, userSettings);
    } catch (ex) {
        return [];
    }
}
export async function getAllUserSettings(get_archived = false, parent_uuid = "6ad06cfb-85aa-425d-bde6-eff63ac33211", user_account_uuid = []){
    const parameters = {
        "user_account_uuids":user_account_uuid,
        "user_settings_uuids":[],
        "parent_account_uuids":[parent_uuid],
        "get_all":true,
        "get_archived": get_archived
    }
    const res = await post_data("/get_MariTraceUserAccountSetttings", parameters);
    try {
        return res.map((item: any) => formatUserSettings(item));
    } catch (ex) {
        return [];
    }
}

export async function postParentAccount(parameters){
    const res = await post_data("/post_MariTraceParentAccount", parameters);
    return res;
}
export async function postUserAccount(parameters, refresh = true){
    const res = await post_data("/post_MariTraceUserAccount", parameters);
    return res;
}
export async function postUserSettings(parameters){
    const res = await post_data("/post_MariTraceUserAccountSettings", parameters);
    if(res.is_successful) {
        alert("User Settings Update/Creation Successful");
        G.dispatchRefresh('my-app:refresh-main');
    }
    else alert("An error occurred");
    return res;
}
export async function postIndividualSettings(parameters){
    if(parameters.setting_field_name == "TableauCustomViews") {
        if(parameters.new_value == "true") parameters.new_value = "on";
        if(parameters.new_value == "false") parameters.new_value = "off";
    }
    const res = await post_data("/post_IndividualUserSetting", parameters);
    return res;
}

export async function resetPassword(email, whiteLabel = ""){
    let parameters = { "email_address" : email, }

    if(whiteLabel !== ""){
        if (whiteLabel.toUpperCase().contains("SEDNA")) {
            parameters.application_name = whiteLabel;
            parameters.info_email_address = "info@sedna.com"
        }
        if (whiteLabel.toUpperCase().contains("VANGUARD")) {
            parameters.application_name = whiteLabel;
            parameters.info_email_address = "info@vanguard.com"
        }
    }

    const res = await post_data("/get_reset_password", parameters);
    return res;
}
//string white_label_uuid, string email, string password, string urlHost, string urlPath, string ip, string sessionID
export async function updatePassword(email, password, whiteLabelUuid = "6ad06cfb-85aa-425d-bde6-eff63ac33211"){
    let parameters = {
        "whiteLabelUuid" : whiteLabelUuid,
        "emailAddress" : email,
        "password" : password,
        "urlHost" : "admin",
        "urlAbsolutePath" : "admin",
        "ipAddress" : "1 27.0.0.0",
        "sessionID" : "sessionID"
    }
    const res = await post_data("/update_password", parameters);
    return res;
}
export async function handleExpiring(user_uuid, is_parent = false, parent:ParentAccount | null = null){
    if(is_parent) {
        N.basicNotification("Expiring Parent will also archive all users, are you sure?", "Archive Parent",  true, "smallNotification", [<>
           <Button onClick={(e) => {handleExpiringConfirmed(user_uuid, is_parent, parent); N.basicNotificationClose(true, "")}} variant="success">Continue</Button>
        </>]);
    }
    else {
       N.basicNotification("Are you sure you wish to Expire User?", "Archive User",  true, "smallNotification", [<>
          <Button onClick={(e) => {handleExpiringConfirmed(user_uuid, is_parent, parent); N.basicNotificationClose(true, "")}} variant="success">Continue</Button>
       </>]);
    }
}
export async function handleExpiringConfirmed(user_uuid, is_parent = false, parent:ParentAccount | null = null){
    const expiredDate = new Date().toISOString();
    let user_uuid_list = [user_uuid];
    if(is_parent && parent) {
        const parameters = {
            "postgres_only" : false,
            "parent_account_uuid": parent.parent_account_uuid,
            "parent_account_name": parent.name || "",
            "address" : parent.address || "",
            "country_code" : parent.country_code || "",
            "phone" : parent.phone.toString() || "",
            "fax" : parent.fax.toString() || "",
            "email" : parent.email.replace(/\s/g, "") || "",
            "web_site" : parent.website || "",
            "site_beacon_account" : parent.site_beacon_account,
            "date_expires" : expiredDate
        }

        const res = await postParentAccount(parameters);
        if(res.is_successful) {
            store.dispatch(AMS.updateParentAccountField({uuid: parent.parent_account_uuid, key: 'date_expires', value: expiredDate, archived: false}));
            toast.success("Parent successfully expired");
            user_uuid_list = parent?.children?.map(u => u.user_account_uuid) ?? [];
        }
        else {
            toast.error("Parent failed to expire");
            return;
        }
    }
    if(user_uuid_list.length > 0){
        const parameters = {
            "user_uuid_list" : user_uuid_list,
            "setting_field_name" : 'date_expires',
            "new_value" : expiredDate
        }

        const res = await postIndividualSettings(parameters);

        if(res.is_successful) {
            user_uuid_list.forEach(uuid => {
                const existingUser = store.getState().userAccounts.activeAccounts.find(acc => acc.user_account_uuid === uuid);
                const updatedUser: AM.UserAccount = {
                  ...existingUser, date_expires: expiredDate,
                  account_settings: { ...existingUser.account_settings, date_expires: expiredDate }
                };

                store.dispatch(AMS.syncUserWithParent(updatedUser, "update", false)); // false = active
                //store.dispatch(AMS.updateUserAccountField({uuid, key: 'account_settings.date_expires', value: expiredDate, archived: false}));
                //store.dispatch(AMS.updateUserAccountField({uuid, key: 'date_expires', value: expiredDate, archived: false}));
            })
            toast.success("Users successfully expired");
        }
        else {
            toast.error("Failed to expire users");
        }
    }
}
export async function handleArchiving(uuid_list, is_parent, unarchive = false, sub_uuid_list = []){
    if(is_parent && !unarchive) {
        N.basicNotification("Archiving Parent will also archive all users, are you sure?", "Archive Parent",  true, "smallNotification", [<>
           <Button onClick={(e) => {handleArchivingConfirmed(uuid_list, is_parent, unarchive, sub_uuid_list); N.basicNotificationClose(true, "")}} variant="success">Continue</Button>
        </>]);
    }
    else if(!unarchive) {
       N.basicNotification("Are you sure you wish to Archive User?", "Archive User",  true, "smallNotification", [<>
          <Button onClick={(e) => {handleArchivingConfirmed(uuid_list, is_parent, unarchive, sub_uuid_list); N.basicNotificationClose(true, "")}} variant="success">Continue</Button>
       </>]);
    }
    if(is_parent && unarchive) {
        N.basicNotification("Are you sure you wish to un-archive Parent?", "Un-archive Parent",  true, "smallNotification", [<>
           <Button onClick={(e) => {handleArchivingConfirmed(uuid_list, is_parent, unarchive, sub_uuid_list); N.basicNotificationClose(true, "")}} variant="success">Continue</Button>
        </>]);
    }
    else if(unarchive) {
       N.basicNotification("are you sure you wish to un-archive User?", "Un-archive User",  true, "smallNotification", [<>
          <Button onClick={(e) => {handleArchivingConfirmed(uuid_list, is_parent, unarchive, sub_uuid_list); N.basicNotificationClose(true, "")}} variant="success">Continue</Button>
       </>]);
    }
}
export async function handleArchivingConfirmed(uuid_list, is_parent, unarchive = false, sub_uuid_list = []){
    let user_uuid_list = [];
    const parameters = {
        "uuids_to_archive": uuid_list,
        "user_uuid" : session_user_uuid,
        "unArchive": unarchive
    }

    if(is_parent){
        const res_parent = await post_data("/handleArchiveParent", parameters);
        if(res_parent && sub_uuid_list.length > 0) await handleArchiving(sub_uuid_list, false, unarchive);

        if(res_parent.failure_note == null) {
            toast.success("Parent and users "+ (unarchive ? "Unarchive" : "Archive") +" successfully");
            uuid_list.forEach(uuid => {
                let archivingAccount = store.getState().parentAccounts.activeAccounts.find(acc => acc.parent_account_uuid === uuid);
                if (!archivingAccount) archivingAccount = store.getState().parentAccounts.archivedAccounts.find(acc => acc.parent_account_uuid === uuid);

                if (archivingAccount) {
                    store.dispatch(AMS.removeParentAccount({ uuid, archived: unarchive }));
                    store.dispatch(AMS.addParentAccount({ account: archivingAccount, archived: unarchive ? false : true }));
                }
                const matchingUUIDs = store.getState().userAccounts.activeAccounts
                    .filter(acc => acc.parent_account_uuid === uuid).map(acc => acc.user_account_uuid);
                user_uuid_list.push(...matchingUUIDs);
            });
        }
        else{
            toast.error((unarchive ? "Unarchive" : "Archive") + " failed");
            return;
        }
    }
    else{

        const res_user = await post_data("/handleArchiveUser", parameters);
        const res_settings = await post_data("/handleArchiveUserSettings", parameters);
        if(res_user.failure_note == null && res_settings.failure_note == null) {
            toast.success("User "+ (unarchive ? "unarchive" : "archive") +" successfully");
            user_uuid_list = uuid_list;
        }
        else{
            if(res_user.failure_note != null && res_settings.failure_note != null) toast.error((unarchive ? "Unarchive" : "Archive") +" failed");
            else if(res_settings.failure_note != null)  toast.error("User settings "+ (unarchive ? "unarchive" : "archive") +" failed");
            else if(res_user.failure_note != null) toast.success("User "+ (unarchive ? "unarchive" : "archive") +" failed but settings archive successful");

            return;
        }
    }
    uuid_list.forEach(uuid => {
        let archivingAccount = store.getState().userAccounts.activeAccounts.find(acc => acc.user_account_uuid === uuid);
        if (!archivingAccount) archivingAccount = store.getState().userAccounts.archivedAccounts.find(acc => acc.user_account_uuid === uuid);

        if (archivingAccount) {
            store.dispatch(AMS.syncUserWithParent(archivingAccount, "remove", unarchive));
            store.dispatch(AMS.syncUserWithParent(archivingAccount, "add", unarchive ? false : true));
            //store.dispatch(AMS.removeUserAccount({ uuid, archived: unarchive }));
            //store.dispatch(AMS.addUserAccount({ account: archivingAccount, archived: unarchive ? false : true }));
        }
    });
}

export async function formatNewParentData(data){
    const parent_details = formatParentAccount(data);
    parent_details.parent_account_uuid = uuidv4();

    const parameters = {
        "postgres_only" : false,
        "parent_account_uuid": parent_details.parent_account_uuid,
        "parent_account_name": parent_details.name || "",
        "address" : parent_details.address || "",
        "country_code" : parent_details.country_code || "",
        "phone" : parent_details.phone.toString() || "",
        "fax" : parent_details.fax.toString() || "",
        "email" : parent_details.email.replace(/\s/g, "") || "",
        "web_site" : parent_details.website || "",
        "site_beacon_account" : parent_details.site_beacon_account ? true : false
    }

    if(parent_details.site_maximum_vessels_tracked) {
        parameters.maximum_vessels_tracked = Number(parent_details.site_maximum_vessels_tracked);
    }
    if(parent_details.date_expires) parameters.date_expires = parent_details.date_expires;
    if(parent_details.whitelabel_parent_account_uuid) {
        parameters.white_label_parent_account_uuid = parent_details.whitelabel_parent_account_uuid;
    }
    if(parent_details.is_whitelabel_parent) parameters.is_whitelabel_parent = parent_details.is_whitelabel_parent;
    if(parent_details.maritrace_internal_id) parameters.maritrace_internal_id = parent_details.maritrace_internal_id;

    const result = await postParentAccount(parameters);

    if(result.is_successful){
        const parent = await getAllParents(false, parent_details.parent_account_uuid);

        store.dispatch(AMS.addParentAccount({ account: parent[0]}));
        return parent[0];
    }
    else return null;
}

export async function validateEmail(data){
    const parameters =  {
        "email" : data.email_address.replace(/\s/g, "")
    }
    const res = await post_data("/get_validate_email", parameters);
    return res;
}

export async function formatNewUserData(data, updated_fields){
    const user_details = formatUserAccount(data);
    user_details.account_settings = formatUserSettings(data);
    const application = {name: "maritrace", email: "info@maritrace.com"};
    user_details.date_created = dayjs().format("YYYY-MM-DD");

    const user_info = {
        "user_account_uuid": uuidv4(),
         "maritrace_parent_account": {
             "parent_account_uuid": user_details.parent_account_uuid,
             "parent_account_name": user_details.parent_account_name
         },
         "email": user_details.email_address.replace(/\s/g, ""),
         "first_name": user_details.given_name,
         "last_name": user_details.surname,
         "expires": user_details.account_settings.date_expires
    }
    user_details.user_account_uuid = user_info.user_account_uuid;
    user_details.account_settings.user_account_uuid = user_info.user_account_uuid;

    if(user_details.front_facing_id && user_details.front_facing_id != "") user_info.ffid = user_details.front_facing_id;
    const parameters = {
       "user_list": [user_info],
        "initialise_settings" : true,
        "use_otp" : false,
        "application_name" : "maritrace",
        "application_email" : "info@maritrace.com"
    }

    if(user_details.maritrace_internal_id) parameters.maritrace_internal_id = user_details.maritrace_internal_id;

    const result = await postUserAccount(parameters);

    const {successful_updates, failed_updates } = await updateSettingsFields(user_details.user_account_uuid, [],
        user_details.account_settings, updated_fields);

    const newUserResp = await getAllUsers(false, user_details.parent_account_uuid, [user_details.user_account_uuid]);
    const newUserSettings = await getAllUserSettings(false, user_details.parent_account_uuid, [user_details.user_account_uuid]);
    newUserResp[0].account_settings = newUserSettings[0];
    const newUser = formatUserAccount(newUserResp[0]);

    //store.dispatch(AMS.addUserAccount({ account: newUser , archived:false }));
    store.dispatch(AMS.syncUserWithParent(newUser, "add"));

    return newUser;
}

export async function formatMultipleUsers(user_list, data, parent, updated_fields){
    let initial_settings = structuredClone(blankUserSettings);
    const { updated, updated_keys } = getChangedFields(data, initial_settings, updated_fields);
    const account_settings = updated;
    updated_fields = updated_keys;

    if ( updated_fields["date_expires"] && updated_fields["date_expires"] !== user_list[0]["date_expires"] ) {
      user_list = user_list.map(user => ({
        ...user,
        date_expires: updated_fields["date_expires"]
      }));
    }

    let user_info = [];
    let user_uuid_list = [];

    user_list.forEach(user => {
        user_uuid_list.push(user.user_account_uuid);
        user_info.push({
            user_account_uuid: user.user_account_uuid,
            maritrace_parent_account: {
                parent_account_uuid: parent.parent_account_uuid,
                parent_account_name: parent.parent_account_name
            },
            email: user.email_address.replace(/\s/g, ""),
            first_name: user.given_name,
            last_name: user.surname,
            expires: user.date_expires
        });
    });

    const parameters = {
        "user_list": user_info,
        "initialise_settings" : true,
        "use_otp" : false
    }

    if(parent.whitelabel_parent_account_uuid == "27208132-d4ad-46cf-86b3-2c6b16f70ec0"){
        parameters.application_name = "sednaglobal";
        parameters.application_email = "info@sedna.com";
    }
    if(parent.whitelabel_parent_account_uuid == "cd33941e-d1d8-478a-a938-d7feb2ff5a63") {
        parameters.application_name = "vanguard";
        parameters.application_email = "info@vanguard.com";
    }

    const resp = await postUserAccount(parameters, false);
    if(resp.is_successful) {
        const successful_updates = [];
        const failed_updates = [];

        if(updated_fields.length > 0){
            const {successful_updates, failed_updates } = await updateSettingsFields(G.getEmptyUUID(), user_uuid_list, account_settings, updated_fields);
        }

        const newUserList = await getAllUsers(false, parent.parent_account_uuid, user_uuid_list);

        newUserList.forEach(user => {
            //store.dispatch(AMS.addUserAccount({ account: user, archived:false }));
            store.dispatch(AMS.syncUserWithParent(user, "add"));
        });

        if(failed_updates.length > 0) {
            toast.success("Users created");
            toast.error("Failed settings: " + failed_updates);
            return false; //, "Failed settings: " + failed_updates];
        }
        else {
            toast.success("Users created");
            return true; //, "", account_settings];
        }
    } else {
        toast.error("Failed to create new users");
        return false;
    }
}

async function updateSettingsFields(user_uuid, user_uuid_list, account_settings, updated_fields){
    const successful_updates = [];
    const failed_updates = [];
    for(const key of updated_fields){
        let value = account_settings[key];

        if(value === "on") value = "true";
        if(value === "off") value = "false";

        const parameters = {
            "user_uuid_list" : user_uuid_list,
            "user_uuid" : user_uuid,
            "setting_field_name" : key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(''),
            "new_value" : String(value)
        }

        if(parameters.new_value != undefined && parameters.new_value != "undefined") {
            const res = await postIndividualSettings(parameters);
            if(res.is_successful) successful_updates.push(key);
            else failed_updates.push(key);
        }
    }

    return {successful_updates, failed_updates};
}

export async function updateParentData(data, parentAccount, updated_fields){
    const { updated, updated_keys } = getChangedFields(data, parentAccount, updated_fields);
    const updatedParent = updated;

    const parameters = {
        "postgres_only" : false,
        "parent_account_uuid": updatedParent.parent_account_uuid,
        "parent_account_name": updatedParent.name || "",
        "address" : updatedParent.address || "",
        "country_code" : updatedParent.country_code || "",
        "phone" : updatedParent.phone.toString() || "",
        "fax" : updatedParent.fax.toString() || "",
        "email" : updatedParent.email.replace(/\s/g, "") || "",
        "web_site" : updatedParent.website || "",
        "site_beacon_account" : updatedParent.site_beacon_account ? true : false
    }

    if(updatedParent.site_maximum_vessels_tracked) {
        parameters.maximum_vessels_tracked = Number(updatedParent.site_maximum_vessels_tracked);
    }
    if(updatedParent.date_expires) parameters.date_expires = updatedParent.date_expires;
    if(updatedParent.site_beacon_account) parameters.site_beacon_account = updatedParent.site_beacon_account;

    if(updatedParent.whitelabel_parent_account_uuid) {
        parameters.white_label_parent_account_uuid = updatedParent.whitelabel_parent_account_uuid;
    }
    if(updatedParent.is_whitelabel_parent) parameters.is_whitelabel_parent = updatedParent.is_whitelabel_parent;
    if(updatedParent.maritrace_internal_id) parameters.maritrace_internal_id = updatedParent.maritrace_internal_id;
    if(updatedParent.date_removed) parameters.date_removed = updatedParent.date_removed;
    if(updatedParent.user_account_uuid_removed) {
        parameters.user_account_uuid_removed = updatedParent.user_account_uuid_removed;
    }
    if(updated_keys && updated_keys.length > 0) {
        const resp = await postParentAccount(parameters);
        if(resp.is_successful) {
            toast.success('Parent account updated');
            store.dispatch(AMS.removeParentAccount(updatedParent.parent_account_uuid));
            store.dispatch(AMS.addParentAccount({ account: updatedParent}));
            return updatedParent;
        }
    }

    toast.error('Parent account failed to update');
    return null;
}

export async function updateUserData(data, userAccount, parentAccount, updated_fields){
    const { updated, updated_keys } = getChangedFields(data, userAccount, updated_fields);
    let keys_to_update = updated_keys;
    const updatedUser = updated;

    const parameters = {
       "user_list": [{
           "user_account_uuid": updatedUser.user_account_uuid,
           "maritrace_parent_account": {
               "parent_account_uuid": updatedUser.parent_account_uuid,
               "parent_account_name": updatedUser.parent_account_name
           },
           "email": updatedUser.email_address.replace(/\s/g, ""),
           "ffid" : updatedUser.front_facing_id,
           "first_name": updatedUser.given_name,
           "last_name": updatedUser.surname,
           "expires": updatedUser.account_settings.date_expires,
       }]
    }
    if(updatedUser.maritrace_internal_id) parameters.maritrace_internal_id = updatedUser.maritrace_internal_id;
    if(keys_to_update && keys_to_update.length > 0) {
        const resp = await postUserAccount(parameters, false)
        if(resp.is_successful) toast.success('User account updated');
    }
    return await updateUserSettings(data, updatedUser, parentAccount, updated_fields);
}
export async function updateUserSettings(data, userAccount, parentAccount, updated_fields){
    const { updated, updated_keys } = getChangedFields(data, userAccount.account_settings, updated_fields);
    let keys_to_update = updated_keys;

    if(updated) {
        userAccount.account_settings = updated;
        userAccount.date_expires = updated.date_expires;
    }


    const {successful_updates, failed_updates } = await updateSettingsFields(userAccount.user_account_uuid, [], userAccount.account_settings, updated_keys);
    if(successful_updates.length > 0) {
        toast.success(successful_updates);
        //store.dispatch(AMS.removeUserAccount(userAccount.user_account_uuid));
        //store.dispatch(AMS.addUserAccount({ account: userAccount }));
        store.dispatch(AMS.syncUserWithParent(userAccount, "remove"));
        store.dispatch(AMS.syncUserWithParent(userAccount, "add"));
    }
    if(failed_updates.length > 0) toast.error(failed_updates);

    return userAccount;
}

export function archiveAccount(userAccount, parentAccount){
    if(userAccount != null) archiveAccount(userAccount);
    else if(parentAccount != null) parentAccount(parentAccount);
}

export async function resetTutorial(uuid){
    const parameters = {
        "user_uuid" : uuid,
        "setting_field_name" : "TutorialStarted",
        "new_value" : null
    }
    const res = await postIndividualSettings(parameters);
    if(res.is_successful) toast.success("Tutorial reset");
    else toast.success("Error occurred");
}

function getChangedFields(data, original, updated_fields = []) {
    let updated = structuredClone(original);
    const updated_keys = [];

    for (const key in data) {
        if (!(key in original)) continue;
        let value = data[key];
        const originalValue = original[key];
        let parsed = value;

        if (typeof originalValue === 'number') parsed = Number(value);
        else if (typeof originalValue === 'boolean') parsed = value === 'true' || value === 'on';
        if(updated_fields.includes(key)){
            updated[key] = parsed;
            updated_keys.push(key);
        }
    }
     return { updated, updated_keys};
}

export async function combineAccountsData(parentList, userList){
    parentList.forEach(item => {
        const parent_users = userList.filter(i => i.parent_account_uuid === item.parent_account_uuid)  || [];
        item.children = parent_users;
    });

    return parentList;
}
export async function combineUserAccountsData(userList, userSetttingsList){
    userList.forEach(item => {
        const settings = userSetttingsList.find(i => i.user_account_uuid === item.user_account_uuid)  || [];
        if(settings != []){
            item.date_expires = settings.date_expires;
            item.last_login = settings.last_login;
        }
        item.account_settings = settings;
    });
    return userList;
}
export async function initialiseUser(futureDate, parent){
    const tempUser = structuredClone(blankUserAccount);
    tempUser.user_account_uuid = uuidv4();
    tempUser.parent_account_uuid = parent.parent_account_uuid;
    tempUser.parent_account_name  = parent.name;
    tempUser.date_created = new Date();
    tempUser.date_expires = futureDate;

    tempUser.account_settings.user_account_uuid = tempUser.user_account_uuid;
    tempUser.account_settings.user_settings_uuid = uuidv4();
    tempUser.account_settings.date_created = new Date();
    tempUser.account_settings.date_expires = futureDate;

    return tempUser;
}

function handleNavbarCollapse() {
  const navbar = document.getElementById("navbarNav");

  if (navbar && window.innerWidth <= 768) {
    navbar.classList.remove("show");
  }
  else if(navbar && !navbar.classList.contains("show")){
    navbar.classList.add("show");
  }
}

export const renderFormField = (field: FormField, inputsUpdated: (key: string) => void) => {
  const { type, placeholder, key, options, currentValue } = field;
  const today = new Date().toISOString().split("T")[0];
  const common = { name: key, placeholder, onChange: () => inputsUpdated(key) };

  switch (type) {
    case "select":
      return (
        <Form.Select {...common} defaultValue={currentValue ? options?.find(o => o.value == currentValue)?.value || "" : ""}>
          {placeholder && <option>{placeholder}</option>}
          {options?.map(o => <option key={o.value} value={o.value}>{o.name}</option>)}
        </Form.Select>
      );
    case "checkbox":
      return <Form.Check {...common} type="checkbox" defaultChecked={currentValue === "true"} />;
    case "tel":
      return <Form.Control {...common} type="tel" pattern="\d*" inputMode="numeric" defaultValue={currentValue || ""}
        onInput={e => e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "")} />;
    case "date":
      return <Form.Control {...common} type="date" defaultValue={currentValue ? dayjs(currentValue).format("YYYY-MM-DD") : ""} min={today} />;
    default:
      return <Form.Control {...common} {...(type === "textarea" ? { as: type } : { type })} defaultValue={currentValue || ""}
        autoCorrect="off" autoComplete="off" spellCheck={false} />;
  }
};

handleNavbarCollapse();

window.addEventListener("resize", handleNavbarCollapse);


export function archiveUser(userAccount){
}
export function archiveParent(parentAccount){
}
export function reactivateAccount(userAccount, parentAccount){
    if(userAccount != null) archiveAccount(userAccount);
    else if(parentAccount != null) parentAccount(parentAccount);
}
export function reactivateUser(userAccount){
}
export function reactivateParent(parentAccount){
}


//   --------------OBJECTS--------------  //

export interface ParentAccount{
    parent_account_uuid: string;
    date_created: DateTime | null;
    date_expires: DateTime | null;
    name: string;
    address: string;
    country_code: string;
    phone: number;
    fax: number;
    email: string;
    website: string;
    site_maximum_vessels_tracked: number;
    date_removed: DateTime | null;
    site_beacon_account: bool;
    whitelabel_parent_account_uuid: string;
    is_whitelabel_parent: bool;
    user_account_uuid_removed: string;
    removed_first_name: string;
    removed_last_name: string;
    removed_full_name: string;
    //LOCAL
    children: UserAccount[];
    last_pulse: DateTime | null;
}

export const defaultParentAccount: ParentAccount = {
  parent_account_uuid: "",
  date_created: null,
  date_expires: null,
  name: "",
  address: "",
  country_code: "",
  phone: 0,
  fax: 0,
  email: "",
  website: "",
  site_maximum_vessels_tracked: 0,
  date_removed: new Date(),
  site_beacon_account: false,
  whitelabel_parent_account_uuid: "",
  is_whitelabel_parent: false,
  user_account_uuid_removed: "",
  removed_first_name: "",
  removed_last_name: "",
  removed_full_name: "",
  // LOCAL
  children: [],
  archivedChildren: [],
  last_pulse: null,
};


export interface UserAccount {
    user_account_uuid: string;
    parent_account_uuid: string;
    parent_account_name: string;
    date_created: DateTime;
    email_address: string;
    given_name: string;
    surname: string;
    date_removed: DateTime | null;
    front_facing_id: string;
    maritrace_internal_id: string;
    account_settings: UserSettings;
    user_account_uuid_removed: string;
    removed_first_name: string;
    removed_last_name: string;
    removed_full_name: string;
    // local only
    date_expires: DateTime | null;
    last_login: DateTime | null;
    password: string;
}

export interface UserSettings {
    user_settings_uuid: string;
    date_created: DateTime;
    date_expires: DateTime | null;
    user_account_uuid: string;
    password: string;
    map_all_options: string;
    map_settings_base_map: string;
    map_overlays_selected: string;
    map_position: string;
    chart_visible: bool;
    chart_options: string;
    chart_username: string;
    chart_password: string;
    vessel_meta_data_sources: string;
    vessel_position_data_sources: string;
    vessels_selected: string;
    last_session_id: string;
    last_pulse: DateTime | null;
    last_login: DateTime | null;
    tableau_username: string;
    tableau_custom_views: bool;
    is_alert_admin: bool;
    asp_security_level: number;
    weather_settings: string;
    heatmap_settings: string;
    access_piracy: bool;
    access_piracy_risk_assessment: bool;
    access_tracking: bool;
    access_alerts: bool;
    access_main: bool;
    access_charts: bool;
    is_administrator: bool;
    reset_password_otp: string;
    reset_password_expires: DateTime | null;
    account_type: string;
    tutorial_started: DateTime | null;
    vessel_path_source: string;
    state_radpersistencemanager_fleetoverview: string;
    is_read_only: bool;
    mobile_settings: string;
    mercury_mobile_selected: string;
    mobile_session_id: string;
}

export const blankUserSettings: UserSettings = {
    user_settings_uuid: "",
    date_created: new Date(),
    date_expires: null,
    user_account_uuid: "",
    password: "",
    map_all_options: "",
    map_settings_base_map: "",
    map_overlays_selected: "",
    map_position: "",
    chart_visible: false,
    chart_options: "",
    chart_username: "",
    chart_password: "",
    vessel_meta_data_sources: "",
    vessel_position_data_sources: "",
    vessels_selected: "",
    last_session_id: "",
    last_pulse: null,
    last_login: null,
    tableau_username: "",
    tableau_custom_views: false,
    is_alert_admin: false,
    asp_security_level: 0,
    weather_settings: "",
    heatmap_settings: "",
    access_piracy: false,
    access_piracy_risk_assessment: false,
    access_tracking: false,
    access_alerts: false,
    access_main: false,
    access_charts: false,
    is_administrator: false,
    reset_password_otp: "",
    reset_password_expires: null,
    account_type: "",
    tutorial_started: null,
    vessel_path_source: "",
    state_radpersistencemanager_fleetoverview: "",
    is_read_only: false,
    mobile_settings: "",
    mercury_mobile_selected: "",
    mobile_session_id: ""
};


export const blankUserAccount: UserAccount = {
    user_account_uuid: "",
    parent_account_uuid: "",
    parent_account_name: "",
    date_created: new Date(),
    email_address: "",
    given_name: "",
    surname: "",
    date_removed: null,
    front_facing_id: "",
    maritrace_internal_id: "",
    account_settings: structuredClone(blankUserSettings),
    user_account_uuid_removed: "",
    removed_first_name: "",
    removed_last_name: "",
    removed_full_name: "",
    date_expires: null,
    last_login: null,
    password: ""
};

export function formatParentAccount(inputData: any) {
    return {
        parent_account_uuid: inputData.parent_account_uuid || "",
        date_created: inputData.date_created || "",
        //date_expires: inputData.date_expires || "",
        date_expires: dayjs(inputData.date_expires).format("YYYY-MM-DDTHH:mm") || "",
        name: inputData.name || inputData.parent_account_name || "",
        address: inputData.address || "",
        country_code: inputData.country_code || "",
        phone: inputData.phone || 0,
        fax: inputData.fax || 0,
        email: inputData.email || "",
        website: inputData.website || inputData.web_site || "",
        site_maximum_vessels_tracked: inputData.site_maximum_vessels_tracked || inputData.tracked_vessels ||
            inputData.tracking_slots || 0,
        date_removed: inputData.date_removed || "",
        user_account_uuid_removed: inputData.user_account_uuid_removed || "",
        site_beacon_account: Boolean(inputData.site_beacon_account),
        whitelabel_parent_account_uuid: inputData.whitelabel_parent_account_uuid || "",
        is_whitelabel_parent: Boolean(inputData.is_whitelabel_parent),
        children: (inputData.children || []).map(formatUserAccount),
        removed_first_name: inputData.removed_first_name || "",
        removed_last_name: inputData.removed_last_name || "",
        removed_full_name: `${inputData.removed_first_name || ""} ${inputData.removed_last_name || ""}`,
        last_pulse: null,
    };
}
export function formatUserAccount(inputData: any) {
    return {
        user_account_uuid: inputData.user_account_uuid || "",
        parent_account_uuid: inputData.maritrace_parent_account?.parent_account_uuid || inputData.parent_account_uuid || "",
        parent_account_name: inputData.maritrace_parent_account?.parent_account_name || inputData.parent_account_name || "",
        email_address: inputData.email || inputData.email_address || "",
        given_name: inputData.first_name || inputData.given_name || "",
        surname: inputData.last_name || inputData.surname || "",
        date_removed: inputData.date_removed || "",
        user_account_uuid_removed: inputData.user_account_uuid_removed || "",
        front_facing_id: inputData.ffid || "",
        maritrace_internal_id: inputData.maritrace_internal_id || "",
        account_settings: formatUserSettings(inputData.account_settings || {}),
        removed_first_name: inputData.removed_first_name || "",
        removed_last_name: inputData.removed_last_name || "",
        removed_full_name: `${inputData.removed_first_name || ""} ${inputData.removed_last_name || ""}`,
        date_created: inputData.date_created || inputData.account_settings?.date_created || "",
        date_expires: dayjs(inputData.date_expires).format("YYYY-MM-DDTHH:mm") ||
            dayjs(inputData.account_settings?.date_expires).format("YYYY-MM-DDTHH:mm") || "",
        last_login: inputData.last_login || inputData.account_settings?.last_login || "",
        password: "",
    };
}
export function formatUserSettings(inputData: any) {
    return {
        user_settings_uuid: inputData.user_settings_uuid || "",
        date_created: inputData.date_created || "",
        date_expires: dayjs(inputData.date_expires).format("YYYY-MM-DDTHH:mm") || "",
        user_account_uuid: inputData.user_account_uuid || "",
        password: inputData.password || "",
        map_all_options: inputData.map_all_options || "",
        map_settings_base_map: inputData.map_settings_base_map || "",
        map_overlays_selected: inputData.map_overlays_selected || "",
        map_position: inputData.map_position || "",
        chart_visible: inputData.chart_visible || false,
        chart_options: inputData.chart_options || "",
        chart_username: inputData.chart_username || "",
        chart_password: inputData.chart_password || "",
        vessel_meta_data_sources: inputData.vessel_metadata_sources || inputData.vessel_meta_data_sources || "",
        vessel_position_data_sources: inputData.vessel_position_data_sources || "",
        vessels_selected: inputData.vessels_selected || "",
        last_session_id: inputData.last_session_id || "",
        last_pulse: inputData.last_pulse || "",
        last_login: inputData.last_login || "",
        tableau_username: inputData.tableau_username || "",
        tableau_custom_views:Boolean(inputData.tableau_custom_views),
        is_alert_admin: Boolean(inputData.is_alert_admin),
        asp_security_level: inputData.asp_security_level || 0,
        weather_settings: inputData.weather_settings || "",
        heatmap_settings: inputData.heatmap_settings || "",
        access_piracy: Boolean(inputData.access_piracy),
        access_piracy_risk_assessment: Boolean(inputData.access_piracy_risk_assessment),
        access_tracking: Boolean(inputData.access_tracking),
        access_alerts: Boolean(inputData.access_alerts),
        access_main: Boolean(inputData.access_main),
        access_charts: Boolean(inputData.access_charts),
        is_administrator: Boolean(inputData.is_administrator),
        reset_password_otp: inputData.reset_password_otp || "",
        reset_password_expires: inputData.reset_password_expires || "",
        account_type: inputData.account_type || "",
        tutorial_started: inputData.tutorial_started || "",
        vessel_path_source: inputData.vessel_path_source || "",
        state_radpersistencemanager_fleetoverview: inputData.state_radpersistencemanager_fleetoverview || "",
        is_read_only: Boolean(inputData.is_read_only),
        mobile_settings: inputData.mobile_settings || "",
        mercury_mobile_selected: inputData.mercury_mobile_selected || "",
        mobile_session_id: inputData.mobile_session_id || "",
    };
}
