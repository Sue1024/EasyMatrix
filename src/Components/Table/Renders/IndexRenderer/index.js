import React, { Component } from 'react';

class IndexRenderer extends Component {
    constructor(props) {
        super(props)
        this.handleMouseDown = this.handleMouseDown.bind(this)
    }
    handleMouseDown() {
        const node = this.props.node;
        node.setSelected(!node.selected)
    }
    render() {
        const { value } = this.props;
        return <div className="col-index" onMouseDown={this.handleMouseDown}><span>{value}</span></div>
    }
}

export default IndexRenderer;
