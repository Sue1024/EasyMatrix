import React, { Component } from 'react'
import Profile from '../config/profile'
import ColorsMap from './colors'
// import { Config } from '../../../config/config';
import './index.less'
import { debounce, throttle } from 'lodash'

class Canvas extends Component {
  constructor(props) {
    super(props)
    this.api = props.api
    this.dpi = 2
    const centerContainer = document.querySelector('.ag-center-cols-container');
    const horizontalScroll = document.querySelector('.ag-body-horizontal-scroll-viewport')
    const verticalScroll = document.querySelector('.ag-body-viewport')
    const scrollLeft = horizontalScroll.scrollLeft
    const scrollTop = verticalScroll.scrollTop
    this.state = {
      width: centerContainer.offsetWidth,
      height: centerContainer.offsetHeight,
      scrollLeft: -scrollLeft,
      scrollTop: -scrollTop,
    }
    this.dpr = 1;
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseMoveWhenDraggingExistingRange = this.onMouseMoveWhenDraggingExistingRange.bind(this)
    this.onMouseUpWhenDraggingExistingRange = this.onMouseUpWhenDraggingExistingRange.bind(this)
    this.onMouseMoveWhenDraggingNewRange = this.onMouseMoveWhenDraggingNewRange.bind(this)
    this.onMouseUpWhenDraggingNewRange = this.onMouseUpWhenDraggingNewRange.bind(this)
    this.onMouseMoveWhenMovingExistingRange = this.onMouseMoveWhenMovingExistingRange.bind(this)
    this.onMouseUpWhenMovingExistingRange = this.onMouseUpWhenMovingExistingRange.bind(this)
    this.onMouseMoveDebounced = debounce(this.onMouseMoveHandle, 100)
    const cols = this.api.getDisplayedRowAtIndex(1).columnApi.columnController.getAllColumnsForQuickFilter();
    let colAlphaMap = Profile.colAlphaMap
    this.cols = cols.filter(col=> !["ag-Grid-AutoColumn", "id"].includes(col.colId)).map(col => {
      return {
        left: col.left,
        width: col.actualWidth,
        colId: col.colId,
        alpha: colAlphaMap[col.colId]
      }
    })
    // const theme = Config.getInstance().theme
    this.bgColor = '#fff'

    const header = document.querySelector(".header");
    const tableHeader = document.querySelector(".ag-header");
    const pinnedLeft = document.querySelector(".ag-pinned-left-cols-container")
    const headerH = header.clientHeight;
    const tableHeaderH = tableHeader.clientHeight
    this.topHeight = headerH + tableHeaderH;
    this.pinnedLeftW = pinnedLeft.clientWidth
    this.dotAreas = []
    this.dotWidth = 6
    this.rowHeight = 25;
  }

  componentDidMount() {
    this.updateCanvas();
  }

  shouldComponentUpdate(nextProps, nextState) {
    let shouldUpdate = false
    if ((this.state.width !== nextState.width) || (this.state.height !== nextState.height) ||
      (this.state.scrollLeft !== nextState.scrollLeft) || (this.state.scrollTop !== nextState.scrollTop) ||
      nextProps.isShowCanvans !== this.props.isShowCanvans) {
      shouldUpdate = true
    }
    if ((!this.isSelectedCellPositionsEqual(this.props.selectedCellPositions, nextProps.selectedCellPositions)) || (!this.isEditorTextsEqual(this.props.editorBox.texts, nextProps.editorBox.texts))) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.drawBorder(nextProps.selectedCellPositions);
      const { editorPos, texts } = nextProps.editorBox
      this.fillTextBg(this.ctx, editorPos, this.bgColor)
      this.fillMixedText(this.ctx, texts, editorPos.left + 8, editorPos.top + 8, editorPos, this.bgColor)
    }
    return shouldUpdate
  }

  isEditorTextsEqual(texts1, texts2) {
    let result = true
    if (!texts1 || !texts2 || (texts1.length !== texts2.length)) {
      result = false;
    } else {
      const length = texts1.length
      for (let i = 0; i < length; i++) {
        let text1 = texts1[i]
        let text2 = texts2[i]
        if ((text1.text === text2.text) && (text1.fillStyle === text2.fillStyle)) {
          continue
        } else {
          result = false
          break
        }
      }
    }
    return result
  }

  isSelectedCellPositionsEqual(selectedCellPositions1, selectedCellPositions2) {
    let result = true
    if (!selectedCellPositions1 || !selectedCellPositions2 || (selectedCellPositions1.length !== selectedCellPositions2.length)) {
      result = false;
    } else {
      const length = selectedCellPositions1.length
      for (let i = 0; i < length; i++) {
        let pos1 = selectedCellPositions1[i]
        let pos2 = selectedCellPositions2[i]
        if ((pos1.top === pos2.top) && (pos1.left === pos2.left) && (pos1.width === pos2.width) && (pos1.height === pos2.height) && (pos1.index === pos2.index)) {
          continue
        } else {
          result = false
          break
        }
      }
    }
    return result
  }

  updateCanvas() {
    this.canvas = this.refs.canvas;
    this.canvas.style.height = this.state.height + 'px';
    this.canvas.style.width = this.state.width + 'px';
    this.canvas.height = this.state.height * this.dpi;
    this.canvas.width = this.state.width * this.dpi;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.setTransform(this.dpi, 0, 0, this.dpi, 0, 0)
  }

  isOnDot(x, y) {
    return this.isOnArea(x, y, this.dotAreas, 4)
  }

  isOnLine(x, y) {
    return this.isOnArea(x, y, this.lineAreas, 1)
  }

  isOnArea(x, y, arr, tolerance) {
    for (let i = 0, len = arr.length; i < len; i++) {
      const area = arr[i]
      const aX = area.x
      const aY = area.y
      const w = area.w
      const h = area.h
      tolerance++;
      if (x > aX - tolerance && x < aX + w + tolerance && y > aY - tolerance && y < aY + h + tolerance) {
        return area
      }
    }
  }
  onMouseMove(e) {
    e.persist()
    this.onMouseMoveDebounced(e)
  }

  onMouseMoveHandle(e) {
    const { x, y } = this.genEventPos(e)
    const dot = this.isOnDot(x, y) || this.startDot
    if (dot) {
      switch (dot.pos) {
        case "lb":
        case "rt":
          this.canvas.style.cursor = "ne-resize";
          return
        case "lt":
        case "rb":
          this.canvas.style.cursor = "nw-resize";
          return
        default:
          return;
      }
    }
    const line = this.isOnLine(x, y)
    if (line) {
      this.canvas.style.cursor = "move"
      return
    }
    this.canvas.style.cursor = "cell"
  }

  genEventPos(e) {
    const x = e.pageX - this.state.scrollLeft - this.pinnedLeftW;
    const y = e.pageY - this.state.scrollTop - (this.topHeight);
    return {
      x,
      y
    }
  }

  onMouseDown(e) {
    e.preventDefault()
    const { x, y } = this.genEventPos(e);
    let dot = this.isOnDot(x, y)
    if (dot) {
      this.dragging = true
      this.startDot = dot
      this.lastRange = dot.coordinate
      this.dragRangeStartCell = this.computeDiagonalCell(dot)
      this.tempEnd = this.findCellInRange(dot.coordinate, dot.pos)
      this.mouseMoveWhenDraggingExistingRangeThrottle = throttle(this.onMouseMoveWhenDraggingExistingRange, 200)
      this.canvas.addEventListener('mousemove', this.mouseMoveWhenDraggingExistingRangeThrottle)
      this.canvas.addEventListener('mouseup', this.onMouseUpWhenDraggingExistingRange)
      return
    }

    let line = this.isOnLine(x, y)

    if (line) {
      this.dragging = true
      this.lastRange = line.coordinate
      this.moveIndex = line.index
      this.startPos = { x, y }
      this.rangeSpan = this.genSpanOfRange(this.lastRange)
      this.tempEnd = this.findCellInRange(this.lastRange, "lt")
      this.mouseMoveWhenMovingExistingRangeThrottle = throttle(this.onMouseMoveWhenMovingExistingRange, 200)
      this.canvas.addEventListener('mousemove', this.mouseMoveWhenMovingExistingRangeThrottle)
      this.canvas.addEventListener('mouseup', this.onMouseUpWhenMovingExistingRange)
      return;
    }

    {
      const { x, y } = this.genEventPos(e)
      const { rowIndex, colId } = this.genCellFromPos(x, y)
      this.props.setCurrentCanvasFocus(rowIndex, colId)
      this.startCell = this.genCoordinatesFromCell(rowIndex, colId)
      const selectType = this.genSelectType(e)
      this.props.onClick(`${selectType}${this.startCell.colAlpha}${this.startCell.rowIndex}`)
      this.mouseMoveWhenDraggingNewRangeThrottle = throttle(this.onMouseMoveWhenDraggingNewRange, 200)
      this.canvas.addEventListener('mousemove', this.mouseMoveWhenDraggingNewRangeThrottle)
      this.canvas.addEventListener('mouseup', this.onMouseUpWhenDraggingNewRange)
    }
  }

  String2Obj(str) {
    let groups = str.match(/^([A-Za-z])(\d+)$/)
    return {
      colAlpha: groups[1],
      rowIndex: groups[2]
    }
  }

  genCellFromPos(x, y, ratio) {
    const rowIndex = Math.ceil(y / (this.rowHeight * this.dpr));
    let colId = '';
    for (let i = 0, length = this.cols.length; i < length; i++) {
      const col = this.cols[i];
      const width = col.width;
      const left = ratio ? (col.left + ratio * width) : col.left;
      if (left < (x + 1) && ((col.left + width) > x)) {
        colId = col.colId
        break
      }
    }
    return {
      rowIndex, colId
    }
  }

  genCoordinatesFromCell(rowIndex, colId) {
    let colAlpha = ''
    Object.keys(Profile.AlphaColMap).forEach(key => {
      if (Profile.AlphaColMap[key] === colId) {
        colAlpha = key
      }
    })
    return {
      colAlpha, rowIndex
    }
  }

  genCoordinatesFromPos(x, y, ratio) {
    let { rowIndex, colId } = this.genCellFromPos(x, y, ratio);
    return this.genCoordinatesFromCell(rowIndex, colId)
  }

  genSelectType(e) {
    let selectType = '';
    if (e.ctrlKey) {
      selectType = ','
    } else if (e.shiftKey) {
      selectType = ':'
    }
    return selectType
  }

  Obj2StringForCoordinate(obj) {
    return `${obj.colAlpha}${obj.rowIndex}`
  }

  onMouseMoveWhenDraggingNewRange(e) {
    const selectType = this.genSelectType(e)
    const { x, y } = this.genEventPos(e);
    this.tempEnd = this.genCoordinatesFromPos(x, y)
    if (this.tempEnd.colAlpha === this.startCell.colAlpha && this.tempEnd.rowIndex === this.startCell.rowIndex) return
    this.props.onClick(`${selectType}${this.startCell.colAlpha}${this.startCell.rowIndex}:${this.tempEnd.colAlpha}${this.tempEnd.rowIndex}`)
  }

  onMouseUpWhenDraggingNewRange(e) {
    this.canvas.removeEventListener('mousemove', this.mouseMoveWhenDraggingNewRangeThrottle)
    this.canvas.removeEventListener('mouseup', this.onMouseUpWhenDraggingNewRange)
    this.mouseMoveWhenDraggingNewRangeThrottle.cancel()
    this.tempEnd = null
    this.startCell = null
  }

  onMouseMoveWhenDraggingExistingRange(e) {
    const { x, y } = this.genEventPos(e)
    const end = this.genCoordinatesFromPos(x, y);
    if (end.colAlpha === this.tempEnd.colAlpha && end.rowIndex === this.tempEnd.rowIndex) return
    this.tempEnd = end
    let diagonal = this.dragRangeStartCell;
    let newRange = `${diagonal.colAlpha}${diagonal.rowIndex}:${this.tempEnd.colAlpha}${this.tempEnd.rowIndex}`
    this.props.replaceCoordinate(this.lastRange, newRange, this.startDot.index)
    this.lastRange = newRange
  }

  onMouseUpWhenDraggingExistingRange(e) {
    this.dragging = false
    this.canvas.removeEventListener('mousemove', this.mouseMoveWhenDraggingExistingRangeThrottle)
    this.canvas.removeEventListener('mouseup', this.onMouseUpWhenDraggingExistingRange)
    this.mouseMoveWhenDraggingExistingRangeThrottle.cancel()
    this.tempEnd = null
    this.startDot = null
    this.dragRangeStartCell = null
    this.lastRange = ''
    e.stopPropagation()
    e.preventDefault()
  }

  onMouseMoveWhenMovingExistingRange(e) {
    const { x, y } = this.genEventPos(e)
    let spanX = x - this.startPos.x
    const spanY = y - this.startPos.y;
    const colDir = spanX > 0 ? 1 : 0;
    spanX = Math.abs(spanX)
    let lastEnd;
    for (let i = 0, length = this.cols.length; i < length; i++) {
      let col = this.cols[i];
      if (!col.alpha || !this.tempEnd.colAlpha) continue
      if (col.alpha.toLowerCase() === this.tempEnd.colAlpha.toLowerCase()) {
        lastEnd = {
          i,
          ...col
        }
      }
    }
    if (!lastEnd) return
    let count = lastEnd.i
    let width = 0
    let col
    while (width < spanX) {
      colDir ? count++ : count--
      if(this.cols[count]) col = this.cols[count]
      if(!col) break
      width += col.width
    }
    if(!col) return
    const rowSpan = Math.ceil(spanY / (this.rowHeight * this.dpr))
    const newRowIndex = this.tempEnd.rowIndex + rowSpan - 1
    let newCol = Profile.Alphabet.indexOf(col.alpha)+this.rangeSpan.colSpan
    newCol = Profile.Alphabet[newCol]
    let newRange = `${col.alpha}${newRowIndex}:${newCol}${newRowIndex+this.rangeSpan.rowSpan}`
    this.props.replaceCoordinate(this.lastRange, newRange, this.moveIndex)
    this.lastRange = newRange
    
  }

  onMouseUpWhenMovingExistingRange(e) {
    this.dragging = false;
    this.canvas.removeEventListener('mousemove', this.mouseMoveWhenMovingExistingRangeThrottle)
    this.canvas.removeEventListener('mouseup', this.onMouseUpWhenMovingExistingRange)
    this.mouseMoveWhenMovingExistingRangeThrottle.cancel()
    this.lastRange = ''
    this.startPos = null;
    this.moveIndex = 0
    this.rangeSpan = {}
    this.tempEnd = null
    e.stopPropagation()
    e.preventDefault()
  }

  genSpanOfRange(range) {
    const groups = /^([A-Za-z])(\d+):([A-Za-z])(\d+)$/.exec(range)
    const rowIndexes = [groups[2], groups[4]]
    const colAlphas = [groups[1], groups[3]]
    let col1 = colAlphas[0] && colAlphas[0].toUpperCase();
    let col2 = colAlphas[1] && colAlphas[1].toUpperCase();
    let index1 = Profile.Alphabet.indexOf(col1);
    let index2 = Profile.Alphabet.indexOf(col2)
    return {
      rowSpan: Math.abs(rowIndexes[1] - rowIndexes[0]),
      colSpan: Math.abs(index1 - index2)
    }
  }

  findCellInRange(range, pos) {
    if (range.indexOf(":") < 0) {
      const groups = /^([A-Za-z])(\d+)$/.exec(range)
      return {
        rowIndex: groups[2],
        colAlpha: groups[1]
      }
    }
    const groups = /^([A-Za-z])(\d+):([A-Za-z])(\d+)$/.exec(range)
    const compare = (dir1, dir2) => {
      const rowIndexes = [groups[2], groups[4]]
      const colAlphas = [groups[1], groups[3]]
      const rowIndex = rowIndexes.reduce((initial, value) => {
        if (!initial) return Number(value)
        let span = dir1 ? (value - initial) : (initial - value)
        if (span > 0) return Number(value)
        return initial
      }, undefined)
      const colAlpha = colAlphas.reduce((initial, value) => {
        value = value.toLowerCase()
        if (!initial) return value
        let span = dir2 ? value.localeCompare(initial) : initial.localeCompare(value)
        if (span > 0) return value
        return initial
      }, undefined)
      return {
        rowIndex, colAlpha
      }
    }
    if (pos === 'lt') {
      return compare(false, false)
    } else if (pos === 'rb') {
      return compare(true, true)
    } else if (pos === 'lb') {
      return compare(true, false)
    } else if (pos === 'rt') {
      return compare(false, true)
    }
  }

  computeDiagonalCell(dot) {
    const range = dot.coordinate;
    const pos = dot.pos
    if (pos === 'lt') {
      return this.findCellInRange(range, "rb")
    } else if (pos === 'rb') {
      return this.findCellInRange(range, "lt")
    } else if (pos === 'lb') {
      return this.findCellInRange(range, "rt")
    } else if (pos === 'rt') {
      return this.findCellInRange(range, "lb")
    }
  }

  computeRBCellInRange(range) {
    if (range.indexOf(":") < 0) {
      const groups = /^([A-Za-z])(\d+)$/.exec(range)
      return {
        rowIndex: groups[2],
        colAlpha: groups[1]
      }
    }
    const groups = /^([A-Za-z])(\d+):([A-Za-z])(\d+)$/.exec(range)
    const rowIndex = [groups[2], groups[4]].reduce((initial, value) => {
      if (Number(value) > initial) return Number(value)
      return initial
    }, 0)
    const colAlpha = [groups[1], groups[3]].reduce((initial, value) => {
      value = value.toLowerCase()
      if (value > initial) return value
      return initial
    }, "a")
    return {
      rowIndex,
      colAlpha
    }
  }

  drawBorder(cellPositions) {
    this.ctx.setLineDash([10, 3]);
    const colorSize = ColorsMap.length
    this.dotAreas = []
    this.lineAreas = []

    for (let i = 0, len = cellPositions.length; i < len; i++) {
      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = ColorsMap[i % colorSize];
      this.ctx.strokeStyle = ColorsMap[i % colorSize];
      this.ctx.save();

      let cellPos = cellPositions[i];
      let x = cellPos.left;
      let y = cellPos.top;
      let w = cellPos.width;
      let h = cellPos.height;
      this.ctx.strokeRect(x + 1, y, w, h);

      this.ctx.globalAlpha = 0.2;
      this.ctx.fillRect(x + 2, y + 1, w - 2, h - 2);

      this.ctx.restore();

      let dw = this.dotWidth;
      let dl = x - dw / 2
      let dl2 = x + w - dw / 2
      let dt = y - dw / 2;
      let dt2 = y + h - dw / 2
      this.ctx.fillRect(dl, dt, dw, dw);
      this.ctx.fillRect(dl2, dt, dw, dw);
      this.ctx.fillRect(dl, dt2, dw, dw);
      this.ctx.fillRect(dl2, dt2, dw, dw);
      this.lineAreas.push({ x: dl, y: dt + dw, w: dw, h: h - dw, coordinate: cellPos.coordinate, index: cellPos.index })
      this.lineAreas.push({ x: dl + dw, y: dt, w: w - dw, h: dw, coordinate: cellPos.coordinate, index: cellPos.index })
      this.lineAreas.push({ x: dl2, y: dt + dw, w: dw, h: h - dw, coordinate: cellPos.coordinate, index: cellPos.index })
      this.lineAreas.push({ x: dl + dw, y: dt2, w: w - dw, h: dw, coordinate: cellPos.coordinate, index: cellPos.index })
      this.dotAreas.push({ x: dl, y: dt, w: dw, h: dw, pos: "lt", coordinate: cellPos.coordinate, index: cellPos.index })
      this.dotAreas.push({ x: dl, y: dt2, w: dw, h: dw, pos: "lb", coordinate: cellPos.coordinate, index: cellPos.index })
      this.dotAreas.push({ x: dl2, y: dt, w: dw, h: dw, pos: "rt", coordinate: cellPos.coordinate, index: cellPos.index })
      this.dotAreas.push({ x: dl2, y: dt2, w: dw, h: dw, pos: "rb", coordinate: cellPos.coordinate, index: cellPos.index })
    }
  }

  fillTextBg(ctx, editorPos, bgColor) {
    ctx.fillStyle = bgColor
    this.ctx.fillRect(editorPos.left + 3, editorPos.top + 3 , editorPos.width - 5, editorPos.height - 5);
  }

  fillMixedText(ctx, texts, x, y, editorPos, bgColor) {
    const defaultFillStyle = ctx.fillStyle;
    ctx.globalAlpha = 1;
    ctx.textBaseline = "top";
    texts.forEach(({ text, fillStyle, font }) => {
      ctx.fillStyle = bgColor
      let textW = ctx.measureText(text).width
      // this.ctx.fillRect(editorPos.left + x, editorPos.top + 4, textW, editorPos.height - 7);
      ctx.fillStyle = fillStyle || defaultFillStyle;
      ctx.font = "100 13px Arial";
      ctx.fillText(text, x, y+1);
      x += textW;
    });
  };

  render() {
    return (
      <canvas
        ref="canvas"
        className={this.props.isShowCanvans ? 'canvas-block' : 'canvas-block canvas-block-disabled'}
        style={{ transform: `translate(${this.state.scrollLeft}px, ${this.state.scrollTop}px)`, top: this.topHeight, left: this.pinnedLeftW }}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
      />
    )
  }
}
export default Canvas
