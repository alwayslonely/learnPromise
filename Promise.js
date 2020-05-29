(function (params) {

    const PENDING = 'pending'
    const RESOLVED = 'resolved'
    const REJECTED = 'rejected'

    /**
     * Promise构造函数
     * excutor:执行器函数
     */
    function Promise(excutor) {
        const self = this
        self.status = PENDING
        self.data = undefined
        self.callbacks = []

        function resolve(value) {

            if (self.status !== PENDING) {
                return
            }
            self.status = RESOLVED
            self.data = value

            if (self.callbacks.length > 0) {
                setTimeout(() => {
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onResolved(value)
                    });
                });

            }

        }

        function reject(reason) {

            if (self.status !== PENDING) {
                return
            }
            self.status = REJECTED
            self.data = reason

            if (self.callbacks.length > 0) {
                setTimeout(() => {
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onRejected(reason)
                    });
                });

            }
        }

        excutor(resolve, reject)

    }

    Promise.prototype.then = function (onResolved, onRejected) {

        onResolved = typeof onResolved === 'function' ? onResolved : value => value
        onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

        const self = this

        return new Promise((resolve, reject) => {
            function handle(callback) {
                try {
                    const result = callback(self.data)
                    if (result instanceof Promise) {
                        result.then(resolve, reject)
                    } else {
                        resolve(result)
                    }
                } catch (error) {
                    reject(error)
                }
            }

            if (self.status === PENDING) {
                self.callbacks.push({
                    onResolved() {
                        handle(onResolved)
                    },
                    onRejected() {
                        handle(onRejected)
                    }
                })
            } else if (self.status === RESOLVED) {
                setTimeout(() => {
                    handle(onResolved)
                });
            } else {
                setTimeout(() => {
                    handle(onRejected)
                });
            }
        })

    }

    Promise.prototype.catch = function (onRejected) {
        return this.then(undefined, onRejected)
    }

    Promise.resolve = function (value) {
        return new Promise((resolve, reject) => {
            if (value instanceof Promise) {
                value.then(resolve, reject)
            } else {
                resolve(value)
            }
        })
    }

    Promise.reject = function (reason) {
        return new Promise((resolve, reject) => {
            reject(reason)
        })

    }

    Promise.all = function (promises) {

        const values = new Array(promises.length)
        let resolvedCount = 0
        let rejectedCount = 0
        let minRejectedIndex
        return new Promise((resolve, reject) => {

            promises.forEach((p, index) => {
                p = p instanceof Promise ? p : Promise.resolve(p)
                p.then(
                    value => {
                        resolvedCount++
                        values[index] = value

                        if (resolvedCount === promises.length) {
                            resolve(values)
                        }
                    },
                    reason => {
                        if (!minRejectedIndex) {
                            minRejectedIndex = index
                        } else {
                            minRejectedIndex = minRejectedIndex > index ? index : minRejectedIndex
                        }
                        rejectedCount++
                        values[index] = reason
                        if ((resolvedCount + rejectedCount) === promises.length) {
                            reject(values[minRejectedIndex])
                        }
                    }
                )
            })
        })

    }

    Promise.race = function (promises) {
        return new Promise((resolve, reject) => {

            promises.forEach((p, index) => {
                p = p instanceof Promise ? p : Promise.resolve(p)
                p.then(
                    value => {
                        resolve(value)
                    },
                    reason => {
                        reject(reason)
                    }
                )
            })
        })
    }

    window.Promise = Promise
})(window)