import * as _ from 'lodash';

export class Ring<T> {
    data: T[] = [];
    cap: number;

    constructor(cap: number = 60) {
        this.cap = cap;
    }

    push(item: T) {
        this.data.push(item);
    }

    recent() : (T | undefined);
    recent(defualtValue: T): T;
    recent(defaultValue?: T): (T | undefined) {
        if (_.isEmpty(this.data)) {
            return defaultValue;
        }
        return _.last(this.data);
    }

    prev() {
        let item = this.data.pop();
        if (item) {
            this.data.unshift(item);
        }
    }

    next() {
        let item = this.data.shift();
        if (item) {
            this.data.push(item);
        }
    }
}