import axios from "axios";
import { getSessionParentUuid, getSessionUserUuid } from "./session"
let access_token = null;
let refresh_token = null;

 /* LIVE! */
let api_gateway = 'https://api-gateway.maritrace.com/api';
//let api_gateway = 'http://localhost:8080/api';

export const post_data = async (endpoint, request_data) => {
  if(access_token == null){
    await startSystem();
  }
  const api_endpoint = api_gateway + "/microservice" + endpoint;
  try {
    const headers = {
      'Authorization': 'Bearer ' + access_token
    };

    const api_response = await axios.post(api_endpoint, request_data, { headers });
    let response = api_response.data;

    if (response.payload){
        response = response.payload;
    }
    if(response.Items){
        response = response.Items;
    }
    return response;
  } catch (error) {
    if (error.response) {
      console.error('API Error Response:', error.response);
      throw new Error(`API responded with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else if (error.message) {
      throw new Error(`API request failed: ${error.message}`);
    } else {
      throw new Error("API request failed: Unknown reason");
    }
  }
};

export const post_data_mws = async (endpoint, request_data, mws_topic) => {
  if(access_token == null){
    await startSystem();
  }
  const api_endpoint = api_gateway + "/mws" + endpoint;
  try {
    const headers = {
      'Authorization': 'Bearer ' + access_token,
      'ParentUuid': getSessionParentUuid(),
      'UserUuid': getSessionUserUuid(),
      'mwsTopic' : mws_topic
    };

    const api_response = await axios.post(api_endpoint, request_data, { headers });
    let response = api_response.data;

    if (response.payload){
        response = response.payload;
    }
    if(response.Items){
        response = response.Items;
    }
    return response;
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
};

/*async function retrieveTokensOld() {
    try {
        //console.log(api_gateway + '/report-system');
        const requestBody = {
            "UserName": "zoho-system",
            "UserId": "AIDN6Z3RQLH25WJD8M2XP",
            "AccessKeyId": "AKIN6Z3RQLH75DJDCC9E",
            "SecretAccessKey": "6Yzq4mNPTvWsGgk1bD2tFr8pLx9QhR7eSaJjCUyo"
        };
        const response = await axios.post(api_gateway + '/validate-system', requestBody);
        const payload = response.data.payload;
        console.log("Orig Token Payload:", payload);

        access_token = payload['ACTIVE Token'];
        refresh_token = payload['REFRESH Token'];
        setTimeout(refreshAccessToken, 60 * 60 * 500);
    } catch (error) {
        console.error('Error retrieving tokens:', error);
        window.location.reload();
        throw error;
    }
}*/

async function retrieveTokens() {
    try {
        let requestBody = {
            "key" : "admin_system_AccessKeyId",
            "userID" : "QW9JE5CRLKD17X8BPA3MYZ",
        };
        let response = await axios.post(api_gateway + '/validateAPI/get_api_security_key', requestBody);
        const value = response.data.value;
        //console.log("value 1: ", value);
        const validateBody = {
            "SystemName": "admin_system",
            "UserId": "QW9JE5CRLKD17X8BPA3MYZ",
            "AccessKeyId": value,
        };

        response = await axios.post(api_gateway + '/validate-system-new', validateBody);
        const payload = response.data.payload;
        //console.log("payload 1: ", payload);

        access_token = payload['ACTIVE Token'];
        refresh_token = payload['REFRESH Token'];
        setTimeout(refreshAccessToken, 60 * 60 * 500);
    } catch (error) {
        console.error('Error retrieving tokens:', error);
        throw error;
    }
}

async function refreshAccessToken() {
  try {
    const response = await axios.get(api_gateway + '/active_token', {
         headers: {
             Authorization: `Bearer ${refresh_token}`
         }
     });

    const payload = response.data.payload;
    access_token = payload['active_token'];

    setTimeout(refreshAccessToken, 60 * 60 * 500);
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}
function scheduleRefreshRefreshToken() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const timeUntilNextDay = tomorrow.getTime() - now.getTime();

  setTimeout(refreshRefreshToken, 60 * 60 * 1000 * 24);
}
async function refreshRefreshToken() {
  try {
    const response = await axios.get(api_gateway + '/refresh_token', {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    });

    const payload = response.data.payload;
    refresh_token = payload['refresh_token'];

    scheduleRefreshRefreshToken();
  } catch (error) {
    console.error('Error refreshing refresh token:', error);
    throw error;
  }
}
// Function to start the system
async function startSystem() {
  await retrieveTokens(); // Initial token acquisition
  scheduleRefreshRefreshToken(); // Schedule refresh of refresh token every day
}


var get_content = {
    "host": "maritrace",
    "language": "BR",
    "page": ""
};

export async function get_page_content(page_name){
    get_content.page = page_name;
    const res = await post_data("/get_localisation_content", get_content );

    const formatted_res: { [key: string]: string} = {};
    res.forEach((item: { id: string; content: string }) => {
      formatted_res[item.id] = item.content;
    });

    return formatted_res;
}