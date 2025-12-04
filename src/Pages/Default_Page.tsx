import React, { useEffect, useState } from 'react';
import { session_id, setSessionUserUuid, setSessionParentUuid, startSession } from '../Javascript/session.js';
import { post_data, get_page_content } from '../Javascript/API_Calls.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatStringForHTML } from '../Javascript/General.js';
import * as login_js from '../Javascript/Login_Page.js';
import * as G from '../Javascript/General.js';
import '../CSS/style.css';

interface Props {
}

const DefaultPage: React.FC<Props> = ({}) => {
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
        <div className="page_container">

        {is_loading ? (
            G.showLoadingPanel()
          ) : (
            <div className="header">
                <img className='logo' src={`${process.env.PUBLIC_URL}/Images/Logos/mtlogotransparent.png`} alt="Logo" />
                <p>{login_content?.login_header_text}</p>
            </div>
        )}
        </div>
    );
};

export default DefaultPage;
