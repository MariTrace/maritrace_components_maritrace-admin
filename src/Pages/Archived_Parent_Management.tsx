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
}

const ArchivedParentManagementPage: React.FC<Props> = ({}) => {
    const [is_loading, set_is_loading] = useState(false);
    const parentAccountsOriginal = useSelector((state: RootState) => state.parentAccounts.archivedAccounts);
    const [parentAccountsList, setParentAccountsList] = useState<AM.ParentAccount[]>(parentAccountsOriginal);
    const userAccountsOriginal = useSelector((state: RootState) => state.userAccounts.archivedAccounts);
    const [userAccountsList, setUserAccountsList] = useState<AM.UserAccount[]>(userAccountsOriginal);
    const [expandedRowUuid, setExpandedRowUuid] = useState<string | null>(null);

    const toggleExpand = (uuid: string) => {
        setExpandedRowUuid(prev => (prev === uuid ? null : uuid));
    };

    const fetchContent = async () => {
        try {
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

    useEffect(() => {
    },[expandedRowUuid]);

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
        if(parentAccountsOriginal){
            if(filterColumn.name != "" && filterColumn.value != "") {
                setParentAccountsList(G.filterData(parentAccountsOriginal, filterColumn.name, filterColumn.value));
            }
            else setParentAccountsList(parentAccountsOriginal);
        }
    }, [filterColumn, parentAccountsOriginal])

    return (
        <div id="archived_parent_management_page" className="page_container">
            <h1 className="page_title">Archived Parents</h1>
              <div className="filter_container">
                  <div className="filter_columns">
                      <p> Filter by Column: <select value={filterColumn.name} className="form-select"
                        onChange={(e) => setFilterColumn({ name: e.target.value, value: filterColumn.value})}>
                          <option value="name">Name</option>
                          <option value="date_created">Date Created</option>
                          <option value="date_expires">Date Expires</option>
                          <option value="removed_full_name">Archived By</option>
                        </select>
                        </p>
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
                        <th className="sortable_column" onClick={() => toggleSort("name")}>Name {sortColumn.name == "name" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                        <th className="sortable_column" onClick={() => toggleSort("date_created")}>Date Created {sortColumn.name == "date_created" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                        <th className="sortable_column" onClick={() => toggleSort("date_expires")}>Date Expires {sortColumn.name == "date_expires" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                        <th className="sortable_column" onClick={() => toggleSort("removed_full_name")}>Archived By {sortColumn.name == "removed_full_name" ? sortColumn.dir ? <span className="sorting_arrow">&darr;</span> : <span className="sorting_arrow">&uarr;</span> : null}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {parentAccountsList?.map((item, index) => (
                    <>
                        <tr key={item.parent_account_uuid}>
                            <td><Button className="btn btn-light fas pt1-5 action_buttons" title={item.parent_account_uuid === expandedRowUuid ? "Collapse" : "Expand"}
                                                                  onClick={() => {toggleExpand(item.parent_account_uuid)}}>
                                                                    <FontAwesomeIcon icon={['fal', item.parent_account_uuid === expandedRowUuid ? 'square-minus' : 'square-plus']} />
                                                                </Button>
                            </td>
                            <td>{G.displayValue(item.name)}</td>
                            <td>{G.displayValue(item.date_created.split("T")[0])}</td>
                            <td>{G.displayValue(item.date_expires.split("T")[0])}</td>
                            <td>{item.removed_full_name}</td>
                            <td><Button className="btn btn-light fas pt1-5 action_buttons2" onClick={() => {
                                    const childUuids = item.children?.map((child: AM.UserAccount) => child.user_account_uuid) || [];
                                    AM.handleArchiving([item.parent_account_uuid], true, true)}}> Un-archive </Button>
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

export default ArchivedParentManagementPage;