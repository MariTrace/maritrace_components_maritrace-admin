import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import '../CSS/style.css';
import { session_id } from '../Javascript/session.js';
import * as AM from '../Javascript/AccountManagement.js';
import * as G from '../Javascript/General.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatStringForHTML } from '../Javascript/General.js';
import { post_data, get_page_content } from '../Javascript/API_Calls.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Table, Button } from 'react-bootstrap';
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../Redux/store.js";
import { ToastContainer, toast } from 'react-toastify';

interface Props {
    edit_element: ((editAccount: AM.ParentAccount, addUser:boolean) => void);
}

const InactiveParentManagementPage: React.FC<Props> = ({edit_element}) => {
    const [is_loading, set_is_loading] = useState(false);
    const parentAccountsOriginal = useSelector((state: RootState) => state.parentAccounts.activeAccounts);
    const [parentAccountsList, setParentAccountsList] = useState<AM.ParentAccount[]>(parentAccountsOriginal);
    const userAccountsOriginal = useSelector((state: RootState) => state.userAccounts.activeAccounts);
    const [userAccountsList, setUserAccountsList] = useState<AM.UserAccount[]>(userAccountsOriginal);
    const [expandedRowUuid, setExpandedRowUuid] = useState<string | null>(null);

    const toggleExpand = (uuid: string) => {
        setExpandedRowUuid(prev => (prev === uuid ? null : uuid));
    };

    /*useEffect(() => {
        if(parentAccountsOriginal){
            const parentAccounts = parentAccountsOriginal.filter(parent => {
              if (parent.children.length > 0) {
                const mostRecent = parent.children.reduce((latest, item) => {
                  const currentDate = new Date(item.account_settings?.last_pulse || 0);
                  const latestDate = new Date(latest.account_settings?.last_pulse || 0);
                  return currentDate > latestDate ? item : latest;
                });

                const mostRecentPulse = mostRecent.account_settings?.last_pulse;
                parent.last_pulse = mostRecentPulse;
                return mostRecentPulse && G.isAtLeastOneYearOld(mostRecentPulse);
              }

              return false;
            });

            setParentAccountsList(parentAccounts.filter(item => dayjs(item.date_expires).isAfter(dayjs())));
        }
    },[parentAccountsOriginal]);*/

    const [sortColumn, setSortColumn] = useState<{name: string, dir: boolean}>({name:"", dir: true})
    const [filterColumn, setFilterColumn] = useState<{name: string, value: string}>({name:"name", value: ""})
    const toggleSort = (column: string) => {
        if(sortColumn.name === column) setSortColumn({ name: sortColumn.name, dir: sortColumn.dir ? false : true});
        else setSortColumn({name: column, dir: true});
    };

    useEffect(() => {
        if(sortColumn.name != "") {
            setParentAccountsList(G.sortingData(parentAccountsList, sortColumn.name, sortColumn.dir ? "desc" : "asc"));
        }
    }, [sortColumn])
    useEffect(() => {
        const parentAccounts = parentAccountsOriginal
               .map(parent => {
                 if (parent.children.length > 0) {
                   const mostRecent = parent.children.reduce((latest, item) => {
                     const currentDate = new Date(item.account_settings?.last_pulse || 0);
                     const latestDate = new Date(latest.account_settings?.last_pulse || 0);
                     return currentDate > latestDate ? item : latest;
                   });

                   const mostRecentPulse = mostRecent.account_settings?.last_pulse;

                   // return a new object, don't mutate
                   return {
                     ...parent,
                     last_pulse: mostRecentPulse,
                   };
                 }
                 return null;
               })
               .filter(
                 (parent): parent is NonNullable<typeof parent> =>
                   !!parent?.last_pulse && G.isAtLeastOneYearOld(parent.last_pulse)
               );

        if(parentAccountsOriginal && parentAccounts){
            if(filterColumn.name != "" && filterColumn.value != "") {
                setParentAccountsList(G.filterData(parentAccounts, filterColumn.name, filterColumn.value));
            }
            else {
                setParentAccountsList(parentAccounts.filter(item => dayjs(item.date_expires).isAfter(dayjs())));
            }
        }
    }, [filterColumn, parentAccountsOriginal])

    return (
        <div id="inactive_parent_page" className="page_container">
            <h1 className="page_title">Inactive Parents</h1>
            <div className="filter_container">
                <div className="filter_columns">
                    <p> Filter by Column: <select value={filterColumn.name} className="form-select"
                      onChange={(e) => setFilterColumn({ name: e.target.value, value: filterColumn.value})}>
                        <option value="name">Name</option>
                        <option value="date_created">Date Created</option>
                        <option value="date_expires">Date Expires</option>
                        <option value="last_pulse">last_pulse</option>
                        <option value="children">Number of Accounts</option></select>
                      </p>
                </div>
                <div className="filter_value">
                    <p> value: <input type="text" className="form-control" value={filterColumn.value} autoCorrect="off" autoComplete="off"
                    spellCheck={false} onChange={(e) => setFilterColumn({ name:filterColumn.name , value: e.target.value})} /></p>
                </div>
            </div>
        {is_loading ? (
            <p>Loading...</p>
          ) : (
          <div className='custom-table_cont'>
              <Table striped bordered hover>
                <thead>
                    <tr>
                        <th></th>
                        <th className="sortable_column" onClick={() => toggleSort("name")}>Name {sortColumn.name == "name" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                        <th className="sortable_column" onClick={() => toggleSort("date_created")}>Date Created {sortColumn.name == "date_created" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                        <th className="sortable_column" onClick={() => toggleSort("date_expires")}>Date Expires {sortColumn.name == "date_expires" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                        <th className="sortable_column" onClick={() => toggleSort("last_pulse")}>last_pulse {sortColumn.name == "last_pulse" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                        <th className="sortable_column" onClick={() => toggleSort("children")}>Number of Accounts {sortColumn.name == "children" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {parentAccountsList?.map((item, index) => (
                    <>
                        <tr key={item.parent_account_uuid}>
                            <td>
                                <Button className="btn btn-light fas pt1-5 action_buttons" title={item.parent_account_uuid === expandedRowUuid ? "Collapse" : "Expand"}
                                  onClick={() => {toggleExpand(item.parent_account_uuid)}}>
                                    <FontAwesomeIcon icon={['fal', item.parent_account_uuid === expandedRowUuid ? 'square-minus' : 'square-plus']} />
                                </Button>
                                <Button className="btn btn-light fas pt1-5 action_buttons button_left_margin" title="Edit"
                                  onClick={() => {edit_element(item, false)}}>
                                    <FontAwesomeIcon icon={['fas', 'pencil']} />
                                </Button>
                            </td>
                            <td>{G.displayValue(item.name)}</td>
                            <td>{G.displayValue(item.date_created.split("T")[0])}</td>
                            <td>{G.displayValue(item.date_expires.split("T")[0])}</td>
                            <td>{G.displayValue(item.last_pulse?.split("T")[0])}</td>
                            <td>{G.displayValue(item.children?.length || 0)}</td>
                            <td><Button className="btn btn-light fas pt1-5 action_buttons2" onClick={() => {
                                const childUuids = item.children?.map((child: AM.UserAccount) => child.user_account_uuid) || [];
                                AM.handleArchiving([item.parent_account_uuid], true, false, childUuids)}}>Archive</Button>
                            </td>
                        </tr>
                        {expandedRowUuid === item.parent_account_uuid && (
                            <tr key={item.parent_account_uuid + "_expand"}>
                                <td colSpan={5}>
                                    <table className="child-table">
                                        <thead>
                                            <tr>
                                                <th></th>
                                                <th>Given Name</th>
                                                <th>Surname</th>
                                                <th>Email</th>
                                                <th>Date Created</th>
                                                <th>Date Expires</th>
                                                <th>API Account</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {item.children?.map((child: AM.UserAccount) => (
                                                <tr key={child.user_account_uuid}>
                                                    <td></td>
                                                    <td>{G.displayValue(child.given_name)}</td>
                                                    <td>{G.displayValue(child.surname)}</td>
                                                    <td className="clickToCopyText" onClick={(e) => G.copyTextFromEvent(e)}>{G.displayValue(child.email_address)}</td>
                                                    <td>{G.displayValue(child.date_created ? child.date_created.split("T")[0] : child.account_settings.date_created ? child.account_settings.date_created.split("T")[0] : ""  )}</td>
                                                    <td>{G.displayValue(child.date_removed ? child.date_removed.split("T")[0] : child.account_settings.date_expires ? child.account_settings.date_expires.split("T")[0] : ""  )}</td>
                                                    <td>false</td>
                                                    <td>
                                                        <Button className="btn btn-light fas pt1-5 action_buttons2" onClick={() => {AM.handleExpiring(child.user_account_uuid, false)}}>Expire</Button>
                                                        <Button className="btn btn-light fas pt1-5 action_buttons2" onClick={() => {AM.handleArchiving([child.user_account_uuid], false, false)}}>Archive</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!item.children || item.children.length === 0) && (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center' }}>
                                                        No user accounts found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        )}
                    </>
                    ))}
                </tbody>
              </Table>
          </div>
        )}
            <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
    );
};

export default InactiveParentManagementPage;