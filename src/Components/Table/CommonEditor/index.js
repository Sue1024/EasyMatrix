import React, { Component } from 'react'
import Utils from '../../../../utils/utils'
import { FormulaAssistant } from '../../FormulaAssistant'
import Canvas from '../../Canvas/index';
import Profile from '../../config/profile';
import {Model} from '../../../../stores/model'
import { debounce } from 'lodash'
import * as Helper from './helper'
import tokenizer from '../../tokenizer'
import FormulaParser from '../../formula-parser'
import './index.less'

export default class CommonEditor extends Component {
  constructor(props) {
    super(props)
    this.firstCharPress = props.charPress
    this.rowCount = this.props.api.getDisplayedRowCount()
    const row = props.data;
    const colId = props.column.colId;
    const cell = row[colId];
    let value = this.firstCharPress || cell.formula || cell.value;
    if (Utils.isNil(value)) {
      value = '';
    }
    this.state = {
      value: value,
      isFormulaAssistantActived: false,
      keyword: '',
      selectedCellPositions: [],
      isShowCanvans: /^=/.test(value) ? true : false,
      editorBox: {
        editorPos: {
          top: this.props.node.rowTop,
          left: this.props.column.left,
          width: this.props.column.actualWidth,
          height: this.props.node.rowHeight
        },
        texts: []
      },
      colId,
      rowIndex: props.rowIndex + 1
    }
    let rowData = this.getAllRows(props.api)
    this.formulaParser = new FormulaParser(()=>rowData)
    this.handleKeydown = this.handleKeydown.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.lockLeftAndRight =false;
    this.debounceSetActived = debounce(
      value => {
        if (Utils.isNil(value)) {
          this.resetFormulaAssistant()
        } else {
          this.setState({ isFormulaAssistantActived: true, keyword: value.replace('=', '') })
        }
      },
      300
    )

    this.currentFocusInCanvas = {};
  }
  getAllRows(api) {
    let rowData = [];
    api.forEachNode(node => rowData.push(node.data));
    return rowData;
  }
  /********** ag-grid callback Start **********/
  isPopup() { return true }
  getValue() { 
    let value = this.state.value;
    let formula = ''
    if(Helper.isFormula(value)) {
      formula = value
      value = this.formulaParser.parse(formula).result
    }
    if(!isNaN(Number(value)) && !Utils.isNil(value)) value = Number(value)
    return new Model(value, formula)
  }
  /********** ag-grid callback End **********/

  componentDidMount() {
    setTimeout(() => {
      if (this.input) {
        this.input.focus()
        if (!this.firstCharPress && !this.state.isShowCanvans) {
          this.input.select()
        }
      }
    }, 50);

    if (this.state.isShowCanvans) {
      this.genSelectedCellPositions(this.state.value)
    }
    if (this.state.isShowCanvans) {
      this.assignColorToSplitedValue(this.state.value)
    }
  }

  handleChange(evt) {
    const value = evt.target.value
    this.setState({ value })
    if (/^=/.test(value)) {
      this.setState({ isShowCanvans: true })
      const cursorPos = Utils.getCursorPosition(evt)
      const _processedKeyword = this.processFormulaKeyword(value.substr(0, cursorPos))
      this.debounceSetActived(_processedKeyword)
      this.genSelectedCellPositions(value)
      this.assignColorToSplitedValue(value)
      if(/[=,+,-,*,/,^,>,<,;,,]$/.test(value) && this.input.selectionStart === value.length){
        this.currentFocusInCanvas = {
          rowIndex: this.state.rowIndex,
          colId: this.state.colId
        }
      }
    } else {
      this.setState({ isShowCanvans: false, selectedCellPositions: [] })
      debounce(this.resetFormulaAssistant.bind(this), 350)
    }
  }

  handleBlur(e) {
    this.setState({ value: e.target.value })
  }

  handleKeydown(evt) {
    if (!evt.shiftKey && (evt.keyCode === 13 || evt.keyCode === 9)) { // Enter or Tab
      evt.preventDefault()
      if (this.state.isFormulaAssistantActived) {
        const formula = this.FA_getFormula().value
        this.handleFormulaSelected(formula, Utils.getCursorPosition(evt))
      } else {
        if (!Utils.isNil(this.state.value) || evt.keyCode === 9) {
          this.props.toNextCell()
        } else {
          this.props.api.stopEditing()
        }
      }
    } else if (evt.shiftKey && evt.keyCode === 9) {
      this.props.toPrevCell();
    } else if (evt.keyCode === 40) { // arrow down
      if (/^=/.test(this.state.value) && !this.state.isFormulaAssistantActived) {
        this.transferFocusInCanvas("down", evt.shiftKey)
      }
      this.FA_navigateToNextOrPrev({ toNext: true })
      evt.preventDefault()
    } else if (evt.keyCode === 38) { // arrow up
      if (/^=/.test(this.state.value) && !this.state.isFormulaAssistantActived) {
        this.transferFocusInCanvas("up", evt.shiftKey)
      }
      this.FA_navigateToNextOrPrev({ toNext: false })
      evt.preventDefault()
    } else if (evt.keyCode === 39) { // right
      this.resetFormulaAssistant()
      const p = Utils.getCursorPosition(evt)
      if (p === this.state.value.toString().length) {
        if (/^=/.test(this.state.value) && !this.state.isFormulaAssistantActived) {
          evt.preventDefault()
          this.transferFocusInCanvas("right", evt.shiftKey)
        } else {
          this.props.toNextCell();
        }
      }
    } else if (evt.keyCode === 37) {
      this.resetFormulaAssistant()
      const p = Utils.getCursorPosition(evt)
      if (p === 0 && !/^=/.test(this.state.value)) {
        this.props.toPrevCell();
      }
      if (/^=/.test(this.state.value)&& p !== 0  && !this.state.isFormulaAssistantActived) {
        this.transferFocusInCanvas("left", evt.shiftKey)
      }
    }
  }

  transferFocusInCanvas(dir, range) {
    let { rowIndex, colId } = this.currentFocusInCanvas;
    if (!rowIndex || !colId) {
      rowIndex = this.state.rowIndex
      colId = this.state.colId
    }
    if (!this.ColNumMap) {
      this.ColNumMap = Profile.colNumMap;
    }
    if(dir==="left") {
      let colNum = this.ColNumMap[colId] - 1;
      colId = Object.keys(this.ColNumMap).filter(col => this.ColNumMap[col] === colNum)[0]
      if (colId === this.state.colId && rowIndex === this.state.rowIndex) {
        colNum = this.ColNumMap[colId] - 1;
        colId = Object.keys(this.ColNumMap).filter(col => this.ColNumMap[col] === colNum)[0]
      }
    } else if(dir ==="right") {
      let colNum = this.ColNumMap[colId] + 1;
      colId = Object.keys(this.ColNumMap).filter(col => this.ColNumMap[col] === colNum)[0]
      if (colId === this.state.colId && rowIndex === this.state.rowIndex) {
        colNum = this.ColNumMap[colId] + 1;
        colId = Object.keys(this.ColNumMap).filter(col => this.ColNumMap[col] === colNum)[0]
      }
    } else if(dir === 'up') {
      rowIndex--;
      if (colId === this.state.colId && rowIndex === this.state.rowIndex) {
        rowIndex--
      }
    } else if(dir === 'down'){
      rowIndex++;
        if (colId === this.state.colId && rowIndex === this.state.rowIndex) {
          rowIndex++
        }
    }
    if(!colId || rowIndex < 1 || rowIndex > this.props.api.getDisplayedRowCount()) {
      return
    }

    this.currentFocusInCanvas = {
      rowIndex,
      colId
    }
    let coordinate = this.genCoordinates(colId, rowIndex)
    range && (coordinate = `:${coordinate}`)
    this.popCoordinateIntoCell(coordinate)
  }

  /********* Formula Assistant Functions Start **************/
  setFormulaAssistantIsActived(isActived) {
    this.setState({ isFormulaAssistantActived: isActived })
  }

  resetFormulaAssistant() {
    this.setState({ isFormulaAssistantActived: false, keyword: '' })
  }

  processFormulaKeyword(value) {
    let proceesedValue = value.substr(1)
    const nonAlphanumeric = proceesedValue.match(/\W/ig) // non-alphanumeric character
    if (nonAlphanumeric) {
      const lastOneNonAlphanumeric = nonAlphanumeric[nonAlphanumeric.length - 1]
      const lastOneNonAlphanumericIndex = Utils.findLastCharIndex(proceesedValue, lastOneNonAlphanumeric)
      proceesedValue = proceesedValue.substr(lastOneNonAlphanumericIndex + 1)
    }
    return proceesedValue
  }

  handleFormulaSelected(formula, cursorPos) {
    const inputValue = this.state.value
    const appended = inputValue[cursorPos] === '(' ? '' : '()'
    const comletedValue = Utils.replaceStrAtCursorPos(inputValue, this.state.keyword, formula + appended, cursorPos)
    this.resetFormulaAssistant()
    this.setState({ value: comletedValue }, () => {
      const newCursorPos = comletedValue.length - (inputValue.length - cursorPos) - appended.length + 1
      this.input.setSelectionRange(newCursorPos, newCursorPos)
    })
    this.assignColorToSplitedValue(comletedValue)
  }

  genCoordinates(colId, rowIndex) {
    if (!this.ColAlphaMap) {
      this.ColAlphaMap = Profile.genColAlphaMap()
    }
    let alpha = this.ColAlphaMap[colId];
    return `${alpha}${rowIndex}`
  }
  /********* Formula Assistant Functions End **************/



  /*********Canvas Start**************/
  popCoordinateIntoCell(coordinat) {
    if(/^(:|,)([A-Za-z]+\d+)(:)/.test(coordinat)){
      coordinat = coordinat.replace(/^(,|:)/, '')
    }
    const {token, targetIndex, tokens} = this.getActiveToken();
    if (token) {
      const value = token.value;
      const cursor = token.cursor;
      const selectionStart = this.input.selectionStart;
      let newVal = '';
      let rangeIndex = 0;
      if(/[A-Za-z]\d+/.test(value)){
        if((coordinat.startsWith(',')|| (coordinat.startsWith(':') && (!tokens[targetIndex-1] || tokens[targetIndex-1].value !==':'))) && (selectionStart===(cursor+value.length))){
          // if ctrl or shift and not after :    do append
          newVal = Utils.replaceStrAtCursorPos(this.state.value, '', coordinat, selectionStart)
          rangeIndex = selectionStart + coordinat.length;
        } else {// replace value
          coordinat = coordinat.replace(/^(,|:)/, '')
          if(/:/.test(coordinat)){ // area selected
            const  { replaceStr, replaceStart, replaceEnd} = this.getAreaStringBySelectionStart(token, targetIndex, tokens);
            newVal = Utils.replaceStrAtCursorPos(this.state.value, replaceStr, coordinat, replaceEnd)
            rangeIndex = replaceStart + coordinat.length;
          }else {
            newVal = Utils.replaceStrAtCursorPos(this.state.value, value, coordinat, cursor + value.length);
            rangeIndex = cursor + coordinat.length;
          }
        }
      } else {
        coordinat = coordinat.replace(/^(,|:)/, '')
        if(/:/.test(coordinat) && value ===':'){// area selected  and course after: replace value
          const  { replaceStr, replaceStart, replaceEnd} = this.getAreaStringBySelectionStart(token, targetIndex, tokens);
          newVal = Utils.replaceStrAtCursorPos(this.state.value, replaceStr, coordinat, replaceEnd)
          rangeIndex = replaceStart + coordinat.length;
        }else { // append in cursor
          newVal = Utils.replaceStrAtCursorPos(this.state.value, '', coordinat, selectionStart)
          rangeIndex = selectionStart + coordinat.length;
        }
      }
      this.setState({
        value: newVal
      })
      this.assignColorToSplitedValue(newVal)
      this.genSelectedCellPositions(newVal)
      setTimeout(() => {
        this.input.setSelectionRange && this.input.setSelectionRange(rangeIndex, rangeIndex)
      }, 10);
    }
  }

  getActiveToken() {
    const tokens = tokenizer(this.state.value)
    const p = this.input.selectionStart;
    const index = tokens.findIndex((tk) => {
      return (tk.cursor + tk.value.length) >= p
    })
    let targetIndex = index
    let token = tokens[index]
    if (!token) {
      token = tokens[1]
      targetIndex =1;
    } else if (token.cursor > p && p >= 0) {
      token = tokens[index - 1]
      targetIndex = index - 1
    }
    return {token, targetIndex, tokens}
  }
  getAreaStringBySelectionStart(token, targetIndex, tokens){
    const value = token.value;
    const next =  tokens[targetIndex + 1];
    const prev = tokens[targetIndex-1];
    const nextnext = tokens[targetIndex + 2];
    const prevprev = tokens[targetIndex-2];

    const nextVal = next ? next.value: ''
    const prevVal = prev ? prev.value: '';

    const nextnextVal = nextnext ? nextnext.value: ''
    const prevprevVal = prevprev ? prevprev.value: '';

    let replaceStr = value;
    let replaceEnd = token.cursor + value.length
    let replaceStart = token.cursor

    if(/[A-Za-z]\d+/.test(value)){
      if(nextVal ===':'){
        replaceStr  = value + nextVal + nextnextVal
        replaceEnd = token.cursor + replaceStr.length;
        replaceStart = token.cursor
      }
      if(prevVal ===':'){
        replaceStr  = prevprevVal + prev.value + value
        replaceEnd = token.cursor  + value.length;
        replaceStart = prevprev ? prevprev.cursor  : prev.cursor
      }
      return {
        replaceStr,
        replaceStart,
        replaceEnd
      }
    } else if(value === ':'){
      replaceStr  = prevVal + value + nextVal;
      replaceEnd = token.cursor  + nextVal.length + 1;
      replaceStart = prev ? prev.cursor  : token.cursor;
    }
    return  {
      replaceStr,
      replaceStart,
      replaceEnd
    };
  }
  canvasClicked(coordinates) {
    this.popCoordinateIntoCell(coordinates)
  }

  genSelectedCellPositions(value) {
    const { isValid, coordinates } = Helper.getCoordinates(value, this.rowCount)
    if (isValid) {
      this.setState({ selectedCellPositions: Helper.getCellPositions(this.props.api, coordinates) })
    } else {
      this.setState({ selectedCellPositions: [] })
    }
  }

  assignColorToSplitedValue(inputValue) {
    const texts = Helper.assignColorToSplitedValue(inputValue, this.rowCount)
    this.setState({editorBox: {...this.state.editorBox, texts}})
  }

  replaceCoordinate(prevCoordinate, currCoordinate, index) {
    const value = Helper.replaceCoordinate(this.state.value, prevCoordinate, currCoordinate, index)
    this.setState({value})
    this.genSelectedCellPositions(value)
    this.assignColorToSplitedValue(value)
  }

  /*********** Canvas Functions End ************/

  setCurrentCanvasFocus(rowIndex, colId) {
    this.currentFocusInCanvas = {
      rowIndex,
      colId
    }
  }

  render() {
    return (
      <div id="common-editor" ref="" className="input-editor" style={{ width: (this.props.column.actualWidth - 4) + 'px' }}>
        <Canvas
          isShowCanvans={this.state.isShowCanvans}
          selectedCellPositions={this.state.selectedCellPositions}
          onClick={this.canvasClicked.bind(this)}
          replaceCoordinate={this.replaceCoordinate.bind(this)}
          api={this.props.api}
          editorBox={this.state.editorBox}
          setCurrentCanvasFocus={this.setCurrentCanvasFocus.bind(this)}
        >
        </Canvas>
        <input
          ref={(input) => this.input = input}
          value={this.state.value}
          className={this.state.isShowCanvans ? 'common-input-transparent common-input' : 'common-input'}
          style={{width: (this.props.column.actualWidth - 4) + 'px'}}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          onKeyDown={this.handleKeydown}
          spellCheck={false}
          size={Math.min(this.state.value.length + 1, 10)}
        />
        <div id='FAcontainer' style={{ position: 'relative', top: '23px', left: '1px' }}>
          <FormulaAssistant
            keyword={this.state.keyword}
            isActived={this.state.isFormulaAssistantActived}
            popupContainer='FAcontainer'
            setFormulaAssistantIsActived={this.setFormulaAssistantIsActived.bind(this)}
            onGetFormula={func => this.FA_getFormula = func}
            onNavigateToNextOrPrev={func => this.FA_navigateToNextOrPrev = func}
            onFormularClicked={formula => this.handleFormulaSelected(formula, this.input.selectionStart)}
          />
        </div>
      </div>
    )
  }
}
