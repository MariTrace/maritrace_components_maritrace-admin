import CustomNotification from '../Pages/CustomNotification'
import { createRoot } from 'react-dom/client';
import { Button, Form } from 'react-bootstrap';

function getRandomFourDigitNumber() {
    return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

export function handleNotificationRender(containerId, breadcrumb, titleList, contentList, customButtonList, includeClose, classList, onClose = null, callBack = null){
    let notificationContainer = document.createElement('div');
    notificationContainer.id = containerId;

    const root = createRoot(
        notificationContainer
    );

    root.render(
        <CustomNotification breadcrumbs={breadcrumb} title={titleList} text_content={contentList}
                custom_buttons={customButtonList} includeClose={[true, "Cancel"]} notification_class={classList} call_back_func={callBack}
                on_close={onClose} />
    );
};

export function basicNotification(message, messageTitle, isClose = true, className = "",  callbackButtons = null, id = "basicNotification"){
    const title = (<> <p className="title">{messageTitle}</p> </>);
    const content = (<> <p className="text">{message}</p> </>);
    const notif_id = "basicNotification";
    let buttons = (<></>);
    let closeText = "Cancel";
    const existing = document.getElementById(notif_id);
    if (existing) existing.remove();
    if(isClose) closeText = "Close";
    if(callbackButtons) buttons = callbackButtons;

    <CustomNotification breadcrumbs="basicNotification" title={[title]} text_content={[content]} custom_buttons={buttons}
             includeClose={[true, closeText]} notification_class={["basic_MT_notif"]} call_back_func={null}
             on_close={notificationClose} popupId={notif_id} popupContainer={className ? className : null}/>

    let notificationContainer = document.createElement('div');
    const root = createRoot(
        notificationContainer
    );
    root.render(
        <CustomNotification breadcrumbs="basicNotification" title={[title]} text_content={[content]} custom_buttons={buttons}
         includeClose={[true, closeText]} notification_class={["basic_MT_notif"]} call_back_func={null}
         on_close={notificationClose} popupId={notif_id} popupContainer={className ? className : null}/>
    );
}

export function externalCloseNotification(){
    const notifDiv = document.getElementById("popup-root");
    notifDiv.remove();
}

function notificationClose (close_all: boolean, close_item:string){
    const currentURL = window.location.href;
    let message = { item:"notification", value:"", value2:close_item}
    if(close_all) message.value = "CLOSE ALL";
    else message.value = "CLOSE";
}

export function basicNotificationClose() {
  const notif = document.getElementById("popup-root");
  if (notif && notif.parentNode) {
    notif.parentNode.removeChild(notif);
  }
}