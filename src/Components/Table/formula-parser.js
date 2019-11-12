import { Parser } from 'hot-formula-parser';
import Profile from './config/profile';
import { Model } from '../../stores/model';

const EQUAL_SIGN = '='
const AlphaColMap = Profile.AlphaColMap;
const Alphabet = Profile.Alphabet;
export default class FormulaParser {
    constructor(callback) {
        if (callback instanceof Function) {
            this.dataCallback = callback;
        } else {
            this.dataCallback = () => []
        }
        const parser = new Parser();
        parser.on('callCellValue', (cellCoord, done) => {
            debugger
            const data = this.dataCallback();
            const label = cellCoord.label;
            const { alpha, num } = this.seperateAlphaNumeric(label)
            const row = data[num - 1];
            let cell = row[AlphaColMap[alpha]];
            done(cell.value)
        })

        parser.on('callRangeValue', (startCellCoord, endCellCoord, done) => {
            const data = this.dataCallback();
            const fragment = [];
            for (let row = startCellCoord.row.index; row <= endCellCoord.row.index; row++) {
              const rowData = data[row];
              const colFragment = [];
              for (let col = startCellCoord.column.index; col <= endCellCoord.column.index; col++) {
                let cell = rowData[AlphaColMap[[Alphabet[col]]]]
                if(cell instanceof Model) {
                    cell = cell.value
                }
                colFragment.push(cell);
              }
              fragment.push(colFragment);
            }
            if (fragment.length > 0) {
                done(fragment);
            }
        })
        this.parser = parser
    }

    seperateAlphaNumeric(value) {
        const r = RegExp(/^([a-zA-Z]*)([0-9]*)$/g)
        const match = r.exec(value);
        var alpha = match[1];
        var num = match[2];
        return { alpha, num }
    }

    parse(value) {
        debugger
        value = this.removeEqualSign(value)
        return this.parser.parse(value)
    }

    removeEqualSign(value) {
        if (!value) {
          return;
        }
        return value.substr(1, value.length - 1)
    }

    isFormula(value) {
        return value && value.toString().startsWith(EQUAL_SIGN)
    }
}
