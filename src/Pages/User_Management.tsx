import React, { useEffect, useState } from 'react';
import '../CSS/style.css';
import { session_id } from '../Javascript/session.js';
import { formatStringForHTML } from '../Javascript/General.js';
import { post_data, get_page_content } from '../Javascript/API_Calls.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as AM from '../Javascript/AccountManagement.js';
import * as G from '../Javascript/General.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Container, Row, Col, Table, Button } from 'react-bootstrap';
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../Redux/store.js";
import { ToastContainer, toast } from 'react-toastify';

interface Props {
    edit_element: ((editAccount: AM.UserAccount) => void);
    parentUuid?: string;
}

const UserManagementPage: React.FC<Props> =({ edit_element, parentUuid = ""}) => {
    const userAccountsOriginal = useSelector((state: RootState) => state.userAccounts.activeAccounts);
    const [userAccountsList, setUserAccountsList] = useState<AM.UserAccount[]>([]);
    const [is_loading, set_is_loading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchContent = async () => {
        try {
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
       const fetchData = async () => {
           try {
             if(parentUuid != "") setUserAccountsList(userAccountsOriginal.filter(u => u.parent_account_uuid === parentUuid));
             else setUserAccountsList(userAccountsOriginal);
             await fetchContent();
           } catch (error) {
             console.error(error);
           } finally {
             set_is_loading(false);
           }
         };

         if(is_loading) fetchData();
    }, [is_loading]);

    const [sortColumn, setSortColumn] = useState<{name: string, dir: boolean}>({name:"", dir: true})
    const [filterColumn, setFilterColumn] = useState<{name: string, value: string}>({name:"parent_account_name", value: ""})
    const toggleSort = (column: string) => {
        setIsUpdating(true);
        if(sortColumn.name === column) setSortColumn({ name: sortColumn.name, dir: sortColumn.dir ? false : true});
        else setSortColumn({name: column, dir: true});
        setIsUpdating(false);
    };

    useEffect(() => {
        setIsUpdating(true);
        if(sortColumn.name != "") {
            setUserAccountsList(G.sortingData(userAccountsList, sortColumn.name, sortColumn.dir ? "desc" : "asc"));
        }
        setIsUpdating(false);
    }, [sortColumn]);

    useEffect(() => {
        setIsUpdating(true);
        let users:AM.UserAccount[] = userAccountsOriginal;
        if(parentUuid != "") users = userAccountsOriginal.filter(u => u.parent_account_uuid === parentUuid);
        if(filterColumn.name != "" && filterColumn.value != "") {
            setUserAccountsList(G.filterData(users, filterColumn.name, filterColumn.value));
        }
        else setUserAccountsList(users);
        setIsUpdating(false);
    }, [filterColumn, userAccountsOriginal, parentUuid]);

    return (
        <div id="user_management_page" className="page_container">
            <h1 className="page_title">Active Users</h1>
           <div className="filter_container">
               <div className="filter_columns">
                   <p> Filter by Column:
                   <select value={filterColumn.name} className="form-select" onChange={(e) => setFilterColumn({ name: e.target.value, value: filterColumn.value})}>
                       <option value="parent_account_name">Parent Account</option>
                       <option value="given_name">Given Name</option>
                       <option value="surname">Surname</option>
                       <option value="email_address">Email</option>
                       <option value="account_settings?.last_login">Last Login</option>
                       <option value="account_settings?.last_pulse">Last Pulse</option>
                       <option value="account_settings?.date_expires">Expires</option>
                  </select></p>
               </div>
               <div className="filter_value">
                   <p> Value: <input type="text" className="form-control" value={filterColumn.value} autoCorrect="off" autoComplete="off"
                   spellCheck={false} onChange={(e) => setFilterColumn({ name:filterColumn.name , value: e.target.value})} /></p>
               </div>
           </div>
        {is_loading ? (
            G.showLoadingPanel()
          ) : (
          <div className='custom-table_cont'>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th></th>
                            {parentUuid == "" && (<th className="sortable_column" onClick={() => toggleSort('parent_account_name')}>Parent Account {sortColumn.name == "parent_account_name" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>)}
                            <th className="sortable_column" onClick={() => toggleSort('given_name')}>Given Name {sortColumn.name == "given_name" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                            <th className="sortable_column" onClick={() => toggleSort('surname')}>Surname {sortColumn.name == "surname" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                            <th className="sortable_column" onClick={() => toggleSort('email_address')}>Email {sortColumn.name == "email_address" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                            <th style={{ minWidth: '140px' }} className="sortable_column" onClick={() => toggleSort('last_login')}>Last Login {sortColumn.name == "last_login" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                            <th style={{ minWidth: '140px' }} className="sortable_column" onClick={() => toggleSort('last_pulse')}>Last Pulse {sortColumn.name == "last_pulse" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                            <th style={{ minWidth: '100px' }} className="sortable_column" onClick={() => toggleSort('date_expires')}>Expires{sortColumn.name == "date_expires" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>

                    {userAccountsList?.map((item:AM.UserAccount) => (
                        <tr key={item.user_account_uuid}>
                            <td>
                                <Button className="btn btn-light fas pt1-5 action_buttons" title="Edit"
                                  onClick={() => {edit_element(item)}}>
                                    <FontAwesomeIcon icon={['fas', 'pencil']} />
                                </Button>
                            </td>
                            {parentUuid == "" && (<td>{G.displayValue(item.parent_account_name)}</td>)}
                            <td>{G.displayValue(item.given_name)}</td>
                            <td>{G.displayValue(item.surname)}</td>
                            <td className="clickToCopyText" onClick={(e) => G.copyTextFromEvent(e)}>{G.displayValue(item.email_address)}</td>
                            <td>{G.displayValue(item.last_login ? item.last_login.replace("T", " ").slice(0, 16) : "")}</td>
                            <td>{G.displayValue(item.account_settings?.last_pulse ? item.account_settings?.last_pulse.replace("T", " ").slice(0, 16) : "")}</td>
                            <td>{G.displayValue(item.date_expires ? item.date_expires.split("T")[0] : ""  )}</td>
                            <td>
                                <Button className="btn btn-light fas pt1-5 action_buttons2" onClick={() => {AM.handleExpiring(item.user_account_uuid, false)}}>Expire</Button>
                                <Button className="btn btn-light fas pt1-5 action_buttons2" onClick={() => {AM.handleArchiving([item.user_account_uuid], false, false)}}>Archive</Button>
                            </td>
                        </tr>
                    ))}
                    {userAccountsList.length == 0 && (
                        <tr><td>No Users Found</td></tr>
                    )}
                    </tbody>
                </Table>
          </div>
        )}
        <ToastContainer position="bottom-right" autoClose={3000} />
        {isUpdating ? (
            <div id="updating_loading_panel"> {G.showLoadingPanel()}</div>
        ) : null}
        </div>
    );
};

export default UserManagementPage;