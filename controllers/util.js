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
exports.hashString = function (string) {

    var hash = crypto.createHash('md5').update(String(string)).digest('hex');
    return hash;
};
exports.getFormatedDatetime=function(d){
    if(typeof d=='undefined'){
        d= Date.now();
    }
    var appendLeadingZeroes=function (n){
        if(n <= 9){
          return "0" + n;
        }
        return n
      }
    
    return  d.getFullYear() + "-" + appendLeadingZeroes(d.getMonth() + 1) + "-" + appendLeadingZeroes(d.getDate()) + " " + appendLeadingZeroes(d.getHours()) + ":" + appendLeadingZeroes(d.getMinutes()) + ":" + appendLeadingZeroes(d.getSeconds())
};
//'yyyy-mm-dd'
exports.getFormatedDate=function(d){ 
    if(typeof d=='undefined'){
        d= new Date();
    }
    var appendLeadingZeroes=function (n){
        if(n <= 9){
          return "0" + n;
        }
        return n
      }
    
    return  d.getFullYear() + "-" + appendLeadingZeroes(d.getMonth() + 1) + "-" + appendLeadingZeroes(d.getDate()) ;
};
exports.escape= function(str) {
    var isString = typeof str === 'string' || str instanceof String;
    if(isString){
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\//g, '&#x2F;').replace(/\\/g, '&#x5C;').replace(/`/g, '&#96;');
    }else{
        return str
    }
  };
  
  exports.unescape= function(str) {
    var isString = typeof str === 'string' || str instanceof String;
    if(isString){
        return str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2F;/g, '/').replace(/&#x5C;/g, '\\').replace(/&#96;/g, '`');
    }else{
        return str
    }
  };
  exports.encodeRFC5987ValueChars =function (str) {
    //return encodeURIComponent(str).
    return encodeURI(str).
        // Note that although RFC3986 reserves "!", RFC5987 does not,
        // so we do not need to escape it
        replace(/['()]/g, escape). // i.e., %27 %28 %29
        replace(/\*/g, '%2A').
            // The following are not required for percent-encoding per RFC5987, 
            // so we can allow for a little better readability over the wire: |`^
            replace(/%(?:7C|60|5E)/g, unescape);
};
