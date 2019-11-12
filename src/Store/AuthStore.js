import { observable, action } from 'mobx';
import axios from 'axios'
export default class AuthStore {
    @observable auth = {}
    @action initialize(data) {
        this.auth = data
    }
    @action refreshAuth(id) {
        return axios.get(`/auth?soeid=${id}&sheetName=${this.sheetName}`).then(res => {
            this.auth = res.data
        })
    }
}