const Sequelize = require('sequelize');
const {
  Op
} = require('sequelize');
var path = require('path');
var fs = require('fs');
var url = require('url');
var util = require('./util');

var adminController = require('./adminController')();
const nativeUtil = require('util');

const DOMParser = require('xmldom').DOMParser;

var models = require('../models/index');
var sharp = require('sharp');
var ogr2ogr = require('../ogr2ogr');
const format = require('string-format');

var vash = require('vash');
var sphericalmercator = new(require('@mapbox/sphericalmercator'))();

module.exports = function (postgresWorkspace, datasetController) {
  var module = {};
  /**
   * GET /ows/csw
   */
  module.cswGet = async function (req, res, next) {
    var sendXml = async function (view, model) {
      var prom = new Promise((resolve, reject) => {
        res.render(view, model, function (err, xmlData) {
          if (err) {
            reject(err);
          } else {
            resolve(xmlData);
          }

        });
      });
      var xml = await prom;
      return res.set('Content-Type', 'application/xml').send(xml);
    };
    var makeError = async function (text, code, locator, version) {
      var params = {
        code: code,
        text: text,
        version: version || '2.0.2'
      };
      if (locator) {
        params.locator = locator;
      }
      return await sendXml('ows/templates/ogc_error', params);
    };
    for (var key in req.query) {
      req.query[key.toLowerCase()] = req.query[key];
    }
    var item, err;
    process.env.APP_HOST= process.env.APP_HOST ||  (req.protocol + '://' + req.get('host'));
    var request = req.query.request || 'getcapabilities';
    var version = req.query.version || '2.0.2';
    request = request.toLowerCase();
    if (req.body.documentElement) {
      request = req.body.documentElement.nodeName.toLowerCase();
    }
    var outputFormat = req.query.outputformat || 'gml';
    var jsonOutput = false;
    if (outputFormat == 'json' || outputFormat == 'geojson' || outputFormat == 'application/json') {
      jsonOutput = true;
    }
    if (request == 'getcapabilities') {

      var model = {
        //title: item.name || '',
        // abstract: item.description || '',
        //keywords: item.keywords?(item.keywords.split(/[;؛]+/)):[],
        host: process.env.APP_HOST + req.path + '?'

      };
      return await sendXml('ows/templates/csw_cap', model);
    } else if (request == 'describerecord') {

      var model = {
        host: process.env.APP_HOST + req.path + '?'
      }
      return await sendXml('ows/templates/csw_describeRecord', model);

    } else if (request == 'getrecords') {
      var params = {
        version: req.query.version || '2.0.2',
        elementSetName: req.query.elementsetname || 'brief',
        typeNames: req.query.typenames || 'csw:Record',
        resultType: req.query.resulttype || 'results',
        startPosition: req.query.startposition || 1,
        maxRecords: req.query.maxrecords || 100,
        outputFormat: req.query.outputformat || 'application/xml',
        filter: req.query.constraint || '<ogc:Filter></ogc:Filter>'
      }
    
      try {
        var doc = new DOMParser().parseFromString(params.filter, 'text/xml');

        params.filter = doc.documentElement;
      } catch (ex) {

      }
      if (req.body.documentElement) {
        var GetRecords = req.body.documentElement;
        params.version = GetRecords.getAttribute("version") || params.version;
        params.resultType = GetRecords.getAttribute("resultType") || params.resultType;
        params.startPosition = GetRecords.getAttribute("startPosition") || params.startPosition;
        params.maxRecords = GetRecords.getAttribute("maxRecords") || params.maxRecords;
        params.outputFormat = GetRecords.getAttribute("outputFormat") || params.outputFormat;
        params.orderByPropertyName=undefined;
        params.orderBySortOrder=undefined;
      
        var Query = GetRecords.getElementsByTagName('csw:Query')[0] || GetRecords.getElementsByTagName('Query')[0];
        if (Query) {
          params.typeNames = Query.getAttribute("typeNames") || params.typeNames;
          var ElementSetName = Query.getElementsByTagName('csw:ElementSetName')[0] || Query.getElementsByTagName('ElementSetName')[0];
          if (ElementSetName) {
            params.elementSetName = ElementSetName.textContent || params.elementSetName;
          }
          var Constraint = Query.getElementsByTagName('csw:Constraint')[0] || Query.getElementsByTagName('Constraint')[0];
          if (Constraint) {
            params.filter = Constraint.getElementsByTagName('ogc:Filter')[0] || Constraint.getElementsByTagName('Filter')[0];
          }
          var SortBy= Query.getElementsByTagName('ogc:SortBy')[0] || Query.getElementsByTagName('SortBy')[0];
          if (SortBy) {
              var SortProperty= SortBy.getElementsByTagName('ogc:SortProperty')[0] || SortBy.getElementsByTagName('SortProperty')[0];
              if(SortProperty){
                var PropertyName =SortProperty.getElementsByTagName('ogc:PropertyName')[0] || SortProperty.getElementsByTagName('PropertyName')[0];
                var SortOrder =SortProperty.getElementsByTagName('ogc:SortOrder')[0] || SortProperty.getElementsByTagName('SortOrder')[0];
                if(PropertyName){
                  params.orderByPropertyName=PropertyName.textContent;
                  if(SortOrder){
                    params.orderBySortOrder=SortOrder.textContent;
                  }
                  params.orderBySortOrder = params.orderBySortOrder || 'ASC';
                }
              }
          }
        }

      }
      var sqlWhere;
      var orderByExp=undefined;
      if(params.orderByPropertyName){
        if (params.orderByPropertyName.indexOf(':') > -1) {
          params.orderByPropertyName = params.orderByPropertyName.substr(params.orderByPropertyName.indexOf(':') + 1);
        }
        orderByExp=[ [params.orderByPropertyName ,params.orderBySortOrder] ];
      }
      
      if (params.filter) {
        //var sqlWhere=module.parseFilterToSql(params.constraint['ogc:Filter'] || params.constraint['Filter']);
        var sqlWhere = module.parseXmlFilterToSequelize(params.filter);

      }
      //   if (!sqlWhere){
      //     sqlWhere='1=1'
      //     }
      var records;
      try {

        var where={
          'publish_ogc_service':{[Op.eq]:true}
        }
        if(sqlWhere){
          where={
            [Op.and]:[
              where,
              sqlWhere
            ]
          }
        }
        //   records = await models.Metadata.sequelize.query('SELECT * FROM "Metadata" WHERE '+ sqlWhere, {
        //                     model: models.Metadata,
        //                     mapToModel: true
        //                         });

        records = await models.Metadata.findAll({
          where: where,
          order:orderByExp
        });

      } catch (ex) {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Error: ' + ex.message + '');
        return;
      }
      if (!records) {
        records = [];
      }

      var numberOfRecordsMatched = records.length;
      try {
        params.startPosition = parseInt(params.startPosition);
      } catch (ex) {}
      try {
        params.maxRecords = parseInt(params.maxRecords);
      } catch (ex) {}
      if (isNaN(params.startPosition)) {
        params.startPosition = 1;
      }
      if (isNaN(params.maxRecords)) {
        params.maxRecords = 100;
      }
      var nextRecord = params.startPosition + params.maxRecords
      if (nextRecord > numberOfRecordsMatched) {
        nextRecord =0;// numberOfRecordsMatched;
      }
      var selRecords = records.slice(params.startPosition - 1, (nextRecord>0)?nextRecord-1:undefined);
      for(var r=0;r<selRecords.length;r++){
        var item =selRecords[r];
        if(item && item.contentType=='Dataset'){
          var datasetId=item.contentId;
          if(item.format=='raster'|| item.format=='grid'){
            item._wms= process.env.APP_HOST+'/ows/wms/'+datasetId;
            item._wms_layers=item.title;
            item._wmts= process.env.APP_HOST+'/ows/wmts/'+datasetId;
          }else if (item.format && item.format.indexOf('vector')>-1){
            item._wms= process.env.APP_HOST+'/ows/wms/'+datasetId;
            item._wms_layers=item.title;
            
            item._wfs= process.env.APP_HOST+'/ows/wfs/'+datasetId;
            item._wfs_typename='ns:L_'+ datasetId;
            if( item.format.indexOf('-')>-1){
              item._wfs_shapeType= (item.format.split('-')[1]);
              item.shapeType=item._wfs_shapeType;
            }
            item.format='vector';
          }
        }
        if(item && item.subject){
          item.subject= item.subject.split(/[؛;]+/);
        }
        if(item && item.theme){
          item.theme= item.theme.split(/[؛;]+/);
        }
      }
      var model = {
        elementSet: params.elementSetName,
        nextRecord: nextRecord,
        numberOfRecordsMatched: numberOfRecordsMatched,
        numberOfRecordsReturned: selRecords.length,
        records: selRecords
      };
      return await sendXml('ows/templates/csw_getRecords', model);


    } else if (request == 'getrecordbyid') {
        var params = {
            version: req.query.version || '2.0.2',
            elementSetName: req.query.elementsetname || 'brief',
            outputFormat: req.query.outputformat || 'application/xml',
            ids: req.query.id 
          }
          if(typeof params.ids !=='undefined'){
            params.ids= params.ids.split(',');
          }
          if (req.body.documentElement) {
            var GetRecordById = req.body.documentElement;
            params.version = GetRecordById.getAttribute("version") || params.version;
            params.outputFormat = GetRecordById.getAttribute("outputFormat") || params.outputFormat;
            var ElementSetName = GetRecordById.getElementsByTagName('csw:ElementSetName')[0] || GetRecordById.getElementsByTagName('ElementSetName')[0];
            if (ElementSetName) {
              params.elementSetName = ElementSetName.textContent || params.elementSetName;
            }
            var Ids = GetRecordById.getElementsByTagName('Id');
            if(!Ids.length){
                Ids = GetRecordById.getElementsByTagName('csw:Id');
            }
            if (Ids.length) {
                var ids=[];
                for (var i = 0; i < Ids.length; i++) {
                    var Id_el = Ids[i];
                    ids.push(Id_el.textContent);
                }
                params.ids=ids;
            }
    
          }
          var sqlWhere;
          if (params.ids && params.ids.length) {
            
            var sqlWhere = {
                'identifier':{
                    [Op.in]:params.ids
                }
            };
    
          }
          if(!sqlWhere){
              return await makeError('Missing id parameter', 'MissingParameterValue', 'id', params.version);
          }      
          var records;
          try {
    
            records = await models.Metadata.findAll({
              where: sqlWhere
            });
    
          } catch (ex) {
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Error: ' + ex.message + '');
            return;
          }
          if (!records) {
            records = [];
          }
    
         
          var selRecords = records;
          for(var r=0;r<selRecords.length;r++){
            var item =selRecords[r];
            if(item && item.contentType=='Dataset'){
              var datasetId=item.contentId;
              if(item.format=='raster'|| item.format=='grid'){
                item._wms= process.env.APP_HOST+'/ows/wms/'+datasetId;
                item._wms_layers=item.title;
                item._wmts= process.env.APP_HOST+'/ows/wmts/'+datasetId;
              }else if (item.format && item.format.indexOf('vector')>-1){
                item._wms= process.env.APP_HOST+'/ows/wms/'+datasetId;
                item._wms_layers=item.title;
            
                item._wfs= process.env.APP_HOST+'/ows/wfs/'+datasetId;
                item._wfs_typename='ns:L_'+ datasetId;
                if( item.format.indexOf('-')>-1){
                  item._wfs_shapeType= (item.format.split('-')[1]);
                  item.shapeType=item._wfs_shapeType;
                }
                item.format='vector';
              }
            }
            if(item && item.subject){
              item.subject= item.subject.split(/[؛;]+/);
            }
            if(item && item.theme){
              item.theme= item.theme.split(/[؛;]+/);
            }
          }
          var model = {
            elementSet: params.elementSetName,
            records: selRecords
          };
          return await sendXml('ows/templates/csw_getRecordById', model);
    
        } else if (request=='getdomain'){
          var params = {
            version: req.query.version || '2.0.2',
            propertyName: req.query.propertyname || ''
            
          }
          if(typeof params.propertyName !=='undefined'){
            params.propertyNames= params.propertyName.split(',');
          }
          if (req.body.documentElement) {
            var GetDomain= req.body.documentElement;
            params.version = GetDomain.getAttribute("version") || params.version;
            
            var PropertyNames = GetDomain.getElementsByTagName('PropertyName');
            if(!PropertyNames.length){
              PropertyNames = GetDomain.getElementsByTagName('csw:PropertyName');
            }
            if (PropertyNames.length) {
                var propertyNames=[];
                for (var i = 0; i < PropertyNames.length; i++) {
                    var PropertyName_el = PropertyNames[i];
                    propertyNames.push(PropertyName_el.textContent);
                }
                params.propertyNames=propertyNames;
            }
          }
          var domainValues=[];
          //var itemKeywords= await models.Dataset.findAll({ attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('keywords')) ,'keywords'],]});
          for(var i=0;params.propertyNames && i<params.propertyNames.length;i++){
            var propertyName=params.propertyNames[i];
            var listOfValues=[];
            var fieldName= propertyName;
            if(propertyName.indexOf(':')>-1){
              fieldName= propertyName.split(':')[1];
            }
            var uValues=null;
            try{
              //uValues= await models.Metadata.findAll({ attributes: [[Sequelize.fn('DISTINCT', Sequelize.col(fieldName)) ,fieldName],]});
              uValues= await models.Metadata.findAll({
                attributes: [fieldName,[Sequelize.fn('COUNT', Sequelize.col(fieldName)), 'total']] ,
                group : [fieldName],
                where:{
                  'publish_ogc_service':{[Op.eq]:true}
                }
              });
            }catch(ex){
    
            }
    
            if(uValues){
              for(var u=0;u<uValues.length;u++){
                if(typeof uValues[u][fieldName]!=='undefined' && uValues[u][fieldName]!==null){
                  var total=uValues[u].get('total');
                  try{
                    total= parseInt(total);
                  }catch(ex){}
                  listOfValues.push({
                    value: uValues[u][fieldName]+'',
                    total:total
                  });
                }
              }
              if(fieldName=='subject' ||fieldName=='theme'){
                var valueMap={};
                for(var k=0;k< listOfValues.length;k++){
                 var values= listOfValues[k]['value'].split(/[؛;]+/);
                 var cVal=listOfValues[k]['total'];
                 values.forEach(function (key) {
                     key=key.trim();
                     if(key.length>1){
                           if (valueMap.hasOwnProperty(key)) {
                             valueMap[key]+=cVal;
                           } else {
                             valueMap[key] = cVal;
                           }
                    }
                 });
                }
                listOfValues = Object.keys(valueMap).map(function (key) {
                  //return key;
                     return {
                     value: key,
                     total: valueMap[key]
                     };
                });
              }
            }
            if(listOfValues){
              listOfValues.sort(function(a,b){
                if (a['value'] > b['value']) return 1;
                if (a['value'] < b['value']) return -1;
                //return 0;
                return b['total']-a['total'];
              });
            }
            domainValues.push({
              propertyName:propertyName,
              listOfValues:listOfValues
            })
          }
          var model = {
            domainValues: domainValues
          };
          return await sendXml('ows/templates/csw_getDomain', model);
    
    
        }else {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not Supported');
      // return;
      //return await makeError('missing required parameter: request','MissingParameterValue','request');
      //res.status(400).json({code:400,message:"Unknown REQUEST field : " + request});
      if (jsonOutput) {
        res.status(400).json({
          code: 400,
          message: "Unknown REQUEST field : " + request
        });
      } else {
        return await makeError('missing required parameter: request', 'MissingParameterValue', 'request', version);
      }
    }
  };
  module.parseXmlFilterToSequelize = function (filter) {
    var where = undefined;
    if (!filter) {
      return where;
    }
    if (!filter.childNodes) {
      return where;
    }
    var fieldMap = {
      'identifier': 'identifier',
      'dc:identifier': 'identifier',
      'Identifier': 'identifier',
      //'anytext':'anytext','AnyText':'anytext',
      'title': 'title',
      'dc:title': 'title',
      'Title': 'title',
      'alternative': 'alternative',
      'AlternateTitle': 'alternative',
      'abstract': 'abstract',
      'dct:abstract': 'abstract',
      'Abstract': 'abstract',
      'spatial': 'spatial','dct:spatial': 'spatial',
      'subject': 'subject',
      'dc:subject': 'subject',
      'Subject': 'subject',
      'theme': 'theme',
      'TopicCategory': 'theme',
      'created': 'created',
      'CreationDate': 'created',
      'date': 'date','dc:date': 'date',
      'PublicationDate': 'date',
      'modified': 'modified',
      'dct:modified': 'modified',
      'Modified': 'modified',
      'creator': 'creator','dc:creator': 'creator',
      'OrganisationName': 'creator',
      'publisher': 'publisher','dc:publisher': 'publisher',
      'contributor': 'contributor','dc:contributor': 'contributor',
      'rights': 'rights','dc:rights': 'rights',
      'language': 'language','dc:language': 'language',
      'Language': 'language',
      'type': 'type',
      'dc:type': 'type',
      'Type': 'type',
      'format': 'format','dc:format': 'format',
      'Format': 'format',
      'Source': 'source',
      'dct:references':'references',
      'dc:relation':'relation'

    }
    var operators = {

      PropertyIsNull: function (node) {
        if (!node) {
          return false;
        }

        if (!(node.tagName == 'ogc:PropertyIsNull' || node.tagName == 'PropertyIsNull')) {
          return false;
        }
        var PropertyName = node.getElementsByTagName('ogc:PropertyName')[0] || node.getElementsByTagName('PropertyName')[0];

        if (!PropertyName) {
          return false;
        }
        var propertyName = PropertyName.textContent;
        if (propertyName) {
          propertyName = fieldMap[propertyName] || propertyName;
          var where = {};
          where[propertyName] = {
            [Op.is]: null
          }
          return where;
        }
        return false;
      },
      PropertyIsEqualTo: function (node) {
        if (!node) {
          return false;
        }

        if (!(node.tagName == 'ogc:PropertyIsEqualTo' || node.tagName == 'PropertyIsEqualTo')) {
          return false;
        }
        var Literal = node.getElementsByTagName('ogc:Literal')[0] || node.getElementsByTagName('Literal')[0];
        var PropertyName = node.getElementsByTagName('ogc:PropertyName')[0] || node.getElementsByTagName('PropertyName')[0];
        if (!Literal) {
          return false;
        }
        if (!PropertyName) {
          return false;
        }
        var literal = Literal.textContent;
        var propertyName = PropertyName.textContent;
        if (propertyName && typeof literal !== 'undefined') {
          propertyName = fieldMap[propertyName] || propertyName;
          var where = {};
          where[propertyName] = {
            [Op.eq]: literal
          }
          return where;
        }
        return false;
      },
      PropertyIsNotEqualTo: function (node) {
        if (!node) {
          return false;
        }

        if (!(node.tagName == 'ogc:PropertyIsNotEqualTo' || node.tagName == 'PropertyIsNotEqualTo')) {
          return false;
        }
        var Literal = node.getElementsByTagName('ogc:Literal')[0] || node.getElementsByTagName('Literal')[0];
        var PropertyName = node.getElementsByTagName('ogc:PropertyName')[0] || node.getElementsByTagName('PropertyName')[0];
        if (!Literal) {
          return false;
        }
        if (!PropertyName) {
          return false;
        }
        var literal = Literal.textContent;
        var propertyName = PropertyName.textContent;
        if (propertyName && typeof literal !== 'undefined') {
          propertyName = fieldMap[propertyName] || propertyName;
          var where = {};
          where[propertyName] = {
            [Op.ne]: literal
          }
          return where;
        }
        return false;
      },
      PropertyIsLessThan: function (node) {
        if (!node) {
          return false;
        }

        if (!(node.tagName == 'ogc:PropertyIsLessThan' || node.tagName == 'PropertyIsLessThan')) {
          return false;
        }
        var Literal = node.getElementsByTagName('ogc:Literal')[0] || node.getElementsByTagName('Literal')[0];
        var PropertyName = node.getElementsByTagName('ogc:PropertyName')[0] || node.getElementsByTagName('PropertyName')[0];
        if (!Literal) {
          return false;
        }
        if (!PropertyName) {
          return false;
        }
        var literal = Literal.textContent;
        var propertyName = PropertyName.textContent;
        if (propertyName && typeof literal !== 'undefined') {
          propertyName = fieldMap[propertyName] || propertyName;
          var where = {};
          where[propertyName] = {
            [Op.lt]: literal
          }
          return where;
        }
        return false;
      },

      PropertyIsLessThanOrEqualTo: function (node) {
        if (!node) {
          return false;
        }

        if (!(node.tagName == 'ogc:PropertyIsLessThanOrEqualTo' || node.tagName == 'PropertyIsLessThanOrEqualTo')) {
          return false;
        }
        var Literal = node.getElementsByTagName('ogc:Literal')[0] || node.getElementsByTagName('Literal')[0];
        var PropertyName = node.getElementsByTagName('ogc:PropertyName')[0] || node.getElementsByTagName('PropertyName')[0];
        if (!Literal) {
          return false;
        }
        if (!PropertyName) {
          return false;
        }
        var literal = Literal.textContent;
        var propertyName = PropertyName.textContent;
        if (propertyName && typeof literal !== 'undefined') {
          propertyName = fieldMap[propertyName] || propertyName;
          var where = {};
          where[propertyName] = {
            [Op.lte]: literal
          }
          return where;
        }
        return false;
      },
      PropertyIsGreaterThan: function (node) {
        if (!node) {
          return false;
        }

        if (!(node.tagName == 'ogc:PropertyIsGreaterThan' || node.tagName == 'PropertyIsGreaterThan')) {
          return false;
        }
        var Literal = node.getElementsByTagName('ogc:Literal')[0] || node.getElementsByTagName('Literal')[0];
        var PropertyName = node.getElementsByTagName('ogc:PropertyName')[0] || node.getElementsByTagName('PropertyName')[0];
        if (!Literal) {
          return false;
        }
        if (!PropertyName) {
          return false;
        }
        var literal = Literal.textContent;
        var propertyName = PropertyName.textContent;
        if (propertyName && typeof literal !== 'undefined') {
          propertyName = fieldMap[propertyName] || propertyName;
          var where = {};
          where[propertyName] = {
            [Op.gt]: literal
          }
          return where;
        }
        return false;
      },
      PropertyIsBetween: function (node) {
        if (!node) {
          return false;
        }

        if (!(node.tagName == 'ogc:PropertyIsBetween' || node.tagName == 'PropertyIsBetween')) {
          return false;
        }

        var PropertyName = node.getElementsByTagName('ogc:PropertyName')[0] || node.getElementsByTagName('PropertyName')[0];
        var LowerBoundary = node.getElementsByTagName('ogc:LowerBoundary')[0] || node.getElementsByTagName('LowerBoundary')[0];
        var UpperBoundary = node.getElementsByTagName('ogc:UpperBoundary')[0] || node.getElementsByTagName('UpperBoundary')[0];
        if (!LowerBoundary) {
          return false;
        }
        if (!UpperBoundary) {
          return false;
        }
        if (!PropertyName) {
          return false;
        }
        var Literal_lower = LowerBoundary.getElementsByTagName('ogc:Literal')[0] || LowerBoundary.getElementsByTagName('Literal')[0];
        var Literal_upper = UpperBoundary.getElementsByTagName('ogc:Literal')[0] || UpperBoundary.getElementsByTagName('Literal')[0];
        if (!(Literal_lower && Literal_upper)) {
          return false;
        }
        var literal_lower = Literal_lower.textContent;
        var literal_upper = Literal_upper.textContent;
        var propertyName = PropertyName.textContent;
        if (propertyName && typeof literal_lower !== 'undefined' && typeof literal_upper !== 'undefined') {
          propertyName = fieldMap[propertyName] || propertyName;
          var where = {};
          where[propertyName] = {
            [Op.between]: [literal_lower, literal_upper]
          }
          return where;
        }
        return false;
      },
      PropertyIsGreaterThanOrEqualTo: function (node) {
        if (!node) {
          return false;
        }

        if (!(node.tagName == 'ogc:PropertyIsGreaterThanOrEqualTo' || node.tagName == 'PropertyIsGreaterThanOrEqualTo')) {
          return false;
        }
        var Literal = node.getElementsByTagName('ogc:Literal')[0] || node.getElementsByTagName('Literal')[0];
        var PropertyName = node.getElementsByTagName('ogc:PropertyName')[0] || node.getElementsByTagName('PropertyName')[0];
        if (!Literal) {
          return false;
        }
        if (!PropertyName) {
          return false;
        }
        var literal = Literal.textContent;
        var propertyName = PropertyName.textContent;
        if (propertyName && typeof literal !== 'undefined') {
          propertyName = fieldMap[propertyName] || propertyName;
          var where = {};
          where[propertyName] = {
            [Op.gte]: literal
          }
          return where;
        }
        return false;
      },
      PropertyIsLike: function (node) {
        if (!node) {
          return false;
        }

        if (!(node.tagName == 'ogc:PropertyIsLike' || node.tagName == 'PropertyIsLike')) {
          return false;
        }

        var escapeChar = node.getAttribute('escapeChar');
        var singleChar = node.getAttribute('singleChar');
        var wildCard = node.getAttribute('wildCard');


        var Literal = node.getElementsByTagName('ogc:Literal')[0] || node.getElementsByTagName('Literal')[0];
        var PropertyName = node.getElementsByTagName('ogc:PropertyName')[0] || node.getElementsByTagName('PropertyName')[0];
        if (!Literal) {
          return false;
        }
        if (!PropertyName) {
          return false;
        }
        var literal = Literal.textContent;
        var propertyName = PropertyName.textContent;
        if (propertyName && typeof literal !== 'undefined') {
          if (singleChar) {
            literal = literal.replace(new RegExp(singleChar, 'g'), '_')
          }
          if (wildCard) {
            literal = literal.replace(new RegExp(wildCard, 'g'), '%')
          }
          propertyName = fieldMap[propertyName] || propertyName;
          var where = {};
          if (propertyName.toLowerCase() == 'anytext') {

            var $or = [{
                "title": {
                  [Op.iLike]: literal
                }
              },
              {
                "alternative": {
                  [Op.iLike]: literal
                }
              },
              {
                "abstract": {
                  [Op.iLike]: literal
                }
              },
              {
                "spatial": {
                  [Op.iLike]: literal
                }
              },
              {
                "subject": {
                  [Op.iLike]: literal
                }
              },
              {
                "theme": {
                  [Op.iLike]: literal
                }
              },
              {
                "created": {
                  [Op.iLike]: literal
                }
              },
              {
                "date": {
                  [Op.iLike]: literal
                }
              },
              {
                "modified": {
                  [Op.iLike]: literal
                }
              },
              {
                "creator": {
                  [Op.iLike]: literal
                }
              },
              {
                "publisher": {
                  [Op.iLike]: literal
                }
              },
              {
                "contributor": {
                  [Op.iLike]: literal
                }
              },
              {
                "rights": {
                  [Op.iLike]: literal
                }
              },
              {
                "language": {
                  [Op.iLike]: literal
                }
              },
              {
                "type": {
                  [Op.iLike]: literal
                }
              },
              {
                "format": {
                  [Op.iLike]: literal
                }
              },
            ];

            where[Op.or] = $or;
          } else {
            where[propertyName] = {
              [Op.iLike]: literal
            }

          }
          return where;
        }
        return false;
      },
      And: function (node) {
        if (!node) {
          return false;
        }
        if (!(node.tagName == 'ogc:And' || node.tagName == 'And')) {
          return false;
        }
        if (!node.childNodes) {
          return false;
        }
        var list = [];
        for (var i = 0; i < node.childNodes.length; i++) {
          var op = node.childNodes[i];
          if (!op.tagName) {
            continue;
          }
          var opKey = op.tagName;
          var opName = opKey;
          if (opName.indexOf(':') > -1) {
            opName = opName.substr(opName.indexOf(':') + 1);
          }
          if (operators[opName]) {
            var subWhere = operators[opName](op);
            if (subWhere) {
              list.push(subWhere);
            }
          }
        }
        return {
          [Op.and]: list
        };
      },
      Or: function (node) {
        if (!node) {
          return false;
        }
        if (!(node.tagName == 'ogc:Or' || node.tagName == 'Or')) {
          return false;
        }
        if (!node.childNodes) {
          return false;
        }
        var list = [];
        for (var i = 0; i < node.childNodes.length; i++) {
          var op = node.childNodes[i];
          if (!op.tagName) {
            continue;
          }
          var opKey = op.tagName;
          var opName = opKey;
          if (opName.indexOf(':') > -1) {
            opName = opName.substr(opName.indexOf(':') + 1);
          }
          if (operators[opName]) {
            var subWhere = operators[opName](op);
            if (subWhere) {
              list.push(subWhere);
            }
          }
        }
        return {
          [Op.or]: list
        };
      },
      Not: function (node) {
        if (!node) {
          return false;
        }
        if (!(node.tagName == 'ogc:Not' || node.tagName == 'Not')) {
          return false;
        }
        if (!node.childNodes) {
          return false;
        }
        var list = [];
        for (var i = 0; i < node.childNodes.length; i++) {
          var op = node.childNodes[i];
          if (!op.tagName) {
            continue;
          }
          var opKey = op.tagName;
          var opName = opKey;
          if (opName.indexOf(':') > -1) {
            opName = opName.substr(opName.indexOf(':') + 1);
          }
          if (operators[opName]) {
            var subWhere = operators[opName](op);
            if (subWhere) {
              list.push(subWhere);
            }
          }
        }
        if (list.length) {
          return {
            [Op.not]: list[0]
          };
        } else {
          return false;
        }
      },
      BBOX: function (node) {
        if (!node) {
          return false;
        }

        if (!(node.tagName == 'ogc:BBOX' || node.tagName == 'BBOX')) {
          return false;
        }
        var Envelope = node.getElementsByTagName('gml:Envelope')[0] || node.getElementsByTagName('Envelope')[0];
        var PropertyName = node.getElementsByTagName('ogc:PropertyName')[0] || node.getElementsByTagName('PropertyName')[0];
        if (!Envelope) {
          return false;
        }
        if (!PropertyName) {
          return false;
        }
        var lowerCorner = Envelope.getElementsByTagName('gml:lowerCorner')[0] || Envelope.getElementsByTagName('lowerCorner')[0];
        var upperCorner = Envelope.getElementsByTagName('gml:upperCorner')[0] || Envelope.getElementsByTagName('upperCorner')[0];
        if (!(lowerCorner && upperCorner)) {
          return false;
        }
        var lowerCorner_txt = lowerCorner.textContent;
        var upperCorner_txt = upperCorner.textContent;
        var propertyName = PropertyName.textContent;
        if (propertyName && lowerCorner_txt && upperCorner_txt) {
          propertyName = fieldMap[propertyName] || propertyName;
          var lowerCorner_txts = lowerCorner_txt.split(' ');
          var upperCorner_txts = upperCorner_txt.split(' ');
          if (!(lowerCorner_txts.length == 2 && upperCorner_txts.length == 2)) {
            return false;
          }
          var east = upperCorner_txts[0];
          var north = upperCorner_txts[1];
          var west = lowerCorner_txts[0];
          var south = lowerCorner_txts[1];
          var where = {
            [Op.or]: [{
                [Op.or]: [{
                    ext_west: null
                  },
                  {
                    ext_east: null
                  },
                  {
                    ext_south: null
                  },
                  {
                    ext_north: null
                  }
                ]
              },
              {
                [Op.not]: [{
                  [Op.or]: [{
                      ext_west: {
                        [Op.gt]: east
                      }
                    },
                    {
                      ext_east: {
                        [Op.lt]: west
                      }
                    },
                    {
                      ext_south: {
                        [Op.gt]: north
                      }
                    },
                    {
                      ext_north: {
                        [Op.lt]: south
                      }
                    }
                  ]
                }]
              }
            ]
          };
          return where;
        }
        return false;
      },
    }

    var list = []
    for (var i = 0; i < filter.childNodes.length; i++) {

      var op = filter.childNodes[i];
      if (!op.tagName) {
        continue;
      }
      var opKey = op.tagName;
      var opName = opKey;
      if (opName.indexOf(':') > -1) {
        opName = opName.substr(opName.indexOf(':') + 1);
      }
      if (operators[opName]) {
        var subWhere = operators[opName](op);
        if (subWhere) {
          list.push(subWhere);
        }
      }
    }
    if (list.length) {
      where = {
        [Op.or]: list
      }
    }

    return where;
  }
  
  /**
   * GET /ows/wmts/:id
   */
  module.rasterWmtsGet = async function (req, res, next) {
    var makeError = async function (text, code, locator) {
      var params = {
        code: code,
        text: text,
        version: '1.0.0'
      };
      if (locator) {
        params.locator = locator;
      }

      //return params;
      // res.render('ows/templates/ogc_error', params, function (err, xmlData) {
      //     return res.set('Content-Type', 'application/xml').send(xmlData);
      // });
      // return;

      var prom = new Promise((resolve, reject) => {
        res.render('ows/templates/ogc_error', params, function (err, xmlData) {
          if (err) {
            reject(err);
          } else {
            resolve(xmlData);
          }

        });
      });
      var xml = await prom;
      return res.set('Content-Type', 'application/xml').send(xml);
    };

    for (var key in req.query) {
      req.query[key.toLowerCase()] = req.query[key];
    }
    process.env.APP_HOST= process.env.APP_HOST ||  (req.protocol + '://' + req.get('host'));
    var item, err;
    var request = req.query.request || 'getcapabilities';
    request = request.toLowerCase();

    var itemId = req.params.id;

    if (!(req.params.id && req.params.id != '-1')) {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not found');
      // return;
      return await makeError('Dataset not found', 'InvalidParameterValue', 'id');
    }

    [err, item] = await util.call(models.DataLayer.findByPk(itemId));


    if (!item) {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not found');
      // return;
      return await makeError('Dataset not found', 'InvalidParameterValue', 'id');
    }
    if(!item.publish_ogc_service){
      return await makeError('Service is not available', 'InvalidParameterValue', 'id');
    }



    if (!item.details) {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not found');
      // return;
      return await makeError('Dataset error', 'InvalidParameterValue', 'id');
    }
    //todo: permission check

    //todo: permission check
    if (req.user && req.user.id !== item.ownerUser && !res.locals.identity.isAdministrator) {
      var AccessGranted = await adminController._CheckDataPermissionTypes(req.user, item.permissionTypes, 'Deny', ['Edit', 'View']);
      if (!AccessGranted) {
        // res.set('Content-Type', 'text/plain');
        // res.status(403).end('Access denied');
        // return;
        return await makeError('Access denied', 'InvalidParameterValue', 'id');
      }
      var userHasViewPermission = false;
      var err;
      [err, item] = await util.call(models.DataLayer.findOne({
        where: {
          id: itemId
        },
        include: [{
          model: models.Permission,
          as: 'Permissions',
          include: [{
              model: models.User,
              as: 'assignedToUser',
              required: false,
              where: {
                id: req.user.id
              }
            },
            {
              model: models.Group,
              as: 'assignedToGroup',
              required: false,
              include: [{
                model: models.User,
                as: 'Users',
                required: true,
                where: {
                  id: req.user.id
                }
              }]
            }
          ]
        }]
      }));

      if (item) { // get permission
        var permissions = item.Permissions;
        if (permissions) {
          userHasViewPermission = permissions.some((p) => {
            if ((p.grantToType == 'user' && p.assignedToUser) || (p.grantToType == 'group' && p.assignedToGroup)) {
              return (p.permissionName == 'Edit' || p.permissionName == 'View');
            } else return false;
          });
        }

      }

      if (!userHasViewPermission) {
        // res.set('Content-Type', 'text/plain');
        // res.status(403).end('Access denied');
        // return;
        return await makeError('Access denied', 'InvalidParameterValue', 'id');
      }


    }


    var details = {};
    try {
      details = JSON.parse(item.details);
    } catch (ex) {}
    if (!details) {
      details = {};
    }

    //todo: workspace selection

    var tableName = details.datasetName || item.name;
    var oidField = details.oidField || 'rid';
    var rasterField = details.rasterField || 'raster';
    var srid = details.spatialReference.srid || 3857;
    var getZoomForResolution = function (resolution) {
      let minZoom_ = 0;
      let maxResolution_ = 156543.03392804097;
      let minResolution_ = 0.0005831682455839253;
      let zoomFactor_ = 2;

      let offset = minZoom_ || 0;
      let max, zoomFactor;
      // if (this.resolutions_) {
      //   const nearest = linearFindNearest(this.resolutions_, resolution, 1);
      //   offset = nearest;
      //   max = this.resolutions_[nearest];
      //   if (nearest == this.resolutions_.length - 1) {
      //     zoomFactor = 2;
      //   } else {
      //     zoomFactor = max / this.resolutions_[nearest + 1];
      //   }
      // } else {
      max = maxResolution_;
      zoomFactor = zoomFactor_;
      // }
      return offset + Math.log(max / resolution) / Math.log(zoomFactor);
    }
    var maxZoom = 21;
    var minZoom = 0;
    if (details.metadata_3857 && details.metadata_3857.scalex) {
      maxZoom = getZoomForResolution(details.metadata_3857.scalex);
      maxZoom = Math.floor(maxZoom) - 1 - (0);
      minZoom = maxZoom - 4;
      if (minZoom < 0) {
        minZoom = 0;
      }
      //  minZoom=0;

    }
    var layer_bbox = [item.ext_west, item.ext_south, item.ext_east, item.ext_north];
    var getTileLimits = function (bbox, minzoom, maxzoom) {
      var i = minzoom;
      var out = [];
      while (i <= maxzoom) {
        out.push({
          // zoom: i < 10 ? '0' + i.toString() : i.toString(),
          //zoom: i.toString(),
          zoom: i,
          bbox: sphericalmercator.xyz(bbox, i)
        });
        i++;
      }
      return out;
    };
    var tilelimits;
    tilelimits = getTileLimits(layer_bbox, minZoom, maxZoom);


    if (request == 'getcapabilities') {

      var bl = sphericalmercator.forward(layer_bbox.slice(0, 2));
      var mercminx = bl[0];
      var mercminy = bl[1];
      var tr = sphericalmercator.forward(layer_bbox.slice(2, 4));
      var mercmaxx = tr[0];
      var mercmaxy = tr[1];
      // tilelimits =getTileLimits([-180,-90,180,90],minZoom,maxZoom);
      var model = {
        title: item.name || '',
        abstract: item.description || '',
        keywords: item.keywords ? (item.keywords.split(/[;؛]+/)) : [],
        //host: makeHost(layers.host),
        host: process.env.APP_HOST + req.path + '?',
        layers: [{
          title: item.name,
          bbox: layer_bbox,
          minx: layer_bbox[0],
          miny: layer_bbox[1],
          maxx: layer_bbox[2],
          maxy: layer_bbox[3],
          mercminx: mercminx,
          mercminy: mercminy,
          mercmaxx: mercmaxx,
          mercmaxy: mercmaxy,
          tilelimits: tilelimits
        }],
        tilematrix: []
      };

      //// var wmts = fs.readFileAsync(path.join(__dirname, '../views/ows/templates/wmts.vash')).then(function (template) {
      ////     return vash.compile(template.toString());
      //// });
      // var templateStr = fs.readFileSync(path.join(__dirname, '../views/ows/templates/wmts.vash')).toString().trim();
      // var wmts=vash.compile(templateStr.toString());

      // var  template = wmts;   
      // var xmlData;
      // try{
      //  xmlData=template(model);
      // }catch(ex){
      //     console.log(ex);
      // }
      //return res.set('application/xml').send(xmlData);
      res.render('ows/templates/wmts', model, function (err, xmlData) {
        return res.set('Content-Type', 'application/xml').send(xmlData);
      })

    } else if (request == 'gettile') {
      var TileMatrix;
      var x, y, z;
      var checkTile = function (minZoom, maxZoom, layer_bbox, x, y, z) {
        if (z < minZoom || z > maxZoom) {
          return 'TILEMATRIX';
        }
        var tilebbox = sphericalmercator.xyz(layer_bbox, z);
        if (y < tilebbox.minY || y > tilebbox.maxY) {
          return 'TILEROW';
        }
        if (x < tilebbox.minX || x > tilebbox.maxX) {
          return 'TILECOLUMN';
        }
        return false;
      }
      x = req.query['tilecol'];
      y = req.query['tilerow'];
      TileMatrix = req.query['tilematrix'];


      var ref_z = req.query.ref_z || 10;
      try {
        if (ref_z) {
          ref_z = parseInt(ref_z);
        }
      } catch (ex) {}
      ref_z = (maxZoom - 1 - (0));

      try {
        x = parseInt(x);
      } catch (ex) {}
      try {
        y = parseInt(y);
      } catch (ex) {}
      try {
        z = parseInt(z);
      } catch (ex) {}
      if (TileMatrix) {
        var TileMatrix_parts = TileMatrix.split(':');
        if (TileMatrix_parts.length == 3) {
          try {
            z = parseInt(TileMatrix_parts[2]);
          } catch (ex) {};
        }
      }
      var tileError = checkTile(minZoom, maxZoom, layer_bbox, x, y, z);
      if (tileError) {
        return await makeError(`${tileError} is out of range`, 'TileOutOfRange', tileError);
      }
      // y = Math.pow(2, z) - y - 1;
      //y= -y-1;

      var out_srid = 3857; //req.query.srid;// reproject to srid
      var request = req.query.request || 'png';
      var tileSize = 256;
      var display = req.query.display;


      if (display) {
        try {
          display = JSON.parse(display);
        } catch (ex) {}
      }
      try {
        return await datasetController.rasterGetTile(req, res, item, details, x, y, z, ref_z, tileSize, display);
      } catch (ex) {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found.(' + ex.message + ')');
        return;
        // return await makeError('Not found','InvalidParameterValue','');
      }
    } else {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not Supported');
      // return;
      return await makeError('missing required parameter: request', 'MissingParameterValue', 'request');
    }
  };
  /**
   * GET /ows/wms/:id
   */
  module.rasterWmsGet = async function (req, res, next) {
    var makeError = async function (text, code, locator) {
      var params = {
        code: code,
        text: text,
        version: '1.1.1'
      };
      if (locator) {
        params.locator = locator;
      }
      var prom = new Promise((resolve, reject) => {
        res.render('ows/templates/ogc_error', params, function (err, xmlData) {
          if (err) {
            reject(err);
          } else {
            resolve(xmlData);
          }

        });
      });
      var xml = await prom;
      return res.set('Content-Type', 'application/xml').send(xml);
    };

    for (var key in req.query) {
      req.query[key.toLowerCase()] = req.query[key];
    }
    var item, err;
    process.env.APP_HOST= process.env.APP_HOST ||  (req.protocol + '://' + req.get('host'));
    var request = req.query.request || 'getcapabilities';
    request = request.toLowerCase();

    var itemId = req.params.id;

    if (!(req.params.id && req.params.id != '-1')) {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not found');
      // return;
      return await makeError('Dataset not found', 'InvalidParameterValue', 'id');
    }

    [err, item] = await util.call(models.DataLayer.findByPk(itemId));


    if (!item) {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not found');
      // return;
      return await makeError('Dataset not found', 'InvalidParameterValue', 'id');
    }
    if(!item.publish_ogc_service){
      return await makeError('Service is not available', 'InvalidParameterValue', 'id');
    }

    if (!item.details) {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not found');
      // return;
      return await makeError('Dataset error', 'InvalidParameterValue', 'id');
    }
    //todo: permission check

    //todo: permission check
    if (req.user && req.user.id !== item.ownerUser && !res.locals.identity.isAdministrator) {
      var AccessGranted = await adminController._CheckDataPermissionTypes(req.user, item.permissionTypes, 'Deny', ['Edit', 'View']);
      if (!AccessGranted) {
        // res.set('Content-Type', 'text/plain');
        // res.status(403).end('Access denied');
        // return;
        return await makeError('Access denied', 'InvalidParameterValue', 'id');
      }
      var userHasViewPermission = false;
      var err;
      [err, item] = await util.call(models.DataLayer.findOne({
        where: {
          id: itemId
        },
        include: [{
          model: models.Permission,
          as: 'Permissions',
          include: [{
              model: models.User,
              as: 'assignedToUser',
              required: false,
              where: {
                id: req.user.id
              }
            },
            {
              model: models.Group,
              as: 'assignedToGroup',
              required: false,
              include: [{
                model: models.User,
                as: 'Users',
                required: true,
                where: {
                  id: req.user.id
                }
              }]
            }
          ]
        }]
      }));

      if (item) { // get permission
        var permissions = item.Permissions;
        if (permissions) {
          userHasViewPermission = permissions.some((p) => {
            if ((p.grantToType == 'user' && p.assignedToUser) || (p.grantToType == 'group' && p.assignedToGroup)) {
              return (p.permissionName == 'Edit' || p.permissionName == 'View');
            } else return false;
          });
        }

      }

      if (!userHasViewPermission) {
        // res.set('Content-Type', 'text/plain');
        // res.status(403).end('Access denied');
        // return;
        return await makeError('Access denied', 'InvalidParameterValue', 'id');
      }


    }


    var details = {};
    try {
      details = JSON.parse(item.details);
    } catch (ex) {}
    if (!details) {
      details = {};
    }

    //todo: workspace selection

    var tableName = details.datasetName || item.name;
    var oidField = details.oidField || 'rid';
    var rasterField = details.rasterField || 'raster';
    var srid = 3857;
    if (details.spatialReference) {
      srid = details.spatialReference.srid || 3857;
    }
    var getZoomForResolution = function (resolution) {
      let minZoom_ = 0;
      let maxResolution_ = 156543.03392804097;
      let minResolution_ = 0.0005831682455839253;
      let zoomFactor_ = 2;

      let offset = minZoom_ || 0;
      let max, zoomFactor;
      // if (this.resolutions_) {
      //   const nearest = linearFindNearest(this.resolutions_, resolution, 1);
      //   offset = nearest;
      //   max = this.resolutions_[nearest];
      //   if (nearest == this.resolutions_.length - 1) {
      //     zoomFactor = 2;
      //   } else {
      //     zoomFactor = max / this.resolutions_[nearest + 1];
      //   }
      // } else {
      max = maxResolution_;
      zoomFactor = zoomFactor_;
      // }
      return offset + Math.log(max / resolution) / Math.log(zoomFactor);
    }
    var maxZoom = 21;
    var minZoom = 0;
    if (details.metadata_3857 && details.metadata_3857.scalex) {
      maxZoom = getZoomForResolution(details.metadata_3857.scalex);
      maxZoom = Math.floor(maxZoom) - 1 - (0);
      minZoom = maxZoom - 4;
      if (minZoom < 0) {
        minZoom = 0;
      }
      //  minZoom=0;

    }
    var layer_bbox = [item.ext_west, item.ext_south, item.ext_east, item.ext_north];


    if (request == 'getcapabilities') {

      var bl = sphericalmercator.forward(layer_bbox.slice(0, 2));
      var mercminx = bl[0];
      var mercminy = bl[1];
      var tr = sphericalmercator.forward(layer_bbox.slice(2, 4));
      var mercmaxx = tr[0];
      var mercmaxy = tr[1];
      // tilelimits =getTileLimits([-180,-90,180,90],minZoom,maxZoom);
      var model = {
        title: item.name || '',
        abstract: item.description || '',
        keywords: item.keywords ? (item.keywords.split(/[;؛]+/)) : [],
        //host: makeHost(layers.host),
        dataType:item.dataType,
        host: process.env.APP_HOST + req.path + '?',
        layers: [{
          name: item.id,
          title: item.name,
          dataType:item.dataType,
          bbox: layer_bbox,
          minx: layer_bbox[0],
          miny: layer_bbox[1],
          maxx: layer_bbox[2],
          maxy: layer_bbox[3],
          mercminx: mercminx,
          mercminy: mercminy,
          mercmaxx: mercmaxx,
          mercmaxy: mercmaxy
        }]
      };

      res.render('ows/templates/wms', model, function (err, xmlData) {
        return res.set('Content-Type', 'application/xml').send(xmlData);
      })

    } else if (request == 'getmap') {

      var getZoom = function (bounds, dimensions, minzoom, maxzoom) {
        minzoom = (minzoom === undefined) ? 0 : minzoom;
        maxzoom = (maxzoom === undefined) ? 21 : maxzoom;


        var bl = sphericalmercator.px([bounds[0], bounds[1]], maxzoom);
        var tr = sphericalmercator.px([bounds[2], bounds[3]], maxzoom);
        var width = tr[0] - bl[0];
        var height = bl[1] - tr[1];
        var ratios = [width / dimensions[0], height / dimensions[1]];
        var adjusted = Math.ceil(Math.min(
          maxzoom - (Math.log(ratios[0]) / Math.log(2)),
          maxzoom - (Math.log(ratios[1]) / Math.log(2))));
        //return Math.max(minzoom, Math.min(maxzoom, adjusted));
        return adjusted;

      }
      var checkExtent = function (minZoom, maxZoom, z, layer_bbox, bbox) {
        if (z < minZoom || z > maxZoom) {
          return 'Scale';
        }

        // minx: layer_bbox[0],
        // miny: layer_bbox[1],
        // maxx: layer_bbox[2],
        // maxy: layer_bbox[3],
        if (bbox[0] > layer_bbox[2] || bbox[2] < layer_bbox[0] ||
          bbox[1] > layer_bbox[3] || bbox[3] < layer_bbox[1]
        ) {
          return 'Extent';
        }

        return false;
      }
      var srs;
      var query_srs=req.query['srs'] || req.query['crs'];
      srs = req.query['srs'] || req.query['crs'] || 'epsg:3857';
      srs = srs.toLowerCase();
      var bbox = req.query['bbox'];
      var query_bbox=bbox;
      bbox = bbox.split(',').map(function (num) {
        return parseFloat(num);
      });
      if (['epsg:900913', 'epsg:3857'].indexOf(srs) > -1) {
        bbox = sphericalmercator.inverse([bbox[0], bbox[1]]).concat(sphericalmercator.inverse([bbox[2], bbox[3]]));
      }
      var width = parseInt(req.query.width, 10);
      if (width < 1) {
        return await makeError('width must be greater then 0', 'InvalidParameterValue', 'WIDTH');
      }
      var height = parseInt(req.query.height, 10);
      if (height < 1) {
        return await makeError('height must be greater then 1', 'InvalidParameterValue', 'HEIGHT');
      }

      var zoom = getZoom(bbox, [width, height], minZoom, maxZoom);

      var ref_z = req.query.ref_z || 10;
      try {
        if (ref_z) {
          ref_z = parseInt(ref_z);
        }
      } catch (ex) {}
      ref_z = (maxZoom - 1 - (0));


      var extentError = checkExtent(minZoom, maxZoom, zoom, layer_bbox, bbox);
      if (extentError) {
        return await makeError(`${extentError} is out of range`, 'OutOfRange');
      }
      srs = srs.toLowerCase();
      if (['epsg:900913', 'epsg:3857' /*, 'epsg:4326'*/ ].indexOf(srs) === -1) {
        return await makeError(`invalid srs: ${srs}`, 'InvalidSRS');
      }

      //var out_srid = 3857; //req.query.srid;// reproject to srid
      var imageFormat = req.query.format || 'image/png';


      var tileSize = 256;
      var display = req.query.display;


      if (display) {
        try {
          display = JSON.parse(display);
        } catch (ex) {}
      }
      try {

        if(item.dataType=='raster'){
          return await datasetController.rasterGetImage(req, res, item, details, bbox, zoom, ref_z, width, height, imageFormat, display);
        }else if(item.dataType=='vector'){
          var tableName = details.datasetName || item.name;
          var oidField = details.oidField || 'gid';
          var shapeField = details.shapeField || 'geom';
          var datasetType = details.datasetType || 'vector';
          var shapeType = details.shapeType || 'Point';
          var fields = details.fields || [];
          var out_srid = srid;
          var srs_array = srs.split(':');
          out_srid = srs_array[1];
          var filter;
          if (!filter) {
            filter = {};
          }

          if (bbox) {
            //  var bboxExpr=`ST_Intersects(${shapeField},ST_MakeEnvelope(${bbox}))`;
            var bboxExpr = `ST_Intersects(${shapeField},ST_Transform(ST_MakeEnvelope(${bbox},4326),${srid}))`;
            if (!filter.expression)
              filter.expression = bboxExpr;
            else
              filter.expression = '(' + filter.expression + ') AND (' + bboxExpr + ')';
          }
          var geojson = await postgresWorkspace.getGeoJson({
            tableName: tableName,
            datasetType: datasetType,
            oidField: oidField,
            shapeField: shapeField,
            filter: filter,
            onlyIds: false,
            srid: srid,
            //out_srid: out_srid,
            out_srid: 4326,
            fields: details.fields
          });

          const tinycolor = require("tinycolor2");
          const mapnik = require('mapnik');//npm install mapnik@3.6.2
          mapnik.register_default_input_plugins();
          //const mapnikify = require('@mapbox/geojson-mapnikify');//npm install  @mapbox/geojson-mapnikify
          var isPng =function  (data) {
            return data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E &&
            data[3] === 0x47 && data[4] === 0x0D && data[5] === 0x0A &&
            data[6] === 0x1A && data[7] === 0x0A
          };
          var normalizeBbox =function  (bboxStr) {
            const bboxStrArr = bboxStr ? bboxStr.split(',') : []
            if (bboxStrArr.length !== 4) {
              let err = new Error('Invalid bbox: ' + util.inspect(bboxStrArr))
              err.code = 400
              return { err }
            }
            const coordinates = bboxStrArr.map(parseFloat)
            if (coordinates.some(isNaN)) {
              let err = new Error('Invalid bbox: ' + util.inspect(coordinates))
              err.code = 400
              return { err }
            }
          
            return { coordinates }
          };
          var callback=function (err, tile) {
            if (err || !tile || !isPng(tile)) {
              res.status(err.code || 500).json(err || new Error("Rendering didn't produce a proper tile"))
            } else {
              res.status(200)
                .set('Content-Length', tile.length)
                .set('Content-Type', 'image/png')
                .send(tile)
            }
          };
          var bbox_norm = normalizeBbox(query_bbox)
          // Convert GeoJSON to Mapnik XML
          var fillColor='#555555';
          var strokeColor='#555555';
          var strokeWidth=2;
          var stroke_linecap='round';
          var stroke_linejoin='round';
          var marker_width=5;
          var marker_height=5;
          if(details && details.renderer && (details.renderer.style || details.renderer.defaultStyle)){
            var style=(details.renderer.style || details.renderer.defaultStyle);
            if(style.fill){
              try{
                fillColor= tinycolor(style.fill.color).toString('hex6');
              }catch(ex){}
            }
            if(style.stroke && style.stroke.color)
            {
              try{
                strokeColor= tinycolor(style.stroke.color).toString('hex6');
              }catch(ex){}
            }
            if(style.stroke && style.stroke.width)
            {
              strokeWidth=style.stroke.width;
            }
            if(style.stroke && style.stroke.lineCap)
            {
              stroke_linecap=style.stroke.lineCap;
            }
            if(style.stroke && style.stroke.lineJoin)
            {
              stroke_linejoin=style.stroke.lineJoin;
            }
            if(style.circle && style.circle.radius){
              marker_width=marker_height=style.circle.radius;
            }
            
          }
          if(geojson && geojson.features){
            for(var i=0;i<geojson.features.length;i++){
              var f= geojson.features[i];
              //fill":"#555555","fill-opacity":0.6,"stroke":"#555555"
              if(typeof fillColor !=='undefined'){
                f.properties['fill']=fillColor;
              }
              if(typeof strokeColor !=='undefined'){
                f.properties['stroke']=strokeColor;
              }
              if(typeof strokeWidth !=='undefined'){
                f.properties['stroke-width']=strokeWidth;
              }

              f.properties['stroke-linecap']=stroke_linecap;
              f.properties['stroke-linejoin']=stroke_linejoin;
              f.properties['marker-width']=marker_width;
              f.properties['marker-height']=marker_height;
              //f.properties['placement']='point';
              //f.properties['marker-type']='ellipse';
              delete f.properties['marker-path'];
              
              
            }
          }
          var options={};
          var xml=`
          <Map srs="+init=epsg:3857">
              <Style name="geoms">
                  <Rule>
                      <Filter>[mapnik::geometry_type]=polygon</Filter>
                      <PolygonSymbolizer fill="[fill]" fill-opacity="0.6" />
                  </Rule>
                  <Rule>
                      <Filter>[mapnik::geometry_type]=linestring or [stroke]</Filter>
                      <LineSymbolizer stroke="[stroke]" stroke-width="[stroke-width]" stroke-opacity="1" />
                  </Rule>
              </Style>
              <Style name="points" filter-mode="first">
                  <Rule>
                      <Filter>[mapnik::geometry_type]=point</Filter>
                      <MarkersSymbolizer 
                        fill="[fill]" opacity=".8" width="[marker-width]" height="[marker-height]" 
                        stroke="[stroke]" stroke-width="[stroke-width]" stroke-opacity="0.8" placement="point" marker-type="ellipse"
                      />
                  </Rule>
              </Style>
              <Layer name="layer" srs="+init=epsg:4326">
                  <StyleName>geoms</StyleName>
                  <StyleName>points</StyleName>
                  <Datasource>
                      <Parameter name="type">geojson</Parameter>
                      <Parameter name="inline"><![CDATA[${JSON.stringify(geojson)}]]></Parameter>
                  </Datasource>
              </Layer>
          </Map>`
         // mapnikify(geojson, false, function (err, xml) {
         //   if (err) return callback(err)
            var map = new mapnik.Map(256, 256)

            // Create map from XML string
            map.fromString(xml, function (err, map) {
              if (err) {
               // console.log(xml);
                return callback(err)
              }
              // Configure and render
              map.resize(width, height)
              if (query_srs) map.srs = `+init=${query_srs.toLowerCase()}`
              map.extent = bbox_norm.coordinates;
             try{
            //  map.zoomAll();
             }catch(xx){

             }
              var canvas = new mapnik.Image(width, height)
              map.render(canvas, function (err, image) {
                if (err) return callback(err)
                if (options && options.palette) return image.encode('png8:z=1', {palette: options.palette}, callback)
                image.encode('png32:z=1', callback)
              })
            })
       //   });

        }
      } catch (ex) {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found.(' + ex.message + ')');
        return;
        // return await makeError('Not found','InvalidParameterValue','');
      }
    } else if (request == 'getfeatureinfo') {

      var getZoom = function (bounds, dimensions, minzoom, maxzoom) {
        minzoom = (minzoom === undefined) ? 0 : minzoom;
        maxzoom = (maxzoom === undefined) ? 21 : maxzoom;


        var bl = sphericalmercator.px([bounds[0], bounds[1]], maxzoom);
        var tr = sphericalmercator.px([bounds[2], bounds[3]], maxzoom);
        var width = tr[0] - bl[0];
        var height = bl[1] - tr[1];
        var ratios = [width / dimensions[0], height / dimensions[1]];
        var adjusted = Math.ceil(Math.min(
          maxzoom - (Math.log(ratios[0]) / Math.log(2)),
          maxzoom - (Math.log(ratios[1]) / Math.log(2))));
        //return Math.max(minzoom, Math.min(maxzoom, adjusted));
        return adjusted;

      }
      var checkExtent = function (minZoom, maxZoom, z, layer_bbox, bbox) {
        // if (z < minZoom || z > maxZoom) {
        //   return 'Scale';
        // }

        // minx: layer_bbox[0],
        // miny: layer_bbox[1],
        // maxx: layer_bbox[2],
        // maxy: layer_bbox[3],
        if (bbox[0] > layer_bbox[2] || bbox[2] < layer_bbox[0] ||
          bbox[1] > layer_bbox[3] || bbox[3] < layer_bbox[1]
        ) {
          return 'Extent';
        }

        return false;
      }
      var srs;
      var query_srs=req.query['srs'] || req.query['crs'];
      srs = req.query['srs'] || req.query['crs'] || 'epsg:3857';
      srs = srs.toLowerCase();
      var bbox = req.query['bbox'];
      var query_bbox=bbox;
      bbox = bbox.split(',').map(function (num) {
        return parseFloat(num);
      });
      var orig_bbox=bbox;
      if (['epsg:900913', 'epsg:3857'].indexOf(srs) > -1) {
        bbox = sphericalmercator.inverse([bbox[0], bbox[1]]).concat(sphericalmercator.inverse([bbox[2], bbox[3]]));
      }
      var x_i = parseInt(req.query.x || req.query.i);
      var y_j = parseInt(req.query.y || req.query.j);
      var feature_count=1;
      if(req.query.feature_count){
        try{
          feature_count= parseInt(req.query.feature_count);
        }catch(ex){}
      }
      var width = parseInt(req.query.width, 10);
      if (width < 1) {
        return await makeError('width must be greater then 0', 'InvalidParameterValue', 'WIDTH');
      }
      var height = parseInt(req.query.height, 10);
      if (height < 1) {
        return await makeError('height must be greater then 1', 'InvalidParameterValue', 'HEIGHT');
      }

      var zoom = getZoom(bbox, [width, height], minZoom, maxZoom);

      var ref_z = req.query.ref_z || 10;
      try {
        if (ref_z) {
          ref_z = parseInt(ref_z);
        }
      } catch (ex) {}
      ref_z = (maxZoom - 1 - (0));


      var extentError = checkExtent(minZoom, maxZoom, zoom, layer_bbox, bbox);
      if (extentError) {
        return await makeError(`${extentError} is out of range`, 'OutOfRange');
      }
      srs = srs.toLowerCase();
      if (['epsg:900913', 'epsg:3857' /*, 'epsg:4326'*/ ].indexOf(srs) === -1) {
        return await makeError(`invalid srs: ${srs}`, 'InvalidSRS');
      }

      //var out_srid = 3857; //req.query.srid;// reproject to srid
      var info_format = req.query.info_format || 'text/html';


      var tileSize = 256;
      var display = req.query.display;

      var xm= bbox[0] + x_i/width* ((bbox[2]-bbox[0]));
      var ym= bbox[3] - y_j/height* ((bbox[3]-bbox[1]));

     
      try {

        if(item.dataType=='raster'){
          
         // var xr= orig_bbox[0] + x_i/width* ((orig_bbox[2]-orig_bbox[0]));
         // var yr= orig_bbox[3] - y_j/height* ((orig_bbox[3]-orig_bbox[1]));
    
          //return await datasetController.rasterGetImage(req, res, item, details, bbox, zoom, ref_z, width, height, imageFormat, display);
          var result=await postgresWorkspace.getRasterValue({
            tableName:tableName,
            oidField:oidField,
            rasterField:rasterField,
            srid:srid,
            out_srid: 4326,
           // out_srid:out_srid,
            x:xm,
            y:ym,
            bands:details.bands
         });
         var html='';
         var html='<div class="identifyTask-results" style="overflow:auto;padding-bottom: 0.5em;">';
         html += '<table class="table table-striped table-condensed">';
         html += '<thead>';
        //  if(layer && layer.get('title')){
        //      html += '<tr><th colspan="2" style=" white-space: nowrap;overflow-x: hidden; max-width: 260px;text-overflow: ellipsis;">' + layer.get('title')+'</th></tr>';      
        //  }else{
          html += '<tr><th>Band</th><th>Value</th></tr>';
         //}

         html += '</thead>';
         html += '<tbody>';
         if(result){
         for (var key in result) {
             
          html += '<tr>';
          html += '<td>';
          html += key;
          html += '</td>';
          html += '<td>';
          html += result[key];
          html += '</td>';
          html += '</tr>';
         }
        }
         html += '</tbody>';
         html += '</table>';
         html+= '</div>';

         return res.set('Content-Type', info_format).send(html);
        }else if(item.dataType=='vector'){
          var tableName = details.datasetName || item.name;
          var oidField = details.oidField || 'gid';
          var shapeField = details.shapeField || 'geom';
          var datasetType = details.datasetType || 'vector';
          var shapeType = details.shapeType || 'Point';
          var fields = details.fields || [];
          var out_srid = srid;
          var srs_array = srs.split(':');
          out_srid = srs_array[1];
          var filter;
          if (!filter) {
            filter = {};
          }

         var searchR=(bbox[2]-bbox[0])/100.0;
          var sbbox= [xm-searchR,ym-searchR,xm+searchR,ym+searchR];
          var bboxExpr = `ST_Intersects(${shapeField},ST_Transform(ST_MakeEnvelope(${sbbox},4326),${srid}))`;
          if (!filter.expression)
              filter.expression = bboxExpr;
          else
           filter.expression = '(' + filter.expression + ') AND (' + bboxExpr + ')';
          
          var geojson = await postgresWorkspace.getGeoJson({
            tableName: tableName,
            datasetType: datasetType,
            oidField: oidField,
            shapeField: shapeField,
            filter: filter,
            onlyIds: false,
            srid: srid,
            //out_srid: out_srid,
            out_srid: 4326,
            fields: details.fields
          });
          fieldsDic = {};
          if (fields) {
            for (var i = 0; i < fields.length; i++) {
                var fld = fields[i];
                var fldName = fld.name;
                var title = fld.alias || fldName;
                fieldsDic[fldName] = title;
                if(fld.domain && fld.domain.type=='codedValues' && fld.domain.items ){
                    var codedValues={};
                    for(var j=0;j<fld.domain.items.length;j++){
                      codedValues[fld.domain.items[j].code]= fld.domain.items[j].value;
                    }
                    fld.codedValues=codedValues;
                }
            }
        }
          // var callback=function (err, tile) {
          //   if (err || !tile || !isPng(tile)) {
          //     res.status(err.code || 500).json(err || new Error("Rendering didn't produce a proper tile"))
          //   } else {
          //     res.status(200)
          //       .set('Content-Length', tile.length)
          //       .set('Content-Type', 'image/png')
          //       .send(tile)
          //   }
          // };
          var html = '<div class="identifyTask-results">';
       
          //html += "<img src='"+feature.get("img")+"'/>";
          html += '<table class="table table-striped table-condensed">';
          html += '<thead>';
          //if (layer && layer.get('title')) {
          //    html += '<tr><th colspan="2" style=" white-space: nowrap;overflow-x: hidden; max-width: 260px;text-overflow: ellipsis;">' + layer.get('title') + '</th></tr>';
          //} else {
              html += '<tr><th>Field</th><th>Value</th></tr>';
         // }
          html += '</thead>';
          html += '<tbody>';
          if(geojson && geojson.features){
            for(var i=0;i<geojson.features.length && i<feature_count;i++){
              var f= geojson.features[i];

              for (var key in f.properties) {
                if (key !== 'geometry') {
                    anyData = true;
                    html += '<tr>';
                    html += '<td>';
                    html += fieldsDic[key] || key;
                    html += '</td>';
                    html += '<td>';
                    html += f.properties[key];
                    html += '</td>';
                    html += '</tr>';
                }
            }
            }
          }
          html += '</tbody>';
          html += '</table>';
          html += '</div>';
          //var result= 'x_i:'+ x_i +', y_j:'+y_j+', xm:'+xm+', ym:'+ym;
          return res.set('Content-Type', info_format).send(html);

          
       

        }
      } catch (ex) {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found.(' + ex.message + ')');
        return;
        // return await makeError('Not found','InvalidParameterValue','');
      }
    } else {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not Supported');
      // return;
      return await makeError('missing required parameter: request', 'MissingParameterValue', 'request');
    }
  };
  /**
   * GET /ows/wfs/:id
   */
  module.geojsonWfsGet = async function (req, res, next) {
    var sendXml = async function (view, model) {
      var prom = new Promise((resolve, reject) => {
        res.render(view, model, function (err, xmlData) {
          if (err) {
            reject(err);
          } else {
            resolve(xmlData);
          }

        });
      });
      var xml = await prom;
      return res.set('Content-Type', 'application/xml').send(xml);
    };
    var makeError = async function (text, code, locator, version) {
      var params = {
        code: code,
        text: text,
        version: version || '2.0.0'
      };
      if (locator) {
        params.locator = locator;
      }
      var prom = new Promise((resolve, reject) => {
        res.render('ows/templates/ogc_error', params, function (err, xmlData) {
          if (err) {
            reject(err);
          } else {
            resolve(xmlData);
          }

        });
      });
      var xml = await prom;
      return res.set('Content-Type', 'application/xml').send(xml);
    };

    for (var key in req.query) {
      req.query[key.toLowerCase()] = req.query[key];
    }
    process.env.APP_HOST= process.env.APP_HOST ||  (req.protocol + '://' + req.get('host'));
    var item, err;
    var request = req.query.request || 'getcapabilities';
    var version = req.query.version || '2.0.0';
    request = request.toLowerCase();
    var outputFormat = req.query.outputformat || 'gml';
    var jsonOutput = false;
    if (outputFormat == 'json' || outputFormat == 'geojson' || outputFormat == 'application/json') {
      jsonOutput = true;
    }
    var itemId = req.params.id;

    if (!(req.params.id && req.params.id != '-1')) {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not found');
      // return;
      //return await makeError('Dataset not found','InvalidParameterValue','id');
      if (jsonOutput) {
        return res.status(404).json({
          code: 404,
          message: 'Dataset not found'
        });
      } else {
        return await makeError('Dataset not found', 'InvalidParameterValue', 'id');
      }
    }
    if (!(version == '1.1.0' || version == '2.0.0')) {
      if (jsonOutput) {
        return res.status(404).json({
          code: 404,
          message: `${version} is an invalid version number`
        });
      } else {
        return await makeError(`${version} is an invalid version number`, 'VersionNegotiationFailed', null, '2.0.0');
      }
    }
    [err, item] = await util.call(models.DataLayer.findByPk(itemId));


    if (!item) {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not found');
      // return;
      //return await makeError('Dataset not found','InvalidParameterValue','id');
      //return res.status(404).json({code:404,message:'Dataset not found'});
      if (jsonOutput) {
        return res.status(404).json({
          code: 404,
          message: 'Dataset not found'
        });
      } else {
        return await makeError('Dataset not found', 'InvalidParameterValue', 'id', version);
      }
    }
    if(!item.publish_ogc_service){
      if (jsonOutput) {
        return res.status(404).json({
          code: 404,
          message: 'Service is not available'
        });
      } else {
        return await makeError('Service is not available', 'InvalidParameterValue', 'id');
      }
    }


    if (!item.details) {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not found');
      // return;
      //return await makeError('Dataset error','InvalidParameterValue','id');
      //return res.status(404).json({code:404,message:'Dataset not found'});
      if (jsonOutput) {
        return res.status(404).json({
          code: 404,
          message: 'Dataset not found'
        });
      } else {
        return await makeError('Dataset not found', 'InvalidParameterValue', 'id', version);
      }
    }
    //todo: permission check

    //todo: permission check
    if (req.user && req.user.id !== item.ownerUser && !res.locals.identity.isAdministrator) {
      var AccessGranted = await adminController._CheckDataPermissionTypes(req.user, item.permissionTypes, 'Deny', ['Edit', 'View']);
      if (!AccessGranted) {
        // res.set('Content-Type', 'text/plain');
        // res.status(403).end('Access denied');
        // return;
        // return await makeError('Access denied','InvalidParameterValue','id');
        // return res.status(403).json({code:403,message:'Access denied'});
        if (jsonOutput) {
          return res.status(403).json({
            code: 403,
            message: 'Access denied'
          });
        } else {
          return await makeError('Access denied', 'InvalidParameterValue', 'id', version);
        }
      }
      var userHasViewPermission = false;
      var err;
      [err, item] = await util.call(models.DataLayer.findOne({
        where: {
          id: itemId
        },
        include: [{
          model: models.Permission,
          as: 'Permissions',
          include: [{
              model: models.User,
              as: 'assignedToUser',
              required: false,
              where: {
                id: req.user.id
              }
            },
            {
              model: models.Group,
              as: 'assignedToGroup',
              required: false,
              include: [{
                model: models.User,
                as: 'Users',
                required: true,
                where: {
                  id: req.user.id
                }
              }]
            }
          ]
        }]
      }));

      if (item) { // get permission
        var permissions = item.Permissions;
        if (permissions) {
          userHasViewPermission = permissions.some((p) => {
            if ((p.grantToType == 'user' && p.assignedToUser) || (p.grantToType == 'group' && p.assignedToGroup)) {
              return (p.permissionName == 'Edit' || p.permissionName == 'View');
            } else return false;
          });
        }

      }

      if (!userHasViewPermission) {
        // res.set('Content-Type', 'text/plain');
        // res.status(403).end('Access denied');
        // return;
        //return await makeError('Access denied','InvalidParameterValue','id');
        //return res.status(403).json({code:403,message:'Access denied'});
        if (jsonOutput) {
          return res.status(403).json({
            code: 403,
            message: 'Access denied'
          });
        } else {
          return await makeError('Access denied', 'InvalidParameterValue', 'id', version);
        }
      }


    }


    var details = {};
    try {
      details = JSON.parse(item.details);
    } catch (ex) {}
    if (!details) {
      details = {};
    }

    //todo: workspace selection
    var tableName = details.datasetName || item.name;
    var oidField = details.oidField || 'gid';
    var shapeField = details.shapeField || 'geom';
    var datasetType = details.datasetType || 'vector';
    var shapeType = details.shapeType || 'Point';
    var fields = details.fields || [];
    var fields2 = [];
    var shapeField2 = {
      name: shapeField
    };
    if (shapeType == 'Point') {
      shapeField2.type = 'gml:PointPropertyType';
    } else if (shapeType == 'LineString') {
      shapeField2.type = 'gml:LineStringPropertyType';
    } else if (shapeType == 'MultiLineString') {
      shapeField2.type = 'gml:MultiCurvePropertyType';
    } else if (shapeType == 'MultiPolygon') {
      shapeField2.type = 'gml:MultiSurfacePropertyType';
    } else if (shapeType == 'Polygon') {
      shapeField2.type = 'gml:SurfacePropertyType';
    }
    if (shapeField2.type) {
      shapeField2.isShape = true;
      fields2.push(shapeField2);

    }
    for (var i = 0; i < fields.length; i++) {
      var fld = fields[i];
      var fld2 = {};
      fld2.origName = fld.name;
      fld2.name = fld.name.replace(/\./g, '_').replace(/ /g, '_');
      if (fld.type == 'varchar') {
        fld2.type = 'xs:string';
        fld2.length = fld.length;
      } else if (fld.type == 'numeric' || fld.type == 'real' || fld.type == 'double precision') {
        fld2.type = 'xs:float';
      } else if (fld.type == 'smallint') {
        fld2.type = 'xs:short';
      } else if (fld.type == 'integer' || fld.type == 'bigint') {
        fld2.type = 'xs:int';
      } else if (fld.type == 'boolean') {
        fld2.type = 'xs:boolean';
      } else if (fld.type == 'date' || fld.type == 'timestamp with time zone' || fld.type == 'timestamp') {
        fld2.type = 'xs:dateTime';
      }

      if (fld2.type) {
        fields2.push(fld2);
      }
    }
    var srid = 3857;
    if (details.spatialReference) {
      srid = details.spatialReference.srid || 3857;
    }
    if (!filter) {
      filter = {};
    }


    var layer_bbox = [item.ext_west, item.ext_south, item.ext_east, item.ext_north];


    if (request == 'getcapabilities') {

      var bl = sphericalmercator.forward(layer_bbox.slice(0, 2));
      var mercminx = bl[0];
      var mercminy = bl[1];
      var tr = sphericalmercator.forward(layer_bbox.slice(2, 4));
      var mercmaxx = tr[0];
      var mercmaxy = tr[1];

      var model = {
        title: item.name || '',
        abstract: item.description || '',
        keywords: item.keywords ? (item.keywords.split(/[;؛]+/)) : [],
        //host: makeHost(layers.host),
        host: process.env.APP_HOST + req.path + '?',
        layers: [{
          id: item.id,
          name: item.id,
          title: item.name,
          srid: srid,
          bbox: layer_bbox,
          minx: layer_bbox[0],
          miny: layer_bbox[1],
          maxx: layer_bbox[2],
          maxy: layer_bbox[3],
          mercminx: mercminx,
          mercminy: mercminy,
          mercmaxx: mercmaxx,
          mercmaxy: mercmaxy
        }]
      };

      // res.render('ows/templates/wfs', model, function (err, xmlData) {
      //     return res.set('Content-Type', 'application/xml').send(xmlData);
      //   })
      return await sendXml('ows/templates/wfs', model);
    } else if (request == 'describefeaturetype') {

      var model = {
        id: item.id,
        oidField: oidField,
        fields: fields2
      }
      // res.render('ows/templates/wfs_describeFeatureType', model, function (err, xmlData) {
      //     return res.set('Content-Type', 'application/xml').send(xmlData);
      //   })
      return await sendXml('ows/templates/wfs_describeFeatureType', model);
    } else if (request == 'getfeature') {

      var srs;
      srs = req.query['srsname'] || req.query['crsname'] || 'epsg:3857';
      srs = srs.toLowerCase();
      var bbox = req.query['bbox'];
      if (bbox) {
        bbox = bbox.split(',').map(function (num) {
          return parseFloat(num);
        });

        if (['epsg:900913', 'epsg:3857'].indexOf(srs) > -1) {
          bbox = sphericalmercator.inverse([bbox[0], bbox[1]]).concat(sphericalmercator.inverse([bbox[2], bbox[3]]));
        }
      }
      // var extentError = checkExtent(minZoom,maxZoom, zoom,layer_bbox, bbox);
      // if (extentError) {
      //     return await makeError(`${extentError} is out of range`,'OutOfRange');
      // }
      srs = srs.toLowerCase();
      if (['epsg:900913', 'epsg:3857', 'epsg:4326'].indexOf(srs) === -1) {
        // return await makeError(`invalid srs: ${srs}`,'InvalidSRS');
        // return res.status(400).json({code:400,message:`invalid srs: ${srs}`});
        if (jsonOutput) {
          return res.status(400).json({
            code: 400,
            message: `invalid srs: ${srs}`
          });
        } else {
          return await makeError(`invalid srs: ${srs}`, 'InvalidSRS', null, version);
        }
      }
      var out_srid = srid;
      var srs_array = srs.split(':');
      out_srid = srs_array[1];

      var filter;
      if (!filter) {
        filter = {};
      }

      if (bbox) {
        //  var bboxExpr=`ST_Intersects(${shapeField},ST_MakeEnvelope(${bbox}))`;
        var bboxExpr = `ST_Intersects(${shapeField},ST_Transform(ST_MakeEnvelope(${bbox},4326),${srid}))`;
        if (!filter.expression)
          filter.expression = bboxExpr;
        else
          filter.expression = '(' + filter.expression + ') AND (' + bboxExpr + ')';
      }
      try {
        if (jsonOutput) {
          var result = await postgresWorkspace.getGeoJson({
            tableName: tableName,
            datasetType: datasetType,
            oidField: oidField,
            shapeField: shapeField,
            filter: filter,
            onlyIds: false,
            srid: srid,
            out_srid: out_srid,
            fields: details.fields
          });

          return res.json(result);
        } else {
          var result = await postgresWorkspace.getGeoJson({
            tableName: tableName,
            datasetType: datasetType,
            oidField: oidField,
            shapeField: shapeField,
            filter: filter,
            onlyIds: false,
            srid: srid,
            gmlOutput: true,
            out_srid: out_srid,
            fields: details.fields
          });

          var model = {
            host: process.env.APP_HOST + req.path + '?',
            id: item.id,
            oidField: oidField,
            fields: fields2,
            features: result.features || []
          }
          // res.render('ows/templates/wfs_getFeature', model, function (err, xmlData) {
          //     return res.set('Content-Type', 'application/xml').send(xmlData);
          //   })
          return await sendXml('ows/templates/wfs_getFeature', model);
        }
      } catch (ex) {
        // res.set('Content-Type', 'text/plain');
        // res.status(404).end('Not found.('+ ex.message +')' );
        // return;
        // return res.status(404).json({code:404,message:'Not found.('+ ex.message +')'});
        if (jsonOutput) {
          return res.status(404).json({
            code: 404,
            message: 'Not found.(' + ex.message + ')'
          });
        } else {
          return await makeError('Dataset not found', 'InvalidParameterValue', 'id', version);
        }

      }
    } else {
      // res.set('Content-Type', 'text/plain');
      // res.status(404).end('Not Supported');
      // return;
      //return await makeError('missing required parameter: request','MissingParameterValue','request');
      //res.status(400).json({code:400,message:"Unknown REQUEST field : " + request});
      if (jsonOutput) {
        res.status(400).json({
          code: 400,
          message: "Unknown REQUEST field : " + request
        });
      } else {
        return await makeError('missing required parameter: request', 'MissingParameterValue', 'request', version);
      }
    }
  };



  /**
     * GET /ows/csw/providers
     */
    module.cswProvidersGet = async function (req, res) {
      var pageTitle='CSW Providers';
      var viewPath='ows/cswProviders' ;
      var readOnly= req.path.toLowerCase().endsWith('/view');
      var format=undefined;

      if(req.query && 'format' in req.query){
          format=req.query.format;
      }
      var items;
      
      items = await models.CswProvider.findAll({});

      
     
     if(format=='json'){
      return res.json( {
          items: items
      });
     }else{
          res.render(viewPath, {
              title: pageTitle,
              items: items,
              readOnly:readOnly
          });
      }
  };
   /**
     * GET /ows/csw/provider/:id
     */
    module.cswProviderGet = async function (req, res) {
      var pageTitle='Csw Provider';
      var viewPath='ows/cswProvider' ;
      var parentPagePath='/ows/csw/providers/' ;
      var item,err;
      if (req.params.id && req.params.id != '-1') {
          [err, item] = await util.call(models.CswProvider.findOne({where: { id: req.params.id   }}));
          if (!item) {
              req.flash('error', {
                  msg: 'Not found!'
                 
              });
              return res.redirect(parentPagePath);
          }
      }
      if(item && item.thumbnail){
          try{
                const data = await sharp(item.thumbnail)
                         .resize(160,100,{
                           fit: sharp.fit.inside
                         })
                        .png()
                        .toBuffer();
            item.thumbnail   = 'data:image/png;base64,' + data.toString('base64');
          }catch(ex){}
      }
      res.render(viewPath , {
          title: pageTitle,
          item: item || {
              id: -1,
              enabled:true
          }
      });
  };
   /**
   * POST /ows/csw/provider/:id
   */
  module.cswProviderPost = async function (req, res) {
      var pageTitle='Csw Provider';
      var viewPath='ows/cswProvider' ;
      var pagePath='/ows/csw/provider/'
      var parentPagePath='/ows/csw/providers/' ;
      //req.assert('Name', 'name cannot be blank').notEmpty();
      req.assert('name', 'Name is required').notEmpty();
      req.sanitizeBody('name').escape();
      req.assert('url', 'Url is required').notEmpty();
    //  req.sanitizeBody('url').escape();

      //
      req.sanitizeBody('description').escape();
      //req.sanitizeBody('enabled').escape();
      req.body.enabled = ('enabled' in req.body) ? true : false;
   
      var itemId = req.params.id || -1;
      try {
          itemId = parseInt(itemId);
      } catch (ex) { }
      
      var errors = req.validationErrors();
      
      if (req.body.updatedAt) {
          try {
              req.body.updatedAt = new Date(parseInt(req.body.updatedAt));
          } catch (ex) {
          }
      }

      // var thumbnail;
      // try {
      //     if(req.file){
      //         thumbnail = await sharp(req.file.buffer,{failOnError:false})
      //         .rotate()// to apply exif rotation info
      //         // .resize(160,100,{
      //         //     fit: sharp.fit.inside
      //         // })
      //         .png()
      //         .toBuffer();
      //     }
     
      // } catch (err) {
     
      // }


      var model={
          id: itemId,
          name: req.body.name,
          description: req.body.description,
          url: req.body.url,
          enabled: req.body.enabled?true:false
      }
      if (errors) {
          
          req.flash('error', errors);
          res.render(viewPath, {
              title: pageTitle,
              item: model
          });
          return;
      }
      
     
      if (itemId == -1) {
          try {
              delete model.id;
              var newItem = await models.CswProvider.create(model);
             
              req.flash('notify', {
                  type:'success',
                  notify:true,
                  delay:3000,
                  msg: 'Saved successfully'
                 
              });
              try {
                
              } catch (ex) { }
             
              return res.redirect(parentPagePath);
          } catch (ex) {
              if (ex) {
                  req.flash('error', {
                      msg: 'Unknow error!'
                  });
                }
                  model.id=itemId;
                  res.render(viewPath, {
                      title: pageTitle,
                      item: model
                  });
              return;
          }
      } else {
          try {
              var item;
              item = await models.CswProvider.findOne({where: {id: itemId}});
              

              if (!item) {
                  req.flash('error', {
                     msg: 'Item not found!'
                  });
                  return res.redirect(pagePath + itemId);
              }
             
              if (req.body.updatedAt && item.updatedAt.getTime() !== req.body.updatedAt.getTime()) {
                  req.flash('error', {
                     msg: 'Information has been edited by another user. Please refresh the page and try again.'
                  });
                 
                  res.render(viewPath , {
                      title: pageTitle,
                      item: model
                  });
                      return;
              }
             
              for(key in model){
                  item.set(key,model[key]);
              }
             
              await item.save();

              req.flash('notify', {
                  type:'success',
                  msg: 'Saved successfully',
                  notify:true,
                  delay:3000
              });
              return res.redirect(parentPagePath);
          } catch (err) {
                  var detail='';
                  if(err.original && err.original.detail){
                      detail =err.original.detail;
                  }
                  req.flash('error', {
                       msg: 'Error in updating  infos!'+(detail?(': '+detail):'')
                  });
              

                  res.render(viewPath , {
                      title: pageTitle,
                      item: model
                  });
              return;
          }

      }
  };
 
/**
   * DELETE /ows/csw/provider/:id/delete
   */
  module.cswProviderDelete = async function (req, res, next) {
      var pagePath='/ows/csw/provider/'
      var parentPagePath='/ows/csw/providers/' ;
      var item;
      var itemId;
   
      if (req.params.id && req.params.id != '-1') {
          itemId= req.params.id;
          item = await models.CswProvider.findOne({where: {id: itemId}});

          if (!item) {
              req.flash('error', {
                msg: 'Item not found or can not be deleted!'
              });

              return res.redirect(pagePath + itemId);
          }
      }
      
      
      try {
          await item.destroy();
      } catch (ex) {
          req.flash('error', {
              msg: 'Failed to delete item!'
          });
          return res.redirect(pagePath + itemId);
      }

      req.flash('info', {
          msg: `Item has been permanently deleted.`
      });

      res.redirect(parentPagePath);

  };

    /**
     * GET /catalog
     * GET /ows/csw/catalog
     */
    module.catalogGet = async function (req, res) {
      var pageTitle='Catalog';
      var viewPath='ows/catalog' ;
      var providers;
try{
      providers = await models.CswProvider.findAll({where:{
        enabled:true
      }});
}catch(ex)  {}
      res.render(viewPath , {
          title: pageTitle,
          providers:providers ||[]
      });
  };
  return module;
}