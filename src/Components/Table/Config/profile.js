import { uniq } from 'lodash'
import IconUtils from '../../../utils/icon-utils'
import { Row } from '../../../stores/model'
import '../index.less'
export class Group {
    constructor(groupId, children, alwaysShow, status) {
        this.groupId = groupId;
        this.children = children;
        this.alwaysShow = alwaysShow;
        this.status = status;
    }
    isExpanded() {
        return Boolean(this.status)
    }
    setExpand(expand) {
        if (expand) {
            this.status = 1
        } else {
            this.status = 0
        }
    }
}
Group.prototype.isExpanded = function () {
    return Boolean(this.status)
}
class Profile {
    constructor() {
        this.genAlphabet()
        this.genColDefs()
        this.genLicense()
        this.genColAlphaMap()
        this.genAlphaColMap()
        this.genColNumMap()
        this.genColumnGroups()
        this.getContextMenuItems = this.getContextMenuItems.bind(this)
    }

    genColumnGroups() {
        this.columnGroups = [
            new Group("0", ["A", "B", "C"], "A", 0),
        ]
    }

    genAlphabet() {
        this.Alphabet = [
            "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
        ]
    }

    genColNumMap() {
        let colNumMap = {}
        this.Alphabet.forEach((alpha, index) => {
            colNumMap[index] = alpha
        })
        this.colNumMap = colNumMap
    }

    genAlphaColMap() {
        let AlphaColMap = {};
        this.Alphabet.forEach(alpha => {
            AlphaColMap[alpha] = alpha
        })
        this.AlphaColMap = AlphaColMap;
    }

    genColAlphaMap() {
        let colAlphaMap = {};
        this.Alphabet.forEach(alpha => {
            colAlphaMap[alpha] = alpha
        })
        this.colAlphaMap = colAlphaMap;
    }

    genColDefs() {
        let colDefs = []
        colDefs.push({
            headerName: " ",
            lockPosition: true,
            pinned: 'left',
            field: 'id',
            width: 25,
            editable: false,
            cellClassRules: {
                "indexHighlight": params => this.computeIndexClass(params)
            },
            suppressMenu: true,
            valueGetter: params => {
                return params.node.rowIndex + 1
            },
            cellRenderer: "indexRenderer"
        })
        for (let i = 0, len = this.Alphabet.length; i < len; i++) {
            let Alpha = this.Alphabet[i]
            colDefs.push({
                headerName: Alpha,
                headerClass: params => this.computeHeaderClass.call(null, params),
                field: Alpha,
                editable: true,
                width: 100,
                suppressMenu: true,
                valueGetter: params => {
                    return params.data[params.column.colId].value
                },
                cellStyle: params => {
                    let col = params.column.colId;
                    let model = params.data[col];
                    (model.color !== "#000") && console.log(model)
                    return {
                        color: model.color,
                        fontWeight: model.fontWeight,
                        textAlign: model.textAlign,
                        fontStyle: model.fontStyle
                    }
                },
                cellEditor: 'commonEditor',
            })
        }
        this.colDefs = colDefs
    }

    genGridOptions() {
        this.gridOptions = {
            stopEditingWhenGridLosesFocus: true,
            singleClickEdit: false,
            // suppressContextMenu: true,
            defaultColDef: { resizable: true },
            treeData: true,
            enableRangeSelection: true,
            suppressRowClickSelection: true,
            rememberGroupStateWhenNewData: true,
            deltaRowDataMode: true,
            groupDefaultExpanded: -1,
            animateRows: true,
            rowSelection: "multiple",
            allowContextMenuWithControlKey: true,
            autoGroupColumnDef: {
                cellRendererParams: {
                    checkbox: true,
                }
            }

        };
    }

    createFlagImg(flag) {
        return `<span class="iconfont">${IconUtils.iconMap[flag]}</span>`;
    }

    clear(params) {
        params.node.setData(new Row())
    }

    getContextMenuItems(params) {
        let api = params.api;
        api.deselectAll();
        api.clearRangeSelection()
        api.refreshCells({
            columns: ['id'],
            force: true
        })
        api.refreshHeader()
        var result = [
            {
                name: "Delete ",
                action: function () {
                    console.log("delete", params);
                },
                icon: this.createFlagImg("delete"),
                cssClasses: ["context-delete"]
            },
            {
                name: "Clear",
                action: this.clear.call(this, params),
                icon: this.createFlagImg("clear"),
                cssClasses: ["context-clear"],
            },
            {
                name: "Insert",
                icon: this.createFlagImg("add"),
                subMenu: [
                    {
                        name: "row below",
                        action: function () {
                            console.log("Insert a row below", params);
                        },
                        cssClasses: ["context-insert-below"],
                        icon: this.createFlagImg("insert-below"),
                    },
                    {
                        name: "row above",
                        action: function () {
                            console.log("Insert a row above", params);
                        },
                        cssClasses: ["context-insert-above"],
                        icon: this.createFlagImg("insert-above"),
                    },
                    {
                        name: "column left",
                        action: function () {
                            console.log("Insert a column left", params);
                        },
                        cssClasses: ["context-insert-left"],
                        icon: this.createFlagImg("insert-above"),
                    },
                    {
                        name: "column right",
                        action: function () {
                            console.log("Insert a column right", params);
                        },
                        cssClasses: ["context-insert-right"],
                        icon: this.createFlagImg("insert-right"),
                    },
                ]
            },
            {
                name: "Copy",
                shortcut: "Ctrl+C",
                action: function () {
                    console.log("Copy", params);
                },
                cssClasses: ["context-copy"],
                icon: this.createFlagImg("copy"),
            },
            "separator",
            {
                name: "Cut",
                shortcut: "Ctrl+X",
                action: function () {
                    console.log("Cut", params);
                },
                cssClasses: ["context-cut"],
                icon: this.createFlagImg("cut"),
            },
            {
                name: "Paste",
                shortcut: "Ctrl+V",
                action: function () {
                    console.log("Paste", params);
                },
                cssClasses: ["context-paste"],
                icon: this.createFlagImg("paste"),
            },
        ];
        return result;
    }

    genLicense() {
        this.licenseKey = 'Evaluation_License_Not_For_Production_Valid_Until10_February_2019__MTU0OTc1NjgwMDAwMA==411d3352bf224ca4084f9e42f8dce8b3';
    }

    computeIndexClass(p) {
        const api = p.api;
        const selectedNodes = api.getSelectedNodes()
        if (selectedNodes.length > 0) {
            selectedNodes.forEach(node => {

            })
        }

        let ranges = api.getCellRanges();
        let rows = [];
        let rowIndex = p.node.rowIndex;
        ranges && ranges.length > 0 && ranges.forEach(range => {
            let end = range.endRow.rowIndex;
            let start = range.startRow.rowIndex;
            let columns = range.columns
            for (let i = start; i < end + 1; i++) {
                if (i === rowIndex && columns.length === 1 && columns[0].colId === 'id')
                    continue
                rows.push(i)
            }
        })
        rows = uniq(rows)
        if (rows.some(row => row === rowIndex)) {
            return true
        } else {
            let focusedCell = api.getFocusedCell();
            if (focusedCell && rowIndex === focusedCell.rowIndex) {
                return true
            }
        }
        return false
    }

    computeHeaderClass(p) {
        if (p.column.colId === 'id') {
            return
        }
        const api = p.api;
        const colId = p.column.colId;
        const selectedNodes = api.getSelectedNodes()
        if (selectedNodes.length > 0) {
            return "headerHighlight"
        }

        const ranges = api.getCellRanges();
        let columns = [];
        ranges && ranges.length > 0 && ranges.forEach(range => {
            columns = columns.concat(range.columns);
        })
        columns = uniq(columns)
        if (columns.some(col => col.colId === colId)) {
            return "headerHighlight";
        } else {
            let focusedCell = api.getFocusedCell();
            if (focusedCell && focusedCell.column.colId === colId) {
                return "headerHighlight"
            }
        }
        return [];
    }
}

export default new Profile()