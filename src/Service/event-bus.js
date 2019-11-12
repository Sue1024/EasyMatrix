class EventBus {
  constructor() {
    this.callbacks = {};
  }

  trigger(eventName, data = null) {
    if (this.callbacks[eventName]) {
      Object.keys(this.callbacks[eventName]).forEach(id => {
        this.callbacks[eventName][id](data);
      });
    }
  }

  listen(eventName, callback) {
    let event = this.callbacks[eventName];
    if (event) {
      this.callbacks[eventName][callback] = callback;
    } else {
      event = {};
      this.callbacks[eventName] = event;
      event[callback] = callback;
    }
  }

  unlisten(eventName, callback) {
    delete this.callbacks[eventName][callback];
  }
}

export default new EventBus();
