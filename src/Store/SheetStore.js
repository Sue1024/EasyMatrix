import { observable, action } from 'mobx';
import axios from 'axios'
class SheetRows {
    @observable rows = {}
    @observable sheetName = ""
    @action push(row) {
        this.rows.push(row)
    }
    @action pop() {
        this.rows.pop()
    }
    @action initialize(data) {
        this.rows = data
    }
    @action setSheetName(name) {
        this.sheetName = name;
    }
    @action refreshData() {
        return axios.get(`/data/all?sheetName=${this.sheetName}`).then(res => {
            this.rows = res.data
        })
    }
}
export default SheetRows