'use strict';

var DOMParser = require('xmldom').DOMParser;

var DEFAULT_TYPES = ['*/xml', '+xml'];

module.exports = function(bodyParser) {
  if(bodyParser.xml_dom) {
    // We already setup the XML parser.
    // End early.
    return;
  }

  function xml_dom(options) {
    options = options || {};

    options.type = options.type || DEFAULT_TYPES;
    if(!Array.isArray(options.type)) {
      options.type = [options.type];
    }

    var textParser = bodyParser.text(options);
    
    return function xmlParser(req, res, next) {
      // First, run the body through the text parser.
      textParser(req, res, function(err) {
        if(err) { return next(err); }
        if(typeof req.body !== 'string') { return next(); }

        // Then, parse as XML.

        var doc = new DOMParser({
          error:function(e){
            return next(err);
          }
        }).parseFromString(
          req.body
          ,'text/xml');

         if(doc){ 
          req.body = doc ;
          next();  
         }
        // var parser = new xml2js.Parser(options.xmlParseOptions);
        // parser.parseString(req.body, function(err, xml) {
        //   if(err) {
        //     err.status = 400;
        //     return next(err);
        //   }

        //   req.body = xml || req.body;
        //   next();
        // });
      });
    };
  }

  // Finally add the `xml` function to the bodyParser.
  Object.defineProperty(bodyParser, 'xml_dom', {
    configurable: true,
    enumerable: true,
    get: function() {
      return xml_dom;
    }
  });
};