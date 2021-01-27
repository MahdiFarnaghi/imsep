var PrintData={
     a0: {w:1189, h:841},
     a1: {w:841, h:594},
     a2: {w:594, h:420},
     a2p: {h:594, w:420},
     a3: {w:420, h:297},
     a3p: {h:420, w:297},
     a4: {w:297, h:210},
     a4p: {h:297, w:210},
     a5: {w:210, h:148},
     resolutions:{
          'Coarse (fast)':96,
          'Medium':150,
          'Fine (slow)':300
     },
     compass_url:'/images/print/compass.png',
     compass_data:undefined,
     compass_image:undefined,
     thumbnail_75_url:'/css/images/earth75.png',
     thumbnail_75_data:undefined,
     toDataURL:function (url, callback) {
          var xhr = new XMLHttpRequest();
          xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
              callback(reader.result);
            }
            reader.readAsDataURL(xhr.response);
          };
          try{
               xhr.open('GET', url);
               xhr.responseType = 'blob';
               xhr.send();
          }catch(ex){
               console.log('Error:', ex)
          }
        }
};
$(function () {

     setTimeout(function(){
          PrintData.toDataURL(PrintData.thumbnail_75_url, function(dataUrl) {
               PrintData.thumbnail_75_data = dataUrl;
          });
     },1000);
     setTimeout(function(){
          PrintData.toDataURL(PrintData.compass_url, function(dataUrl) {
               PrintData.compass_data = dataUrl;
               var image = new Image();
               image.onload = function() {
                    PrintData.compass_image=image;
               };
               image.src=dataUrl;
          });
     },4000)
     
});
var PrintUtil={
  
     templates:[
        
          {
               name:'A4 landscape',
               orientation:'landscape',
               thumbnail:'/images/print/A4 landscape.png',
               pageSize:'a4',
               
               width:PrintData.a4.w,
               height: PrintData.a4.h,
               borderWidth:0.5,
               borderOffset:1,

               resolution:150,

               defaults:{
                    font:'times',
                    fontStyle:'normal',
                    fontSize:12,
                    textColor:'black',
                    lineWidth:0.5,
                    lineColor:'rgb(50, 50, 50)'
               },
               mapFrame:{
                    left:10+67,
                    top:15,
                    width:PrintData.a4.w-(10+67)-5,
                    height:PrintData.a4.h - 15-10,
                    borderWidth:0.2
               },
               scaleBar:{
                    left:5,// relative to mapFrame
                    top:(PrintData.a4.h - 15-10)-7,
                    width:50,
                    font:"20px Arial"// resolution/72*10px
               }, 
               
               elements:[
                    
                    {
                         type:'image',
                         name:'logo',
                         imageData:function(){return PrintData.thumbnail_75_data;},
                        
                         format:'PNG',
                         left:5,
                         top:3,
                         width:10,height:10
                    },
                    {
                         type:'box',
                         name:'compass-border',
                         left:PrintData.a4.w -10-5-3,
                         top:PrintData.a4.h - 10-10-3,
                         width:10,height:10,
                         lineColor:'rgb(100,100,100)',
                         fillColor:'#ffffff82',
                         borderWidth:0.2
                    }, 
                    {
                         type:'image',
                         rotation:'{north}',
                         name:'compass',
                         imageData:function(){return PrintData.compass_data;},
                         image:function(){return PrintData.compass_image;},
                        
                         format:'PNG',
                         left:PrintData.a4.w -10-5-3,
                         //top:3,
                         top:PrintData.a4.h - 10-10-3,
                         width:10,height:10
                    },
                    {
                         type:'text',
                         name:'logo-title',
                         text:'{site-name}',
                         left:10+5,
                         top:3+5,
                         fontSize:14,
                         textColor:'#0471a0',
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'middle'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'title',
                         text:'{name}',
                         left:10+67 + ((PrintData.a4.w-(10+67)-10)/2),
                         top:10,
                         fontSize:14,
                         align:'center',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'description',
                         text:'{description}',
                         left:10,//10+200+10,
                         //top:15+5,//+ 160+5+5,
                         top: 15+5+5+ (PrintData.a4.h- (75)-10-1)+5,
                         width:67-3,
                         fontSize:12,
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'top'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    
                    {
                         type:'text',
                         name:'app-footer',
                         text:'{app-footer}',
                         left:5,
                         top:PrintData.a4.h-5,
                         fontSize:10,
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    }, 
                    {
                         type:'text',
                         name:'map-copyright',
                         text:'{map-copyrights}, User: {user-id}, Date:{dateTime_local} ',
                         left:PrintData.a4.w-5,
                         top:PrintData.a4.h-5,
                         fontSize:10,
                         align:'right',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    }, 
                    {
                         type:'text',
                         name:'legend-title',
                         text:'Legend',
                         left:10,
                         //top:75-5,
                         top:15+5,
                         fontSize:10,
                         align:'left',
                         baseline:'top',
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    }, 
                    {
                         type:'line',
                         x1:10,
                         //y1:75,
                         y1:15+5+5,
                         x2:10+ 67-5,
                         //y2:75,
                         y2:15+5+5,
                         lineWidth:0.2,
                         lineColor:'rgb(200,200,200)',
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    } ,
                    {
                         type:'legend',
                         left:5+2,
                        // top: 75,//15+ 160+5 +5 ,
                         top:15+5+5,
                         width:67-1,
                         height:PrintData.a4.h- (75)-10-1,
                         columnCount:1,//column-count
                         scaleFactor:1.5,
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    },
                    {
                         type:'box',
                         left:5,
                         top:15,
                         width:(67+3),
                         height:PrintData.a4.h - 15-10,
                         borderWidth:0.2
                    } 
               ]
              
               
                      

          },
          {
               name:'A4 portrait',
               orientation:'portrait',
               thumbnail:'/images/print/A4 portrait.png',
               pageSize:'a4',
               
               width:PrintData.a4p.w,
               height:PrintData.a4p.h,
               
               borderWidth:0.5,
               borderOffset:1,

               resolution:150,

               defaults:{
                    font:'times',
                    fontStyle:'normal',
                    fontSize:12,
                    textColor:'black',
                    lineWidth:0.5,
                    lineColor:'rgb(50, 50, 50)'
               },
               mapFrame:{
                    
                    left:5,
                    top:15,
                    width:PrintData.a4p.w-5-5,
                    height:PrintData.a4p.h -(15+67)-10,
                    borderWidth:0.2
               },
               scaleBar:{
                    left:5,// relative to mapFrame
                    top:(PrintData.a4p.h -(15+67)-10)-10,
                    width:50,
                    font:"20px Arial"// resolution/72*10px
               }, 
               
               elements:[
                    {
                         type:'image',
                         name:'logo',
                         imageData:function(){return PrintData.thumbnail_75_data;},
                         format:'PNG',
                         left:5,
                         top:3,
                         width:10,height:10
                    },
                   
                    {
                         type:'box',
                         name:'compass-border',
                         left:PrintData.a4p.w -10-5-3,
                         top:PrintData.a4p.h -(15+67)-5-3,
                         width:10,height:10,
                         lineColor:'rgb(100,100,100)',
                         fillColor:'#ffffff82',
                         borderWidth:0.2
                    }, 
                    {
                         type:'image',
                         rotation:'{north}',
                         name:'compass',
                         imageData:function(){return PrintData.compass_data;},
                         image:function(){return PrintData.compass_image;},
                        
                         format:'PNG',
                         left:PrintData.a4p.w -10-5-3,
                         //top:3,
                         top:PrintData.a4p.h -(15+67)-5-3,
                         width:10,height:10
                    },
                    {
                         type:'text',
                         name:'logo-title',
                         text:'{site-name}',
                         left:10+5,
                         top:3+5,
                         fontSize:14,
                         textColor:'#0471a0',
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'middle'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'title',
                         text:'{name}',
                         left: ((PrintData.a4p.w/2)),
                         top:10,
                         fontSize:14,
                         align:'center',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'description',
                         text:'{description}',
                         //left:10,//10+200+10,
                         left:5+5+PrintData.a4p.w -(67+10+10)-10,
                         top:PrintData.a4p.h -(67+10-3-5+3),
                         width:67-3,
                         fontSize:12,
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'top'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    
                    {
                         type:'text',
                         name:'app-footer',
                         text:'{app-footer}',
                         left:5,
                         top:PrintData.a4p.h-5,
                         fontSize:10,
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    }, 
                    {
                         type:'text',
                         name:'map-copyright',
                         text:'{map-copyrights}, User: {user-id}, Date:{dateTime_local} ',
                         left:PrintData.a4p.w-5,
                         top:PrintData.a4p.h-5,
                         fontSize:10,
                         align:'right',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'legend-title',
                         text:'Legend',
                        // left:10+67+10+3,
                        left:5+3,
                         top:PrintData.a4p.h -(67+10-3-5-5+3)-5,
                         fontSize:10,
                         align:'left',
                         baseline:'top',
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    }, 
                    {
                         type:'line',
                       //  x1:10+67 +10,
                         x1:5+3,
                         y1:PrintData.a4p.h -(67+10-3-5-5+3),
                        // x2:10+67 +10+PrintData.a4p.w -(67+10+10)-10,
                         x2:5+3+ PrintData.a4p.w -(67+10+10)-10,
                         y2:PrintData.a4p.h -(67+10-3-5-5+3),
                         lineWidth:0.2,
                         lineColor:'rgb(200,200,200)',
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    } ,
                  
                    {
                         type:'legend',
                        // left:10+67 +10,
                          left:5+3,
                         
                         top:PrintData.a4p.h -(67+10-3-5-5+3),
                         
                         width:PrintData.a4p.w -(67+10+10)-10,
                         height:67-3-10,
                         columnCount:3,//column-count
                         scaleFactor:1.5,
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                         
                    },
                    {
                         type:'box',
                         left:5,
                         top:PrintData.a4p.h -(67+10-3),
                         width:PrintData.a4p.w-(5)-5,
                         height:67-3,
                         borderWidth:0.2
                    } 
               ]

          },
          {
               name:'A3 landscape',
               orientation:'landscape',
               thumbnail:'/images/print/A3 landscape.png',
               pageSize:'a3',
               
               width:PrintData.a3.w,//420,
               height:PrintData.a3.h,//297,
               borderWidth:0.5,
               borderOffset:1,

               resolution:150,

               defaults:{
                    font:'times',
                    fontStyle:'normal',
                    fontSize:12,
                    textColor:'black',
                    lineWidth:0.5,
                    lineColor:'rgb(50, 50, 50)'
               },
               mapFrame:{
                    
                    left:10+67,
                    top:15,
                    width:PrintData.a3.w-(10+67)-5,
                    height:PrintData.a3.h - 15-10,
                    borderWidth:0.2
               },
               scaleBar:{
                    left:5,// relative to mapFrame
                    top:(PrintData.a3.h-15-10)-10,
                    width:50,
                    font:"20px Arial"// resolution/72*10px
               }, 
               
               elements:[
                    {
                         type:'image',
                         name:'logo',
                         imageData:function(){return PrintData.thumbnail_75_data;},
                         format:'PNG',
                         left:5,
                         top:3,
                         width:10,height:10
                    },
                  
                    {
                         type:'box',
                         name:'compass-border',
                         left:PrintData.a3.w -10-5-3,
                         top:PrintData.a3.h - 10-10-3,
                         width:10,height:10,
                         lineColor:'rgb(100,100,100)',
                         fillColor:'#ffffff82',
                         borderWidth:0.2
                    }, 
                    {
                         type:'image',
                         rotation:'{north}',
                         name:'compass',
                         imageData:function(){return PrintData.compass_data;},
                         image:function(){return PrintData.compass_image;},
                        
                         format:'PNG',
                         left:PrintData.a3.w -10-5-3,
                         //top:3,
                         top:PrintData.a3.h - 10-10-3,
                         width:10,height:10
                    },
                    {
                         type:'text',
                         name:'logo-title',
                         text:'{site-name}',
                         left:10+5,
                         top:3+5,
                         fontSize:14,
                         textColor:'#0471a0',
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'middle'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'title',
                         text:'{name}',
                         left:10+67 + ((PrintData.a3.w - (10+67)-10)/2),
                         top:10,
                         fontSize:14,
                         align:'center',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'description',
                         text:'{description}',
                         left:10,//10+200+10,
                         //top:15+5,//+ 160+5+5,
                         top: 15+5 +5+3 +PrintData.a3.h- (80)-10-1,
                         width:67-3,
                         fontSize:12,
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'top'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    
                    {
                         type:'text',
                         name:'app-footer',
                         text:'{app-footer}',
                         left:5,
                         top:PrintData.a3.h-5,
                         fontSize:10,
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    }, 
                    {
                         type:'text',
                         name:'map-copyright',
                         text:'{map-copyrights}, User: {user-id}, Date:{dateTime_local} ',
                         left:PrintData.a3.w-5,
                         top:PrintData.a3.h-5,
                         fontSize:10,
                         align:'right',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    }, 
                    {
                         type:'text',
                         name:'legend-title',
                         text:'Legend',
                         left:10,
                         //top:80-5,
                         top:15+5,
                         fontSize:10,
                         align:'left',
                         baseline:'top',
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    }, 
                    {
                         type:'line',
                         x1:10,
                         //y1:80,
                         y1:15+5+5,
                         x2:10+ 67-5,
                         //y2:80,
                         y2:15+5+5,
                         lineWidth:0.2,
                         lineColor:'rgb(200,200,200)',
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    } ,
                    {
                         type:'legend',
                         left:5+2,
                         //top: 80,//15+ 160+5 +5 ,
                         top:15+5+5,
                         width:67-1,
                         height:PrintData.a3.h- (80)-10-1,
                         columnCount:1,//column-count
                         scaleFactor:1,
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    },
                    
                    {
                         type:'box',
                         left:5,
                         top:15,
                         width:(67+3),
                         height:PrintData.a3.h - 15-10,
                         borderWidth:0.2
                    } 
               ]

          },
          {
               name:'A3 portrait',
               orientation:'portrait',
               thumbnail:'/images/print/A3 portrait.png',
               pageSize:'a3',
               
               width:PrintData.a3p.w,//297,
               height:PrintData.a3p.h,//420,
               
               borderWidth:0.5,
               borderOffset:1,

               resolution:150,

               defaults:{
                    font:'times',
                    fontStyle:'normal',
                    fontSize:12,
                    textColor:'black',
                    lineWidth:0.5,
                    lineColor:'rgb(50, 50, 50)'
               },
               mapFrame:{
                    
                    left:5,
                    top:15,
                    width:PrintData.a3p.w-5-5,
                    height:PrintData.a3p.h -(15+67)-10,
                    borderWidth:0.2
               },
               scaleBar:{
                    left:5,// relative to mapFrame
                    top:(PrintData.a3p.h -(15+67)-10)-10,
                    width:50,
                    font:"20px Arial"// resolution/72*10px
               }, 
               
               elements:[
                    {
                         type:'image',
                         name:'logo',
                         imageData:function(){return PrintData.thumbnail_75_data;},
                         format:'PNG',
                         left:5,
                         top:3,
                         width:10,height:10
                    },
                   
                    {
                         type:'box',
                         name:'compass-border',
                         left:PrintData.a3p.w -10-5-3,
                         top:PrintData.a3p.h -(15+67)-5-3,
                         width:10,height:10,
                         lineColor:'rgb(100,100,100)',
                         fillColor:'#ffffff82',
                         borderWidth:0.2
                    }, 
                    {
                         type:'image',
                         rotation:'{north}',
                         name:'compass',
                         imageData:function(){return PrintData.compass_data;},
                         image:function(){return PrintData.compass_image;},
                        
                         format:'PNG',
                         left:PrintData.a3p.w -10-5-3,
                         //top:3,
                         top:PrintData.a3p.h -(15+67)-5-3,
                         width:10,height:10
                    },
                    {
                         type:'text',
                         name:'logo-title',
                         text:'{site-name}',
                         left:10+5,
                         top:3+5,
                         fontSize:14,
                         textColor:'#0471a0',
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'middle'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'title',
                         text:'{name}',
                         left: ((PrintData.a3p.w/2)),
                         top:10,
                         fontSize:14,
                         align:'center',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'description',
                         text:'{description}',
                         left:10+PrintData.a3p.w -(67+40+10+10)-10,//10+200+10,
                         top:PrintData.a3p.h -(67+10-3-5+3),
                         width:67+40-3,
                         fontSize:12,
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'top'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    
                    {
                         type:'text',
                         name:'app-footer',
                         text:'{app-footer}',
                         left:5,
                         top:PrintData.a3p.h-5,
                         fontSize:10,
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    }, 
                    {
                         type:'text',
                         name:'map-copyright',
                         text:'{map-copyrights}, User: {user-id}, Date:{dateTime_local} ',
                         left:PrintData.a3p.w-5,
                         top:PrintData.a3p.h-5,
                         fontSize:10,
                         align:'right',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'legend-title',
                         text:'Legend',
                         left:5+3,
                         top:PrintData.a3p.h -(67+10-3-5-5+3)-5,
                         
                         fontSize:10,
                         align:'left',
                         baseline:'top',
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    }, 
                    {
                         type:'line',
                         x1:5+3,
                         y1:PrintData.a3p.h -(67+10-3-5-5+3),
                         x2:5+3+PrintData.a3p.w -(67+40+10+10)-10,
                         y2:PrintData.a3p.h -(67+10-3-5-5+3),
                         lineWidth:0.2,
                         lineColor:'rgb(200,200,200)',
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    } ,
                  
                    {
                         type:'legend',
                         left:5+3,
                         
                         top:PrintData.a3p.h -(67+10-3-5-5+3),
                         width:PrintData.a3p.w -(67+40+10+10)-10,
                         height:67-3-10,
                         columnCount:3,//column-count
                         scaleFactor:1.5,
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                         
                    },
                    {
                         type:'box',
                         left:5,
                         top:PrintData.a3p.h -(67+10-3),
                         width:PrintData.a3p.w-(5)-5,
                         height:67-3,
                         borderWidth:0.2
                    } 
               ]

          },
          {
               name:'A2 landscape',
               orientation:'landscape',
               thumbnail:'/images/print/A3 landscape.png',
               pageSize:'a2',
               
               width:PrintData.a2.w,//594,
               height:PrintData.a2.h,//420,
               borderWidth:0.5,
               borderOffset:1,

               resolution:150,

               defaults:{
                    font:'times',
                    fontStyle:'normal',
                    fontSize:12,
                    textColor:'black',
                    lineWidth:0.5,
                    lineColor:'rgb(50, 50, 50)'
               },
               mapFrame:{
                    left:10+67,
                    top:15,
                    width:PrintData.a2.w-(10+67)-5,
                    height:PrintData.a2.h - 15-10,
                    borderWidth:0.2
               },
               scaleBar:{
                    left:5,// relative to mapFrame
                    top:(PrintData.a2.h-15-10)-10,
                    width:50,
                    font:"20px Arial"// resolution/72*10px
               }, 
               
               elements:[
                    {
                         type:'image',
                         name:'logo',
                         imageData:function(){return PrintData.thumbnail_75_data;},
                         format:'PNG',
                         left:5,
                         top:3,
                         width:10,height:10
                    },
                    
                    {
                         type:'box',
                         name:'compass-border',
                         left:PrintData.a2.w -10-10-5-3,
                         top:PrintData.a2.h -10- 10-10-3,
                         width:20,height:20,
                         lineColor:'rgb(100,100,100)',
                         fillColor:'#ffffff82',
                         borderWidth:0.2
                    }, 
                    {
                         type:'image',
                         rotation:'{north}',
                         name:'compass',
                         imageData:function(){return PrintData.compass_data;},
                         image:function(){return PrintData.compass_image;},
                        
                         format:'PNG',
                         left:PrintData.a2.w -10-10-5-3,
                         //top:3,
                         top:PrintData.a2.h - 10-10-10-3,
                         width:20,height:20
                    },
                    {
                         type:'text',
                         name:'logo-title',
                         text:'{site-name}',
                         left:10+5,
                         top:3+5,
                         fontSize:14,
                         textColor:'#0471a0',
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'middle'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'title',
                         text:'{name}',
                         left:10+67 + ((PrintData.a2.w - (10+67)-10)/2),
                         top:10,
                         fontSize:14,
                         align:'center',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'description',
                         text:'{description}',
                         left:10,//10+200+10,
                         top:15+5+5+PrintData.a2.h- (100)-10-1,//+ 160+5+5,
                         width:67-3,
                         fontSize:12,
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'top'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    
                    {
                         type:'text',
                         name:'app-footer',
                         text:'{app-footer}',
                         left:5,
                         top:PrintData.a2.h-5,
                         fontSize:10,
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    }, 
                    {
                         type:'text',
                         name:'map-copyright',
                         text:'{map-copyrights}, User: {user-id}, Date:{dateTime_local} ',
                         left:PrintData.a2.w-5,
                         top:PrintData.a2.h-5,
                         fontSize:10,
                         align:'right',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'legend-title',
                         text:'Legend',
                         left:10,
                         top:15+3,
                         fontSize:10,
                         align:'left',
                         baseline:'top',
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    }, 
                    {
                         type:'line',
                         x1:10,
                         y1:15+5+3,
                         x2:10+ 67-5,
                         y2:15+5+3,
                         lineWidth:0.2,
                         lineColor:'rgb(200,200,200)',
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    } ,
                    {
                         type:'legend',
                         left:5+2,
                         top: 15+5+3,//15+ 160+5 +5 ,
                         width:67-1,
                         height:PrintData.a2.h- (100)-10-1,
                         columnCount:1,//column-count
                         scaleFactor:1.5,
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    },
                   
                    {
                         type:'box',
                         left:5,
                         top:15,
                         width:(67+3),
                         height:PrintData.a2.h - 15-10,
                         borderWidth:0.2
                    } 
               ]

          },
         
          {
               name:'A2 portrait',
               orientation:'portrait',
               thumbnail:'/images/print/A2 portrait.png',
               pageSize:'a2',
               //a2p: {h:594, w:420},
               width:PrintData.a2p.w,//420,
               height:PrintData.a2p.h,//598,
               
               borderWidth:0.5,
               borderOffset:1,

               resolution:150,

               defaults:{
                    font:'times',
                    fontStyle:'normal',
                    fontSize:12,
                    textColor:'black',
                    lineWidth:0.5,
                    lineColor:'rgb(50, 50, 50)'
               },
               mapFrame:{
                    
                    left:5,
                    top:15,
                    width:PrintData.a2p.w-5-5,
                    height:PrintData.a2p.h -(15+67)-10,
                    borderWidth:0.2
               },
               scaleBar:{
                    left:5,// relative to mapFrame
                    top:(PrintData.a2p.h -(15+67)-10)-10,
                    width:50,
                    font:"20px Arial"// resolution/72*10px
               }, 
               
               elements:[
                    {
                         type:'image',
                         name:'logo',
                         imageData:function(){return PrintData.thumbnail_75_data;},
                         format:'PNG',
                         left:5,
                         top:3,
                         width:10,height:10
                    },
                   
                    {
                         type:'box',
                         name:'compass-border',
                         left:PrintData.a2p.w -10-10-5-3,
                         top:PrintData.a2p.h -(15+67)-10-5-3,
                         width:20,height:20,
                         lineColor:'rgb(100,100,100)',
                         fillColor:'#ffffff82',
                         borderWidth:0.2
                    }, 
                    {
                         type:'image',
                         rotation:'{north}',
                         name:'compass',
                         imageData:function(){return PrintData.compass_data;},
                         image:function(){return PrintData.compass_image;},
                        
                         format:'PNG',
                         left:PrintData.a2p.w -10-10-5-3,
                         //top:3,
                         top:PrintData.a2p.h -(15+67)-10-5-3,
                         width:20,height:20
                    },
                    {
                         type:'text',
                         name:'logo-title',
                         text:'{site-name}',
                         left:10+5,
                         top:3+5,
                         fontSize:14,
                         textColor:'#0471a0',
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'middle'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'title',
                         text:'{name}',
                         left: ((PrintData.a2p.w/2)),
                         top:10,
                         fontSize:14,
                         align:'center',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'description',
                         text:'{description}',
                         left:10+5+PrintData.a2p.w -(67+40+10+10)-10,//10+200+10,
                         top:PrintData.a2p.h -(67+10-3-5+3),
                         width:67+40-3,
                         fontSize:12,
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'top'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    
                    {
                         type:'text',
                         name:'app-footer',
                         text:'{app-footer}',
                         left:5,
                         top:PrintData.a2p.h-5,
                         fontSize:10,
                         align:'left',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    }, 
                    {
                         type:'text',
                         name:'map-copyright',
                         text:'{map-copyrights}, User: {user-id}, Date:{dateTime_local} ',
                         left:PrintData.a2p.w-5,
                         top:PrintData.a2p.h-5,
                         fontSize:10,
                         align:'right',//The alignment of the text, possible values: left, center, right, justify
                         baseline:'alphabetic'//Sets text baseline used when drawing the text, possible values: alphabetic, ideographic, bottom, top, middle, hanging
                    },
                    {
                         type:'text',
                         name:'legend-title',
                         text:'Legend',
                         left:10,
                         top:PrintData.a2p.h -(67+10-3-5-5+3)-5,
                         fontSize:10,
                         align:'left',
                         baseline:'top',
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    }, 
                    {
                         type:'line',
                         x1:10,
                         y1:PrintData.a2p.h -(67+10-3-5-5+3),
                         x2:10+PrintData.a2p.w -(67+40+10+10)-10,
                         y2:PrintData.a2p.h -(67+10-3-5-5+3),
                         lineWidth:0.2,
                         lineColor:'rgb(200,200,200)',
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                    } ,
                  
                    {
                         type:'legend',
                         left:10,
                         
                         top:PrintData.a2p.h -(67+10-3-5-5+3),
                         width:PrintData.a2p.w -(67+40+10+10)-10,
                         height:67-3-10,
                         columnCount:3,//column-count
                         scaleFactor:1.5,
                         isHidden:function(mapContainer){
                              return !mapContainer.legend.getVisible();
                         }
                         
                    },
                    {
                         type:'box',
                         left:5,
                         top:PrintData.a2p.h -(67+10-3),
                         width:PrintData.a2p.w-(5)-5,
                         height:67-3,
                         borderWidth:0.2
                    } 
               ]

          }
    
     ],
    activeTemplate:'A4 landscape',
    print:function(options){
         var self=this;
          setTimeout(function(){
               try{
                    self.print_internal(options);
               }catch(ex){
                    if(options && options.onComplete){
                              options.onComplete({status:false,message:'Error:'+ex.message })
                    }
               }
          },500)   ;
          
    },
    print_internal:function(options){
        var mapContainer=options.mapContainer;
        
        var settings=options.settings;
        var template=settings.template;
        this.activeTemplate= template.name;
        var downloadPDF=settings.downloadPDF?true:false;
        
        var map=mapContainer.map;


        var pageSize = template.pageSize;
        var resolution = template.resolution || 96;
        
        var mapFrame=template.mapFrame;
        var mapFrame_width = Math.round(mapFrame.width * resolution / 25.4);
        var mapFrame_height = Math.round(mapFrame.height * resolution / 25.4);
      
      
        var orig_mapSize =  (map.getSize());
        var orig_extent = map.getView().calculateExtent(orig_mapSize);
        var orig_legend_title= mapContainer.legend.get('title');
        mapContainer.legend.set('title',undefined);
        //{app-footer}
        var appFooter= $('#footer p').text();
        
        var renderPdf=function  (event) {
          //map.getView().setRotation(map.getView().getRotation()+(30*Math.PI/180.0));
          var mapRotation=map.getView().getRotation()* 180/Math.PI;   
          //var canvas = event.context.canvas;
          var canvas= mapContainer.getMapRenderedCanvas();
          var mapImageData = canvas.toDataURL('image/png');
          var overlayImageData;
          if(ol.ext && ol.ext.getMapCanvas){
               var  overlayCanvas=ol.ext.getMapCanvas(map);
               overlayImageData=overlayCanvas.toDataURL('image/png');
          }
          var pdf = new jsPDF(template.orientation, undefined, pageSize);
         
          pdf.setFont(template.defaults.font);
          pdf.setFontStyle(template.defaults.fontStyle);
          pdf.setFontSize(template.defaults.fontSize);
          pdf.setTextColor(template.defaults.textColor);
          pdf.setLineWidth(template.defaults.lineWidth);
          pdf.setDrawColor(template.defaults.lineColor)

          pdf.setLineWidth(template.borderWidth);
        
          pdf.rect(
               template.borderOffset,
               template.borderOffset,
               template.width-2* template.borderOffset,
               template.height-2* template.borderOffset
               );
         // document.body.appendChild(canvas)

          pdf.addImage(mapImageData, 'PNG', 
               mapFrame.left, mapFrame.top, 
               mapFrame.width, mapFrame.height);
          if(overlayImageData){
               pdf.addImage(overlayImageData, 'PNG', 
               mapFrame.left, mapFrame.top, 
               mapFrame.width, mapFrame.height);
          }     
          pdf.setLineWidth(mapFrame.borderWidth);
          //pdf.setDrawColor(0,0,0);
          pdf.rect(
               mapFrame.left, mapFrame.top, 
               mapFrame.width, mapFrame.height
               );
          var legendItem=undefined;
          if(template.elements){
               for(var t=0;t<template.elements.length;t++){
                    var elemItem=template.elements[t];
                    if(elemItem.hidden){
                         continue;
                    }
                    if(typeof elemItem.isHidden =='function'){
                         if(elemItem.isHidden(mapContainer)){
                              continue;
                         }
                    }
                    pdf.setFont(template.defaults.font);
                    pdf.setFontStyle(template.defaults.fontStyle);
                    pdf.setFontSize(template.defaults.fontSize);
                    pdf.setTextColor(template.defaults.textColor);
                    pdf.setLineWidth(template.defaults.lineWidth);
                    pdf.setDrawColor(template.defaults.lineColor);
                    if(elemItem.font){
                         pdf.setFont(elemItem.font);
                    }
                    if(elemItem.fontStyle){
                         pdf.setFontStyle(elemItem.fontStyle);
                    }
                    if(elemItem.fontSize){
                         pdf.setFontSize(elemItem.fontSize);
                    }
                    if(elemItem.textColor){
                         pdf.setTextColor(elemItem.textColor);
                    }
                    if(elemItem.lineWidth){
                         pdf.setLineWidth(elemItem.lineWidth);
                    }
                    if(elemItem.borderWidth){
                         pdf.setLineWidth(elemItem.borderWidth);
                    }
                    if(elemItem.lineColor){
                         pdf.setDrawColor(elemItem.lineColor);
                    }
                    if(elemItem.type=='text'){
                         var elemItemText=elemItem.text+'';
                         if(elemItemText){
                              elemItemText=elemItemText.replace('{name}',mapContainer.mapSettings.name?mapContainer.mapSettings.name:'Untitled');
                              elemItemText=elemItemText.replace('{description}',mapContainer.mapSettings.description?mapContainer.mapSettings.description:'');
                              elemItemText=elemItemText.replace('{app-footer}',app.COPY_RIGHTS);
                              
                              elemItemText=elemItemText.replace('{site-name}',app.SITE_NAME);
                              elemItemText=elemItemText.replace('{map-copyrights}',app.MAPS_COPY_RIGHTS);
                              elemItemText=elemItemText.replace('{user-id}',app.identity.name);
                              elemItemText=elemItemText.replace('{user-firstName}',app.identity.firstName);
                              elemItemText=elemItemText.replace('{user-lastName}',app.identity.lastName);
                              elemItemText=elemItemText.replace('{user-email}',app.identity.email);
                              
                              elemItemText=elemItemText.replace('{updatedAt}',mapContainer.mapSettings.updatedAt);
                              elemItemText=elemItemText.replace('{date_gmt}',(new Date()).toLocaleDateString('en', { timeZone: 'UTC' })+' GMT');
                              elemItemText=elemItemText.replace('{date_local}',(new Date()).toLocaleDateString());
                              elemItemText=elemItemText.replace('{time_gmt}',(new Date()).toLocaleTimeString('en', { timeZone: 'UTC' })+' GMT');
                              elemItemText=elemItemText.replace('{time_local}',(new Date()).toLocaleTimeString());
                              elemItemText=elemItemText.replace('{dateTime_gmt}',(new Date()).toLocaleString('en', { timeZone: 'UTC' })+' GMT');
                              elemItemText=elemItemText.replace('{dateTime_local}',(new Date()).toLocaleString());
                         }
                         if(elemItem.width){
                              elemItemText=pdf.splitTextToSize(elemItemText,elemItem.width);
                         }
                         if(elemItemText){
                              pdf.text(elemItemText,elemItem.left,elemItem.top,{align:elemItem.align,baseline:elemItem.baseline});
                         }
                    }else if(elemItem.type=='line'){
                         pdf.line(
                              elemItem.x1,
                              elemItem.y1,
                              elemItem.x2,
                              elemItem.y2
                              );

                    }else if(elemItem.type=='box'){
                         
                         
                         if(elemItem.fillColor){
                              var canvas = document.createElement('canvas');
                              canvas.width= elemItem.width;
                              canvas.height=elemItem.height;
                              var gtx=canvas.getContext("2d");
                              gtx.save();

                              gtx.fillStyle=elemItem.fillColor; 

                              gtx.fillRect(0,0,canvas.width,canvas.height);
                              gtx.restore();

                              try{
                                   var imageData = canvas.toDataURL('image/png');
                                   pdf.addImage(imageData, 'PNG', 
                                        elemItem.left, elemItem.top, 
                                        elemItem.width, elemItem.height
                                   );
                             }catch(ex){}
                         }     

                         pdf.rect(
                              elemItem.left,
                              elemItem.top,
                              elemItem.width,
                              elemItem.height
                              );

                    }else if(elemItem.type=='image'){
                         var elemItemRotation=(typeof elemItem.rotation!=='undefined')?(elemItem.rotation+''):'';
                         elemItemRotation=elemItemRotation.replace('{north}',mapRotation+'');
                         var rotation=0;
                         if(elemItemRotation){
                              try{
                                   rotation= parseFloat(elemItemRotation);
                              }catch(ex){}
                              rotation=rotation* Math.PI/180.0;
                         }

                         try{
                              var imageData= elemItem.imageData;
                              if(imageData && typeof imageData == 'function'){
                                   imageData=imageData();
                              }
                              if(rotation==0){
                                   pdf.addImage(imageData,elemItem.format ||'PNG', 
                                   elemItem.left, elemItem.top, 
                                   elemItem.width, elemItem.height);
                              }else{
                                   var image=elemItem.image;
                                   if(image && typeof image == 'function'){
                                        image=image();
                                   }
                                   if(image){
                                        var canvas = document.createElement('canvas');
                                        canvas.width= image.width;
                                        canvas.height=image.height;
                                        var gtx=canvas.getContext("2d");
                                        gtx.save();

                                    
                                        gtx.translate(canvas.width/2,canvas.height/2);
                                        gtx.rotate(rotation);
                                        gtx.drawImage(image,-image.width/2,-image.height/2);
                                        gtx.restore();

                                        try{
                                             imageData = canvas.toDataURL('image/png');
                                             pdf.addImage(imageData, 'PNG', 
                                                  elemItem.left, elemItem.top, 
                                                  elemItem.width, elemItem.height
                                             );
                                       }catch(ex){}

                                   }

                              }
                         }catch(ex){}

                    }else if(elemItem.type=='legend'){

                         legendItem=elemItem;
                    }

               }
          }

          

          var finalize=function(){
               if(downloadPDF){
                    pdf.save('Map-'+template.name+'.pdf');   
               }else{
                    window.open(pdf.output('bloburl'), '_blank');
               }
               //pdf.save('Map-'+template.name+'.pdf');
               //pdf.output('dataurlnewwindow');
               
               // Reset original map size
               mapContainer.scaleLineControl.custom=undefined;
               mapContainer.legend.set('title',orig_legend_title);
               map.setSize(orig_mapSize);
               //map.getView().fit(orig_extent, {size: orig_mapSize});
               setTimeout(function(){
                    
                    map.getView().fit(orig_extent, {size: orig_mapSize});
               },1000);
               
               //on complete
               if(options.onComplete){
                    options.onComplete({status:true});
               }
          }     
          if(legendItem && mapContainer.legend.getVisible()){
               var scaleFactor=legendItem.scaleFactor || 1;
               
               var legend_width = legendItem.width * scaleFactor;//Math.round(legendItem.width * res / 25.4);
               var legend_height = legendItem.height*scaleFactor ;//Math.round(legendItem.height * res / 25.4);
               var element=mapContainer.legend._tableElement;
               var orig_legend_width=element.style.width;
               var orig_legend_height=element.style.height;
               var orig_legend_columnCount=element.style.columnCount;
               
               element.style.width= legend_width + 14 +'mm';
               element.style.height= legend_height +'mm';
               element.style.columnCount= legendItem.columnCount;
               element.style.columnFill= 'auto';
              mapContainer.refreshLegend_immediate();
             //  html2canvas(element,{backgroundColor :'transparent',}).then(function(canvas) {
                    html2canvas(element,{backgroundColor :'#eeeeee',}).then(function(canvas) {
                    element.style.width= orig_legend_width;
                    element.style.height= orig_legend_height;
                    element.style.columnCount= orig_legend_columnCount;
                   // document.body.appendChild(canvas)
                    try{
                         var legendImageData = canvas.toDataURL('image/png');
                   
                         pdf.addImage(legendImageData, 'PNG', 
                                   legendItem.left, legendItem.top, 
                                   legendItem.width, legendItem.height);
                   }catch(ex){}
                    finalize();
                });
          }else{
               finalize();
          }

          
         
          
        }
        map.once('rendercomplete', function(event) {
             try{
               renderPdf(event);
             }catch(ex){
                  if(options.onComplete){
                    options.onComplete({status:false,message:'Error:'+ex.message });
                  }
             }

        });
        
        

        // Set print size
        var map_printSize = [mapFrame_width, mapFrame_height];
        if(template.scaleBar){
             mapContainer.scaleLineControl.custom={
               top:Math.round(template.scaleBar.top * resolution / 25.4),
               left:Math.round(template.scaleBar.left * resolution / 25.4),
               width:Math.round(template.scaleBar.width * resolution / 25.4)

               ,font:template.scaleBar.font
          }
        }
     
        map.setSize(map_printSize);
        map.getView().fit(orig_extent, {size: map_printSize});
     }
}