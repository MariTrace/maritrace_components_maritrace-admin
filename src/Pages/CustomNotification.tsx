import React, { useEffect, useState, useRef } from 'react';
import Popup from 'reactjs-popup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Accordion, Card, Button } from 'react-bootstrap';

interface Props {
  popupId?: string | null;
  popupContainer?: string | null;
  breadcrumbs: string;
  title: React.ReactNode[] | string[];
  text_content: React.ReactNode[];
  custom_buttons: React.ReactNode[] | null;
  includeClose: [boolean, string];
  notification_class: string[];
  call_back_func: ((item_id: string, more_info:string) => void) | null;
  on_close: ((close_all: boolean, close_item:string) => void) | null;
  itemId?: string[] | null;
}

const CustomNotification: React.FC<Props> = ({breadcrumbs, title, text_content, custom_buttons, includeClose, notification_class, call_back_func, on_close, itemId = null, popupId = null, popupContainer = null}) => {
    const [isOpen, setIsOpen] = useState(true); // State to control popup visibility
    const [titles, setTitles] = useState<React.ReactNode[]|string[]>(title);
    const [textContents, setTextContents] = useState<React.ReactNode[]>(text_content);
    const [notificationClasses, setNotificationClasses] = useState<string[]>(notification_class);
    const [itemIdList, setItemIdList] = useState<string[] | null>(itemId);

    const closePopup = (index: number) => {
        if (titles.length > 1 ){
            if(on_close != null) {
                if(itemIdList && itemIdList.length >= index) {
                    on_close(false, itemIdList[index]);
                    setItemIdList((prevIDs) => {if(prevIDs) return prevIDs.filter((_, i) => i !== index)
                    else return []});
                }
                else on_close(false, "");
            }

            setTitles((prevTitles) => prevTitles.filter((_, i) => i !== index));
            setTextContents((prevContents) => prevContents.filter((_, i) => i !== index));
            setNotificationClasses((prevClasses) => prevClasses.filter((_, i) => i !== index));

        }
        else{
            if(on_close != null) on_close(true, "");
            setTitles([]);
        }
    };

    const closeAllPopups = () => {
        if(on_close != null){
            on_close(true, "");
        }
        setTitles([]);
    };

    const handleCallBack = () => {
        if(call_back_func){
            call_back_func(new Date().toISOString(), breadcrumbs); // Trigger callback
        }
    }

    const copyToClipboard = (copyContent: React.ReactNode) => {
      if(copyContent){
          const content = extractText(copyContent);
          navigator.clipboard.writeText(content)
            .then(() => {
              alert('Text copied to clipboard!');
            })
            .catch((err) => {
              alert('Failed to copy text.');
              console.error(err);
            });
      }
    };

    const extractText = (node: React.ReactNode): string => {
        if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
            let textContent = '';
            const children = React.Children.map(node.props.children, (child: React.ReactNode) => {
                if (child === null || child === undefined) return '';

                if (typeof child === 'string' || typeof child === 'number') return child;

                if (React.isValidElement(child)) {
                    if (child.type === 'br') return '\n';
                    if (child.type === 'p') return extractText(child) + '\n\n';
                    return extractText(child);
                }
                return '';
            });
            return children ? children.join('') : ''; // No extra space between children
        }
        return String(node);
    };
    useEffect(() => {
    }, [titles, textContents, notificationClasses]);
    if(titles.length === 0) return null;
    return (
      <Popup open={isOpen} closeOnDocumentClick={false} modal nested>
    <div id={popupId ? popupId : ""} className={popupContainer ? popupContainer : ""}>
        {titles.map((_, i:number) => (
            <Container key={"notification_"+i} className={`popup-container ${notificationClasses[i]}`}>
              {/* Title */}
              <Container className="popup-header">

                { typeof titles[i] === "string" ? (
                    <h3>{titles[i]}</h3>
                ) : titles[i] }
                { includeClose[0] ? (
                    <div className="close_icon">
                        <Button onClick={() => closePopup(i)}><FontAwesomeIcon icon={['fas', 'xmark']} /></Button>
                    </div>
                ) : null }
              </Container>

              <Container className="popup-body">
                {textContents[i]}
              </Container>

              <Container className="popup-footer">
                {includeClose[1] != ""? (
                    <Button onClick={() => closePopup(i)} variant="light">{includeClose[1]}</Button>
                ) : null}
                {custom_buttons && Array.isArray(custom_buttons) ? (
                    custom_buttons.map((button, index) => (
                       <div key={index}>{button}</div> // Add unique key here
                    ))
                ) : custom_buttons === null ? (
                <div>

                    <Button onClick={closeAllPopups} variant="light">Close All Popups</Button>
                    <Button onClick={() => copyToClipboard(textContents[i])} variant="light">Copy Text</Button>
                </div>
                ) : null }
              </Container>
            </Container>
        ))}
    </div>
      </Popup>
    );
  };

export default CustomNotification;