import React, { Component } from 'react';
import Icon from 'antd/lib/icon'
import profile from '../config/profile';
import './index.less'

export default class CustomHeader extends Component {
  constructor(props) {
    super(props);
    props.setHeaderRef(props.column.colId, this)
  }
  onNameClick = () => {
    this.props.setSelectedCols(this.props.column.colId)
    const api = this.props.api;
    let rowCount = api.getDisplayedRowCount();
    api.addCellRange({
      rowStartIndex: 0,
      rowEndIndex: rowCount - 1,
      columns: [this.props.column.colId]
    })
    // api.refreshView()
  }
  render() {
    let icon = null
    let colId = this.props.column.colId
    console.log(profile.columnGroups)
    profile.columnGroups.forEach((group) => {
      let index = group.children.indexOf(colId)
      if (index > -1) {
        if (colId === group.alwaysShow) {
          if (group.isExpanded()) {
            icon =
              <React.Fragment>
                <Icon type="minus-square" className="icon group-icon" onClick={() => this.props.onCollapse(group)}>
                </Icon>
                <div className="line" style={{
                  width: this.props.column.actualWidth/2 - 7,
                  display: 'inline-block',
                  right: 0,
                  position: 'absolute'
                }}></div>
              </React.Fragment>

          } else {
            icon = <Icon type="plus-square" className="icon" onClick={() => this.props.onExpand(group)}></Icon>
          }
        } else if (group.isExpanded()) {
          if (index === group.children.length - 1) {
            icon = <div className="line line-last" style={{ width: this.props.column.actualWidth/2 }}></div>
          } else {
            icon = <div className="line" style={{ width: this.props.column.actualWidth }}></div>
          }
        }
      }
    });
    return (
      <div className="wrapper" style={{ height: 50 }}>
        <div className="top">{icon}</div>
        <div className="name" onClick={this.onNameClick}>{this.props.column.colDef.headerName}</div>
      </div>
    )
  }
}