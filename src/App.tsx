import React, { useEffect, useState } from 'react';
import '@fortawesome/fontawesome-pro/css/all.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import library from './Javascript/FontAwesome_Setup.js';
import * as S from './Javascript/session.js';
import Login_Page from './Pages/Login_Page';
import { Provider } from "react-redux";
import Default_Page from './Pages/Default_Page';
import Main_Page from './Pages/Main_Page';
import { store } from "./Redux/store";
import './CSS/App.css';

interface Props {
  activeTab:string,
  onTabChange:any
}

const App = () => {
  const [currentActiveTab, setActiveTab] = useState<string>('');
  const [startHeartBeat, setStartHeartBeat] = useState<boolean>(true);
  const url = new URL(window.location.href);

  useEffect(() => {
    const init = async () => {
      const storedSession = localStorage.getItem("session");
      if (storedSession) {
          await S.foundSession(JSON.parse(storedSession));
          const stillValid = await S.checkSession();
          if (stillValid) {
            setActiveTab("main");
          } else {
            setActiveTab("login");
          }
      }else {
       setActiveTab("login");
      }
    };
    init();
  }, []);

  useEffect(() => {
      const initHeartBeat = async () => {
        setStartHeartBeat(false);
        if(S.getSessionUserUuid() == "") S.startSession();

        const interval = setInterval(async () => {
            const stillValid = await S.checkSession();
            if (!stillValid) setActiveTab("login");
        }, 1 * 60 * 1000);//5 * 60 * 1000);

        return () => clearInterval(interval);
      };
      if (currentActiveTab === "main" && startHeartBeat) initHeartBeat();
  }, [currentActiveTab]);

  return (
  <Provider store={store}>
      <Content activeTab={currentActiveTab} onTabChange = {setActiveTab}/>
  </Provider>
  );
};
/* All content comes through this one function, the content is changed with a useState hook */
const Content: React.FC<Props> = ({activeTab, onTabChange}) =>{
  switch(activeTab){
      case 'login':
        return (
          <div>
            <Login_Page onTabChange = {onTabChange} />
          </div>
        );
      case 'main':
        return (<Main_Page />);
      default:
        return (<Default_Page />);
  };
};

export default App;