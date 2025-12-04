import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import '../CSS/style.css';
import '../CSS/AccountManagement.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { session_id } from '../Javascript/session.js';
import * as AM from '../Javascript/AccountManagement.js';
import * as G from '../Javascript/General.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Container, Row, Col, Form, Button, Table } from 'react-bootstrap';
import { post_data, get_page_content } from '../Javascript/API_Calls.js';
import { ToastContainer, toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import UserManagementPage from './User_Management';
import ArchivedUserManagementPage from './Archived_User_Management';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../Redux/store.js";

interface Props {
    parentAccount: AM.ParentAccount | null,
    parentUuid?: string | null,
    create?: boolean
    editUserCallback: ((editAccount: AM.UserAccount) => void);
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

const EditParentAccountPage: React.FC<Props> = ({ parentAccount, editUserCallback, parentUuid = "", create = false}) => {
    const [is_loading, set_is_loading] = useState(true);
    const [createParent, setCreateParent] = useState(create);
    const [isUpdating, setIsUpdating] = useState(false);
    const parentAccountsOriginal = useSelector((state: RootState) => state.parentAccounts.activeAccounts);
    const userAccountsOriginal = useSelector((state: RootState) => state.userAccounts.activeAccounts);
    const [userList, setUserList] = useState<AM.UserAccount[]>(userAccountsOriginal.filter(u => u.parent_account_uuid === parentAccount?.parent_account_uuid));
    const [rowNumber, setRowNumber] = useState<number>(1);
    const [addedRowUsers, setAddedRowUsers] = useState<AM.UserAccount[]>([]);
    const [rowUsers, setRowUsers] = useState<AM.UserAccount[]>([]);
    const whiteLabels = [{value: "", name: "No Whitelabelling"}, {value: "27208132-d4ad-46cf-86b3-2c6b16f70ec0", name: "Sedna Global"}, {value: "cd33941e-d1d8-478a-a938-d7feb2ff5a63", name: "Vanguard Tech Inc"}]
    const countryOptions = G.country_list.map(item => { return { value: item.alpha2, name: item.name }; });
    const futureDate = dayjs().add(100, 'year').format('YYYY-MM-DDTHH:mm').toString();
    const [userWhiteLabel, setUserWhiteLabel] = useState<{value:string, name:string} | null>();
    const [userSettings, setUserSettings] = useState<AM.UserSettings[] | null>(null);
    const [currentParentAccount, setCurrentParentAccount] = useState<AM.ParentAccount>(parentAccount ? parentAccount : AM.defaultParentAccount);

    let updated_fields: string[] = [];

    const defaultUserFieldList: FormField[] = [
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
        { key: 'vessel_position_data_sources', label: 'Data Source', type: 'text', placeholder: '', options: [], currentValue: 'ais.vessels_lloyds' },
    ];
    const [userFieldList, setUserFieldList] = useState<FormField[] | null>(null);

    const defaultParentFieldList: FormField[] = [
      { key: "name", label: 'Name', type: 'text', placeholder: 'Enter name', options: [], currentValue: '' },
      { key: "site_maximum_vessels_tracked", label: 'Max Vessels', type: 'number', placeholder: 'Enter max vessels', options: [], currentValue: '10' },
      { key: "whitelabel_parent_account_uuid", label: 'White Label Parent', type: 'select', placeholder: '', options: whiteLabels, currentValue: '' },
      { key: "date_expires", label: 'Date Expires', type: 'datetime-local', placeholder: '', options: [], currentValue: futureDate },
    ];
    const [parentFieldList, setParentFieldList] = useState<FormField[] | null>(null);

    const RenderFormFields = ({ fields }: { fields: FormField[] }) => (
      <>
        {fields.map(f => (
          <Form.Group className={f.type === "checkbox" ? "mb-3 split_checkboxes" : "mb-3"} as={Row} controlId={`form-${f.key}`} key={f.key}>
            <Form.Label column sm={4}>{f.label}</Form.Label>
            <Col sm={8}>{AM.renderFormField(f, inputsUpdated)}</Col>
          </Form.Group>
        ))}
      </>
    );

    const handleSubmit = async (e: React.FormEvent) => {
        setIsUpdating(true);
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        const formData = new FormData(target);
        const data = Object.fromEntries(formData.entries());

        const checkboxes = target.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
            if (!(checkbox.name in data)) data[checkbox.name] = "false";
        });

        if(createParent) {
            const result = await AM.formatNewParentData(data);
            if(result) {
                set_is_loading(true);
                setCreateParent(false)
                setCurrentParentAccount(result);
                handleUpdates();
                toast.success("Parent account created");
            }
            else toast.error("Error Occurred");
        }
        else if(data.parent_account_uuid && !data.user_account_uuid) {
            const res = await AM.updateParentData(data, currentParentAccount, updated_fields);
            if(res) {
                setCurrentParentAccount(res);
            }
            updated_fields = [];
        }
        setIsUpdating(false);
    };

    const handleSubmitUsers = async (e: React.FormEvent) => {
        setIsUpdating(true);
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        const formData = new FormData(target);
        const data = Object.fromEntries(formData.entries());

        const checkboxes = target.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
            if (!(checkbox.name in data)) data[checkbox.name] = "false";
        });

        if(currentParentAccount) {
            const result = await AM.formatMultipleUsers(rowUsers, data, currentParentAccount, updated_fields);

            if(result){
                const passwordList = await Promise.all(
                    rowUsers.map(async (user) => {
                        if(user.email_address != ""){
                            const password = G.generatePassword();
                            const result2 = await AM.updatePassword(user.email_address, password, userWhiteLabel?.value);
                            user.password = password
                            return password;
                        }
                    })
                );
                setRowUsers([]);
                setRowNumber(1);
                setAddedRowUsers([...addedRowUsers, ...rowUsers]);
            }
        }
        else toast.error("parent account not found");
        setIsUpdating(false);
    };

    const handleUpdates = async () => {
      setParentFieldList(defaultParentFieldList.map(field => {
          const key = field.key as keyof AM.ParentAccount;

          return {
              ...field,
              currentValue: currentParentAccount != null && key in currentParentAccount ? String(currentParentAccount[key]) : ''
          };
      }));
    };
    useEffect(() => {
      if(parentAccount) setCurrentParentAccount(parentAccount);
    }, [parentAccount]);

    useEffect(() => {
       const fetchData = async () => {
           try {
                updated_fields = [];
                if (!createParent) {
                    if (userList) setUserSettings(userList.map(i => i.account_settings));
                    if(userFieldList == null) setUserFieldList(defaultUserFieldList);
                }
                else if(createParent){
                    setParentFieldList(defaultParentFieldList);
                }
           } catch (error) {
               console.error(error);
           } finally {
               if( parentFieldList != null ) set_is_loading(false);
           }
       };
       if( is_loading ) fetchData();
    }, [parentFieldList, currentParentAccount]);

    const inputsUpdated = (input_name: string) => {
        updated_fields.push(input_name);
    };

    useEffect(() => {
        handleUpdates();
    }, [currentParentAccount])

    useEffect(() => {
        const fetchRowUsers = async () => {
            try {
                const currentRowUsers = structuredClone(rowUsers);
                if ( currentRowUsers.length != 0 && rowNumber <= currentRowUsers.length) currentRowUsers.length = rowNumber;
                else {
                    while (rowNumber > currentRowUsers.length) {
                        currentRowUsers.push(await AM.initialiseUser(futureDate, currentParentAccount));
                    }
                }
                setRowUsers(currentRowUsers);
            } catch (error) {
                console.error(error);
            }
        }
        if (rowNumber != rowUsers.length) fetchRowUsers();
    }, [rowNumber, rowUsers]);

    useEffect(() => {
        setUserList(userAccountsOriginal.filter(u => u.parent_account_uuid === currentParentAccount?.parent_account_uuid));
    }, [userAccountsOriginal]);

    return (
        <div id="edit_account_page" className="page_container">
            {is_loading ? (
                G.showLoadingPanel()
            ) : (
            <div className="container">
                <div className="edit_parent_tabs_cont d-flex">
                  <div id="mobile_burger">
                    <Button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                        aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                      <i className="fas fa-bars"></i>
                    </Button>
                  </div>
                  <div id="navbarNav" className="collapse show">
                      <div className="nav flex-column nav-pills me-3" id="v-pills-tab" role="tablist" aria-orientation="vertical">
                        <button className="nav-link active" id="v-pills-edit-tab" data-bs-toggle="pill" data-bs-target="#v-pills-edit" type="button" role="tab">
                          Edit Parent
                        </button>
                        <button className="nav-link" id="v-pills-view-tab" data-bs-toggle="pill" data-bs-target="#v-pills-view" type="button" role="tab">
                          View Users
                        </button>
                        <button className="nav-link" id="v-pills-archive-tab" data-bs-toggle="pill" data-bs-target="#v-pills-archive" type="button" role="tab">
                          Archived Users
                        </button>
                        <button className="nav-link" id="v-pills-add-tab" data-bs-toggle="pill" data-bs-target="#v-pills-add" type="button" role="tab">
                          Add Users
                        </button>
                      </div>
                  </div>

                  <div className="tab-content edit_parent_add_user_cont" id="v-pills-tabContent">
                    <div className="tab-pane fade show active" id="v-pills-edit" role="tabpanel">
                      {(currentParentAccount && !createParent) || createParent ? (
                          <div className="container">
                              <h1 className="page_title">{createParent ? "Create parent" : currentParentAccount ? "Edit: "+ currentParentAccount.name : ""}</h1>
                              <div style={{ float: "left", width: "100%" }} className="title_cont">
                                  {currentParentAccount && ( <p style={{ float: "right" }} className="title"> Uuid: <b>{currentParentAccount.parent_account_uuid}</b></p>)}
                              </div>
                              <Form id="edit_parent_form" onSubmit={handleSubmit}>
                                {currentParentAccount ? (<input type="hidden" name="parent_account_uuid"
                                  value={currentParentAccount.parent_account_uuid} />) : null}
                                <div className="left" style={{ flex: 1 }}>
                                    <Form.Group as={Row} className="mb-3" controlId="form-date_created" key="date_created">
                                       <Form.Label column sm={4}>Date Created</Form.Label>
                                       <Col sm={8}>
                                           <Form.Control name="date_created" type="date" value={currentParentAccount?.date_created ?
                                           dayjs(currentParentAccount.date_created).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')} disabled/>
                                       </Col>
                                    </Form.Group>
                                    {parentFieldList && ( <RenderFormFields fields={parentFieldList.slice(0, Math.ceil(parentFieldList.length / 2))}/> )}
                                </div>

                                <div className="right" style={{ flex: 1 }}>
                                  {parentFieldList && ( <RenderFormFields fields={parentFieldList.slice(Math.ceil(parentFieldList.length / 2))}/> )}
                                </div>
                                <Button style={{ float: 'right', margin: '10px'}} variant="primary" type="submit" className="mt-3">Submit</Button>
                              </Form>
                          </div>
                      ) : ( <p>An Error Occurred</p> )}
                    </div>
                    <div className="tab-pane fade" id="v-pills-view" role="tabpanel">
                      <UserManagementPage edit_element={editUserCallback} parentUuid={currentParentAccount?.parent_account_uuid ?? ""}/>
                    </div>
                    <div className="tab-pane fade" id="v-pills-archive" role="tabpanel">
                      <ArchivedUserManagementPage parentUuid={currentParentAccount?.parent_account_uuid ?? ""}/>
                    </div>
                    <div className="tab-pane fade" id="v-pills-add" role="tabpanel">
                        <h1 className="page_title">Add Users</h1>
                      <Form onSubmit={handleSubmitUsers}>
                        <Table id="add_multiple_table" className="add_multiple_users">
                            <thead>
                                <tr>
                                    <th>First Name</th>
                                    <th>Surname</th>
                                    <th>Email</th>
                                    {addedRowUsers.length > 0 && (
                                        <th style={{ color: 'red' }}>Password</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                            {addedRowUsers.map((newUser, i) => (
                                <tr key={i}>
                                    <td>
                                        <Form.Control onChange={(e) => newUser.given_name = e.target.value} name={'first_name_' + i} type="test" defaultValue={newUser.given_name} />
                                    </td>
                                    <td><Form.Control onChange={(e) => newUser.surname = e.target.value} name={'surname_' + i} type="test" defaultValue={newUser.surname} /></td>
                                    <td><Form.Control onChange={(e) => newUser.email_address = e.target.value} name={'email_' + i} type="test" defaultValue={newUser.email_address} /></td>
                                    <td><Form.Control className="clickToCopyText" name={'password_' + i} type="test" defaultValue={newUser.password} title="Click to copy"
                                    readOnly onClick={(e) => G.copyTextFromEvent(e)} /></td>
                                </tr>
                            ))}
                            {rowUsers.map((newUser, i) => (
                                <tr key={i}>
                                    <td>
                                        <Form.Control onChange={(e) => newUser.given_name = e.target.value} name={'first_name_' + i} type="test" defaultValue={newUser.given_name} />
                                    </td>
                                    <td><Form.Control onChange={(e) => newUser.surname = e.target.value} name={'surname_' + i} type="test" defaultValue={newUser.surname} /></td>
                                    <td><Form.Control onChange={(e) => newUser.email_address = e.target.value} name={'email_' + i} type="test" defaultValue={newUser.email_address} /></td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                        <Button onClick={() => {setRowNumber(rowNumber + 1)}}> Add User </Button>
                        <Button style={{ marginLeft: "10px"}} onClick={() => {setRowNumber(rowNumber - 1)}}> Remove User </Button>
                        <Button id="main_submit" variant="primary" type="submit">Submit</Button>
                        <Button id="mobile_submit" variant="primary" type="submit">Submit</Button>
                        <Button style={{ float: "right", marginRight: "10px"}} onClick={() => {G.copyTableContent("add_multiple_table")}}>Copy Table</Button>

                        <div className="multiple_users_settings">
                            <h2 className="sub_title">Default Settings</h2>
                            {userFieldList && ( <RenderFormFields  fields={userFieldList}/> )}
                        </div>
                      </Form>
                    </div>
                  </div>
              </div>
            </div>
            )}
            <ToastContainer position="bottom-right" autoClose={3000} />
            {isUpdating ? (
                <div id="updating_loading_panel"> {G.showLoadingPanel()}</div>
            ) : null}
        </div>
    );
};

export default EditParentAccountPage;