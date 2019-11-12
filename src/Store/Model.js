import Profile from '../components/Table/config/profile'
export class Model {
  constructor(value, formula, color, fontWeight) {
    this.value = value;
    this.formula = formula;
    this.color = color || "#000";
    this.fontWeight = fontWeight || 'normal';
    this.textAlign = "left"
    this.fontStyle = "normal"
  }
}

export class Row {
  constructor() {
    this.id = getId()
    for (let i = 0, len = Profile.Alphabet.length; i < len; i++) {
      const Alpha = Profile.Alphabet[i]
      this[Alpha] = new Model();
    }
  }
}

export function getId() {
  let dt = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
  });
  return uuid;
}
