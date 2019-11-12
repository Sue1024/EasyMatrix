import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.less';
import Excel from './Excel'
import Profile from './components/Table/config/profile'
import * as serviceWorker from './serviceWorker';
import { LicenseManager } from "ag-grid-enterprise";
import axios from 'axios'
import stores from './store/'
import { Provider } from 'mobx-react'
import { configure } from 'mobx'

LicenseManager.setLicenseKey(Profile.licenseKey);
// let id = window.location.pathname.split("").splice(1).join("")
// const auth_promise = axios.get(`/auth?soeid=${id}`);
// const data_promise = axios.get(`/data/all`);
// Promise.all([auth_promise, data_promise]).then(res => {
//     const auth = res[0].data;
//     const data = res[1].data;
//     stores.authStore.initialize(auth);
//     stores.sheetStore.initialize(data)

// })

ReactDOM.render(
    <Provider {...stores}>
        <Excel />
    </Provider>, document.getElementById('root')
);

serviceWorker.unregister();
configure({
    enforceActions: "observed"
})