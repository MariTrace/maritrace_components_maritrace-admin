import React, { useCallback, useEffect, useState } from 'react';
import { Container, Row, Col, Accordion, Card, Button } from 'react-bootstrap';
import { post_data, get_page_content } from '../Javascript/API_Calls.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as AM from '../Javascript/AccountManagement.js';
import { ToastContainer, toast } from 'react-toastify';
import { session_id } from '../Javascript/session.js';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as G from '../Javascript/General.js';
import dayjs from 'dayjs';
import '../CSS/style.css';

import InactiveParentManagementPage from './Inactive_Parent_Management';
import ArchivedParentManagementPage from './Archived_Parent_Management';
import EditParentAccountPage from './Edit_Parent_Account';
import ParentManagementPage from './Parent_Management';
import ArchivedUserManagementPage from './Archived_User_Management';
import InactiveUserManagementPage from './Inactive_User_Management';
import EditUserAccountPage from './Edit_User_Account';
import UserManagementPage from './User_Management';
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../Redux/store";
import * as AMS from "../Redux/Slices/AccountManagementSlices";

interface Props {
}

const MainPage: React.FC<Props> = () => {
    const [activeTab, setActiveTab] = useState<string>('parent');
    const [editParentAccount, setEditParentAccount] = useState<AM.ParentAccount | null>(null);
    const [editUserAccount, setEditUserAccount] = useState<AM.UserAccount | null>(null);
    const [parentAddUuid, setParentAddUuid] = useState<string | null>(null);
    const [activeContent2, setActiveContent2] = useState<React.ReactNode | null>();
    const [is_loading, set_is_loading] = useState(true);
    const [refreshCount, setRefreshCount] = useState(0);
    const [createdUser, setCreatedUser] = useState<string>("");

    const dispatch = useDispatch<AppDispatch>();
    const userReduxAccounts = useSelector((state: RootState) => state.userAccounts.activeAccounts);
    const userReduxArchivedAccounts = useSelector((state: RootState) => state.userAccounts.archivedAccounts);
    const parentReduxAccounts = useSelector((state: RootState) => state.parentAccounts.activeAccounts);
    const parentReduxArchivedAccounts = useSelector((state: RootState) => state.parentAccounts.archivedAccounts);

    const editParent = useCallback( async (editAccount: AM.ParentAccount, addUser:boolean) => {
        setEditParentAccount(editAccount);
        if(addUser) {
            setActiveTab("create_user");
            setParentAddUuid(editAccount.parent_account_uuid)
        }
        else setActiveTab("edit_parent");
    }, []);
    const editUser = useCallback( async (editAccount: AM.UserAccount) => {
        if(editAccount){
            setEditUserAccount(editAccount);
            setActiveTab("edit_user");
        }
        else{
            toast.error("Error occurred: failed to find user details")
        }
    }, []);
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                if (userReduxAccounts.length === 0) await dispatch(AMS.fetchAllUsers());
                if (userReduxArchivedAccounts.length === 0) await dispatch(AMS.fetchAllUsers(true));

                if (userReduxAccounts.length > 0 && parentReduxAccounts.length === 0) await dispatch(AMS.fetchAllParents());
                if (userReduxArchivedAccounts.length > 0 && parentReduxArchivedAccounts.length === 0) await dispatch(AMS.fetchAllParents(true));
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchAllData();
    }, [userReduxAccounts, userReduxArchivedAccounts, parentReduxAccounts, parentReduxArchivedAccounts ]);

    useEffect(() => {
        if(is_loading && userReduxAccounts.length != 0 && userReduxArchivedAccounts.length != 0 &&
        parentReduxArchivedAccounts.length != 0 && parentReduxAccounts.length != 0) {
            set_is_loading(false);
        }
    }, [userReduxAccounts, userReduxArchivedAccounts, parentReduxAccounts, parentReduxArchivedAccounts]);

    useEffect(() => {
      if(!is_loading && createdUser != "" && userReduxAccounts != null) {
        const matchedUser = userReduxAccounts.find(item => item.user_account_uuid === createdUser);
        if (matchedUser) {
            setEditUserAccount(matchedUser);
            setCreatedUser("");
            setActiveTab("edit_user");
        }
      }
    }, [createdUser, userReduxAccounts, is_loading]);

    useEffect(() => {
        if (!["edit_user", "edit_parent"].includes(activeTab)) {
            setEditParentAccount(null);
            setEditUserAccount(null);
        }
    }, [activeTab]);

    useEffect(() => {
        const ContentMain = (activeTab: string) => {

            if(activeTab === "load") setActiveContent2(G.showLoadingPanel());
            else if(activeTab === "inactive_parent") {
                setActiveContent2(<InactiveParentManagementPage edit_element={editParent}/>);
            }
            else if(activeTab === "archived_parent") setActiveContent2(<ArchivedParentManagementPage/>);
            else if(activeTab === "edit_parent"){
                setActiveContent2(<EditParentAccountPage key={`edit-parent-${Date.now()}`} parentAccount={editParentAccount} create={false} editUserCallback={editUser}/>);
            }
            else if(activeTab === "create_parent"){
                setActiveContent2(<EditParentAccountPage key={`create-parent-${Date.now()}`} parentAccount={null} create={true} editUserCallback={editUser}/>);
            }
            else if(activeTab === "archived_user") setActiveContent2(<ArchivedUserManagementPage/>);
            else if(activeTab === "inactive_user") setActiveContent2(<InactiveUserManagementPage edit_element={editUser}/>);
            else if(activeTab === "edit_user"){
                setActiveContent2(<EditUserAccountPage key={`edit-${editUserAccount?.user_account_uuid ?? "new"}`}
                parentAccount={editParentAccount} userAccount={editUserAccount ?? null} create={false} view_parent={editParent}/>);
            }
            else if(activeTab === "create_user"){
                setActiveContent2(<EditUserAccountPage key={`create-user-${Date.now()}`} parentAccount={null}
                userAccount={null} create={true} parentUuid={parentAddUuid} view_parent={editParent}/>);
            }
            else if(activeTab === "user") setActiveContent2(<UserManagementPage edit_element={editUser}/>);
            else{
                 setActiveContent2(<ParentManagementPage edit_element={editParent} edit_child_element={editUser}/>);
            }
        };
        if(parentReduxArchivedAccounts != null && parentReduxAccounts != null) {
            ContentMain(activeTab);
        }
    }, [is_loading, activeTab, editUserAccount, editParentAccount]);

    return (
        <div id="main_page" className="page_container">
            <div className="header">
                <div className="header_inner_cont">
                    <img className='logo' src={`${process.env.PUBLIC_URL}/Images/Logos/mtlogotransparent.png`} alt="Logo" />
                    <p>Ship Tracking and Global Maritime Intelligence</p>
                </div>
                <div id="tabs_container" className="container">
                    <ul className="nav nav-tabs">
                      <li className="nav-item dropdown">
                          <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            Parent Accounts
                          </a>
                          <ul className="dropdown-menu">
                            <li>
                              <a className={`dropdown-item ${activeTab === "redux" ? "active" : ""}`} href="#" onClick={() => setActiveTab("redux")}>
                                Active Parents
                              </a>
                            </li>
                            <li>
                              <a className={`dropdown-item ${activeTab === "inactive_parent" ? "active" : ""}`} href="#" onClick={() => setActiveTab("inactive_parent")}>
                                Inactive Parents
                              </a>
                            </li>
                            <li>
                              <a className={`dropdown-item ${activeTab === "archived_parent" ? "active" : ""}`} href="#" onClick={() => setActiveTab("archived_parent")}>
                                Archived Parents
                              </a>
                            </li>
                            <li>
                              <a className={`dropdown-item ${activeTab === "create_parent" ? "active" : ""}`} href="#" onClick={() => setActiveTab("create_parent")}>
                                Create Parent Account
                              </a>
                            </li>
                          </ul>
                        </li>

                      <li className="nav-item dropdown">
                          <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            User Accounts
                          </a>
                          <ul className="dropdown-menu">
                            <li>
                              <a className={`dropdown-item ${activeTab === "user" ? "active" : ""}`} href="#" onClick={() => setActiveTab("user")}>
                                Active Users
                              </a>
                            </li>
                            <li>
                              <a className={`dropdown-item ${activeTab === "inactive_user" ? "active" : ""}`} href="#" onClick={() => setActiveTab("inactive_user")}>
                                Inactive User Account
                              </a>
                            </li>
                            <li>
                              <a className={`dropdown-item ${activeTab === "archived_user" ? "active" : ""}`} href="#" onClick={() => setActiveTab("archived_user")}>
                                Archived User Account
                              </a>
                            </li>
                            <li>
                              <a className={`dropdown-item ${activeTab === "create_user" ? "active" : ""}`} href="#" onClick={() => setActiveTab("create_user")}>
                                Create User Account
                              </a>
                            </li>
                          </ul>
                        </li>

                    </ul>
                </div>
            </div>
        {is_loading ? (
            G.showLoadingPanel()
          ) : (
          <>
            <div className="container">
                {activeContent2}
            </div>
          </>
        )}
        </div>
    );
};
export default MainPage;