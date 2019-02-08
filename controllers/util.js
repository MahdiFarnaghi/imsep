var crypto = require('crypto');
exports.handleErrors = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(err => {
        next(err);
      });
  };
  
https://blog.grossman.io/how-to-write-async-await-without-try-catch-blocks-in-javascript/
exports.call= function (promise) {
    return promise.then(data => {
        return [null, data];
    })
        .catch(err => {
            return [err];
        });
}
exports.HttpError = function (errorCode, msg) {
    this.errorCode = errorCode;
    this.message = msg;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
    this.constructor.prototype.__proto__ = Error.prototype;
};
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Setting_a_function_parameter's_default_value
exports.generateToken = function ({ stringBase = 'base64', byteLength = 48 } = {}) {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(byteLength, (err, buffer) => {
            if (err) {
                reject(err);
            } else {
                resolve(buffer.toString(stringBase));
            }
        });
    });
};

exports.generateUrlSafeToken = function () {
    return exports.generateToken({ stringBase:'hex', byteLength: 16 });
};


