import React, { useEffect, useState } from 'react';
import { session_id, setSessionUserUuid, setSessionParentUuid, startSession } from '../Javascript/session.js';
import { post_data, get_page_content } from '../Javascript/API_Calls.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatStringForHTML } from '../Javascript/General.js';
import * as login_js from '../Javascript/Login_Page.js';
import * as G from '../Javascript/General.js';
import '../CSS/style.css';

interface Props {
  onTabChange: any;
}

const LoginPage: React.FC<Props> = ({ onTabChange }) => {
    const [login_content, set_login_content] = useState<login_js.LoginContent>(login_js.default_login_content);
    const [is_loading, set_is_loading] = useState(true);

    const fetchContent = async () => {
        try {
            const page_content = await get_page_content("login");
            set_login_content((prevLoginContent) => ({
                              ...prevLoginContent,
                              ...page_content,
                            }));
        } catch (error) {
            console.error(error);
        }
    }

    const [user, set_user] = useState("");
    const [password, set_password] = useState("");
    const [login_error, set_login_error] = useState("");
    const temp_white_label = "6ad06cfb-85aa-425d-bde6-eff63ac33211";

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        var login_details = {
            whiteLabelUuid : temp_white_label.toString(),
            emailAddress : user.toString(),
            password : password.toString(),
            urlHost : window.location.host.toString(),
            urlAbsolutePath : window.location.pathname.toString(),
            ipAddress : "89.37.64.185",
            sessionID : session_id.toString()
        };

        const res = await post_data("/get_MobileLogin", login_details);

        if (res && typeof res === 'object' && res.response === 'VALID' && res.user_uuid && G.allowedParents.includes(res.parent_uuid)){
            setSessionUserUuid(res.user_uuid);
            setSessionParentUuid(res.parent_uuid);
            startSession();
            onTabChange('main');
        } else {
            set_login_error("Login Failed");
        }
    };

    useEffect(() => {
       const fetchData = async () => {
           try {
             await fetchContent();
           } catch (error) {
             console.error(error);
           } finally {
             set_is_loading(false);
           }
         };

         fetchData();
    }, []);

    return (
        <div id="login_page" className="page_container">

        {is_loading ? (
            G.showLoadingPanel()
          ) : (
          <>
            <div className="header">
                <img className='logo' src={`${process.env.PUBLIC_URL}/Images/Logos/mtlogotransparent.png`} alt="Logo" />
                <p>{login_content?.login_header_text}</p>
            </div>

            <h1>{login_content?.login_title}</h1>
            <div className='container'>
            <div id='login_cont'>
                <p style={{ display : "none" }} className='text'>{formatStringForHTML(login_content?.login_welcome_text)}</p>

                <form id="login_form" onSubmit={onSubmit}>
                    <p className="input_label">{login_content?.login_email}:</p>
                    <input type="text" name="user_email" onChange={(e) => set_user(e.target.value)} />
                    <p className="input_label">{login_content?.login_password}:</p>
                    <input type="password"  name="user_password" onChange={(e) => set_password(e.target.value)}/>
                    <input type="submit" name="submit_login" value={login_content?.login_log_in} />
                    <a className='link' href="#">{login_content?.login_forgotten}</a>
                    <p>{login_error}</p>
                </form>
            </div>
            </div>
            </>
        )}
        </div>
    );
};

export default LoginPage;
