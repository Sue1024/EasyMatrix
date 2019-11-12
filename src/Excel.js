import React, { Component } from 'react'
import Table from './components/Table'
import Footer from './components/Footer'
import 'antd/dist/antd.css';
import Header from './components/Header'
import './styles/index.less';
export default class Excel extends Component {
    constructor(props) {
        super(props)
    }
    
    render() {
        return (
            <div>
                <Header></Header>
                <Table>
                </Table>
                <Footer tabClicked={this.tabClicked}></Footer>
            </div>
        )
    }
}