import React, { Component } from 'react'
import Menu from 'antd/lib/menu'
import Item from 'antd/lib/menu/MenuItem'
import Dropdown from 'antd/lib/dropdown'
import Utils from '../../../utils/utils'
import { SUPPORTED_FORMULAS } from './formulas'
import './index.less'
import formulaSVG from '../../../assets/formula.svg'

export class FormulaAssistant extends Component {
  constructor(props) {
    super(props)
    this.activedOptionRef = null
    this.dropdownItems = this.getDropdownItems(this.props.keyword, 0)
    this.prevKeyword = ''
    this.state = {
      imageIsReady: false,
      activedItemIndex: 0
    }
  }

  componentDidMount() {
    this.props.onNavigateToNextOrPrev(this.navigateToNextOrPrev.bind(this))
    this.props.onGetFormula(this.getFormula.bind(this))
    const img = new Image()
    img.src = formulaSVG
    img.onload = () => {
      this.setState({ imageIsReady: true })
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!Utils.isNil(nextProps.keyword) && (nextProps.keyword !== this.props.keyword)) {
      this.dropdownItems = this.getDropdownItems(nextProps.keyword, 0)
      this.getDropdownIndex = Utils.generateIndexCalculator({ length: this.dropdownItems.filteredItems.length, initialIndex: 0 })
      this.setState({ activedItemIndex: 0 })
      return true
    } else if (nextProps.isActived !== this.props.isActived || nextState.activedItemIndex !== this.state.activedItemIndex || nextState.imageIsReady !== this.state.imageIsReady) {
      return true
    } else {
      return false
    }
  }

  setIsActived(isActived) {
    this.props.setFormulaAssistantIsActived(isActived)
  }

  getResult() {
    return this.dropdownItems.filteredItems[this.state.activedItemIndex]
  }

  getDropdownItems(keyword, activedItemIndex, filteredItems) {
    if (Utils.isNil(keyword)) {
      keyword = '-999'
    }

    if (!filteredItems) {
      try {
        filteredItems = SUPPORTED_FORMULAS.filter(formula => new RegExp("^" + keyword.trim(), "i").test(formula.value))
      } catch (e) {
        filteredItems = []
      }
    }
    const items = filteredItems.map((formula, idx) => {
      let className = 'dropdown-item'
      let setRef;
      if (activedItemIndex === idx) {
        className += ' dropdown-item-actived'
        setRef = ref => this.activedOptionRef = ref
      }
      return (
        <Item key={formula.id}>
          <div
            className={className}
            ref={setRef}
            onMouseDown={evt => this.handleFormulaClicked(evt, formula.value)}
          >
            <img src={formulaSVG} alt='' />
            <span>{formula.value}</span>
          </div>
        </Item>
      )
    })
    const style = { width: '150px', maxHeight: '200px', overflowY: 'auto', position: 'relative', top: '-3px', left: '-1px' }

    const menu = <Menu style={style}>{items}</Menu>

    if (filteredItems.length === 0) {
      this.setIsActived(false)
    }
    return { menu, filteredItems }
  }

  handleFormulaClicked(evt, value) {
    evt.preventDefault()
    this.props.onFormularClicked(value)
  }

  navigateDropdownItem({ step }) {
    let newDropdownIndex
    newDropdownIndex = this.getDropdownIndex({ step })
    this.setState(() => {
      return {
        activedItemIndex: newDropdownIndex,
      }
    })
    return newDropdownIndex
  }

  getFormula() {
    return this.dropdownItems.filteredItems[this.state.activedItemIndex]
  }

  navigateToNextOrPrev({ toNext }) {
    if (this.dropdownItems.filteredItems.length) {
      this.dropdownItems = this.getDropdownItems(this.props.keyword, this.navigateDropdownItem({ step: toNext ? 1 : -1 }))
      this._scrollActivedIntoView()
    }
  }

  _scrollActivedIntoView() {
    setTimeout(() => {
      const activedDom = this.activedOptionRef
      activedDom && activedDom.scrollIntoViewIfNeeded()
    }, 100);
  }

  render() {
    if (this.state.imageIsReady && this.props.isActived) {
      return (
        <div className="fomular-assistant" ref={elem => this.formulaAssistant = elem}>
          <Dropdown
            overlay={this.dropdownItems.menu}
            visible={this.props.isActived}
            getPopupContainer={() => document.getElementById(this.props.popupContainer)}
          >
            <span></span>
          </Dropdown>
        </div>
      )
    } else {
      return null
    }
  }
}

export default FormulaAssistant
