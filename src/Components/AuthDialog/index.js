import React, { Component, Profiler } from "react";
import Modal from "antd/lib/modal"
import Select from "antd/lib/select"
import Profile from "../../components/Table/config/profile"
import axios from 'axios'
import './index.less'
const { Option } = Select;
export default class AuthDialog extends Component {
    constructor(props) {
        super(props)
        this.state={
            soeid: "",
            uneditableCols: [],
            invisibleCols: [],
            nonConfigurableCols: [],
            effectiveUsers: []
        }
    }
    onOk = () => {
        this.props.hide()
        const {soeid, uneditableCols, invisibleCols, nonConfigurableCols, effectiveUsers} = {...this.state}
        axios.post('/auth', {
            soeid,
            uneditableCols,
            invisibleCols,
            nonConfigurableCols,
            effectiveUsers
        })
    }

    onCancel = () => {
        this.props.hide()
    }

    onIdChange = (value) => {
        this.setState({
            soeid: value
        })
        axios.get(`auth?soeid=${value}`).then(res => {
            let {invisibleCols, uneditableCols, nonConfigurableCols, effectiveUsers} = {...res.data}
            this.setState({
                invisibleCols,
                uneditableCols,
                nonConfigurableCols,
                effectiveUsers
            })
        })
    }

    onInvisibleColsChange = (value) => {
        this.setState({
            invisibleCols: value
        })
    }

    onNonConfigurableColsChange = (value) => {
        this.setState({
            nonConfigurableCols: value
        })
    }

    onUneditableColsChange = (value) => {
        this.setState({
            uneditableCols: value
        })
    }
    render() {
        const person = this.props.auth && this.props.auth.effectiveUsers;
        const personList = person&&person.map((value, index) => {
            return <Option value={value} key={index}>{value}</Option>
        })
        const colList = Profile.colDefs.map((def, index) => {
            return <Option value={def.field} key={index}>{def.field}</Option>
        })
        return (
            <Modal
                title="Auth Management"
                visible={this.props.visible}
                onOk={this.onOk}
                onCancel={this.onCancel}
                destroyOnClose={true}>
                <div className="row">
                    <span className="label">SOEID:</span>
                    <Select
                        className="select"
                        showSearch
                        style={{ width: 200 }}
                        placeholder="Select a person"
                        optionFilterProp="children"
                        onChange={this.onIdChange}
                    >
                        {personList}
                    </Select>
                </div>

                <div className="row">
                    <span className="label">Effective Users:</span>
                    <Select
                        className="select"
                        mode="multiple"
                        style={{ width: 200 }}
                        disabled={true}
                        value={this.state.effectiveUsers}
                        optionFilterProp="children"
                    >
                        {personList}
                    </Select>
                </div>

                <div className="row">
                    <span className="label">Invisible Columns:</span>
                    <Select
                        className="select"
                        mode="multiple"
                        style={{ width: 200 }}
                        // placeholder="Invisible columns"
                        value={this.state.invisibleCols}
                        onChange={this.onInvisibleColsChange}
                        optionFilterProp="children"
                    >
                        {colList}
                    </Select>
                </div>

                <div className="row">
                    <span className="label">Uneditable Columns:</span>
                    <Select
                        className="select"
                        mode="multiple"
                        style={{ width: 200 }}
                        onChange={this.onUneditableColsChange}
                        value={this.state.uneditableCols}
                        // placeholder="Uneditable column"
                        optionFilterProp="children"
                    >
                        {colList}
                    </Select>
                </div>
                {/* <div className="row">
                    <span className="label">Non-configurable Columns:</span>
                    <Select
                        className="select"
                        mode="multiple"
                        style={{ width: 200 }}
                        onChange={this.onNonConfigurableColsChange}
                        // placeholder="Non-configurable columns"
                        optionFilterProp="children"
                    >
                        {colList}
                    </Select>
                </div> */}
            </Modal>
        )
    }
}