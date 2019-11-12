import AuthStore from './AuthStore'
import SheetStore from './SheetStore'
let authStore = new AuthStore();
let sheetStore = new SheetStore();
export default {
    authStore, sheetStore
}