import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import '../CSS/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { session_id } from '../Javascript/session.js';
import * as AM from '../Javascript/AccountManagement.js';
import * as G from '../Javascript/General.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { post_data, get_page_content } from '../Javascript/API_Calls.js';
import { ToastContainer, toast } from 'react-toastify';
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../Redux/store";
import 'react-toastify/dist/ReactToastify.css';

interface Props {
    parentAccount: AM.ParentAccount | null,
    userAccount: AM.UserAccount | null,
    parentUuid?: string | null,
    create?: boolean,
    view_parent: ((editAccount: AM.ParentAccount, addUser:boolean) => void);
}

interface FormField {
  key: string;
  label: string;
  type: string;
  placeholder: string;
  options?: { value: string; name: string }[]; // optional and correctly typed
  currentValue: string;
}

interface RenderFormFieldsProps {
  fields: FormField[];
}
const EditUserAccountPage: React.FC<Props> = ({ parentAccount, userAccount, view_parent, parentUuid = "", create = false}) => {
    const dispatch = useDispatch<AppDispatch>();
    const parentAccountsOriginal = useSelector((state: RootState) => state.parentAccounts.activeAccounts);
    const [currentUserAccount, setCurrentUserAccount] = useState<AM.UserAccount>( userAccount ? userAccount : AM.blankUserAccount);
    const [currentParentAccount, setCurrentParentAccount] = useState<AM.ParentAccount | null>( parentAccount ? parentAccount : null);
    const [is_loading, set_is_loading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [createUser, setCreateUser] = useState(create);
    const whiteLabels = [{value: "", name: "No Whitelabelling"}, {value: "27208132-d4ad-46cf-86b3-2c6b16f70ec0", name: "Sedna Global"}, {value: "cd33941e-d1d8-478a-a938-d7feb2ff5a63", name: "Vanguard Tech Inc"}]
    const countryOptions = G.country_list.map(item => { return { value: item.alpha2, name: item.name }; });
    const parentNameList = Array.isArray(parentAccountsOriginal) ? parentAccountsOriginal
       .filter((item): item is NonNullable<typeof item> => item != null)
       .map(item => ({ value: item.parent_account_uuid, name: item.name })) : [];
    const futureDate = dayjs().add(100, 'year').format('YYYY-MM-DDTHH:mm').toString();
    const [userWhiteLabel, setUserWhiteLabel] = useState<{value:string, name:string} | null>();
    const [genPassword, setGenPassword] = useState<string>("");

    let updated_fields: string[] = [];

    const defaultUserFieldList: FormField[] = [
      { key: 'parent_account_uuid', label: 'Parent', type: 'select', placeholder: '', options: parentNameList, currentValue: '' },
      { key: 'given_name', label: 'First Name', type: 'text', placeholder: 'Enter First Name', options: [], currentValue: '' },
      { key: 'surname', label: 'Surname', type: 'text', placeholder: 'Enter Surname', options: [], currentValue: '' },
      { key: "email_address", label: 'Email', type: 'email', placeholder: 'Enter email', options: [], currentValue: '' },
      { key: 'vessel_position_data_sources', label: 'Data Source', type: 'text', placeholder: '', options: [], currentValue: 'ais.vessels_lloyds' },
      { key: 'date_expires', label: 'Date Expires', type: 'datetime-local', placeholder: '', options: [], currentValue: futureDate },
      { key: 'access_piracy', label: 'Access Piracy', type: 'checkbox', placeholder: '', options: [], currentValue: 'true' },
      { key: 'access_piracy_risk_assessment', label: 'Access Piracy RA', type: 'checkbox', placeholder: '', options: [], currentValue: 'true' },
      { key: 'access_tracking', label: 'Access Tracking', type: 'checkbox', placeholder: '', options: [], currentValue: 'true' },
      { key: 'access_alerts', label: 'Access Alerts', type: 'checkbox', placeholder: '', options: [], currentValue: 'true' },
      { key: 'access_main', label: 'Access Main', type: 'checkbox', placeholder: '', options: [], currentValue: 'true' },
      { key: 'is_administrator', label: 'Is Admin', type: 'checkbox', placeholder: '', options: [], currentValue: 'false' },
      { key: 'is_alert_admin', label: 'Alert Admin', type: 'checkbox', placeholder: '', options: [], currentValue: 'false' },
      { key: 'account_type', label: 'Account Type', type: 'select', placeholder: '', options: [{ value:'Standard', name: 'Standard'},
      { value:'Data Analytics Only', name: 'Data Analytics Only'}], currentValue: 'Standard' },
      { key: 'chart_options', label: 'Options JSON', type: 'textarea', placeholder: '', options: [], currentValue: '' },
    ]
    const [userFieldList, setUserFieldList] = useState<FormField[] | null>(null);

    const RenderFormFields = ({ fields }: { fields: FormField[] }) => {
      return (
       <>
         {fields.map(f => (
           <Form.Group className={f.type === "checkbox" ? "mb-3 split_checkboxes" : "mb-3"} as={Row} controlId={`form-${f.key}`} key={f.key}>
             <Form.Label column sm={4}>{f.label}</Form.Label>
             <Col sm={8}>{AM.renderFormField(f, inputsUpdated)}</Col>
           </Form.Group>
         ))}
       </>
    )};

    const handleGenPassword = async () => {
        setIsUpdating(true);

        const password = G.generatePassword();

        const res = await AM.updatePassword(currentUserAccount.email_address, password, userWhiteLabel?.value);
        if(res.is_successful) {
            toast.success("Password generated");
            setGenPassword(password);
        }
        else{
            toast.error("Unknown error occurred");
        }

        setIsUpdating(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        setIsUpdating(true);
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        const formData = new FormData(target);
        const data = Object.fromEntries(formData.entries());

        const email = data["email_address"];
        if (typeof email !== "string" || !email.includes("@")) {
            toast.error("Email address required");
            return;
        }

        const checkboxes = target.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
            if (!(checkbox.name in data)) data[checkbox.name] = "false";
        });


        if (parentAccountsOriginal) {
            const foundParent = parentAccountsOriginal.find(i => data.parent_account_uuid === i.parent_account_uuid);
            if (foundParent) data["parent_account_name"] = foundParent.name || "";
            else data["parent_account_name"] = "";
        }

        if(createUser) {
            const res = await AM.validateEmail(data);

            if(res.email_used) alert("Email address already used on previous account");
            else {
                const res = await AM.formatNewUserData(data, updated_fields);
                if(res) {
                    set_is_loading(true);
                    setCreateUser(false);
                    const password = G.generatePassword();
                    await AM.updatePassword(res.email_address, password, userWhiteLabel?.value);
                    setGenPassword(password);
                    toast.success("User created successfully");
                    setCurrentUserAccount(res);
                }
            }
        }
        else if("user_account_uuid" in data) {
            const res = await AM.updateUserData(data, currentUserAccount, parentAccount, updated_fields)
            if(res) setCurrentUserAccount(res);
            else{
                toast.error("User update failed");
            }
            updated_fields = [];
        }
        setIsUpdating(false);
    };
    useEffect(() => {

      if (userAccount) {
        setCurrentUserAccount(userAccount);
      }
    }, [userAccount]);

    useEffect(() => {
      if (parentAccount && currentParentAccount == null) {
        setCurrentParentAccount(parentAccount);
      }
      else if(parentUuid != "" && currentParentAccount == null) setCurrentParentAccount(parentAccountsOriginal.find(p => p.parent_account_uuid == parentUuid) ?? null);
      else if(userAccount && currentParentAccount == null) setCurrentParentAccount(parentAccountsOriginal.find(p => p.parent_account_uuid == userAccount.parent_account_uuid) ?? null);
      else if(currentUserAccount != null && currentParentAccount == null) setCurrentParentAccount(parentAccountsOriginal.find(p => p.parent_account_uuid == currentUserAccount.parent_account_uuid) ?? null);

    }, [parentAccount, parentUuid, currentUserAccount]);

    useEffect(() => {
        handleUpdates();
    }, [currentUserAccount])
    const handleUpdates = async () => {
      if (currentUserAccount) {
        const ua = currentUserAccount;

        setUserFieldList(
          defaultUserFieldList.map((field) => {
            const key = field.key as keyof AM.UserAccount;
            const key2 = field.key as keyof AM.UserSettings;

            return {
              ...field,
              currentValue:
                key in ua ? String(ua[key]) :
                key2 in ua.account_settings ? String(ua.account_settings[key2]) : ''
            };
          })
        );
      }
    };

    useEffect(() => {
       const fetchData = async () => {
           try {
                updated_fields = [];

                if (currentUserAccount && !createUser) {
                     handleUpdates();
                     const userParent = parentAccountsOriginal?.find(i => i.parent_account_uuid === currentUserAccount.parent_account_uuid) || null;

                     whiteLabels.forEach(item => {
                       if (userParent && item.value === userParent?.whitelabel_parent_account_uuid) {
                         setUserWhiteLabel(item);
                       }
                     });
                } else if(createUser){
                    if(parentUuid && parentUuid != "") {
                        setUserFieldList(defaultUserFieldList.map(field => {
                            if(field.key == "parent_account_uuid") {
                                field.currentValue = parentUuid;
                                return {
                                    ...field,
                                    currentValue: parentUuid
                                }
                            }
                            else return { ...field}
                        }));
                    }
                    else setUserFieldList(defaultUserFieldList);
                }
           } catch (error) {
               console.error(error);
           } finally {
               if( userFieldList != null ) set_is_loading(false);
           }
       };
       if (is_loading) fetchData();
    }, [currentUserAccount, userFieldList]);

    const inputsUpdated = (input_name: string) => {
        if (!updated_fields.includes(input_name)) updated_fields.push(input_name);
    };

    return (
        <div id="edit_account_page" className="page_container">
            {is_loading ? (
                G.showLoadingPanel()
            ) : (
            <>
            {currentUserAccount || createUser ? (
                <div className="container">
                    <div style={{ float: "left", width: "100%" }}className="title_cont">
                        <h1 className="page_title">{!createUser ? "Edit User: " + currentUserAccount.given_name + " " + currentUserAccount.surname : "Create User"}</h1>
                        { currentParentAccount != null && (<Button style={{ float: "right" }} onClick={() => view_parent(currentParentAccount!, false)}>View Parent</Button>)}
                        {!createUser ? ( <><p style={{ float: "right", marginRight: "20px" }} className="title"> Internal Id: <b>{currentUserAccount.maritrace_internal_id}</b></p>
                            <p style={{ float: "right", marginRight: "20px" }} className="title"> FFID: <b>{currentUserAccount.front_facing_id}</b></p>
                            <p style={{ float: "right", marginRight: "20px" }} className="title">UUID: <b>{currentUserAccount.user_account_uuid}</b></p></> ) : null}
                    </div>
                    <Form onSubmit={handleSubmit}>
                      {!createUser ? (<input type="hidden" name="user_account_uuid"
                        value={currentUserAccount.user_account_uuid} />) : null}
                      <div className="left" style={{ flex: 1 }}>
                          <Form.Group as={Row} className="mb-3" controlId="form-date_created" key="date_created">
                             <Form.Label column sm={4}>Date Created</Form.Label>
                             <Col sm={8}>
                                 <Form.Control name="date_created" type="date" value={currentUserAccount.date_created ?
                                 dayjs(currentUserAccount.date_created).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')} disabled/>
                             </Col>
                          </Form.Group>
                          {userFieldList && ( <RenderFormFields fields={userFieldList.slice(0, Math.ceil(userFieldList.length / 2))}/> )}
                      </div>

                      <div className="right" style={{ flex: 1 }}>
                          { userFieldList ? (
                            <RenderFormFields fields={userFieldList.slice(Math.ceil(userFieldList.length / 2))}/>
                          ) : null }
                          { genPassword != "" ? (
                            <Form.Group style={{ color: 'red' }} className="mb-3" controlId="form-gen_password" key="gen_password">
                                <Form.Label style={{ float: 'left' }} column sm={4}><b>Generated Password</b></Form.Label>
                                <Col style={{ float: 'right', maxWidth: '405px' }} sm={8}>
                                    <Form.Control className="clickToCopyText" name="gen_password" type="text" value={genPassword} title="Click to copy"
                                        readOnly onClick={(e) => G.copyTextFromEvent(e)}/>
                                </Col>
                            </Form.Group>
                          ) : null }
                      </div>

                      { !createUser && currentUserAccount != null ? (
                         <div style={{ float: 'right', maxWidth: '482px' }} className="right">
                             <Button  style={{ float: 'right', marginLeft: '20px' }} variant="primary" className="mt-3" onClick={() => handleGenPassword()}>
                             Generate Password</Button>
                             <Button style={{ float: 'right' }} variant="primary" className="mt-3" onClick={() => AM.resetTutorial(currentUserAccount.user_account_uuid)}>
                             Reset Tutorial</Button>
                         </div>
                      ) : null }

                      <Button style={{ float: 'right'}} variant="primary" type="submit" className="mt-3">Submit</Button>
                    </Form>
                </div>
            ) : ( <p>An Error Occurred</p> )}
            </>
            )}
            <ToastContainer position="bottom-right" autoClose={3000} />
            {isUpdating ? (
                <div id="updating_loading_panel"> {G.showLoadingPanel()}</div>
            ) : null}
        </div>
    );
};
/*
<Button style={{ float: 'right', marginLeft: '20px' }} variant="primary" className="mt-3" onClick={() => AM.resetPassword(currentUserAccount.email_address, userWhiteLabel?.name)}>
Reset Password</Button>
*/
export default EditUserAccountPage;