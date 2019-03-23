'use strict';
var models = require('../../models/index');
const pg = require('pg');
const {
    Pool
} = require('pg');
const path = require('path');
const uuidv4 = require('uuid/v4');
const fs = require('fs');

class PostgresWorkspace {
    constructor(connectionSettings,readonlyConnectionString) {
        try{
            this._pools = {
                'default': new Pool(connectionSettings)
            }
        }catch(ex){}
        if(readonlyConnectionString){
            this.readonlyConnectionString=readonlyConnectionString;
            try{
                this._pools['readonly']= new Pool(readonlyConnectionString);
            }catch(ex){}
        }
        this.models = models;
        this.connectionSettings = connectionSettings;
    }
    getPool(key) {
        //todo: generate pools for each unique connection
        var pool=this._pools[key];
        if(!pool){
            pool= this._pools['default'];    
        }
        return pool;
    }
    async query(options, connection) {
        if (!connection)
            connection = 'default';
        var _pool = this.getPool(connection);

        if (_pool) {
            //  try {
            var result = await _pool.query(options);
            return result;
            //  } catch (e) {
            //      var er = e;
            //  }
        }

        return undefined;
    }
    async isTableExists(tableName, schema) {
        var result = false;
        if (!schema)
            schema = 'public'
        var queryTemplate = `SELECT EXISTS (
            SELECT 1
            FROM   information_schema.tables 
            WHERE  table_schema = '${schema}'
            AND    table_name = '${tableName}'
            ); `;
        try {
            var qResult = await this.query(queryTemplate);
            result = qResult.rows[0]['exists'];
        } catch (ex) {
            //throw ex;

        }

        return result;
    }
    async createVectorTable(layerInfo) {
        var errors = '';
        var datasetName = layerInfo.datasetName;
        if (!datasetName) {
            datasetName = 'vector_' + uuidv4().replace(new RegExp('-', 'g'), '');
            layerInfo.datasetName = datasetName;
        }
        if (!layerInfo.fields) {
            layerInfo.fields = [];
        }

        layerInfo.datasetType = 'vector';
        if (!layerInfo.shapeType)
            layerInfo.shapeType = 'Point';
        if (!layerInfo.shapeField)
            layerInfo.shapeField = 'geom';
        if (!layerInfo.oidField)
            layerInfo.oidField = 'gid';
        if (!layerInfo.spatialReference)
            layerInfo.spatialReference = {
                name: 'EPSG:3857',
                alias:'Google Maps Global Mercator',
                srid: 3857
            };

        var namesArray = [];
        if (layerInfo.fields) {
            for (var i = 0; i < layerInfo.fields.length; i++) {
                layerInfo.fields[i].name = layerInfo.fields[i].name.toLowerCase();
                namesArray.push(layerInfo.fields[i].name);
            }
        }
        var ensureNonDuplicatedName = function(fieldName, namesArray) {
            var result = fieldName;
            if (!namesArray)
                return result;
            var isDup = false;
            for (var i = 0; i < namesArray.length; i++) {
                if (result.toLowerCase() === namesArray[i].toLowerCase()) {
                    isDup = true;
                    break;
                }
            }
            if (isDup) {
                var number = Math.random(); // 0.9394456857981651
                result = result + number.toString().substring(2);
            }
            return result;
        };

        layerInfo.shapeField = ensureNonDuplicatedName(layerInfo.shapeField, namesArray);
        layerInfo.oidField = ensureNonDuplicatedName(layerInfo.oidField, namesArray);


        var tbl = layerInfo.datasetName;
        var fields = layerInfo.fields;
        var gid = layerInfo.oidField;
        var geom = layerInfo.shapeField;
        var geomType = layerInfo.shapeType;
        var srid = layerInfo.spatialReference.srid;
        var fieldsExpression = '';
        var sequenceName = tbl + '_seq';
        for (var i = 0; i < fields.length; i++) {
            var fld = fields[i];

            fieldsExpression += '"' + fld.name + '" ' + fld.type;
            if ((fld.type == 'varchar' || fld.type == 'numeric') && fld.length > 0) {
                if (fld.type == 'numeric' && typeof fld.scale !== 'undefined') {
                    fieldsExpression += '(' + fld.length + ',' + fld.scale + ')';
                } else {
                    fieldsExpression += '(' + fld.length + ')';
                }
            }
            if (fld.notNull) {
                fieldsExpression += ' NOT NULL ';
            }
            if (typeof fld.default != 'undefined') {
                if (fld.type == 'varchar' || fld.type == 'timestamp with time zone' || fld.type == 'date') {
                    if ((!fld.default && !fld.notNull) || fld.default) {
                        fieldsExpression += ' DEFAULT \'' + fld.default+'\'';
                    }

                } else {
                    fieldsExpression += ' DEFAULT ' + fld.default;
                }
            }
            fieldsExpression += ', ';

            delete fld._action;
        }
        var createTemplate = `
            DROP TABLE if exists public."${tbl}";
            
            drop sequence if exists "${sequenceName}";
            create sequence "${sequenceName}";

            CREATE TABLE public."${tbl}"
            (
            ${gid} integer NOT NULL DEFAULT nextval('${sequenceName}'::regclass),
            --${geom} geometry(${geomType},${srid}),
            ${geom} geometry(Geometry,${srid}),
            ${fieldsExpression}
            CONSTRAINT "${tbl}_pkey" PRIMARY KEY (${gid})
            -- CONSTRAINT enforce_geometry_type CHECK (geometrytype(geom) = 'MULTIPOLYGON'::text OR geometrytype(geom) = 'POLYGON'::text OR geom IS NULL)
            )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;
            
            --ALTER TABLE public."${tbl}"
            --    OWNER to postgres;
            -- Index: ${tbl}_${geom}_idx
            -- DROP INDEX public."${tbl}_${geom}_idx";
            
            CREATE INDEX "${tbl}_${geom}_idx"
                ON public."${tbl}" USING gist
                (${geom})
                TABLESPACE pg_default;`;

        var tableCreated = false;
        try {
            var qResult = await this.query(createTemplate);
            tableCreated = true;
        } catch (ex) {
            //throw ex;
            errors += 'Failed to Create Table ' + tbl + '. Error:' + ex.message;
        }

        return {
            status: tableCreated,
            details: layerInfo,
            message: errors
        }

    }
    async alterVectorTable(layerInfo) {
        var errors = '';
        var datasetName = layerInfo.datasetName;
        if (!datasetName) {
            return {
                status: false,
                details: layerInfo,
                message: 'datasetName is not defined'
            };
        }

        try {
            var exists = await this.isTableExists(datasetName, 'public');
            if (!exists) {
                return {
                    status: false,
                    details: layerInfo,
                    message: `${datasetName} does not exist`
                };
            }
        } catch (ex) {
            //throw ex;

        }
        if (!layerInfo.fields) {
            layerInfo.fields = [];
            return {
                status: true,
                details: layerInfo
            };
        }

        if (layerInfo.datasetType !== 'vector') {
            return {
                status: false,
                details: layerInfo,
                message: 'datasetType is not vector'
            };
        }
        if (!layerInfo.shapeField)
            layerInfo.shapeField = 'geom';
        if (!layerInfo.oidField)
            layerInfo.oidField = 'gid';
        // if(!layerInfo.spatialReference)
        //     layerInfo.spatialReference={name:'EPSG:3857',srid:3857}; 

        var namesArray = [];
        if (layerInfo.fields) {
            for (var i = 0; i < layerInfo.fields.length; i++) {
                layerInfo.fields[i].name = layerInfo.fields[i].name.toLowerCase();
                namesArray.push(layerInfo.fields[i].name);
            }
        }
        var fieldExists = function(fieldName, namesArray) {
            var isDup = false;
            if (!namesArray)
                return isDup;

            for (var i = 0; i < namesArray.length; i++) {
                if (fieldName.toLowerCase() === namesArray[i].toLowerCase()) {
                    isDup = true;
                    break;
                }
            }

            return isDup;
        };

        if (fieldExists(layerInfo.shapeField, namesArray)) {
            return {
                status: false,
                details: layerInfo,
                message: layerInfo.shapeField + ' field is reserved for shape field.'
            };
        }
        if (fieldExists(layerInfo.oidField, namesArray)) {
            return {
                status: false,
                details: layerInfo,
                message: layerInfo.oidField + ' field is reserved for oid field.'
            };
        }


        var tbl = layerInfo.datasetName;
        var fields = layerInfo.fields;
        // var gid = layerInfo.oidField;
        // var geom = layerInfo.shapeField;
        //  var geomType = layerInfo.shapeType;
        // var srid = layerInfo.spatialReference.srid;

        var fieldExpressions = [];
        var renameExpressions = [];
        var _fields = []
        for (var i = 0; i < fields.length; i++) {
            var fld = fields[i];
            var fieldExpression = '';
            var renameExpression = '';
            if (!fld._action) {
                _fields.push(fld);
                continue;
            }
            if (fld._action.isNew) {
                fieldExpression += 'ADD COLUMN "' + fld.name + '" ' + fld.type;
                if ((fld.type == 'varchar' || fld.type == 'numeric') && fld.length > 0) {
                    if (fld.type == 'numeric' && typeof fld.scale !== 'undefined') {
                        fieldExpression += '(' + fld.length + ',' + fld.scale + ')';
                    } else {
                        fieldExpression += '(' + fld.length + ')';
                    }
                }
                if (fld.notNull) {
                    fieldExpression += ' NOT NULL ';
                }
                if (typeof fld.default != 'undefined') {
                    if (fld.type == 'varchar' || fld.type == 'timestamp with time zone' || fld.type == 'date') {
                        if ((!fld.default && !fld.notNull) || fld.default) {
                            fieldExpression += ' DEFAULT \'' + fld.default+'\'';
                        }
                    } else {
                        fieldExpression += ' DEFAULT ' + fld.default;
                    }
                }

            } else if (fld._action.delete) {
                fieldExpression += 'DROP COLUMN IF EXISTS "' + fld.name + '" ';

            } else if (fld._action.modified && fld._action.origField) {
                var origFld = fld._action.origField;
                origFld.name = origFld.name.toLowerCase();
                var origName = origFld.name;
                if (origName !== fld.name) {
                    renameExpression = `ALTER TABLE public."${tbl}"   RENAME COLUMN "${origName}" TO "${fld.name}";`;
                }

                if (origFld.type !== fld.type || origFld.length !== fld.length) {
                    var newFieldType = fld.type;
                    if ((fld.type == 'varchar' || fld.type == 'numeric') && fld.length > 0) {
                        if (fld.type == 'numeric' && typeof fld.scale !== 'undefined') {
                            newFieldType += '(' + fld.length + ',' + fld.scale + ')';
                        } else {
                            newFieldType += '(' + fld.length + ')';
                        }

                    }
                    fieldExpression += 'ALTER COLUMN "' + origFld.name + '" SET DATA TYPE ' + newFieldType;
                    fieldExpression += ' USING ("' + origFld.name + '"::' + fld.type + ')';

                }
                if (origFld.default !== fld.default) {
                    if (fieldExpression) {
                        fieldExpression += ',';
                    }

                    if (typeof fld.default != 'undefined') {
                        if (fld.type == 'varchar' || fld.type == 'timestamp with time zone' || fld.type == 'date') {
                            fieldExpression += 'ALTER COLUMN "' + origFld.name + '" SET  DEFAULT \'' + fld.default+'\'';
                        } else {
                            fieldExpression += 'ALTER COLUMN "' + origFld.name + '" SET  DEFAULT ' + fld.default;
                        }
                    } else {
                        fieldExpression += 'ALTER COLUMN "' + origFld.name + '" DROP  DEFAULT ';
                    }
                }
                if (origFld.notNull !== fld.notNull) {
                    if (fieldExpression) {
                        fieldExpression += ',';
                    }
                    if (fld.notNull) {
                        fieldExpression += 'ALTER COLUMN "' + origFld.name + '" SET NOT NULL ';
                    } else {
                        fieldExpression += 'ALTER COLUMN "' + origFld.name + '" DROP NOT NULL ';
                    }
                }
            }

            if (!fld._action.delete) {
                _fields.push(fld);
            }

            if (fieldExpression)
                fieldExpressions.push(fieldExpression)
            if (renameExpression)
                renameExpressions.push(renameExpression);
            delete fld._action;
        }

        var fieldsExpression = fieldExpressions.join(',');
        var renamesExpression = renameExpressions.join();
        var alterTemplate = `ALTER TABLE public."${tbl}"  ${fieldsExpression} ;`;

        var isModified = false;
        var toAlter = (fieldsExpression || renamesExpression);
        if (fieldsExpression) {
            try {
                var qResult = await this.query(alterTemplate);
                isModified = true;
            } catch (ex) {
                //throw ex;
                errors += 'Failed to modify Table ' + tbl + '. Error:' + ex.message;
            }
        }
        if ((isModified || (!fieldsExpression)) && renamesExpression) {
            try {
                var qResult = await this.query(renamesExpression);
                isModified = true;
            } catch (ex) {
                //throw ex;
                errors += 'Failed to modify Table ' + tbl + '. Error:' + ex.message;
            }
        }
        if (isModified) {
            layerInfo.fields = _fields;
        }
        return {
            status: isModified || (!toAlter),
            details: layerInfo,
            message: errors
        }

    }
    async insertVector(layerInfo, geoJsonFeature) {
        var errors = '';
        var datasetName = layerInfo.datasetName;
        if (!datasetName) {
            return {
                status: false,
                details: layerInfo,
                geoJsonFeature: geoJsonFeature,
                message: 'datasetName is not defined'
            };
        }
        if (!geoJsonFeature) {
            return {
                status: false,
                details: layerInfo,
                geoJsonFeature: geoJsonFeature,
                message: 'geoJsonFeature is not defined'
            };
        }
        try {
            var exists = await this.isTableExists(datasetName, 'public');
            if (!exists) {
                return {
                    status: false,
                    details: layerInfo,
                    geoJsonFeature: geoJsonFeature,
                    message: `${datasetName} does not exist`
                };
            }
        } catch (ex) {
            //throw ex;

        }
        if (layerInfo.datasetType !== 'vector') {
            return {
                status: false,
                details: layerInfo,
                geoJsonFeature: geoJsonFeature,
                message: 'datasetType is not vector'
            };
        }
        if (!layerInfo.fields) {
            layerInfo.fields = [];

        }


        if (!layerInfo.shapeField)
            layerInfo.shapeField = 'geom';
        if (!layerInfo.oidField)
            layerInfo.oidField = 'gid';
        if (!layerInfo.spatialReference)
            layerInfo.spatialReference = {
                name: 'EPSG:3857',
                alias:'Google Maps Global Mercator',
                srid: 3857
            };

        var fieldNames = [];
        var fieldNames_safe = [];
        if (layerInfo.fields) {
            for (var i = 0; i < layerInfo.fields.length; i++) {
                layerInfo.fields[i].name = layerInfo.fields[i].name.toLowerCase();
                fieldNames.push(layerInfo.fields[i].name);
                fieldNames_safe.push('"' + layerInfo.fields[i].name + '"');
            }
        }

        var tbl = layerInfo.datasetName;
        var fields = layerInfo.fields;
        var gid = layerInfo.oidField;
        var geom = layerInfo.shapeField;
        //  var geomType = layerInfo.shapeType;
        var srid = layerInfo.spatialReference.srid;

        var i = 0;
        var n = 0;
        var bulkSize = 1000;
        var bulkRows = [];
        var status = false;
        if (true) {
            var f = {
                value: geoJsonFeature
            };
            var endLoop = true;

            if (f.value) {
                var geometry;
                if (f.value.geometry) {
                    geometry = `ST_Force_2D(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(f.value.geometry)}'), ${srid}))`;
                }
                var row = {};
                row[geom] = geometry;
                if (!f.value.properties)
                    f.value.properties = {};
                if (f.value.properties) {
                    for (var i = 0; i < fields.length; i++) {
                        var fld = fields[i];
                        var fldName = fld.name;
                        var fValue = f.value.properties[fldName];
                        if (typeof fValue === 'undefined') {
                            fValue = fld.default;
                        }
                        if (fld.type === 'date') {
                            try {
                                var d = fValue;
                                if (typeof d === 'string' || d instanceof String) {
                                    try {
                                        d = new Date(d);
                                    } catch (de) {}
                                }
                                if (d instanceof Date && !isNaN(d)) {
                                    var year = d.getFullYear();
                                    var month = d.getMonth() + 1;
                                    if (month < 10)
                                        month = '0' + month;
                                    var day = d.getDate();
                                    if (day < 10)
                                        day = '0' + day;
                                    var dateStr = year + '-' + month + '-' + day;
                                    row[fldName] = dateStr;
                                } else
                                    row[fldName] = null;
                            } catch (ex) {
                                row[fldName] = null;
                            }
                        } else {
                            row[fldName] = fValue;
                        }
                    }
                }
                bulkRows.push(row)
            }
            if (endLoop || bulkRows.length >= bulkSize) {


                const values = []
                const chunks = []
                bulkRows.forEach(row => {
                    const valueClause = [];
                    valueClause.push(row[geom]);
                    for (var i = 0; i < fieldNames.length; i++) {
                        var fldName = fieldNames[i];
                        values.push(row[fldName]);
                        valueClause.push('$' + values.length);
                    }
                    chunks.push('(' + valueClause.join(', ') + ')')
                })

                var fieldNamesExpr = fieldNames_safe.join(',');
                if (fieldNamesExpr)
                    fieldNamesExpr = ',' + fieldNamesExpr;

                var insertQuery = {
                    text: `INSERT INTO public.${tbl}(
                         ${geom}
                         ${fieldNamesExpr}
                        )
                        VALUES ` + chunks.join(', ') + `;`,
                    values: values,
                }
                try {
                    var result = await this.query(insertQuery);
                    if (result) {
                        n += bulkRows.length;
                    }
                } catch (ex) {
                    var s = 1;
                    errors += '<br/>' + ex.message;
                }

                bulkRows = [];
            }
            i++;
        } //while (!endLoop);
        if (n > 0) {
            status = true;
        }

        return {
            status: status,
            message: errors
        }

    }
    async updateVector(layerInfo, geoJsonFeature) {
        var errors = '';
        var datasetName = layerInfo.datasetName;
        if (!datasetName) {
            return {
                status: false,
                details: layerInfo,
                geoJsonFeature: geoJsonFeature,
                message: 'datasetName is not defined'
            };
        }
        if (!geoJsonFeature) {
            return {
                status: false,
                details: layerInfo,
                geoJsonFeature: geoJsonFeature,
                message: 'geoJsonFeature is not defined'
            };
        }
        try {
            var exists = await this.isTableExists(datasetName, 'public');
            if (!exists) {
                return {
                    status: false,
                    details: layerInfo,
                    geoJsonFeature: geoJsonFeature,
                    message: 'datasetName does not exist'
                };
            }
        } catch (ex) {
            //throw ex;

        }
        if (layerInfo.datasetType !== 'vector') {
            return {
                status: false,
                details: layerInfo,
                geoJsonFeature: geoJsonFeature,
                message: 'datasetType is not vector'
            };
        }
        if (!layerInfo.fields) {
            layerInfo.fields = [];

        }


        if (!layerInfo.shapeField)
            layerInfo.shapeField = 'geom';
        if (!layerInfo.oidField)
            layerInfo.oidField = 'gid';
        if (!layerInfo.spatialReference)
            layerInfo.spatialReference = {
                name: 'EPSG:3857',
                alias:'Google Maps Global Mercator',
                srid: 3857
            };

        var fieldNames = [];
        var fieldNames_safe = [];
        if (layerInfo.fields) {
            for (var i = 0; i < layerInfo.fields.length; i++) {
                layerInfo.fields[i].name = layerInfo.fields[i].name.toLowerCase();
                fieldNames.push(layerInfo.fields[i].name);
                fieldNames_safe.push('"' + layerInfo.fields[i].name + '"');
            }
        }
        var gid_value = -1;
        try {
            gid_value = parseInt(geoJsonFeature.id);
        } catch (ex) {}
        if (gid_value <= 0 || isNaN(gid_value)) {
            return {
                status: false,
                details: layerInfo,
                geoJsonFeature: geoJsonFeature,
                message: 'Invalid feature Id'
            };
        }
        var tbl = layerInfo.datasetName;
        var fields = layerInfo.fields;
        var gid = layerInfo.oidField;

        var geom = layerInfo.shapeField;
        //  var geomType = layerInfo.shapeType;
        var srid = layerInfo.spatialReference.srid;

        var i = 0;
        var n = 0;

        var status = false;
        if (true) {
            var f = {
                value: geoJsonFeature
            };


            if (f.value) {
                var geometry;
                if (f.value.geometry) {
                    geometry = `ST_Force_2D(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(f.value.geometry)}'), ${srid}))`;
                }
                var row = {};
                // row[geom]=geometry;
                if (!f.value.properties)
                    f.value.properties = {};
                if (f.value.properties) {
                    for (var i = 0; i < fields.length; i++) {
                        var fld = fields[i];
                        var fldName = fld.name;
                        if (!(fldName in f.value.properties)) {
                            continue;
                        }
                        var fValue = f.value.properties[fldName];
                        if (fld.type === 'timestamp with time zone') {
                            var test = 1;
                        }
                        if (fld.type === 'date') {
                            try {
                                var d = fValue;
                                if (typeof d === 'string' || d instanceof String) {
                                    try {
                                        d = new Date(d);
                                    } catch (de) {}
                                }
                                if (d instanceof Date && !isNaN(d)) {
                                    var year = d.getFullYear();
                                    var month = d.getMonth() + 1;
                                    if (month < 10)
                                        month = '0' + month;
                                    var day = d.getDate();
                                    if (day < 10)
                                        day = '0' + day;
                                    var dateStr = year + '-' + month + '-' + day;
                                    row[fldName] = dateStr;
                                } else
                                    row[fldName] = null;
                            } catch (ex) {
                                row[fldName] = null;
                            }
                        } else {
                            row[fldName] = fValue;
                        }
                    }
                }

            }


            const values = []
            const chunks = []

            const valueClause = [];
            // valueClause.push( row[geom]);
            for (var i = 0; i < fieldNames.length; i++) {
                var fldName = fieldNames[i];
                values.push(row[fldName]);
                valueClause.push('"' + fldName + '"=($' + values.length + ')');
            }


            var fieldNamesExpr = valueClause.join(',');
            if (fieldNamesExpr)
                fieldNamesExpr = ',' + fieldNamesExpr;

            var updateQuery = {
                text: `UPDATE  public.${tbl} SET
                         ${geom}= ${geometry}
                         ${fieldNamesExpr}
                        WHERE  ${gid}= ${gid_value} ;`,
                values: values,
            }
            try {
                var result = await this.query(updateQuery);
                if (result) {
                    n += result.rowCount;
                }
            } catch (ex) {
                var s = 1;
                errors += '<br/>' + ex.message;
            }



            i++;
        } //while (!endLoop);
        if (n > 0) {
            status = true;
        }

        return {
            status: status,
            message: errors
        }

    }
    async deleteRow(layerInfo, rowId) {
        var errors = '';
        var datasetName = layerInfo.datasetName;
        if (!datasetName) {
            return {
                status: false,
                details: layerInfo,
                message: 'datasetName is not defined'
            };
        }

        try {
            var exists = await this.isTableExists(datasetName, 'public');
            if (!exists) {
                return {
                    status: false,
                    details: layerInfo,
                    message: `${datasetName} does not exist`
                };
            }
        } catch (ex) {
            //throw ex;

        }




        if (!layerInfo.oidField)
            layerInfo.oidField = 'gid';


        var gid_value = -1;
        try {
            gid_value = parseInt(rowId);
        } catch (ex) {}
        if (gid_value <= 0 || isNaN(gid_value)) {
            return {
                status: false,
                details: layerInfo,
                message: 'Invalid row Id'
            };
        }
        var tbl = layerInfo.datasetName;

        var gid = layerInfo.oidField;
        var n = 0;

        var status = false;
        if (true) {
            var deleteQuery = {
                text: `DELETE  FROM public.${tbl}   WHERE  ${gid}= ${gid_value} ;`
            }
            try {
                var result = await this.query(deleteQuery);
                if (result) {
                    n += 1;
                }
            } catch (ex) {
                errors += '<br/>' + ex.message;
            }

        } //while (!endLoop);
        if (n > 0) {
            status = true;
        }

        return {
            status: status,
            message: errors
        }

    }
    async getGeoJson(options) {
        var tableName = options.tableName;
        var oidField = options.oidField || 'gid';
        var shapeField = options.shapeField || 'geom';
        var filter = options.filter || {};
        var onlyIds= options.onlyIds || false;
        var where= filter.expression;
        var srid= options.srid || 3857;
        var selectFrom;
        var whereStr = ''
        if (where) {
           var checkSQlExpression_res= this.checkSQlExpression(where);
           if(!checkSQlExpression_res.valid){
               throw new Error(checkSQlExpression_res.message);
           }
            whereStr = ` WHERE ${where}`;
        }
        selectFrom=`${tableName} as a ${whereStr}`;

       // selectFrom=`(SELECT a.* FROM ${selectFrom}) as j`;
        if(filter.spatialFilter){
            if( filter.spatialFilter.searchArea && filter.spatialFilter.searchArea.geometry && !filter.spatialFilter.byFeaturesOfLayerItem_details ){
                var searchAreaGeometry= filter.spatialFilter.searchArea.geometry;
                var searchAreaSrid=filter.spatialFilter.searchAreaSrid || 3857;
                var spatialOperator=filter.spatialFilter.spatialOperator || 'ST_Intersects';
                var bufferDistance =filter.spatialFilter.bufferDistnace;
              
                var searchGeom=`ST_SetSRID(ST_CollectionHomogenize(ST_GeomFromGeoJSON('${JSON.stringify(searchAreaGeometry)}')),${searchAreaSrid})`;
                if(typeof bufferDistance !=='undefined'){
                    searchGeom=`ST_Buffer( ST_Transform (${searchGeom}, 4326)::geography , ${bufferDistance})::geometry`;
                }
                var spatialWhere=`${spatialOperator}(${shapeField}, ST_Transform(${searchGeom},${srid}))`;
                if(spatialOperator=='ST_DWithin'){
                    var within_distance=filter.spatialFilter.within_distance;
                     spatialWhere=`${spatialOperator}(ST_Transform (${shapeField}, 4326)::geography,  ST_Transform (${searchGeom}, 4326)::geography,${within_distance})`;
                }
                //var spatialWhere=`${spatialOperator}(${shapeField}, ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(searchAreaGeometry)}'),${searchAreaSrid}),${srid}))`;
                //ST_CollectionHomogenize
                var orderByExpr='';
                var limitExpr='';
                var recordsLimit=filter.recordsLimit;
                
                if(spatialOperator=='ST_Nearest'){
                    spatialOperator='ST_DWithin';
                    var within_distance=filter.spatialFilter.nearest_searchDistance;
                     spatialWhere=`${spatialOperator}(ST_Transform (${shapeField}, 4326)::geography,  ST_Transform (${searchGeom}, 4326)::geography,${within_distance})`;
                     //note: there is no need to convert to geography
                     orderByExpr=` ORDER BY ST_Distance(${shapeField}, ST_Transform(${searchGeom},${srid})) `;
                     recordsLimit= filter.spatialFilter.nearest_maxNumber;
                     if(!recordsLimit){
                        recordsLimit=1;
                     }
                }
                if(recordsLimit && recordsLimit>0){
                    limitExpr=` LIMIT ${recordsLimit}`;
                }
                if(where){
                    var atWhere=where;
                    where= `(${where}) AND (${spatialWhere})`; 
                }else{
                    where= `(${spatialWhere})`; 
                }
            
                whereStr = '';
                if (where) {
                    whereStr = ` WHERE ${where}`;
                }
                //selectFrom=`${tableName}${whereStr} ${orderByExpr} ${limitExpr}`;
                selectFrom=`(SELECT * FROM ${tableName} ${whereStr} ${orderByExpr} ${limitExpr}) as j`;
            }else if (filter.spatialFilter.byFeaturesOfLayerItem_details){
                var details_r=filter.spatialFilter.byFeaturesOfLayerItem_details;
                var tableName_r = details_r.datasetName;
                var oidField_r = details_r.oidField || 'gid';
                var shapeField_r = details_r.shapeField || 'geom';
                var srid_r=3857;
                if(details_r.spatialReference){
                    srid_r=  details_r.spatialReference.srid || 3857;
                }
                var searchAreaSrid=srid_r;
                var spatialOperator=filter.spatialFilter.spatialOperator || 'ST_Intersects';
                var bufferDistance =filter.spatialFilter.bufferDistnace;
                var searchGeom=`B.${shapeField_r}`;
                if(typeof bufferDistance !=='undefined'){
                    searchGeom=`ST_Buffer( ST_Transform (ََ${searchGeom}, 4326)::geography , ${bufferDistance})::geometry`;
                }

                
               // var spatialWhere=`${spatialOperator}(A.${shapeField}, ST_Transform(${searchGeom},${srid}))`;
               
                var baseSelect=`(SELECT * FROM ${tableName} ${whereStr})`;

               // selectFrom=`(SELECT DISTINCT ON (A.${oidField}) A.* FROM  ${baseSelect} as A, ${tableName_r} as B WHERE ${spatialWhere}) as j `;

                var not=' NOT ';
                if(spatialOperator.toLowerCase().startsWith('not ')){
                    spatialOperator =spatialOperator.substring('not '.length);
                    not='';
                }
                var spatialCondition=`${spatialOperator}(A.${shapeField}, ST_Transform(${searchGeom},${srid}))`;
                if(spatialOperator=='ST_DWithin'){
                    var within_distance=filter.spatialFilter.within_distance;
                    spatialCondition=`${spatialOperator}(ST_Transform (A.${shapeField}, 4326)::geography,  ST_Transform (${searchGeom}, 4326)::geography,${within_distance})`;
                }
                var orderByExpr='';
                var limitExpr='';
                var recordsLimit=filter.recordsLimit;
                
                
                if(spatialOperator=='ST_Nearest'){
                    spatialOperator='ST_DWithin';
                    var within_distance=filter.spatialFilter.nearest_searchDistance;
                    spatialCondition=`${spatialOperator}(ST_Transform (A.${shapeField}, 4326)::geography,  ST_Transform (${searchGeom}, 4326)::geography,${within_distance})`;
                     //note: there is no need to convert to geography
                    // orderByExpr=` ORDER BY A.${oidField}, ST_Distance(A.${shapeField}, ST_Transform(${searchGeom},${srid})) `;
                     var distanceField=`ST_Distance(A.${shapeField}, ST_Transform(${searchGeom},${srid}))`;
                     orderByExpr=` ORDER BY AtoB_distance  `;
                     recordsLimit= filter.spatialFilter.nearest_maxNumber;
                     if(!recordsLimit){
                        recordsLimit=1;
                     }
                     if(recordsLimit && recordsLimit>0){
                        limitExpr=` LIMIT ${recordsLimit}`;
                    }

                    //  selectFrom=`(SELECT * from
                    //  (SELECT DISTINCT ON (A.${oidField}) A.*, ${distanceField} as AtoB_distance 
                    // FROM  ${baseSelect} as A
                    // LEFT JOIN ${tableName_r} as B
                    // ON ${spatialCondition}
                    //  WHERE (${not}  B.${oidField_r} IS NULL)
                    //  ) as j0
                    //  ${orderByExpr} ${limitExpr}) as j `;
                    selectFrom=`(SELECT * from
                        (SELECT DISTINCT ON (${oidField}) * from
                            (SELECT A.*, ${distanceField} as AtoB_distance 
                                FROM  ${baseSelect} as A
                                LEFT JOIN ${tableName_r} as B
                                ON ${spatialCondition}
                                    WHERE (${not}  B.${oidField_r} IS NULL)
                                    ${orderByExpr}
                            ) as j0
                        ) as j00 
                        ${orderByExpr} ${limitExpr}) as j 
                         
                         `;
                }else
                {
                     if(recordsLimit && recordsLimit>0){
                        limitExpr=` LIMIT ${recordsLimit}`;
                    }
                selectFrom=`(SELECT DISTINCT ON (A.${oidField}) A.* 
                    FROM  ${baseSelect} as A
                    LEFT JOIN ${tableName_r} as B
                    ON ${spatialCondition}
                     WHERE (${not}  B.${oidField_r} IS NULL)
                     ${orderByExpr} ${limitExpr}
                     ) as j `;
                }
            }
        }
     

        var queryText=undefined;
        if(onlyIds){
            queryText = `SELECT ${oidField} as id
                FROM ${selectFrom}; `

        }else{
            queryText = `SELECT jsonb_build_object(
                'type',     'FeatureCollection',
                'features', jsonb_agg(feature)
            )
            FROM (
                SELECT jsonb_build_object(
                'type',       'Feature',
                'id',         ${oidField},
                'geometry',   ST_AsGeoJSON(${shapeField})::jsonb,
                'properties', to_jsonb(inputs) - '${oidField}' - '${shapeField}'
                ) AS feature
                FROM (
                SELECT * FROM ${selectFrom} 
                LIMIT 50000
                ) inputs
            ) features;`
            }
        var results = await this.query({
            text: queryText
        },'readonly');
        if (results) {
            if(onlyIds){
                return results.rows;
            }else{
                return results.rows[0]['jsonb_build_object'];
            }
        } else
            return null;

    }
    async getVectorExtentJson(options) {
        var tableName = options.tableName;
        var shapeField = options.shapeField || 'geom';
        var where = options.where || '';
        var whereStr = ''
        if (where) {
            var checkSQlExpression_res= this.checkSQlExpression(where);
           if(!checkSQlExpression_res.valid){
               throw new Error(checkSQlExpression_res.message);
           }
            whereStr = ` WHERE ${where}`;
        }

        var queryText = `SELECT ST_AsGeoJSON(ST_Extent(${shapeField})) as bextent FROM ${tableName} ${whereStr};`
        var results = await this.query({
            text: queryText
        });
        if (results) {
            try {
                return JSON.parse(results.rows[0]['bextent']);
            } catch (ex) {

                return null;
            }
        } else
            return null;

    }
    async importZipfile(zipfilePath, DataLayer, ownerUserId, options) {
        var results = [];
        var unzip = require('unzip');
        var fs = require('fs');

        var rootPath = __basedir;
        var importRasters = options.importRasters ? true : false;

        var ext = path.extname(zipfilePath).toLowerCase();
        var filename = path.basename(zipfilePath);
        var filebaseName = path.basename(zipfilePath, ext);

        var filePathFolder = path.dirname(zipfilePath);
        var extractToDirectory = path.join(filePathFolder, filebaseName + '_files');

        var walkSync = function(dir, filelist) {

            var files = fs.readdirSync(dir);
            filelist = filelist || [];
            files.forEach(function(file) {
                if (fs.statSync(path.join(dir, file)).isDirectory()) {
                    filelist = walkSync(path.join(dir, file), filelist);
                } else {
                    var ext = path.extname(file).toLowerCase();
                    if (ext === '.shp') {
                        filelist.push(path.join(dir, file));
                    } else if (ext === '.tif' || ext === '.tiff' || ext === '.geotif' || ext === '.geotiff' || ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
                        if (importRasters) {
                            filelist.push(path.join(dir, file));
                        }
                    }
                }
            });
            return filelist;
        };

        var promise = new Promise(function(resolve, reject) {

            fs.createReadStream(zipfilePath)
                .pipe(unzip.Extract({
                    path: extractToDirectory
                })).on('close', function() {
                    //To do after unzip
                    var filelist = walkSync(extractToDirectory, filelist);
                    resolve(filelist);

                });
        });

        // promise.then(function(){
        //     var filelist= walkSync(extractToDirectory,filelist);
        //     console.log(filelist);
        // });

        var fileList = await promise;



        await Promise.all(fileList.map(async (file) => {
            try {
                var ext = path.extname(file).toLowerCase();
                if (ext === '.shp') {
                    try{
                        var importResult = await this.importShapefile(file, DataLayer, ownerUserId, options);
                        if (importResult && importResult.status) {
                            results.push(importResult);
                        }
                    }catch(ex){
                        console.log(ex);
                    }
                } else if (ext === '.tif' || ext === '.tiff' || ext === '.geotif' || ext === '.geotiff' || ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
                    try{
                        var importResult = await this.importRaster(file, DataLayer, ownerUserId, options);
                        if (importResult && importResult.status) {
                            results.push(importResult);
                        }
                    }catch(ex){
                        console.log(ex);
                    }
                }

            } catch (ex) {

            }
        }));
        // console.log('importZipfile done');

        return results;
    }

    async importShapefile(shpfilePath, DataLayer, ownerUserId, options) {
        options = options || {};
        var shapefile = require("shapefile");
        var sharp = require('sharp');
        var srs = require('srs');
        var fs = require('fs');
        var status = false;
        // var rootPath= path.resolve(path.join(__dirname, '../..'));

        var ext = path.extname(shpfilePath).toLowerCase();
        var filename = path.basename(shpfilePath);
        var filebaseName = path.basename(shpfilePath, ext);


        var filePathFolder = path.dirname(shpfilePath);
        var projFile = path.join(filePathFolder, filebaseName + '.prj');
        var thumbnailFile_png = path.join(filePathFolder, filebaseName + '.png');
        var thumbnailFile_jpg = path.join(filePathFolder, filebaseName + '.jpg');
        var dbfFilePath = path.join(filePathFolder, filebaseName + '.dbf');
        var encodingFilePath = path.join(filePathFolder, filebaseName + '.cpg');
        var encoding = options.defaultEncoding || process.env.IMPORTED_SHAPEFILE_DEFAULT_ENCODING || 'windows-1252';
        //encoding ='windows-1256';
        //encoding='utf8';
        if (fs.existsSync(encodingFilePath)) {
            try {
                var codePage = fs.readFileSync(encodingFilePath).toString().trim();
                if (codePage)
                    encoding = codePage;
            } catch (ex) {

            }
        }

        var number = Math.random().toString().substring(2);
        // var uniqueTableName=filebaseName.replace(new RegExp('-', 'g'), '_'); 
        //     uniqueTableName=uniqueTableName.replace(/\./g, '_');
        //     uniqueTableName=uniqueTableName.replace(/ /g, '_');
        //uniqueTableName= 'shp_'+uniqueTableName+'_'+number;
        //var sequenceName= 'seq_'+number;


        var uniqueTableName = 'shp_' + uuidv4().replace(new RegExp('-', 'g'), '');
        var sequenceName = uniqueTableName + '_seq';

        var errors = '';
        var layerInfo = {
            shapefileName: filename,
            //datasetName: 'shp_' + uuidv4().replace(new RegExp('-', 'g'), ''),
            datasetName: uniqueTableName,
            workspace: 'postgres',
            datasetType: 'vector',
            shapeType: 'MultiPolygon',
            schema: undefined,
            styles: [],
            defaultField: '',
            shapeField: 'geom',
            oidField: 'gid',
            spatialReference: {
                srid: 0
            }
        };
        if (options.defaultProjection) {
            // layerInfo.spatialReference.name= options.defaultEncoding;
        }
        if (fs.existsSync(projFile)) {
            try {
                var esri_srs = fs.readFileSync(projFile).toString();
                var esri_result = srs.parse('ESRI::' + esri_srs);
                layerInfo.spatialReference.alias = esri_result.name;
                if (esri_result.auth) {
                    layerInfo.spatialReference.name = esri_result.auth + ':' + esri_result.srid;
                    layerInfo.spatialReference.srid = esri_result.srid;
                } else {
                    layerInfo.spatialReference.name = esri_result.name;
                }
                layerInfo.spatialReference.proj4 = esri_result.proj4;
                layerInfo.spatialReference.wkt = esri_result.pretty_wkt;
            } catch (ex) {
                errors += 'Failed to process ' + filebaseName + '.prj' + ' file';
                console.log(ex);
            }
        } else if (options.defaultProjection) {
            try {
                var esri_srs = options.defaultProjection;
                var esri_result = srs.parse('ESRI::' + esri_srs);
                layerInfo.spatialReference.alias = esri_result.name;
                if (esri_result.auth) {
                    layerInfo.spatialReference.name = esri_result.auth + ':' + esri_result.srid;
                    layerInfo.spatialReference.srid = esri_result.srid;
                } else {
                    layerInfo.spatialReference.name = esri_result.name;
                }
                layerInfo.spatialReference.proj4 = esri_result.proj4;
                layerInfo.spatialReference.wkt = esri_result.pretty_wkt;
            } catch (ex) {
                // errors += 'Failed to process ' + filebaseName + '.prj' + ' file';
                // console.log(ex);
            }
        }
        try {
            var geoJsonSource = await shapefile.open(shpfilePath, dbfFilePath, {
                encoding: encoding
            });
            var fields = [];
            var fieldNames = [];
            var fieldNames_safe=[];
            if (geoJsonSource._dbf && geoJsonSource._dbf._fields) {
                for (var i = 0; i < geoJsonSource._dbf._fields.length; i++) {
                    var shpField = geoJsonSource._dbf._fields[i];
                    var fld = {
                        name: shpField.name.toLowerCase(),
                        origName: shpField.name,
                        alias: '',
                        type: 'varchar',
                        length: shpField.length,
                        default: undefined,
                        notNull: false
                    };
                    switch (shpField.type) {
                        case 'M':
                            fld.type = 'numeric';
                            fld.default = 0;
                            break;

                        case 'B':
                            fld.type = 'numeric';
                            fld.default = 0;
                            break;
                        case 'N':
                            // fld.type='integer';
                            fld.type = 'numeric';
                            if (fld.length <= 4)
                                fld.type = 'smallint'
                            fld.default = 0;
                            break;
                        case 'C':
                            fld.type = 'varchar';
                            if (fld.length > 254)
                                fld.length = 254;
                            fld.default = '';
                            break;
                        case 'F':
                            fld.type = 'numeric';
                            fld.default = 0;
                            break;
                        case 'D':
                            fld.type = 'date';
                            //fld.type='varchar';
                            //fld.length=0;
                            break;
                        case 'L':
                            fld.type = 'boolean';
                            fld.default = false;
                            break;
                    }
                    fields.push(fld);
                    fieldNames.push(fld.name);
                    fieldNames_safe.push('"' + fld.name + '"');

                }
            }
            var ensureNonDuplicatedName = function(fieldName, namesArray) {
                var result = fieldName;
                if (!namesArray)
                    return result;
                var isDup = false;
                for (var i = 0; i < namesArray.length; i++) {
                    if (result.toLowerCase() === namesArray[i].toLowerCase()) {
                        isDup = true;
                        break;
                    }
                }
                if (isDup) {
                    var number = Math.random(); // 0.9394456857981651
                    result = result + number.toString().substring(2);
                }
                return result;
            };

            layerInfo.shapeField = ensureNonDuplicatedName(layerInfo.shapeField, fieldNames);
            layerInfo.oidField = ensureNonDuplicatedName(layerInfo.oidField, fieldNames);


            switch (geoJsonSource._shp._type) {
                case 1:
                case 11:
                case 21:
                    layerInfo.shapeType = 'Point';
                    break;

                case 5:
                case 15:
                case 25:
                    layerInfo.shapeType = 'MultiPolygon';
                    break;
                case 3:
                case 13:
                case 23:
                    layerInfo.shapeType = 'MultiLineString';
                    break;
                case 8:
                case 18:
                case 28:
                    layerInfo.shapeType = 'MultiPoint';
                    break;
            }
            layerInfo.fields = fields;

            var tbl = layerInfo.datasetName;
            var gid = layerInfo.oidField;
            var geom = layerInfo.shapeField;
            var geomType = layerInfo.shapeType;
            var srid = layerInfo.spatialReference.srid;

            var fieldsExpression = '';
            for (var i = 0; i < fields.length; i++) {
                var fld = fields[i];

                fieldsExpression += '"'+fld.name + '"'+' ' + fld.type;
                // if(fld.type=='varchar' && fld.length >0){
                //     fieldsExpression +='('+ fld.length+')';  
                // }
                // if(!fld.notNull){
                //     fieldsExpression +=' NOT NULL ';  
                // }
                if ((fld.type == 'varchar' || fld.type == 'numeric') && fld.length > 0) {
                    if (fld.type == 'numeric' && typeof fld.scale !== 'undefined') {
                        fieldsExpression += '(' + fld.length + ',' + fld.scale + ')';
                    } else {
                        fieldsExpression += '(' + fld.length + ')';
                    }
                }
                if (fld.notNull) {
                    fieldsExpression += ' NOT NULL ';
                }
                if (typeof fld.default != 'undefined') {
                    if (fld.type == 'varchar' || fld.type == 'timestamp with time zone' || fld.type == 'date') {
                        if ((!fld.default && !fld.notNull) || fld.default) {
                            fieldsExpression += ' DEFAULT \'' + fld.default+'\'';
                        }
                    } else {
                        fieldsExpression += ' DEFAULT ' + fld.default;
                    }
                }
                fieldsExpression += ', ';
            }
            var createTemplate = `
            DROP TABLE if exists public."${tbl}";
            
            drop sequence if exists "${sequenceName}";
            create sequence "${sequenceName}";

            CREATE TABLE public."${tbl}"
            (
            ${gid} integer NOT NULL DEFAULT nextval('${sequenceName}'::regclass),
            --${geom} geometry(${geomType},${srid}),
            ${geom} geometry(Geometry,${srid}),
            ${fieldsExpression}
            CONSTRAINT "${tbl}_pkey" PRIMARY KEY (${gid})
            -- CONSTRAINT enforce_geometry_type CHECK (geometrytype(geom) = 'MULTIPOLYGON'::text OR geometrytype(geom) = 'POLYGON'::text OR geom IS NULL)
            )
            WITH (
                OIDS = FALSE
            )
            TABLESPACE pg_default;
            
            --ALTER TABLE public."${tbl}"
            --    OWNER to postgres;
            -- Index: ${tbl}_${geom}_idx
            -- DROP INDEX public."${tbl}_${geom}_idx";
            
            CREATE INDEX "${tbl}_${geom}_idx"
                ON public."${tbl}" USING gist
                (${geom})
                TABLESPACE pg_default;`;

            var tableCreated = false;
            try {
                var qResult = await this.query(createTemplate);
                tableCreated = true;
            } catch (ex) {
                //throw ex;
                errors += 'Failed to Create Table ' + tbl + '. Error:' + ex.message;
            }

            var i = 0;
            var n = 0;
            var bulkSize = 1000;
            var bulkRows = [];
            if (tableCreated) {
                do {
                    var f = await geoJsonSource.read()
                    var endLoop = (f && (!f.done)) ? false : true;

                    if (f.value) {
                        var geometry;
                        if (f.value.geometry) {
                            geometry = `ST_Force_2D(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(f.value.geometry)}'), ${srid}))`;
                        }
                        var row = {}
                        row[geom] = geometry;
                        if (f.value.properties) {
                            for (var i = 0; i < fields.length; i++) {
                                var fld = fields[i];
                                var fldName = fld.name;
                                var origFldName = fld.origName;
                                if (fld.type === 'date') {
                                    try {
                                        var d = f.value.properties[origFldName];
                                        if (typeof d === 'string' || d instanceof String) {
                                            try {
                                                d = new Date(d);
                                            } catch (de) {}
                                        }
                                        if (d instanceof Date && !isNaN(d)) {
                                            var year = d.getFullYear();
                                            var month = d.getMonth() + 1;
                                            if (month < 10)
                                                month = '0' + month;
                                            var day = d.getDate();
                                            if (day < 10)
                                                day = '0' + day;
                                            var dateStr = year + '-' + month + '-' + day;
                                            row[fldName] = dateStr;
                                        } else
                                            row[fldName] = null;
                                    } catch (ex) {
                                        row[fldName] = null;
                                    }
                                } else {
                                    row[fldName] = f.value.properties[origFldName];
                                }
                            }
                        }
                        bulkRows.push(row)
                    }
                    if (endLoop || bulkRows.length >= bulkSize) {


                        const values = []
                        const chunks = []
                        bulkRows.forEach(row => {
                            const valueClause = [];
                            valueClause.push(row[geom]);
                            for (var i = 0; i < fieldNames.length; i++) {
                                var fldName = fieldNames[i];
                                values.push(row[fldName]);
                                valueClause.push('$' + values.length);
                            }
                            //   Object.keys(row).forEach(p => {
                            //     if(p==geom){
                            //         valueClause.push( row[geom]);
                            //       }else{
                            //         values.push(row[p]);
                            //         valueClause.push('$' + values.length);

                            //       }
                            //   })

                            chunks.push('(' + valueClause.join(', ') + ')')
                        })

                        var fieldNamesExpr = fieldNames_safe.join(',');
                        if (fieldNamesExpr)
                            fieldNamesExpr = ',' + fieldNamesExpr;

                        var insertQuery = {
                            text: `INSERT INTO public.${tbl}(
                             ${geom}
                             ${fieldNamesExpr}
                            )
                            VALUES ` + chunks.join(', ') + `;`,
                            values: values,
                        }
                        try {
                            var result = await this.query(insertQuery);
                            if (result) {
                                n += bulkRows.length;
                            }
                        } catch (ex) {
                            var s = 1;
                            errors += '<br/>' + ex.message;
                        }

                        bulkRows = [];
                    }
                    i++;
                } while (!endLoop);
                if (n > 0) {
                    status = true;
                }
            }
        } catch (ex) {
            var rr = '';
        }

        errors = (errors ? ('<br /> <span style="color:red;">' + errors + '</span>') : '');
        if (status) {
            var thumbnailFile;
            if (fs.existsSync(thumbnailFile_png)) {
                thumbnailFile = thumbnailFile_png;

            } else if (fs.existsSync(thumbnailFile_jpg)) {
                thumbnailFile = thumbnailFile_jpg;
            }
            var thumbnail = null;
            if (thumbnailFile) {
                thumbnail = await sharp(thumbnailFile)
                    .resize(160,100,{
                        fit: sharp.fit.inside
                      })
                    .png()
                    .toBuffer();
            }

            var history= history=[];
            history.push({
                 task:'importFromShapefile',
                 settings:{
                    shapefileName:layerInfo.shapefileName,
                 }
             });
             layerInfo.history=history;

            var newLayer = await DataLayer.create({
                name: layerInfo.shapefileName,
                dataType: 'vector',
                description: 'Imported from ' + filebaseName + errors,
                ownerUser: ownerUserId,
                thumbnail: thumbnail,
                details: JSON.stringify(layerInfo)
            });
        }
        return {
            status: status,
            fileName: filename,
            message: errors
        }
    }
    async importRaster(filePath, DataLayer, ownerUserId, options) {
        options = options || {};
        var gdal = require('gdal');
        var srs = require('srs');
        var sharp = require('sharp');
        const util = require('util');
        const execFile = util.promisify(require('child_process').execFile);
        const exec = util.promisify(require('child_process').exec);
        const fs= require('fs');
        const fs_writeFile = util.promisify(fs.writeFile)


        var status = true;
        // var rootPath= path.resolve(path.join(__dirname, '../..'));

        var ext = path.extname(filePath).toLowerCase();
        var filename = path.basename(filePath);
        var filebaseName = path.basename(filePath, ext);


        var filePathFolder = path.dirname(filePath);

        
        var thumbnailFile_png = path.join(filePathFolder, filebaseName + '.png');
        if (thumbnailFile_png.toLowerCase() == filePath.toLowerCase()) {
            thumbnailFile_png = '';
        }
        var thumbnailFile_jpg = path.join(filePathFolder, filebaseName + '.jpg');
        if (thumbnailFile_jpg.toLowerCase() == filePath.toLowerCase()) {
            thumbnailFile_jpg = '';
        }
        var number = Math.random().toString().substring(2);


        var uniqueTableName = 'rst_' + uuidv4().replace(new RegExp('-', 'g'), '');



        var errors = '';
        var layerInfo = {
            fileName: filename,
            datasetName: uniqueTableName,
            workspace: 'postgres',
            datasetType: 'raster',
            rasterType:'',
            fileType: ext,
            schema: undefined,
            rasterField: 'rast',
            oidField: 'rid',
            spatialReference: {
                name: 'EPSG:3857',
                alias:'Google Maps Global Mercator',
                srid: 3857
            }
        };
        try {
            var dataset = gdal.open(filePath);

            layerInfo.numberOfBands = dataset.bands.count();
            layerInfo.bands = [];
            dataset.bands.forEach(function(band, i) {
                //getStatistics ( allow_approximation  force ) 
                var allow_approximation = false;
                var force = true;
                var statistics = band.getStatistics(allow_approximation, force);
                 var bandName=band.colorInterpretation;
                if(bandName=='Gray'){
                    bandName='Value';
                }
                layerInfo.bands.push({
                    id: band.id,
                    name:bandName,
                    dataType: band.dataType,
                    description: band.description,
                    minimum: band.minimum,
                    maximum: band.maximum,
                    noDataValue: band.noDataValue,
                    unitType: band.unitType,
                    size: band.size,
                    blockSize: band.blockSize,
                    scale: band.scale,
                    statistics: statistics

                })
            });
            layerInfo.rasterWidth = dataset.rasterSize.x;
            layerInfo.rasterHeight = dataset.rasterSize.y;
            layerInfo.geotransform = dataset.geoTransform;
            var wktSrs = (dataset.srs ? dataset.srs.toWKT() : null);
            if (wktSrs) {
                var parsedSrs = srs.parse(wktSrs);
                layerInfo.spatialReference.alias = parsedSrs.name;
                if (parsedSrs.auth) {
                    layerInfo.spatialReference.name = parsedSrs.auth + ':' + parsedSrs.srid;
                    layerInfo.spatialReference.srid = parsedSrs.srid;
                } else {
                    layerInfo.spatialReference.name = parsedSrs.name;
                }
                layerInfo.spatialReference.proj4 = parsedSrs.proj4;
                layerInfo.spatialReference.wkt = parsedSrs.pretty_wkt;
            }
        } catch (ex) {
            status = false;
            errors += '<br/>' + ex.message;
        }

        var tbl = layerInfo.datasetName;
        var srid = layerInfo.spatialReference.srid;

        var host = this.connectionSettings.host;
        var database = this.connectionSettings.database;
        var password = this.connectionSettings.password;
        var user = this.connectionSettings.user;
        var port = this.connectionSettings.port || 5432;
        var psqlBinPath_win = this.connectionSettings.psqlBinPath_win;
        var psqlBinPath_linux = this.connectionSettings.psqlBinPath_linux;

        if(process.platform=='win32'){
        var importBatchFile = path.join(filePathFolder, filebaseName + '_import.bat');
        var batchScript = `set PGPASSWORD=${password}
"${psqlBinPath_win}/raster2pgsql" -s ${srid} -I -d -C -M "${filePath}" -t 100x100 public.${tbl} | "${psqlBinPath_win}/psql" -h ${host} -p ${port} -U ${user} -d ${database}`;
        try {
            //await fs_writeFile(importBatchFile, batchScript);
            await util.promisify(fs.writeFile)(importBatchFile, batchScript);
            //require('fs').writeFileSync(importBatchFile, batchScript);
            //require('fs-extra').outputFileSync(importBatchFile, batchScript);
        } catch (exx) {
            console.log(exx);
            status = false;
            errors += '<br/>' + exx.message;
        }
        if (status) {
            try {
                const {
                    stdout,
                    stderr
                } = await execFile(importBatchFile);
            } catch (ex) {
                status = false;
                errors += '<br/>' + ex.message;
            }
        }
    }else if(process.platform=='linux'){
       
          var importBatchFile = path.join(filePathFolder, filebaseName + '_import.sh');
          var outSqlFile = path.join(filePathFolder, filebaseName + '_import.sql');
  
          //todo: copy all related files
          
        //   var batchScript = `export PGPASSWORD=${password}
        //   "/usr/binraster2pgsql" -s ${srid} -I -d -C -M "${filePath}" -t 100x100 public.${tbl} | "psql" -h ${host} -p ${port} -U ${user} -d ${database}`;
  
        //   var batchScript = `export PGPASSWORD=${password}
        //   "raster2pgsql" -s ${srid} -I -d -C -M "${filename}" -t 100x100 public.${tbl} > im.sql`;
  
        // var batchScript = `export PGPASSWORD=${password}
        // "/usr/bin/raster2pgsql" -s ${srid} -I -d -C -M "${filePath}" -t 100x100 public.${tbl} > import.sql
        // "psql" -h ${host} -p ${port} -U ${user} -d ${database} -f import.sql`;

        var batchScript = `export PGPASSWORD=${password}
        "raster2pgsql" -s ${srid} -I -d -C -M "${filePath}" -t 100x100 public.${tbl} > ${outSqlFile}
        "psql" -h ${host} -p ${port} -U ${user} -d ${database} -f ${outSqlFile}`;

        //var batchScript = `export PGPASSWORD=${password}
        //"raster2pgsql" -s ${srid} -I -d -C -M "${filePath}" -t 100x100 public.${tbl} | "psql" -h ${host} -p ${port} -U ${user} -d ${database} -f import.sql`;

          try {
              //await fs_writeFile(importBatchFile, batchScript);
              await util.promisify(fs.writeFile)(importBatchFile, batchScript);
              //require('fs').writeFileSync(importBatchFile, batchScript);
              //require('fs-extra').outputFileSync(importBatchFile, batchScript);
          } catch (exx) {
              console.log(exx);
              status = false;
              errors += '<br/>' + exx.message;
          }
          //
          if (status) {
              try {
                  const {
                      stdout,
                      stderr
                  //} = await exec( '/var/run/docker.sock/docker exec postgis '+ importBatchFile);
              } = await exec( 'sh '+ importBatchFile);
              } catch (ex) {
                  status = false;
                  errors += '<br/>' + ex.message;
              }
          }
            
    }else if(process.platform=='linux__'){
      var copyFile= async function (source, target) {
            var rd = fs.createReadStream(source);
            var wr = fs.createWriteStream(target);
            try {
              return await new Promise(function(resolve, reject) {
                rd.on('error', reject);
                wr.on('error', reject);
                wr.on('finish', resolve);
                rd.pipe(wr);
              });
            } catch (error) {
              rd.destroy();
              wr.end();
              throw error;
            }
          }
        var shareVolume= process.env.SHARED_VOLUME?process.env.SHARED_VOLUME:'/sharedvolume';
        var importBatchFile = path.join(shareVolume, filebaseName + '_import.sh');

        //todo: copy all related files
        await copyFile(filePath, path.join(shareVolume, filename));
        
        var batchScript = `export PGPASSWORD=${password}
        "raster2pgsql" -s ${srid} -I -d -C -M "${filename}" -t 100x100 public.${tbl} | "${psqlBinPath_linux}/psql" -p ${port} -U ${user} -d ${database}`;

        try {
            //await fs_writeFile(importBatchFile, batchScript);
            await util.promisify(fs.writeFile)(importBatchFile, batchScript);
            //require('fs').writeFileSync(importBatchFile, batchScript);
            //require('fs-extra').outputFileSync(importBatchFile, batchScript);
        } catch (exx) {
            console.log(exx);
            status = false;
            errors += '<br/>' + exx.message;
        }
        //
        if (status) {
            try {
                const {
                    stdout,
                    stderr
                //} = await exec( '/var/run/docker.sock/docker exec postgis '+ importBatchFile);
            } = await exec( 'docker exec postgis '+ importBatchFile);
            } catch (ex) {
                status = false;
                errors += '<br/>' + ex.message;
            }
        }
      }
        errors = (errors ? ('<br /> <span style="color:red;">' + errors + '</span>') : '');
        if (status) {
            var thumbnailFile;
            if (fs.existsSync(thumbnailFile_png)) {
                thumbnailFile = thumbnailFile_png;

            } else if (fs.existsSync(thumbnailFile_jpg)) {
                thumbnailFile = thumbnailFile_jpg;
            }
            var thumbnail = null;
            if (thumbnailFile) {
                thumbnail = await sharp(thumbnailFile)
                .resize(160,100,{
                    fit: sharp.fit.inside
                  })
                    .png()
                    .toBuffer();
            } else {
                try {
                    var srid = layerInfo.spatialReference.srid || 3857;
                    var BBand = 3;
                    if (layerInfo.numberOfBands < 3)
                        BBand = layerInfo.numberOfBands;
                    var GBand = 2;
                    if (layerInfo.numberOfBands < 2)
                        GBand = layerInfo.numberOfBands;
                    var RBand = 1;
                    if (layerInfo.bands && layerInfo.bands.length) {
                        for (var i = 0; i < layerInfo.bands.length; i++) {
                            var band = layerInfo.bands[i];
                            if(!band.name){
                                band.name=band.colorInterpretation;
                            }
                            if (band.name === 'Red') {
                                RBand = band.id;
                            }
                            if (band.name === 'Green') {
                                GBand = band.id;
                            }
                            if (band.name === 'Blue') {
                                BBand = band.id;
                            }
                        }
                    }
                    var BBand = 3;
                    if (layerInfo.numberOfBands < 3)
                        BBand = layerInfo.numberOfBands;
                    var GBand = 2;
                    if (layerInfo.numberOfBands < 2)
                        GBand = layerInfo.numberOfBands;
                    var RBand = 1;
                    if (layerInfo.bands && layerInfo.bands.length) {
                        for (var i = 0; i < layerInfo.bands.length; i++) {
                            var band = layerInfo.bands[i];
                            if(!band.name){
                                band.name=band.colorInterpretation;
                            }
                            if (band.name === 'Red') {
                                RBand = band.id;
                            }
                            if (band.name === 'Green') {
                                GBand = band.id;
                            }
                            if (band.name === 'Blue') {
                                BBand = band.id;
                            }
                        }
                    }
                    var display;


                    if (layerInfo.numberOfBands > 1) {
                        layerInfo.rasterType='MultiBand';
                        display = {
                            displayType: 'RGB',
                            RBand: RBand,
                            GBand: GBand,
                            BBand: BBand,
                            ABand: undefined,
                            reclass: false
                        }
                    } else {
                        layerInfo.rasterType='SingleBand';
                        display = {
                            displayType: 'colorMap',
                            band: 1,
                            colorMap: 'grayscale',
                            reclass: false
                        }
                    }

                    layerInfo.display = display;

                    var resultThumbnail = await this.getRasterAsPng({
                        tableName: layerInfo.datasetName,
                        oidField: layerInfo.oidField,
                        rasterField: layerInfo.rasterField,
                        srid: srid,
                        bands: layerInfo.bands,
                        display: display
                    });
                    thumbnail = await sharp(resultThumbnail.output)
                    .resize(160,100,{
                        fit: sharp.fit.inside
                      })
                        .png()
                        .toBuffer();
                } catch (ex) {
                    var a = 1;
                }
            }

            try {
                layerInfo.metadata_4326 = await this.getRasterMetadata({
                    tableName: layerInfo.datasetName,
                    oidField: layerInfo.oidField,
                    rasterField: layerInfo.rasterField,
                    srid: 4326
                });
                layerInfo.metadata_3857 = await this.getRasterMetadata({
                    tableName: layerInfo.datasetName,
                    oidField: layerInfo.oidField,
                    rasterField: layerInfo.rasterField,
                    srid: 3857
                });
            } catch (ex) {}

            var history= history=[];
            history.push({
                 task:'importFromGeotiff',
                 settings:{
                    fileName:layerInfo.fileName,
                 }
             });
             layerInfo.history=history;

            var newLayer = await DataLayer.create({
                name: layerInfo.fileName,
                dataType: 'raster',
                description: 'Imported from ' + filebaseName + errors,
                ownerUser: ownerUserId,
                thumbnail: thumbnail,
                details: JSON.stringify(layerInfo)
            });
        }
        return {
            status: status,
            fileName: filename,
            message: errors
        }
    }
    async getRasterAsPng(options) {
        var tableName = options.tableName;
        var oidField = options.oidField || 'rid';
        var rasterField = options.rasterField || 'rast';
        var srid = options.srid;
        var display = options.display;
        if (!display) {
            return;
        }
        var RBand = options.display.RBand || 1;
        var GBand = options.display.GBand || 1;
        var BBand = options.display.BBand || 1;
        var ABand = options.display.ABand;
        var bands = options.bands;
        var apply_reclass = false;
        var noDataValue = null;
        var minimum, maximum;
        var bandMinimum, bandMaximum;
        if (display.displayType == 'colorMap') {
            if (display.reclass) {
                apply_reclass = true;
            }
            if (!display.colorMap) {
                display.colorMap = 'grayscale';
            }
            if (!display.band) {
                display.band = 1;
            }
            if (bands && bands.length) {
                var band = bands[display.band - 1];
                noDataValue = band.noDataValue;
                bandMinimum = minimum = band.minimum;
                bandMaximum = maximum = band.maximum;
            }
            if (typeof display.minimum == 'undefined') {

                display.minimum = minimum;
            }
            if (typeof display.maximum == 'undefined') {

                display.maximum = maximum;
            }

            minimum = Math.max(minimum, display.minimum);
            maximum = Math.min(maximum, display.maximum);
            if (minimum !== bandMinimum || maximum != bandMaximum) {
                apply_reclass = true;
            }
        }
        // if(bands && bands.length){
        //     for(var i=0;i< bands.length;i++){
        //         var band=bands[i];
        //         if(band.colorInterpretation==='Gray' || band.dataType=='Int16' || band.dataType=='Int32' ){
        //             RBand= band.id;
        //             GBand=RBand;
        //             BBand=RBand;

        //             noDataValue=band.noDataValue;
        //             minimum=band.minimum;
        //             maximum=band.maximum;
        //             reclassToGray=true;
        //             break;
        //         }

        //     }
        // }
        var ABand_expr = '';

        if (ABand)
            ABand_expr = `,ST_Union(${rasterField},${ABand})`;
        var where = options.where || '';
        var whereStr = ''
        if (where) {
            var checkSQlExpression_res= this.checkSQlExpression(where);
           if(!checkSQlExpression_res.valid){
               throw new Error(checkSQlExpression_res.message);
           }
            whereStr = ` WHERE ${where}`;
        }
        var queryText = '';
        if (display.displayType === 'RGB') {
            queryText = `SELECT ST_AsPNG(raster) as output ,ST_GeoReference(raster, 'ESRI') As esri_ref, ST_GeoReference(raster, 'GDAL') As gdal_ref
 FROM ( Select 
           ST_Transform(
              ST_AddBand(
                ST_Union(${rasterField},${RBand}),
                 ARRAY[
                     ST_Union(${rasterField},${GBand}),
                     ST_Union(${rasterField},${BBand})
                     ${ABand_expr}
                    ]
               )
               ,${srid},'Bilinear'
           ) as raster
           from  public."${tableName}"${whereStr} 
) as raster`;
        }

        if (display.displayType == 'colorMap') {
            var band = display.band;
            var colorMap = display.colorMap;
            apply_reclass = true; //note: ST_ColorMap without reclassifying generate reverse grayscale
            if (!apply_reclass) {
                queryText = `SELECT ST_AsPNG(raster) as output ,ST_GeoReference(raster, 'ESRI') As esri_ref, ST_GeoReference(raster, 'GDAL') As gdal_ref
    FROM ( Select 
              ST_Transform(
               ST_ColorMap(
                   ST_Union(${rasterField},${band})
                   ,1,'${colorMap}'
                ) 
                ,${srid},'Bilinear'
              ) as raster
              from  public."${tableName}"${whereStr} 
   ) as raster`;
            } else {
                // calssified values
                var c_minimum = 1;
                var c_maximum = 254;
                var c_noDataValue = 255;
                if (colorMap == 'grayscale') { // grayscale does not support transparency                        
                    queryText = `SELECT ST_AsPNG(raster) as output ,ST_GeoReference(raster, 'ESRI') As esri_ref, ST_GeoReference(raster, 'GDAL') As gdal_ref
    FROM ( Select 
            ST_Transform(
     --       ST_ColorMap(
                ST_Reclass(ST_Union(${rasterField},${band}),1, '[${minimum}-${maximum}]:${c_minimum}-${c_maximum}', '8BUI',${c_noDataValue} )
      --          ,1,'${colorMap}'
       --         ) 
                ,${srid},'Bilinear')
             as raster
            from  public."${tableName}"${whereStr} 
) as raster`;
                } else {
                    queryText = `SELECT ST_AsPNG(raster) as output ,ST_GeoReference(raster, 'ESRI') As esri_ref, ST_GeoReference(raster, 'GDAL') As gdal_ref
        FROM ( Select 
                ST_Transform(
                ST_ColorMap(
                    ST_Reclass(ST_Union(${rasterField},${band}),1, '[${minimum}-${maximum}]:${c_minimum}-${c_maximum}', '8BUI',${c_noDataValue} )
                    ,1,'${colorMap}'
                    ) 
                    ,${srid},'Bilinear')
                 as raster
                from  public."${tableName}"${whereStr} 
    ) as raster`;

                }
            }


        }
        if (false) {
            //     queryText=  `SELECT ST_AsPNG(raster) as output ,ST_GeoReference(raster, 'ESRI') As esri_ref, ST_GeoReference(raster, 'GDAL') As gdal_ref
            //     FROM ( Select 
            //               ST_Transform(
            //                        ST_Reclass(ST_Union(${rasterField},${RBand}),1,'[${minimum}-${maximum}]:0-255', '8BUI',${noDataValue} )
            //                   ,${srid}
            //               ) as raster
            //               from  public."${tableName}"${whereStr} 
            //    ) as raster`;

            queryText = `SELECT ST_AsPNG(raster) as output ,ST_GeoReference(raster, 'ESRI') As esri_ref, ST_GeoReference(raster, 'GDAL') As gdal_ref
 FROM ( Select 
           ST_Transform(
            ST_Reclass(ST_Union(${rasterField},${RBand}),1, '[0-2000):0,[2000-2500):100,[2500-3000):200,[3000-${maximum}]:255', '8BUI',0       )
               ,${srid}
           ) as raster
           from  public."${tableName}"${whereStr} 
) as raster`;


            queryText = `SELECT ST_AsPNG(raster) as output ,ST_GeoReference(raster, 'ESRI') As esri_ref, ST_GeoReference(raster, 'GDAL') As gdal_ref
 FROM ( Select 
           ST_Transform(
            ST_AddBand(
                    ST_Reclass(ST_Union(${rasterField},${RBand}),1, '[0-2000):0,[2000-2500):100,[2500-3000):0,[3000-${maximum}]:0','8BUI',0),
                    ARRAY[
                        ST_Reclass(ST_Union(${rasterField},${RBand}),1, '[0-2000):0,[2000-2500):0,[2500-3000):200,[3000-${maximum}]:0','8BUI',0),
                        ST_Reclass(ST_Union(${rasterField},${RBand}),1, '[0-2000):0,[2000-2500):100,[2500-3000):200,[3000-${maximum}]:255','8BUI',0)
                        ${ABand_expr}
                       ]
               )        
               ,${srid}
           ) as raster
           from  public."${tableName}"${whereStr} 
) as raster`;


            queryText = `SELECT ST_AsPNG(raster) as output ,ST_GeoReference(raster, 'ESRI') As esri_ref, ST_GeoReference(raster, 'GDAL') As gdal_ref
 FROM ( Select 
           ST_Transform(
                ST_ColorMap(
                    ST_Reclass(ST_Union(${rasterField},${RBand}),1,'[${minimum}-${maximum}]:0-255', '8BUI',${noDataValue} ),
                    1,'pseudocolor'
                    )
               ,${srid}
           ) as raster
           from  public."${tableName}"${whereStr} 
) as raster`;

            queryText = `SELECT ST_AsPNG(raster) as output ,ST_GeoReference(raster, 'ESRI') As esri_ref, ST_GeoReference(raster, 'GDAL') As gdal_ref
 FROM ( Select 
           ST_Transform(
                ST_ColorMap(
                      ST_Union(${rasterField},${RBand}),
                    1,'pseudocolor'
                    )
               ,${srid}
           ) as raster
           from  public."${tableName}"${whereStr} 
) as raster`;

            queryText = `SELECT ST_AsPNG(raster) as output ,ST_GeoReference(raster, 'ESRI') As esri_ref, ST_GeoReference(raster, 'GDAL') As gdal_ref
 FROM ( Select 
           ST_Transform(
            ST_ColorMap(
                ST_Reclass(ST_Union(${rasterField},${RBand}),1, '[0-2000):0,[2000-2500):1,[2500-3000):2,[3000-${maximum}]:3', '8BUI',0       )
                ,1,'pseudocolor'
             ) 
             ,${srid}
           ) as raster
           from  public."${tableName}"${whereStr} 
) as raster`;

            queryText = `SELECT ST_AsPNG(raster) as output ,ST_GeoReference(raster, 'ESRI') As esri_ref, ST_GeoReference(raster, 'GDAL') As gdal_ref
 FROM ( Select 
           ST_Transform(
            ST_ColorMap(
                ST_Reclass(ST_Union(${rasterField},${RBand}),1, '[0-2000):0,[2000-2500):1-25,[2500-3000):25-30,[3000-${maximum}]:30-50', '8BUI',0       )
                ,1,'pseudocolor'
             ) 
             ,${srid}
           ) as raster
           from  public."${tableName}"${whereStr} 
) as raster`;


            queryText = `SELECT ST_AsPNG(raster) as output ,ST_GeoReference(raster, 'ESRI') As esri_ref, ST_GeoReference(raster, 'GDAL') As gdal_ref
 FROM ( Select 
           ST_Transform(
            ST_ColorMap(
                ST_Reclass(ST_Union(${rasterField},${RBand}),1, '[0-2000):0,[2000-2500):1-25,[2500-3000):25-30,[3000-${maximum}]:0', '8BUI',0       )
                ,1,'pseudocolor'
             ) 
             ,${srid}
           ) as raster
           from  public."${tableName}"${whereStr} 
) as raster`;

        }

        var results = await this.query({
            text: queryText
        });
        if (results) {

            return results.rows[0];
        } else
            return null;

    }
    async getRasterMetadata(options) {
        var tableName = options.tableName;
        var oidField = options.oidField || 'rid';
        var rasterField = options.rasterField || 'rast';
        var srid = options.srid;
        var where = options.where || '';
        var whereStr = ''
        if (where) {
            var checkSQlExpression_res= this.checkSQlExpression(where);
           if(!checkSQlExpression_res.valid){
               throw new Error(checkSQlExpression_res.message);
           }
            whereStr = ` WHERE ${where}`;
        }

        var queryText = `select (raster.md).* from 
(
SELECT ST_MetaData(raster) as md 
 FROM ( Select 
           ST_Transform(
            ST_Union(${rasterField},1)
            ,${srid}
           ) as raster
           from  public."${tableName}"${whereStr} 
	) as raster
) as raster`;

        var results = await this.query({
            text: queryText
        });
        if (results) {
            var result = results.rows[0];
            delete result.numbands;
            return result;
        } else
            return null;

    }
    async getRasterBandSummaryStats(options) {
        var tableName = options.tableName;
        var oidField = options.oidField || 'rid';
        var rasterField = options.rasterField || 'rast';
        var band = options.band || 1;


        var queryText = `select (raster.stats).*,nodatavalue from 
(
SELECT ST_SummaryStats(raster, 1) as stats ,ST_BandNoDataValue(raster,1) as nodatavalue
 FROM ( Select ST_Union(${rasterField},${band}) as raster
           from  public."${tableName}"
	) as raster
) as raster`;

        var results = await this.query({
            text: queryText
        });
        if (results) {
            var result = results.rows[0];
            //delete result.numbands;
            return result;
        } else
            return null;

    }
    async getRasterBandHistogram(options) {
        var tableName = options.tableName;
        var oidField = options.oidField || 'rid';
        var rasterField = options.rasterField || 'rast';
        var band = options.band || 1;


        var queryText = `select (raster.stats).* from 
(
SELECT ST_Histogram(raster, 1) as stats 
 FROM ( Select ST_Union(${rasterField},${band}) as raster
           from  public."${tableName}"
	) as raster
) as raster`;

        var results = await this.query({
            text: queryText
        });
        if (results) {
            var result = results.rows;
            return result;
        } else
            return null;

    }
    async getRasterBandDistinctValueCount(options) {
        var tableName = options.tableName;
        var oidField = options.oidField || 'rid';
        var rasterField = options.rasterField || 'rast';
        var band = options.band || 1;


        var queryText = `SELECT COUNT(*) as distinct_value_count FROM 
        (
        SELECT DISTINCT (pvc).VALUE
         FROM public."${tableName}", lateral ST_ValueCount(public."${tableName}".${rasterField},${band}) AS pvc
         ORDER BY (pvc).VALUE
        ) AS Q;`;

        var results = await this.query({
            text: queryText
        });
        if (results) {
            var result = results.rows[0];
            //delete result.numbands;
            return result;
        } else
            return null;

    }
    async getRasterValue(options) {
        var x = options.x;
        var y = options.y;
        var tableName = options.tableName;

        var oidField = options.oidField || 'rid';
        var rasterField = options.rasterField || 'rast';
        var srid = options.srid;
        var out_srid = options.out_srid;
        if (!out_srid) out_srid = srid;
        var bands = options.bands;
        var selectExpr = '';

        if (bands && bands.length) {
            var selectExprs = [];
            for (var i = 0; i < bands.length; i++) {
                var band = bands[i];
                var bandName = band.name || band.description || band.colorInterpretation;
                if (!bandName) {
                    bandName = 'b' + band.id;
                }
                selectExprs.push(`ST_Value(${rasterField},${band.id}, ST_Transform(ST_SetSRID(ST_MakePoint(${x}, ${y}),${out_srid}),${srid})) as "${bandName}"`);

            }
            selectExpr = selectExprs.join(',');
        }

        var queryText = `SELECT 
${selectExpr} 
FROM public."${tableName}"
WHERE ST_Intersects(${rasterField}, ST_Transform(ST_SetSRID(ST_MakePoint(${x}, ${y}),${out_srid}),${srid}));`;

        var results = await this.query({
            text: queryText
        });
        if (results) {
            var result = results.rows[0];
            return result;
        } else
            return null;

    }

    async createRaster_Slope(DataLayer, ownerUserId, options) {
        var sharp = require('sharp');
        var status = false;
        var settings= options.settings;
        if(!settings){
            settings= {};
        }
        var fromDetails = options.details;
        var outputName = options.outputName || ( (fromDetails.name || fromDetails.fileName) + '-Slope');
        var tableName = fromDetails.datasetName;
        var oidField = fromDetails.oidField || 'rid';
        var rasterField = fromDetails.rasterField || 'rast';
        var srid = options.out_srid || fromDetails.spatialReference.srid;
        var scale = settings.scale || 1;
        var units= settings.units || 'DEGREES';
        var interpolate_nodata= settings.interpolate_nodata?true:false;
        var history=fromDetails.history;
        if(!history){
            history=[];
        }
        history.push({
             task:'slope',
             settings:{
               
                outputName:options.outputName,
                units:units,
                interpolate_nodata:interpolate_nodata,
                out_srid:options.out_srid
             }
         });
         interpolate_nodata= interpolate_nodata?'TRUE':'FALSE';

        if (srid == '4326' || srid == 4326) {
            srid = 4326;
            scale = 111120;
        }
        var where = options.where || '';
        var whereStr = ''
        if (where) {
            var checkSQlExpression_res= this.checkSQlExpression(where);
           if(!checkSQlExpression_res.valid){
               throw new Error(checkSQlExpression_res.message);
           }
            whereStr = ` WHERE ${where}`;
        }

        var uniqueTableName = 'rst_' + uuidv4().replace(new RegExp('-', 'g'), '');

        var errors = '';
        var outDetails = {
            name:outputName,
            datasetName: uniqueTableName,
            workspace: 'postgres',
            datasetType: 'raster',
            rasterType:'SingleBand',
            fileType: fromDetails.fileType,
            schema: undefined,
            rasterField: rasterField,
            oidField: oidField,
            spatialReference: {
                srid: srid
            },
            history:history
        };
        var tbl = outDetails.datasetName;
        var fromTbl = fromDetails.datasetName;

        var queryText = ` DROP TABLE if exists public."${tbl}";
            
CREATE TABLE public."${tbl}"(
    ${oidField} SERIAL primary key, ${rasterField} raster
    );
INSERT INTO ${tbl}(${rasterField})
SELECT ST_Slope(
    ST_Transform(
        ST_Union(
            ${rasterField}
         )
        ,${srid},'Bilinear')
    , 1, '32BF', '${units}', ${scale}, ${interpolate_nodata})
FROM ${fromTbl} ${whereStr}; 

SELECT AddRasterConstraints(
    '${tbl}'::name,  
    '${rasterField}'::name  
  );
  
  CREATE INDEX ${tbl}_gist_idx
  ON ${tbl}
  USING GIST(ST_ConvexHull(${rasterField}));`;
        try {
            var results = await this.query({
                text: queryText
            });
            if (results) {
                //var result= results.rows[0];
                status = true;
            } else {
                status = false;
            }
        } catch (ex) {
            status = false;
            errors += '<br/>' + ex.message;
        }

        if (status) {

            var thumbnail = null;
            var minimum = 0;
            var maximum = 90;
            var noDataValue;
            var bandStats;
            var srid = outDetails.spatialReference.srid || 3857;
            try {
                bandStats = await this.getRasterBandSummaryStats({
                    tableName: outDetails.datasetName,
                    oidField: outDetails.oidField,
                    rasterField: outDetails.rasterField,
                    band: 1
                });
                if (bandStats) {
                    minimum = bandStats.min;
                    maximum = bandStats.max;
                    noDataValue = bandStats.nodatavalue
                }

            } catch (ex) {}
            try {
                outDetails.metadata_4326 = await this.getRasterMetadata({
                    tableName: outDetails.datasetName,
                    oidField: outDetails.oidField,
                    rasterField: outDetails.rasterField,
                    srid: 4326
                });
                outDetails.metadata_3857 = await this.getRasterMetadata({
                    tableName: outDetails.datasetName,
                    oidField: outDetails.oidField,
                    rasterField: outDetails.rasterField,
                    srid: 3857
                });
                var extInfo;
                if (srid == 4326) {
                    extInfo = outDetails.metadata_4326;
                } else if (srid == 3857) {
                    extInfo = outDetails.metadata_3857;
                } else {
                    extInfo = await this.getRasterMetadata({
                        tableName: outDetails.datasetName,
                        oidField: outDetails.oidField,
                        rasterField: outDetails.rasterField,
                        srid: srid
                    });
                }
                outDetails.rasterWidth = extInfo.width;
                outDetails.rasterHeight = extInfo.height;
            } catch (ex) {}
            outDetails.numberOfBands = 1;
            outDetails.bands = [];
            outDetails.bands.push({
                id: 1,
                name: "Slope(" +units+')',
                dataType: "Float32",      
                description: '',
                minimum: minimum,
                maximum: maximum,
                noDataValue: noDataValue,
                unitType: units,
                size: {
                    x: outDetails.rasterWidth,
                    y: outDetails.rasterHeight
                },
                //blockSize:band.blockSize,
                //scale:band.scale,
                statistics: bandStats

            });
            try {

                var BBand = 1;
                var GBand = 1;
                var RBand = 1;
                var display = {
                    displayType: 'colorMap',
                    band: 1,
                    colorMap: 'grayscale',
                    reclass: false,
                    minimum: minimum,
                    maximum: maximum
                };
                outDetails.display = display;

                var resultThumbnail = await this.getRasterAsPng({
                    tableName: outDetails.datasetName,
                    oidField: outDetails.oidField,
                    rasterField: outDetails.rasterField,
                    srid: srid,
                    bands: outDetails.bands,
                    display: display
                });
                thumbnail = await sharp(resultThumbnail.output)
                    .resize(160,100,{
                        fit: sharp.fit.inside
                    })
                    .png()
                    .toBuffer();
            } catch (ex) {
                var a = 1;
            }




            try {
                var newLayer = await DataLayer.create({
                    name: outputName,
                    dataType: 'raster',
                    description: 'Generated from ' + (fromDetails.name  || fromDetails.datasetName) + errors,
                    ownerUser: ownerUserId,
                    thumbnail: thumbnail,
                    details: JSON.stringify(outDetails)
                });
                return {
                    status: status,
                    id: newLayer.id
                }
            } catch (ex) {
                status = false;
                errors += '<br/>' + ex.message;
            }

            return {
                status: false,
                errors: errors
            }

        }

    }

    async createRaster_Hillshade(DataLayer, ownerUserId, options) {
        var sharp = require('sharp');
        var settings= options.settings;
        if(!settings){
            settings= {};
        }
        var status = false;
        var fromDetails = options.details;
        var outputName = options.outputName || ((fromDetails.name || fromDetails.fileName) + '-Hillshade');
        var tableName = fromDetails.datasetName;
        var oidField = fromDetails.oidField || 'rid';
        var rasterField = fromDetails.rasterField || 'rast';
        var srid = options.out_srid || fromDetails.spatialReference.srid;
        var scale = settings.scale || 1;
        var units= settings.units || 'DEGREES';
        var azimuth=315;
        if(typeof settings.azimuth !=='undefined'){
            azimuth=settings.azimuth;
        }
        var altitude=45;
        if(typeof settings.altitude !=='undefined'){
            altitude=settings.altitude;
        }
        var max_bright=255;
        if(typeof settings.max_bright !=='undefined'){
            max_bright=settings.max_bright;
        }
        var interpolate_nodata= settings.interpolate_nodata?true:false;
        var history=fromDetails.history;
        if(!history){
            history=[];
        }
        history.push({
             task:'hillshade',
             settings:{
                outputName:options.outputName,
                azimuth:azimuth,
                altitude:altitude,
                scale:scale,
                max_bright:max_bright,
                interpolate_nodata:interpolate_nodata,
                out_srid:options.out_srid
             }
         });
         interpolate_nodata= interpolate_nodata?'TRUE':'FALSE';

        if (srid == '4326' || srid == 4326) {
            srid = 4326;
            scale = 111120;
        }
        var where = options.where || '';
        var whereStr = ''
        if (where) {
            var checkSQlExpression_res= this.checkSQlExpression(where);
           if(!checkSQlExpression_res.valid){
               throw new Error(checkSQlExpression_res.message);
           }
            whereStr = ` WHERE ${where}`;
        }

        var uniqueTableName = 'rst_' + uuidv4().replace(new RegExp('-', 'g'), '');

        var errors = '';
        var outDetails = {
            name:outputName,
            datasetName: uniqueTableName,
            workspace: 'postgres',
            datasetType: 'raster',
            rasterType:'SingleBand',
            fileType: fromDetails.fileType,
            schema: undefined,
            rasterField: rasterField,
            oidField: oidField,
            spatialReference: {
                srid: srid
            },
            history:history
        };
        var tbl = outDetails.datasetName;
        var fromTbl = fromDetails.datasetName;

        var queryText = ` DROP TABLE if exists public."${tbl}";
            
CREATE TABLE public."${tbl}"(
    ${oidField} SERIAL primary key, ${rasterField} raster
    );
INSERT INTO ${tbl}(${rasterField})
SELECT ST_Hillshade(
    ST_Transform(
        ST_Union(
            ${rasterField}
         )
        ,${srid},'Bilinear')
    , 1, '8BUI', ${azimuth},${altitude},${max_bright}, ${scale},${interpolate_nodata})
FROM ${fromTbl} ${whereStr}; 

SELECT AddRasterConstraints(
    '${tbl}'::name,  
    '${rasterField}'::name  
  );
  
  CREATE INDEX ${tbl}_gist_idx
  ON ${tbl}
  USING GIST(ST_ConvexHull(${rasterField}));`;
        try {
            var results = await this.query({
                text: queryText
            });
            if (results) {
                //var result= results.rows[0];
                status = true;
            } else {
                status = false;
            }
        } catch (ex) {
            status = false;
            errors += '<br/>' + ex.message;
        }

        if (status) {

            var thumbnail = null;
            var minimum = 0;
            var maximum = 255;
            var noDataValue;
            var bandStats;
            var srid = outDetails.spatialReference.srid || 3857;
            try {
                bandStats = await this.getRasterBandSummaryStats({
                    tableName: outDetails.datasetName,
                    oidField: outDetails.oidField,
                    rasterField: outDetails.rasterField,
                    band: 1
                });
                if (bandStats) {
                    minimum = bandStats.min;
                    maximum = bandStats.max;
                    noDataValue = bandStats.nodatavalue
                }

            } catch (ex) {}
            try {
                outDetails.metadata_4326 = await this.getRasterMetadata({
                    tableName: outDetails.datasetName,
                    oidField: outDetails.oidField,
                    rasterField: outDetails.rasterField,
                    srid: 4326
                });
                outDetails.metadata_3857 = await this.getRasterMetadata({
                    tableName: outDetails.datasetName,
                    oidField: outDetails.oidField,
                    rasterField: outDetails.rasterField,
                    srid: 3857
                });
                var extInfo;
                if (srid == 4326) {
                    extInfo = outDetails.metadata_4326;
                } else if (srid == 3857) {
                    extInfo = outDetails.metadata_3857;
                } else {
                    extInfo = await this.getRasterMetadata({
                        tableName: outDetails.datasetName,
                        oidField: outDetails.oidField,
                        rasterField: outDetails.rasterField,
                        srid: srid
                    });
                }
                outDetails.rasterWidth = extInfo.width;
                outDetails.rasterHeight = extInfo.height;
            } catch (ex) {}
            outDetails.numberOfBands = 1;
            outDetails.bands = [];
            outDetails.bands.push({
                id: 1,
                name: "Gray Value",
                dataType: "Byte",
                description: '',
                minimum: minimum,
                maximum: maximum,
                noDataValue: noDataValue,
                unitType: "",
                size: {
                    x: outDetails.rasterWidth,
                    y: outDetails.rasterHeight
                },
                //blockSize:band.blockSize,
                //scale:band.scale,
                statistics: bandStats

            });
            try {

                var BBand = 1;
                var GBand = 1;
                var RBand = 1;
                var display = {
                    displayType: 'colorMap',
                    band: 1,
                    colorMap: 'grayscale',
                    reclass: false,
                    minimum: minimum,
                    maximum: maximum
                };
                outDetails.display = display;

                var resultThumbnail = await this.getRasterAsPng({
                    tableName: outDetails.datasetName,
                    oidField: outDetails.oidField,
                    rasterField: outDetails.rasterField,
                    srid: srid,
                    bands: outDetails.bands,
                    display: display
                });
                thumbnail = await sharp(resultThumbnail.output)
                    .resize(160,100,{
                        fit: sharp.fit.inside
                    })
                    .png()
                    .toBuffer();
            } catch (ex) {
                var a = 1;
            }




            try {
                var newLayer = await DataLayer.create({
                    name: outputName,
                    dataType: 'raster',
                    description: 'Generated from ' + (fromDetails.name || fromDetails.fileName) + errors,
                    ownerUser: ownerUserId,
                    thumbnail: thumbnail,
                    details: JSON.stringify(outDetails)
                });
                return {
                    status: status,
                    id: newLayer.id
                }
            } catch (ex) {
                status = false;
                errors += '<br/>' + ex.message;
            }

            return {
                status: false,
                errors: errors
            }

        }

    }
    gdalPixelTypeToPostGIS(pixelType){
        var map={
            'Byte':'8BSI',
            'Int16':'16BSI',
            'UInt16':'16BUI',
            'Int32':'32BSI',
            'UInt32':'32BUI',
            'Float32':'32BF',
            'Float64':'64BF'
        }
        return map[pixelType];
    }
    async createRaster_Reclass(DataLayer, ownerUserId, options) {
        var sharp = require('sharp');
        var status = false;
        var fromDetails = options.details;
        var outputName = options.outputName || ((fromDetails.name || fromDetails.fileName) + '-Reclass');
        var tableName = fromDetails.datasetName;
        var settings=options.settings;
        var outputDescription= options.outputDescription || settings.outputDescription || '';
        var history=fromDetails.history;
        if(!history){
            history=[];
        }
        history.push({
             task:'reclass',
             settings:{
                reclass:settings.reclass,
                out_srid:options.out_srid
             }
         });


        var reclassexpr= settings.reclass.expression;
        var out_noDataValue=settings.reclass.noDataValue;
        if(typeof out_noDataValue==='undefined'){
            out_noDataValue='NULL';
        }
        var out_dataType=settings.reclass.dataType;
        var out_dataType_postgis=this.gdalPixelTypeToPostGIS(out_dataType);
        var out_bad= settings.band;

        var oidField = fromDetails.oidField || 'rid';
        var rasterField = fromDetails.rasterField || 'rast';
        var srid = options.out_srid || fromDetails.spatialReference.srid;
        var scale = 1;
        if (srid == '4326' || srid == 4326) {
            srid = 4326;
            scale = 111120;
        }
        var where = options.where || '';
        var whereStr = ''
        if (where) {
            var checkSQlExpression_res= this.checkSQlExpression(where);
           if(!checkSQlExpression_res.valid){
               throw new Error(checkSQlExpression_res.message);
           }
            whereStr = ` WHERE ${where}`;
        }

        var uniqueTableName = 'rst_' + uuidv4().replace(new RegExp('-', 'g'), '');

        var errors = '';
        var outDetails = {
            name:outputName,
            datasetName: uniqueTableName,
            workspace: 'postgres',
            datasetType: 'raster',
            rasterType:'SingleBand',
            fileType: fromDetails.fileType,
            schema: undefined,
            rasterField: rasterField,
            oidField: oidField,
            spatialReference: {
                srid: srid
            },
            history:history
        };
        if(fromDetails.rasterType==='SingleBand_Dem'){
            outDetails.rasterType=fromDetails.rasterType;
        }

        var tbl = outDetails.datasetName;
        var fromTbl = fromDetails.datasetName;

        var queryText = ` DROP TABLE if exists public."${tbl}";
            
CREATE TABLE public."${tbl}"(
    ${oidField} SERIAL primary key, ${rasterField} raster
    );
INSERT INTO ${tbl}(${rasterField})
SELECT ST_Reclass(
    ST_Transform(
        ST_Union(
            ${rasterField},${out_bad}
         )
        ,${srid},'Bilinear')
    , 1, '${reclassexpr}', '${out_dataType_postgis}', ${out_noDataValue})
FROM ${fromTbl} ${whereStr}; 

SELECT AddRasterConstraints(
    '${tbl}'::name,  
    '${rasterField}'::name  
  );
  
  CREATE INDEX ${tbl}_gist_idx
  ON ${tbl}
  USING GIST(ST_ConvexHull(${rasterField}));`;
        try {
            var results = await this.query({
                text: queryText
            });
            if (results) {
                //var result= results.rows[0];
                status = true;
            } else {
                status = false;
            }
        } catch (ex) {
            status = false;
            errors += '<br/>' + ex.message;
        }

        if (status) {

            var thumbnail = null;
            var minimum = 0;
            var maximum = 255;
            var noDataValue;
            var bandStats;
            var srid = outDetails.spatialReference.srid || 3857;
            try {
                bandStats = await this.getRasterBandSummaryStats({
                    tableName: outDetails.datasetName,
                    oidField: outDetails.oidField,
                    rasterField: outDetails.rasterField,
                    band: 1
                });
                if (bandStats) {
                    minimum = bandStats.min;
                    maximum = bandStats.max;
                    noDataValue = bandStats.nodatavalue
                }

            } catch (ex) {}
            try {
                outDetails.metadata_4326 = await this.getRasterMetadata({
                    tableName: outDetails.datasetName,
                    oidField: outDetails.oidField,
                    rasterField: outDetails.rasterField,
                    srid: 4326
                });
                outDetails.metadata_3857 = await this.getRasterMetadata({
                    tableName: outDetails.datasetName,
                    oidField: outDetails.oidField,
                    rasterField: outDetails.rasterField,
                    srid: 3857
                });
                var extInfo;
                if (srid == 4326) {
                    extInfo = outDetails.metadata_4326;
                } else if (srid == 3857) {
                    extInfo = outDetails.metadata_3857;
                } else {
                    extInfo = await this.getRasterMetadata({
                        tableName: outDetails.datasetName,
                        oidField: outDetails.oidField,
                        rasterField: outDetails.rasterField,
                        srid: srid
                    });
                }
                outDetails.rasterWidth = extInfo.width;
                outDetails.rasterHeight = extInfo.height;
            } catch (ex) {}
            outDetails.numberOfBands = 1;
            outDetails.bands = [];
            outDetails.bands.push({
                id: 1,
                name: "Value",
                dataType: out_dataType,
                description: '',
                minimum: minimum,
                maximum: maximum,
                noDataValue: noDataValue,
                unitType: "",
                size: {
                    x: outDetails.rasterWidth,
                    y: outDetails.rasterHeight
                },
                //blockSize:band.blockSize,
                //scale:band.scale,
                statistics: bandStats

            });
            try {

                var BBand = 1;
                var GBand = 1;
                var RBand = 1;
                var display = {
                    displayType: 'colorMap',
                    band: 1,
                    colorMap: 'grayscale',
                    reclass: false,
                    minimum: minimum,
                    maximum: maximum
                };
                outDetails.display = display;

                var resultThumbnail = await this.getRasterAsPng({
                    tableName: outDetails.datasetName,
                    oidField: outDetails.oidField,
                    rasterField: outDetails.rasterField,
                    srid: srid,
                    bands: outDetails.bands,
                    display: display
                });
                thumbnail = await sharp(resultThumbnail.output)
                    .resize(160,100,{
                        fit: sharp.fit.inside
                    })
                    .png()
                    .toBuffer();
            } catch (ex) {
                var a = 1;
            }




            try {
                var newLayer = await DataLayer.create({
                    name: outputName,
                    dataType: 'raster',
                    description: outputDescription || ('Generated from ' + (fromDetails.name || fromDetails.fileName) + errors),
                    ownerUser: ownerUserId,
                    thumbnail: thumbnail,
                    details: JSON.stringify(outDetails)
                });
                return {
                    status: status,
                    id: newLayer.id
                }
            } catch (ex) {
                status = false;
                errors += '<br/>' + ex.message;
            }

            return {
                status: false,
                errors: errors
            }

        }

    }

    async rasterToPolygon(DataLayer, ownerUserId, options) {
        var sharp = require('sharp');
        var status = false;
        var fromDetails = options.details;
        var outputName = options.outputName || ((fromDetails.name || fromDetails.fileName) + '-Polygon');
        
        var tableName = fromDetails.datasetName;
        var settings=options.settings;
        if(!settings){
            settings={
                band:1
            }
        }
        var outputDescription= options.outputDescription || settings.outputDescription || '';
        var val_field_alias=options.val_field_alias || settings.val_field_alias || 'Value';
        var out_bad= settings.band;
        if(!out_bad)
        {
            out_bad=1;
        }
        var oidField = fromDetails.oidField || 'rid';
        var rasterField = fromDetails.rasterField || 'rast';
        var srid = options.out_srid || fromDetails.spatialReference.srid;
        
        var history=fromDetails.history;
        if(!history){
            history=[];
        }
        history.push({
             task:'rasterToPolygon',
             settings:{
                outputName:options.outputName,
                band:settings.band,
                out_srid:options.out_srid
             }
         });

        var where = options.where || settings.where || '';
        var whereStr = ''
        if (where) {
            var checkSQlExpression_res= this.checkSQlExpression(where);
           if(!checkSQlExpression_res.valid){
               throw new Error(checkSQlExpression_res.message);
           }
            whereStr = ` WHERE ${where}`;
        }
        var outputWhere = options.outputWhere || settings.outputWhere || '';
        var outputWhereStr = ''
        if (outputWhere) {
            outputWhereStr = ` WHERE ${outputWhere}`;
        }
        var uniqueTableName = 'rst_poly_' + uuidv4().replace(new RegExp('-', 'g'), '');

        var errors = '';
        var outDetails = {
            name:outputName,
            datasetName: uniqueTableName,
            workspace: 'postgres',
            datasetType: 'vector',
            shapeType: 'MultiPolygon',
            shapeField: 'geom',
            oidField: 'gid',
            spatialReference: {
                srid: srid
            },
            fields:[
                {
                    name:'val',
                    alias:val_field_alias || 'Value',
                    type:'double precision'
                }
            ],
            history:history
        };

var createVectorResult= await this.createVectorTable(outDetails);
        if(!createVectorResult.status){
            return createVectorResult;
        }

        var tbl = outDetails.datasetName;
        var fromTbl = fromDetails.datasetName;

        var queryText = `
        INSERT INTO ${tbl}(val,geom)
        SELECT val, geom
        --into TABLE a_polygonTable
        FROM (
        SELECT dp.*
        FROM
        (SELECT 
            ST_Transform(
                ST_Union(
                    ${rasterField},${out_bad}
                )
                ,${srid},'Bilinear') as rast
            FROM ${fromTbl} ${whereStr}) as raster
        , LATERAL ST_DumpAsPolygons(rast) AS dp
            ) as t ${outputWhereStr}; `;
        try {
            var results = await this.query({
                text: queryText
            });
            if (results) {
                //var result= results.rows[0];
                status = true;
            } else {
                status = false;
            }
        } catch (ex) {
            status = false;
            errors += '<br/>' + ex.message;
        }

        if (status) {
            try{
                var newLayer = await DataLayer.create({
                    name: outputName,
                    dataType: 'vector',
                    description: outputDescription || ('created from ' + (fromDetails.name || fromDetails.shapefileName || fromDetails.datasetName) + errors),
                    ownerUser: ownerUserId,
                    thumbnail: null,
                    details: JSON.stringify(outDetails)
                });
                if(newLayer){
                    return {
                        status:true,
                        id:newLayer.id
                        };
                }
            }catch(ex){
                status = false;
                errors += '<br/>' + ex.message;
            }
            return {
                status: status,
                errors: errors
            }

        }else
        {
            return {
                status: false,
                errors: errors
            } 
        }

    }
    async getRasterAsGeotiff(options) {
        var tableName = options.tableName;
        var oidField = options.oidField || 'rid';
        var rasterField = options.rasterField || 'rast';
        var srid = options.srid;
        
     
        var where = options.where || '';
        var whereStr = ''
        if (where) {
            var checkSQlExpression_res= this.checkSQlExpression(where);
           if(!checkSQlExpression_res.valid){
               throw new Error(checkSQlExpression_res.message);
           }
            whereStr = ` WHERE ${where}`;
        }
        var queryText = '';
        
            queryText = `SELECT ST_AsTIFF(raster) as output 
 FROM ( Select 
           ST_Transform(
            ST_Union(${rasterField})
               ,${srid},'Bilinear'
           ) as raster
           from  public."${tableName}"${whereStr} 
) as raster`;

        var results = await this.query({
            text: queryText
        });
        if (results) {

            return results.rows[0];
        } else
            return null;

    }

    async importGeoJSON(layerInfo,geoJson, DataLayer, ownerUserId, options) {
        options = options || {};
        var status = false;
        if(!(geoJson && geoJson.features &&  geoJson.features.length)){
            return {
                status: false,
                message: ''
            }
        }
        var createVectorTableResult= await this.createVectorTable(layerInfo);
        if(!createVectorTableResult.status){
            return createVectorTableResult;
        }
        layerInfo= createVectorTableResult.details;
        var n=0;
        status=true;
        for(var i=0;i< geoJson.features.length ;i++){
            var geoJsonFeature= geoJson.features[i];
            try{
               var res= await this.insertVector(layerInfo,geoJsonFeature);
               n++;
            }catch(ex){

            }
        }
    try{
        var history= layerInfo.history;
        if(!history){
            history=[];
        }
        history.push({
                task:'importedFromGeoJson',
                settings:{
                 name:layerInfo.fileName || 'imported geojson'
                }
            });
            layerInfo.history=history;
        var newLayer = await DataLayer.create({
            name: layerInfo.fileName || 'imported geojson',
            dataType: 'vector',
            description: 'Imported geojson data ' ,
            ownerUser: ownerUserId,
            thumbnail: null,
            details: JSON.stringify(layerInfo)
        });
        
        return {
            status: status,
            id: newLayer.id
        }
    }catch(ex){
        return {
            status: false,
            errors: ex
        }
    }
    }

    async makeBuffer(DataLayer, ownerUserId, options) {
        var status = false;
        var fromDetails = options.details;
        var outputName = options.outputName || ((fromDetails.name || fromDetails.fileName)+ '-Buffer');
        var tableName = fromDetails.datasetName;
        var settings=options.settings;
        if(!settings){
            settings={
                distance:0
            }
        }
        var outputDescription= options.outputDescription || settings.outputDescription || '';
        
        var oidField = fromDetails.oidField || 'gid';
        var geom= fromDetails.shapeField ||'geom';
        var shapeField = geom;
        var fields= fromDetails.fields || [];
        var srid =settings.out_srid || options.out_srid || fromDetails.spatialReference.srid;
        
        var history=fromDetails.history;
        if(!history){
            history=[];
        }
        history.push({
             task:'buffer',
             settings:{
                outputName:options.outputName,
                distance:settings.distance,
                out_srid:options.out_srid
             }
         });

        var where = options.where || '';
        var whereStr = ''
        if (where) {
            var checkSQlExpression_res= this.checkSQlExpression(where);
           if(!checkSQlExpression_res.valid){
               throw new Error(checkSQlExpression_res.message);
           }
            whereStr = ` WHERE ${where}`;
        }
        var distance= settings.distance || 0;
        var uniqueTableName = 'buffer_' + uuidv4().replace(new RegExp('-', 'g'), '');
        
        var fieldNames = [];
        var fieldNames_safe = [];
        if (fields) {
            for (var i = 0; i < fields.length; i++) {
                fields[i].name = fields[i].name.toLowerCase();
                fieldNames.push(fields[i].name);
                fieldNames_safe.push('"' + fields[i].name + '"');
            }
        }
        var errors = '';
        var outDetails = {
            name:outputName,
            datasetName: uniqueTableName,
            workspace: 'postgres',
            datasetType: 'vector',
            shapeType: 'MultiPolygon',
            shapeField: shapeField,
            oidField: oidField,
            spatialReference: {
                srid: srid
            },
            fields:fields,
            history:history
        };

var createVectorResult= await this.createVectorTable(outDetails);
        if(!createVectorResult.status){
            return createVectorResult;
        }

       

        var tbl = outDetails.datasetName;
        var fromTbl = fromDetails.datasetName;

        var fieldNamesExpr = fieldNames_safe.join(',');
        if (fieldNamesExpr)
            fieldNamesExpr = ',' + fieldNamesExpr;

        //var fromGeom=`ST_Buffer( ST_Transform (${geom}, ${srid}) , ${distance}) as geom`;
        //var fromGeom=`ST_Buffer( ${geom} , ${distance}) as geom`;
        var fromGeom0=`ST_Buffer( ST_Transform (${geom}, 4326)::geography , ${distance})::geometry`;
        var fromGeom=`ST_Transform (${fromGeom0}, ${srid}) as geom`;
        var queryText = `
        INSERT INTO ${tbl}(${shapeField} ${fieldNamesExpr})
        SELECT ${fromGeom} ${fieldNamesExpr}
        FROM ${fromTbl} ${whereStr};`;
        try {
            var results = await this.query({
                text: queryText
            });
            if (results) {
                //var result= results.rows[0];
                status = true;
            } else {
                status = false;
            }
        } catch (ex) {
            status = false;
            errors += '<br/>' + ex.message;
        }

        if (status) {
            try{
                var newLayer = await DataLayer.create({
                    name: outputName,
                    dataType: 'vector',
                    description: outputDescription || ('created from ' +(fromDetails.name || fromDetails.shapefileName || fromDetails.datasetName) + errors),
                    ownerUser: ownerUserId,
                    thumbnail: null,
                    details: JSON.stringify(outDetails)
                });
                if(newLayer){
                    return {
                        status:true,
                        id:newLayer.id
                        };
                }
            }catch(ex){
                status = false;
                errors += '<br/>' + ex.message;
            }
            return {
                status: status,
                errors: errors
            }

        }else
        {
            return {
                status: false,
                errors: errors
            } 
        }

    }

    async intersection(DataLayer, ownerUserId, options) {
        var status = false;
        var fromDetails = options.details;
        var settings= options.settings;
        var toDetails= settings.otherDetails;
        var outputName = options.outputName || ((fromDetails.name || fromDetails.fileName) + '_'+ (toDetails.name || toDetails.fileName) +'-Intersection');
        var tableName = fromDetails.datasetName;
       
        var outputDescription= options.outputDescription || settings.outputDescription || '';
        
        var fromOidField= fromDetails.oidField || 'gid';
        var toOidField= toDetails.oidField || 'gid';
        var oidField =  'gid';
        var geom= 'geom';
        var shapeField = geom;
        var fromFields= fromDetails.fields || [];
        var toFields= toDetails.fields || [];
        var fields= [];
        var srid_from = fromDetails.spatialReference.srid || 3857;
        var srid_to = toDetails.spatialReference.srid || 3857;

        var srid = options.out_srid || srid_from;
        var shapeType='Point';
        var shapeRank={
            'Point':0,
            'MultiPoint':0,
            'MultiLineString':1,
            'LineString':1,
            'Line':1,
            'MultiPolygon':2,
            'Polygon':2
        }
        var from_shapeType= fromDetails.shapeType || 'Point';
        var to_shapeType= toDetails.shapeType || 'Point';

        var outShapeRank= Math.min(shapeRank[from_shapeType],shapeRank[to_shapeType]);
        if(outShapeRank==0){
            shapeType='Point';
        }else if( outShapeRank==1)
        {
            shapeType='MultiLineString';
        }else if( outShapeRank==2)
        {
            shapeType='MultiPolygon';
        }
        var history=fromDetails.history;
        if(!history){
            history=[];
        }
        history.push({
             task:'intersection',
             settings:{
                outputName:options.outputName,
                otherLayerName:settings.otherLayerName,
                otherLayerId:settings.otherLayerId,
                out_srid:options.out_srid
             }
         });

       
        var uniqueTableName = 'intersection_' + uuidv4().replace(new RegExp('-', 'g'), '');
        
        
        var fieldNames_safe = [];
        var selectFieldNames_safe = [];
        
        
        // fields.push({
        //     name:fromOidField,
        //     type:'integer'
        // })
        
        for (var i = 0; i < fromFields.length; i++) {
                var fld= JSON.parse(JSON.stringify(fromFields[i]));
                var origName= fld.name;
                fld.name = fld.name.toLowerCase();
                fields.push(fld);
                fieldNames_safe.push('"' + fld.name + '"');
                selectFieldNames_safe.push('A."' + origName + '"');
            }
        for (var i = 0; i < toFields.length; i++) {
                var fld= JSON.parse(JSON.stringify(toFields[i]));
                var origName= fld.name;
                fld.name = '2.'+fld.name.toLowerCase();
                fields.push(fld);
                fieldNames_safe.push('"' + fld.name + '"');
                selectFieldNames_safe.push('B."' + origName + '"');
            }
        
        var errors = '';
        var outDetails = {
            name:outputName,
            datasetName: uniqueTableName,
            workspace: 'postgres',
            datasetType: 'vector',
            shapeType: shapeType,
            shapeField: shapeField,
            oidField: oidField,
            spatialReference: {
                srid: srid
            },
            fields:fields,
            history:history
        };

var createVectorResult= await this.createVectorTable(outDetails);
        if(!createVectorResult.status){
            return createVectorResult;
        }

       

        var tbl = outDetails.datasetName;
        var fromTbl = fromDetails.datasetName;
        var toTbl = toDetails.datasetName;

        var fieldNamesExpr = fieldNames_safe.join(',');
        if (fieldNamesExpr)
            fieldNamesExpr = ',' + fieldNamesExpr;

        var selectfieldNamesExpr = selectFieldNames_safe.join(',');
        if (selectfieldNamesExpr)
             selectfieldNamesExpr = ',' + selectfieldNamesExpr;
        //var fromGeom=`ST_Buffer( ST_Transform (${geom}, ${srid}) , ${distance}) as geom`;
        //var fromGeom=`ST_Buffer( ${geom} , ${distance}) as geom`;
        
        var fromGeom=`ST_Transform (A.${fromDetails.shapeField}, ${srid})`;
        var toGeom=`ST_Transform (B.${toDetails.shapeField}, ${srid})`;

        // intersection
        var queryText = `
        INSERT INTO ${tbl}(${shapeField} ${fieldNamesExpr})
        SELECT  ST_Intersection(${fromGeom},${toGeom}) ${selectfieldNamesExpr}
        FROM ${fromTbl} as A, ${toTbl} as B
        WHERE ST_Intersects(${fromGeom},${toGeom}) = true ;`;

       
        
        try {
            var results = await this.query({
                text: queryText
            });
            if (results) {
                //var result= results.rows[0];
                status = true;
            } else {
                status = false;
            }
        } catch (ex) {
            status = false;
            errors += '<br/>' + ex.message;
        }

        if (status) {
            try{
                var newLayer = await DataLayer.create({
                    name: outputName,
                    dataType: 'vector',
                    description: outputDescription || ('created from ' + (fromDetails.name || fromDetails.shapefileName || fromDetails.datasetName) + errors),
                    ownerUser: ownerUserId,
                    thumbnail: null,
                    details: JSON.stringify(outDetails)
                });
                if(newLayer){
                    return {
                        status:true,
                        id:newLayer.id
                        };
                }
            }catch(ex){
                status = false;
                errors += '<br/>' + ex.message;
            }
            return {
                status: status,
                errors: errors
            }

        }else
        {
            return {
                status: false,
                errors: errors
            } 
        }

    }
    async identity(DataLayer, ownerUserId, options) {
        var status = false;
        var fromDetails = options.details;
        var settings= options.settings;
        var toDetails= settings.otherDetails;
        var outputName = options.outputName || ((fromDetails.name || fromDetails.fileName) + '_'+ (toDetails.name || toDetails.fileName) +'-Identity');
        var tableName = fromDetails.datasetName;
       
        var outputDescription= options.outputDescription || settings.outputDescription || '';
        
        var fromOidField= fromDetails.oidField || 'gid';
        var toOidField= toDetails.oidField || 'gid';
        var oidField =  'gid';
        var geom= 'geom';
        var shapeField = geom;
        var fromFields= fromDetails.fields || [];
        var toFields= toDetails.fields || [];
        var fields= [];
        var srid_from = fromDetails.spatialReference.srid || 3857;
        var srid_to = toDetails.spatialReference.srid || 3857;

        var srid = options.out_srid || srid_from;
        var shapeType='Point';
        var shapeRank={
            'Point':0,
            'MultiPoint':0,
            'MultiLineString':1,
            'LineString':1,
            'Line':1,
            'MultiPolygon':2,
            'Polygon':2
        }
        var from_shapeType= fromDetails.shapeType || 'Point';
        var to_shapeType= toDetails.shapeType || 'Point';

        var outShapeRank= Math.min(shapeRank[from_shapeType],shapeRank[to_shapeType]);
        if(outShapeRank==0){
            shapeType='Point';
        }else if( outShapeRank==1)
        {
            shapeType='MultiLineString';
        }else if( outShapeRank==2)
        {
            shapeType='MultiPolygon';
        }
        var history=fromDetails.history;
        if(!history){
            history=[];
        }
        history.push({
             task:'identity',
             settings:{
                outputName:options.outputName,
                otherLayerName:settings.otherLayerName,
                otherLayerId:settings.otherLayerId,
                out_srid:options.out_srid
             }
         });

       
        var uniqueTableName = 'identity_' + uuidv4().replace(new RegExp('-', 'g'), '');
        
        
        var fieldNames_safe = [];
        var selectFieldNames_safe = [];
        var fieldNames_safe_A = [];
        var selectFieldNames_safe_A = [];
        
        
        // fields.push({
        //     name:fromOidField,
        //     type:'integer'
        // })
        
        for (var i = 0; i < fromFields.length; i++) {
                var fld= JSON.parse(JSON.stringify(fromFields[i]));
                var origName= fld.name;
                fld.name = fld.name.toLowerCase();
                fields.push(fld);
                fieldNames_safe.push('"' + fld.name + '"');
                selectFieldNames_safe.push('A."' + origName + '"');
                
                fieldNames_safe_A.push('"' + fld.name + '"');
                selectFieldNames_safe_A.push('A."' + origName + '"');
            }
        for (var i = 0; i < toFields.length; i++) {
                var fld= JSON.parse(JSON.stringify(toFields[i]));
                var origName= fld.name;
                fld.name = '2.'+fld.name.toLowerCase();
                fields.push(fld);
                fieldNames_safe.push('"' + fld.name + '"');
                selectFieldNames_safe.push('B."' + origName + '"');
            }
        
        var errors = '';
        var outDetails = {
            name:outputName,
            datasetName: uniqueTableName,
            workspace: 'postgres',
            datasetType: 'vector',
            shapeType: shapeType,
            shapeField: shapeField,
            oidField: oidField,
            spatialReference: {
                srid: srid
            },
            fields:fields,
            history:history
        };

var createVectorResult= await this.createVectorTable(outDetails);
        if(!createVectorResult.status){
            return createVectorResult;
        }

       

        var tbl = outDetails.datasetName;
        var fromTbl = fromDetails.datasetName;
        var toTbl = toDetails.datasetName;

        var fieldNamesExpr = fieldNames_safe.join(',');
        if (fieldNamesExpr)
            fieldNamesExpr = ',' + fieldNamesExpr;
        var fieldNamesExpr_A = fieldNames_safe_A.join(',');
            if (fieldNamesExpr_A)
                fieldNamesExpr_A = ',' + fieldNamesExpr_A;

        var selectfieldNamesExpr = selectFieldNames_safe.join(',');
        if (selectfieldNamesExpr)
             selectfieldNamesExpr = ',' + selectfieldNamesExpr;
        var selectfieldNamesExpr_A = selectFieldNames_safe_A.join(',');
             if (selectfieldNamesExpr_A)
                  selectfieldNamesExpr_A = ',' + selectfieldNamesExpr_A;
        
        var fromGeom=`ST_Transform (A.${fromDetails.shapeField}, ${srid})`;
        var toGeom=`ST_Transform (B.${toDetails.shapeField}, ${srid})`;
        var toGeom_un=`ST_Transform (${toDetails.shapeField}, ${srid})`;

        
        // Identity

        //keep disjoints
        var queryText = `
        INSERT INTO ${tbl}(${shapeField} ${fieldNamesExpr})
        SELECT DISTINCT ON (A.${fromOidField})  ${fromGeom} ${selectfieldNamesExpr}
        FROM ${fromTbl} as A
        LEFT JOIN ${toTbl} as B
            ON  ST_Intersects(${fromGeom},${toGeom}) 
            WHERE  B.${toOidField} IS NULL  ;`;
        
       // clip outsides
        //     queryText+= `INSERT INTO ${tbl}(${shapeField} ${fieldNamesExpr})
        // SELECT  ST_Difference(${fromGeom},${toGeom}) ${selectfieldNamesExpr}
        // FROM ${fromTbl} as A, ${toTbl} as B
        // WHERE ST_Intersects(${fromGeom},${toGeom}) = true AND ST_Within(${fromGeom},${toGeom}) = false ;
        // `;
queryText+=` with un as (select ST_Union(${toGeom_un}) as geom from  ${toTbl})
INSERT INTO ${tbl}(${shapeField} ${fieldNamesExpr_A})
SELECT  ST_Difference(${fromGeom},B.geom) ${selectfieldNamesExpr_A}
FROM ${fromTbl} as A
LEFT JOIN un as B
ON  ST_Intersects(${fromGeom},B.geom)  AND ST_Within(${fromGeom},B.geom) = false
    WHERE  (NOT B.geom IS NULL)   ;`

        //keep intersection
        queryText+=`INSERT INTO ${tbl}(${shapeField} ${fieldNamesExpr})
        SELECT  ST_Intersection(${fromGeom},${toGeom}) ${selectfieldNamesExpr}
        FROM ${fromTbl} as A, ${toTbl} as B
        WHERE ST_Intersects(${fromGeom},${toGeom}) = true ;
        `;
        // Note:
        /*
            Needs to exclude shapes that completely insides polygon overlay in step 2 (ST_Difference)
        */
        
        try {
            var results = await this.query({
                text: queryText
            });
            if (results) {
                //var result= results.rows[0];
                status = true;
            } else {
                status = false;
            }
        } catch (ex) {
            status = false;
            errors += '<br/>' + ex.message;
        }

        if (status) {
            try{
                var newLayer = await DataLayer.create({
                    name: outputName,
                    dataType: 'vector',
                    description: outputDescription || ('created from ' + (fromDetails.name || fromDetails.shapefileName || fromDetails.datasetName) + errors),
                    ownerUser: ownerUserId,
                    thumbnail: null,
                    details: JSON.stringify(outDetails)
                });
                if(newLayer){
                    return {
                        status:true,
                        id:newLayer.id
                        };
                }
            }catch(ex){
                status = false;
                errors += '<br/>' + ex.message;
            }
            return {
                status: status,
                errors: errors
            }

        }else
        {
            return {
                status: false,
                errors: errors
            } 
        }

    }

    async clipVector(DataLayer, ownerUserId, options) {
        var status = false;
        var fromDetails = options.details;
        var settings= options.settings;
        var clipOutside= settings.clipOutside || false;
        var toDetails= settings.otherDetails;
        var outputName = options.outputName || ((fromDetails.name || fromDetails.fileName) + '_ClippedBy_'+ (toDetails.name || toDetails.fileName) );
        var tableName = fromDetails.datasetName;
       
        var outputDescription= options.outputDescription || settings.outputDescription || '';
        
        var fromOidField= fromDetails.oidField || 'gid';
        var toOidField= toDetails.oidField || 'gid';
        var oidField =  'gid';
        var geom= 'geom';
        var shapeField = geom;
        var fromFields= fromDetails.fields || [];
        var toFields= toDetails.fields || [];
        var fields= [];
        var srid_from = fromDetails.spatialReference.srid || 3857;
        var srid_to = toDetails.spatialReference.srid || 3857;

        var srid = options.out_srid || srid_from;
        
        var from_shapeType= fromDetails.shapeType || 'Point';
        var to_shapeType= toDetails.shapeType || 'Point';
        var shapeType= from_shapeType;
       
        var history=fromDetails.history;
        if(!history){
            history=[];
        }
        history.push({
             task:'clipVector',
             settings:{
                outputName:options.outputName,
                otherLayerName:settings.otherLayerName,
                otherLayerId:settings.otherLayerId,
                out_srid:options.out_srid
             }
         });

       
        var uniqueTableName = 'clp_v_' + uuidv4().replace(new RegExp('-', 'g'), '');
        
        
        var fieldNames_safe = [];
        var selectFieldNames_safe = [];
        
        
        // fields.push({
        //     name:fromOidField,
        //     type:'integer'
        // })
        
        for (var i = 0; i < fromFields.length; i++) {
                var fld= JSON.parse(JSON.stringify(fromFields[i]));
                var origName= fld.name;
                fld.name = fld.name.toLowerCase();
                fields.push(fld);
                fieldNames_safe.push('"' + fld.name + '"');
                selectFieldNames_safe.push('A."' + origName + '"');
            }
        // for (var i = 0; i < toFields.length; i++) {
        //         var fld= JSON.parse(JSON.stringify(toFields[i]));
        //         var origName= fld.name;
        //         fld.name = '2.'+fld.name.toLowerCase();
        //         fields.push(fld);
        //         fieldNames_safe.push('"' + fld.name + '"');
        //         selectFieldNames_safe.push('B."' + origName + '"');
        //     }
        
        var errors = '';
        var outDetails = {
            name:outputName,
            datasetName: uniqueTableName,
            workspace: 'postgres',
            datasetType: 'vector',
            shapeType: shapeType,
            shapeField: shapeField,
            oidField: oidField,
            spatialReference: {
                srid: srid
            },
            fields:fields,
            history:history
        };

var createVectorResult= await this.createVectorTable(outDetails);
        if(!createVectorResult.status){
            return createVectorResult;
        }

       

        var tbl = outDetails.datasetName;
        var fromTbl = fromDetails.datasetName;
        var toTbl = toDetails.datasetName;

        var fieldNamesExpr = fieldNames_safe.join(',');
        if (fieldNamesExpr)
            fieldNamesExpr = ',' + fieldNamesExpr;

        var selectfieldNamesExpr = selectFieldNames_safe.join(',');
        if (selectfieldNamesExpr)
             selectfieldNamesExpr = ',' + selectfieldNamesExpr;
        //var fromGeom=`ST_Buffer( ST_Transform (${geom}, ${srid}) , ${distance}) as geom`;
        //var fromGeom=`ST_Buffer( ${geom} , ${distance}) as geom`;
        
        var fromGeom=`ST_Transform (A.${fromDetails.shapeField}, ${srid})`;
        var toGeom=`ST_Transform (B.${toDetails.shapeField}, ${srid})`;

        var queryText ='';
       
        if(clipOutside){ //Clip outside
        // queryText = `
        //     INSERT INTO ${tbl}(${shapeField} ${fieldNamesExpr})
        //     SELECT DISTINCT ON (A.${fromOidField})  ${fromGeom} ${selectfieldNamesExpr}
        //     FROM ${fromTbl} as A
        //     LEFT JOIN ${toTbl} as B
        //         ON  ST_Intersects(${fromGeom},${toGeom}) 
        //         WHERE  B.${toOidField} IS NULL  ;
            
        //     INSERT INTO ${tbl}(${shapeField} ${fieldNamesExpr})
        //     SELECT  ST_Difference(${fromGeom},${toGeom}) ${selectfieldNamesExpr}
        //     FROM ${fromTbl} as A, ${toTbl} as B
        //     WHERE ST_Intersects(${fromGeom},${toGeom}) = true AND ST_Within(${fromGeom},${toGeom}) = false ;

        //     `;
            queryText = `
            with un as (select ST_Union(ST_Transform (${toDetails.shapeField}, ${srid})) as geom from  ${toTbl})
            INSERT INTO ${tbl}(${shapeField} ${fieldNamesExpr})
            SELECT DISTINCT ON (A.${fromOidField})  ${fromGeom} ${selectfieldNamesExpr}
            FROM ${fromTbl} as A
            LEFT JOIN un as B
                ON  ST_Intersects(${fromGeom},B.geom) 
                WHERE  B.geom IS NULL  ;
            
            with un as (select ST_Union(ST_Transform (${toDetails.shapeField}, ${srid})) as geom from  ${toTbl})
            INSERT INTO ${tbl}(${shapeField} ${fieldNamesExpr})
            SELECT  ST_Difference(${fromGeom},B.geom) ${selectfieldNamesExpr}
            FROM ${fromTbl} as A
            LEFT JOIN un as B
            ON  ST_Intersects(${fromGeom},B.geom)  AND ST_Within(${fromGeom},B.geom) = false
                WHERE  (NOT B.geom IS NULL)   ;
            

            `;
        }else{  
            // clip inside
            queryText = `
            INSERT INTO ${tbl}(${shapeField} ${fieldNamesExpr})
            SELECT  ST_Intersection(${fromGeom},${toGeom}) ${selectfieldNamesExpr}
            FROM ${fromTbl} as A, ${toTbl} as B
            WHERE ST_Intersects(${fromGeom},${toGeom}) = true ;
            `;
           
        }
        try {
            var results = await this.query({
                text: queryText
            });
            if (results) {
                //var result= results.rows[0];
                status = true;
            } else {
                status = false;
            }
        } catch (ex) {
            status = false;
            errors += '<br/>' + ex.message;
        }

        if (status) {
            try{
                var newLayer = await DataLayer.create({
                    name: outputName,
                    dataType: 'vector',
                    description: outputDescription || ('created from ' + (fromDetails.name || fromDetails.shapefileName || fromDetails.datasetName) + errors),
                    ownerUser: ownerUserId,
                    thumbnail: null,
                    details: JSON.stringify(outDetails)
                });
                if(newLayer){
                    return {
                        status:true,
                        id:newLayer.id
                        };
                }
            }catch(ex){
                status = false;
                errors += '<br/>' + ex.message;
            }
            return {
                status: status,
                errors: errors
            }

        }else
        {
            return {
                status: false,
                errors: errors
            } 
        }

    }
    async dissolve(DataLayer, ownerUserId, options) {
        var status = false;
        var fromDetails = options.details;
        var outputName = options.outputName || ((fromDetails.name || fromDetails.fileName) + '-Dissolve');
        var tableName = fromDetails.datasetName;
        var settings=options.settings;
        if(!settings){
            settings={
                dissolve:{
                    dissolveField:undefined
                }
            }
        }
        var dissolveSettings= settings.dissolve;

        var outputDescription= options.outputDescription || settings.outputDescription || '';
        
        var oidField = fromDetails.oidField || 'gid';
        var geom= fromDetails.shapeField ||'geom';
        var shapeType= fromDetails.shapeType;
        var shapeField = geom;
        var orgFields= fromDetails.fields || [];
        var srid =settings.out_srid || options.out_srid || fromDetails.spatialReference.srid;
        
        var history=fromDetails.history;
        if(!history){
            history=[];
        }
        history.push({
             task:'dissolve',
             settings:{
                outputName:options.outputName,
                dissolve:settings.dissolve,
                out_srid:options.out_srid
             }
         });

        var uniqueTableName = 'dissolve' + uuidv4().replace(new RegExp('-', 'g'), '');
        var fields=[];
        var fieldNames_select=[];
        function getFieldByName(fieldArray,fieldName){
            for(var i=0;i<fieldArray.length;i++){
                if(fieldName.toLowerCase()=== fieldArray[i].name.toLowerCase()){
                    return fieldArray[i];
                }
            }
            return null;
        }
        
        var dissolveField= getFieldByName(orgFields,dissolveSettings.dissolveField);
        if(!dissolveField){
            return {
                status: false,
                errors: 'Dissolve field not found'
            } 
        }
        fields.push(dissolveField);
        fieldNames_select.push(dissolveField.name.toLowerCase());

        var statistics_orig= dissolveSettings.statistics ||[];
        var statistics=[]
        for(var i=0;i< statistics_orig.length;i++){
            var stat= statistics_orig[i];
            var fld= getFieldByName(orgFields,stat.field);
            if(fld){
                var field={name:fld.name,alias:fld.alias,type:fld.type,length:fld.length,scale:fld.scale}
                if(stat.statistic=='COUNT'){
                    field.name= fld.name+'_Count';
                    field.alias= 'Count of '+ (fld.alias || fld.name);
                    field.type= 'integer';
                    field.length=undefined;
                    field.scale=undefined;
                    fieldNames_select.push( 'COUNT(' + fld.name.toLowerCase()+')');
                }else if(stat.statistic=='SUM'){
                    field.name= fld.name+'_Sum';
                    field.alias= 'Sum of '+ (fld.alias || fld.name);
                    field.type= 'numeric';
                    field.length=undefined;
                    field.scale=undefined;
                    fieldNames_select.push( 'SUM(' + fld.name.toLowerCase()+')');
                }else if (stat.statistic=='MIN'){
                    field.name= fld.name+'_Min';
                    field.alias= 'Minimum of '+ (fld.alias || fld.name);
                    fieldNames_select.push( 'MIN(' + fld.name.toLowerCase()+')');
                }else if (stat.statistic=='MAX'){
                    field.name= fld.name+'_Max';
                    field.alias= 'Maximum of '+ (fld.alias || fld.name);
                    fieldNames_select.push( 'MAX(' + fld.name.toLowerCase()+')');
                }else if (stat.statistic=='AVG'){
                    field.name= fld.name+'_Avg';
                    field.alias= 'Average of '+ (fld.alias || fld.name);
                    fieldNames_select.push( 'AVG(' + fld.name.toLowerCase()+')');
                }
                fields.push(field);
                statistics.push(stat);
            }
        }

        var fieldNames = [];
        var fieldNames_safe = [];
        if (fields) {
            for (var i = 0; i < fields.length; i++) {
                fields[i].name = fields[i].name.toLowerCase();
                fieldNames.push(fields[i].name);
                fieldNames_safe.push('"' + fields[i].name + '"');
            }
        }
        var errors = '';
        var outDetails = {
            name:outputName,
            datasetName: uniqueTableName,
            workspace: 'postgres',
            datasetType: 'vector',
            shapeType: shapeType,
            shapeField: shapeField,
            oidField: oidField,
            spatialReference: {
                srid: srid
            },
            fields:fields,
            history:history
        };

var createVectorResult= await this.createVectorTable(outDetails);
        if(!createVectorResult.status){
            return createVectorResult;
        }

       

        var tbl = outDetails.datasetName;
        var fromTbl = fromDetails.datasetName;

        var fieldNamesExpr = fieldNames_safe.join(',');
        if (fieldNamesExpr)
            fieldNamesExpr = ',' + fieldNamesExpr;
        var fieldNamesExpr_select = fieldNames_select.join(',');
        if (fieldNamesExpr_select)
                fieldNamesExpr_select = ',' + fieldNamesExpr_select;

        //var fromGeom=`ST_Buffer( ST_Transform (${geom}, ${srid}) , ${distance}) as geom`;
        //var fromGeom=`ST_Buffer( ${geom} , ${distance}) as geom`;
        var fromGeom0=`ST_Union(${geom})`;
        var fromGeom=`ST_Transform (${fromGeom0}, ${srid}) as geom`;
        var queryText = `
        INSERT INTO ${tbl}(${shapeField} ${fieldNamesExpr})
        SELECT ${fromGeom} ${fieldNamesExpr_select}
        FROM ${fromTbl} GROUP BY ${dissolveField.name};`;
        try {
            var results = await this.query({
                text: queryText
            });
            if (results) {
                //var result= results.rows[0];
                status = true;
            } else {
                status = false;
            }
        } catch (ex) {
            status = false;
            errors += '<br/>' + ex.message;
        }

        if (status) {
            try{
                var newLayer = await DataLayer.create({
                    name: outputName,
                    dataType: 'vector',
                    description: outputDescription || ('created from ' + (fromDetails.name || fromDetails.shapefileName || fromDetails.datasetName) + errors),
                    ownerUser: ownerUserId,
                    thumbnail: null,
                    details: JSON.stringify(outDetails)
                });
                if(newLayer){
                    return {
                        status:true,
                        id:newLayer.id
                        };
                }
            }catch(ex){
                status = false;
                errors += '<br/>' + ex.message;
            }
            return {
                status: status,
                errors: errors
            }

        }else
        {
            return {
                status: false,
                errors: errors
            } 
        }

    }
     checkSQlExpression(queryText)
    {
        var Regex_IsMatch=function(text,regpattern){
            //return (new RegExp(pattern)).test(text);
            return regpattern.test(text);
        }
        var result={};
        result.valid=true;
        result.message = "";
         var str = [];
        if (!queryText)
        {
            return result;
        }
        queryText=''+queryText;
        queryText = queryText.toLowerCase();
        if (queryText.includes(";"))
        {
            str.push("Unsupported  ';' character.");
            result.valid = false;
        }
        if (queryText.includes("--"))
        {
            str.push("Unsupported use of '--' characters.");
            result.valid = false;
        }
        if (queryText.includes("/*"))
        {
            str.push("Unsupported use of '/*' characters.");
            result.valid = false;
        }
        if (queryText.includes("*/"))
        {
            str.push("Unsupported use of '*/' characters.");
            result.valid = false;
        }

        //todo: regex 
        if (queryText.includes("char"))
        {
            if (Regex_IsMatch( queryText,(/\schar\s*\(/)))
            {
                str.push("Unsupported use of 'Char' function.");
                result.valid = false;
            }
            
        }
        
        //if (queryText.includes("chr"))
        //{
        //    str.push("Unsupported use of 'char' characters");
        //    result.valid = false;
        //}
        //if (queryText.includes("0x"))
        //{
        //    str.push("Unsupported use of '0x' characters");
        //    result.valid = false;
        //}
       
        if (queryText.includes("concat"))
        {
            if (Regex_IsMatch(queryText, (/concat\s*\(/)))
            {
                str.push("Unsupported use of 'CONCAT' command.");
                result.valid = false;
            }
        }
        if (queryText.includes("drop"))
        {
            if (Regex_IsMatch(queryText, (/drop\s*table/)))
            {
                str.push("Unsupported use of 'Drop Table' command.");
                result.valid = false;
            }else if (Regex_IsMatch(queryText, (/\bdrop\b/)))
            {
                str.push("Forbidden word 'Drop' found in query.");
                result.valid = false;
            }
        }
        //CREATE
        if (queryText.includes("create"))
        {
            if (Regex_IsMatch(queryText, (/\bcreate\b/)))
            {
                str.push("Forbidden word 'Create' found in query.");
                result.valid = false;
            }
        }
        if (queryText.includes("grant"))
        {
            if (Regex_IsMatch(queryText, (/\bgrant\b/)))
            {
                str.push("Forbidden word 'grant' found in query.");
                result.valid = false;
            }
        }
        if (queryText.includes("revoke"))
        {
            if (Regex_IsMatch(queryText, (/\brevoke\b/)))
            {
                str.push("Forbidden word 'revoke' found in query.");
                result.valid = false;
            }
        }
        if (queryText.includes("alter"))
        {
            if (Regex_IsMatch(queryText, (/\balter\b/)))
            {
                str.push("Forbidden word 'alter' found in query.");
                result.valid = false;
            }
        }
        if (queryText.includes("update"))
        {
            if (Regex_IsMatch(queryText, (/update\s*table/)))
            {
                str.push("Unsupported use of 'Update Table' command.");
                result.valid = false;
            }
        }
        if (queryText.includes("insert"))
        {
            if (Regex_IsMatch(queryText, (/insert\s*into/)))
            {
                str.push("Unsupported use of 'Insert Into' command.");
                result.valid = false;
            }
        }
        if (queryText.includes("select"))
        {
            if (Regex_IsMatch(queryText, (/select\s/)))
            {
                str.push("Forbidden word 'Select' found in query.");
                result.valid = false;
            }
        }
        if (queryText.includes("delete"))
        {
            if (Regex_IsMatch(queryText, (/delete\s/)))
            {
                str.push("Forbidden word 'Delete' found in query.");
                result.valid = false;
            }
        }
        if (queryText.includes("exec"))
        {
            if (Regex_IsMatch(queryText, (/exec\s/)))
            {
                str.push("Forbidden word 'Exec' found in query.");
                result.valid = false;
            }
        }
        if (queryText.includes("shutdown"))
        {
          //  if (Regex_IsMatch(queryText, (/shutdown\s/)))
          //  {
                str.push("Forbidden word 'Shutdown' found in query.");
                result.valid = false;
         //   }
        }
        if (queryText.includes("syscolumns"))
        {
           // if (Regex_IsMatch(queryText, (/syscolumns\s/)))
          //  {
                str.push("Forbidden word 'syscolumns' found in query.");
                result.valid = false;
          //  }
        }
        if (queryText.includes("sysobjects"))
        {
            //if (Regex_IsMatch(queryText, (/sysobjects/)))
           // {
                str.push("Forbidden word 'sysobjects' found in query.");
                result.valid = false;
           // }
        }
        
          if (queryText.includes("waitfor"))
        {
            if (Regex_IsMatch(queryText, (/waitfor\s*delay/)))
            {
                str.push("Forbidden word 'waitfor delay' found in query.");
                result.valid = false;
            }
        }
        if (queryText.includes("sleep"))
        {
            if (Regex_IsMatch(queryText, (/sleep\s*\(/)))
            {
                str.push("Forbidden word 'Sleep' found in query.");
                result.valid = false;
            }
        }
        
    if (queryText.includes("benchmark"))
        {
            if (Regex_IsMatch(queryText, (/benchmark\s*\(/)))
            {
                str.push("Unsupported use of 'benchmark' command.");
                result.valid = false;
            }
        }
        if (queryText.includes("version"))
        {
            if (Regex_IsMatch(queryText, (/version\s*\(/)))
            {
                str.push("Unsupported use of 'version' command.");
                result.valid = false;
            }
        }
        if (queryText.includes("union all") || queryText.includes("union select"))
        {
           // if (Regex_IsMatch(queryText, (/version\s*\(/)))
            {
                str.push("Unsupported use of 'union' command.");
                result.valid = false;
            }
        }
        if (queryText.includes("information_schema"))
        {
           // if (Regex_IsMatch(queryText, (/version\s*\(/)))
          //  {
                str.push("Forbidden word 'information_schema' found in query");
                result.valid = false;
           // }
        }
        
        if (!this.isBalanced_parenthesis(queryText))
        {
            str.push("Unclosed parenthesis found.");
            result.valid = false;
        }

        result.message = str.join('');
        return result;
    }
    isBalanced_parenthesis(inputStr) {
  //      var tokens = [ ['{','}'] , ['[',']'] , ['(',')'] ];
        var tokens = [ ['(',')'] ];

        if (inputStr === null) { return true; }
        var isParanthesis=function (char) {
           // var str = '{}[]()';
           var str = '()';
            if (str.indexOf(char) > -1) {
              return true;
            } else {
              return false;
            }
          };
        var isOpenParenthesis=function(parenthesisChar) {
            for (var j = 0; j < tokens.length; j++) {
              if (tokens[j][0] === parenthesisChar) {
                return true;
              }
            }
            return false;
          };
        var matches=function(topOfStack, closedParenthesis) {
            for (var k = 0; k < tokens.length; k++) {
              if (tokens[k][0] === topOfStack && 
                  tokens[k][1] === closedParenthesis) {
                return true;
              }
            }
            return false;
          };

          var expression = inputStr.split('');
          var stack = [];
        
          for (var i = 0; i < expression.length; i++) {
            if (isParanthesis(expression[i])) {
              if (isOpenParenthesis(expression[i])) {
                stack.push(expression[i]);
              } else {
                if (stack.length === 0) {
                  return (false);
                }
                var top = stack.pop(); // pop off the top element from stack
                if (!matches(top, expression[i])) {
                  return (false);
                }
              }
            }
          }
        
          var returnValue = stack.length === 0 ? true : false;
          return (returnValue);
        }
};
module.exports = function(connectionSettings,readonlyConnectionString) {
    var module = {};

    //module.exports = new PostgresWorkspace(connectionSettings);
    //return module;
    return new PostgresWorkspace(connectionSettings,readonlyConnectionString);
}