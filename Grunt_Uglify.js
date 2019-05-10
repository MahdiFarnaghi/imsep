module.exports = {
    options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        sourceMap: false,
        compress:true
     },
    app: {
        src:['<%= concat.app.dest %>'],
        dest: 'public/dist/js/app-<%= pkg.version %>-min.js'
    },
    uploadShapefile_page:{
        src:['public/js/pages/dataLayer/uploadShapefile_page.js'],
        dest: 'public/dist/js/uploadShapefile_page-<%= pkg.version %>-min.js'
    },
    uploadRaster_page:{
        src:['public/js/pages/dataLayer/uploadRaster_page.js'],
        dest: 'public/dist/js/uploadRaster_page-<%= pkg.version %>-min.js'
    },
    dataLayer_vector_page:{
        src:['public/js/pages/dataLayer/dataLayer_vector_page.js'],
        dest: 'public/dist/js/dataLayer_vector_page-<%= pkg.version %>-min.js'
    },
    dataLayer_raster_page:{
        src:['public/js/pages/dataLayer/dataLayer_raster_page.js'],
        dest: 'public/dist/js/dataLayer_raster_page-<%= pkg.version %>-min.js'
    },
    group_page:{
        src:['public/js/pages/admin/group_page.js'],
        dest: 'public/dist/js/group_page-<%= pkg.version %>-min.js'
    },
    
    map_page:{
        src:['public/js/pages/map/map_page.js'],
        dest: 'public/dist/js/map_page-<%= pkg.version %>-min.js'
    },
    map:{
        src:[
            'public/js/map/custom/ol-ext/Transform.js',
            'public/js/map/custom/ol-ext/LayerSwitcher.js',
            'public/js/map/custom/ol-ext/Popup.js',
            'public/js/map/custom/ol-ext/Control-Bar.js',
            'public/js/map/custom/ol-ext/Search.js',
            'public/js/map/custom/ol-ext/CustomStyles.js',
            'public/js/map/custom/ol-ext/FontMakiDef.js',
            'public/js/map/custom/ol-ext/FontMaki2Def.js',
            'public/js/map/custom/ol-ext/FontAwesomeDef.js',
            'public/js/map/custom/ol-ext/GeoImage.js',
            'public/js/map/custom/ol-ext/Legend.js',
            'public/js/map/custom/ol-ext/CanvasScaleLine.js',
             
            
            
            'public/js/map/LayerHelper.js',
            'public/js/map/PrintUtil.js',

            'public/js/map/StyleFactory.js',
            'public/js/map/renderers/simpleRenderer.js',
            'public/js/map/renderers/uniqueValueRenderer.js',
            'public/js/map/renderers/rangeValueRenderer.js',
            'public/js/map/renderers/RendererFactory.js',
        
            'public/js/map/renderers/featureLabeler.js',
            
        
            'public/js/map/sourceFactory.js',
            'public/js/map/tasks/dlgTaskBase.js',
            'public/js/map/tasks/dlgPrint.js',
            
            'public/js/map/tasks/layerTasks.js',
            'public/js/map/tasks/vectorLayerSelectTask.js',
            'public/js/map/tasks/vectorLayerEditTask.js',
            'public/js/map/tasks/vectorLayerAnalysisTask.js',
            'public/js/map/tasks/dlgBuffer.js',
            'public/js/map/tasks/dlgIdentity.js',
            'public/js/map/tasks/dlgIntersection.js',
            'public/js/map/tasks/dlgClip.js',
            'public/js/map/tasks/dlgDissolve.js',
            'public/js/map/tasks/dlgVectorSearch.js',
            'public/js/map/tasks/dlgVectorTableView.js',
                
            'public/js/map/tasks/dlgOSMFilter.js',
            'public/js/map/tasks/dlgOSMShapeTypeSelection.js',
            'public/js/map/tasks/dlgOSMTagSelection.js',
            'public/js/map/tasks/dlgAddGeoJSON.js',
            'public/js/map/tasks/dlgWCS.js',
            
        
        
            
        
            'public/js/map/tasks/rasterLayerValueTask.js',
            'public/js/map/tasks/rasterLayerAnalysisTask.js',
            'public/js/map/tasks/dlgSlope.js',
            'public/js/map/tasks/dlgHillshade.js',
            'public/js/map/tasks/dlgRasterClassify.js',
            'public/js/map/tasks/dlgRasterPointBasedFloodArea.js',
            
            
            
            'public/js/map/tasks/measureTasks.js',
            'public/js/map/tasks/routeTasks.js',
            'public/js/map/tasks/geolocationTasks.js',
            
        
            'public/js/map/mapContainer.js',
        
            'public/js/map/propertyTabs/layerGeneralTab.js',
            'public/js/map/propertyTabs/layerStyleTab.js',
            'public/js/map/propertyTabs/layerLabelTab.js',
            'public/js/map/propertyTabs/layerSourceTab.js',
            
            'public/js/map/propertyTabs/featureAttributesTab.js',
            'public/js/map/propertyTabs/featureShapeTab.js',
            'public/js/map/propertyTabs/featurePointTab.js',
            
        
            'public/js/map/propertyTabs/styleImageTab.js',
            'public/js/map/propertyTabs/styleFillTab.js',
            'public/js/map/propertyTabs/styleStrokeTab.js',
            'public/js/map/propertyTabs/rasterDisplayTab.js',
            'public/js/map/objectPropertiesDlg.js'
        ],
        dest: 'public/dist/js/map-<%= pkg.version %>-min.js'
    }
  }