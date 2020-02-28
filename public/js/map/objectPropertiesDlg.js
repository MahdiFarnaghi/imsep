

function ObjectPropertiesDlg(mapContainer,obj,options) {
     var self=this;    
      this.mapContainer= mapContainer;
      this.obj=obj;
      this.options = options || {};
      this.isNew= options.isNew;
      this.title=options.title;
      var _closable=(typeof options.closable !=='undefined')?options.closable:true;
      this._closeWithBackButton=(typeof options.closeWithBackButton !=='undefined')?options.closeWithBackButton:true;
      this.activeTabIndex=options.activeTabIndex;
      if(!this.title){
        if(obj.get && obj.get('title')){
          this.title=obj.get('title') +' properties';
        }else{
          this.title='Properties';
        }
      }
      this.cancelHandlers=[];
      this.beforeApplyHandlers=[];
      this.applyHandlers=[];

      this.body= $('<div></div>');
       var tabPanelHtml= '<div id="tabPanel">';
       tabPanelHtml+='<ul id="tabPanel_nav" class="nav  nav-pills__ nav-tabs nav-tab-bar_"></ul>';
       tabPanelHtml+='<div id="tabPanel_content" class="tab-content clearfix_"></div>';
       tabPanelHtml+='</div>';
       this.tabPanel= $(tabPanelHtml).appendTo(this.body);
       this.tabPanelNav=this.tabPanel.find('#tabPanel_nav');
       this.tabPanelContent=this.tabPanel.find('#tabPanel_content');
       this.propertyTabs= options.tabs;
       if(!this.propertyTabs){
        this.propertyTabs=[
          new LayerGeneralTab(),
          new LayerStyleTab(),
          new LayerSourceTab(),
        ];
      }
     
      for(var i=0;i<this.propertyTabs.length;i++){
        var propertyTab= this.propertyTabs[i];
        if(propertyTab && propertyTab.init){
            propertyTab.init(this);
        }
      }
      this.dlg = new BootstrapDialog({
        title: this.title,
        message: this.body,
        draggable:true,
        closable: _closable,
            closeByBackdrop: true,
            closeByKeyboard: true,
        buttons: [
           {
          label: 'OK',
          // no title as it is optional
          cssClass: 'btn-primary',
          action: function(dialogRef){
              if(self.apply()){
                self.changesApplied=true;
                dialogRef.close();
                if(self.options.onapply){
                  self.options.onapply(dialogRef);
                }
              }
          }
      },{
          label: 'Close',
          action: function(dialogRef){
              
              dialogRef.close();
          }
      }],
      onshow: function(dialogRef){
      //  alert('Dialog is popping up, its message is ' + dialogRef.getMessage());
      if(self.options.helpLink){
        var aLink='<a title="Help" class="close" style=" float: right; margin-right: .5em;" ';
        aLink+= ' target="_blank" href="' + self.options.helpLink+'"';
        aLink+='>?</a>';
        dialogRef.getModalHeader().find('.bootstrap-dialog-header').append(aLink);
      }

      

        if(self.options.onshow){
          self.options.onshow(dialogRef);
        }
      
        var hash = self.title;
        window.location.hash = hash;
        window.onhashchange = function() {
          if (!location.hash && self._closeWithBackButton ){
            dialogRef.close();
          }
        }

        
    },
    onshown: function(dialogRef){
      //  alert('Dialog is popped up.');
      if(self.options.onshown){
        self.options.onshown(dialogRef);
      }
      for(var i=0;i<self.propertyTabs.length;i++){
        var propertyTab= self.propertyTabs[i];
        if(propertyTab && propertyTab.onshown){
          propertyTab.onshown();
        }
      }
      if(self.activeTabIndex){
        try{
          self.propertyTabs[self.activeTabIndex].activate();
        }catch(ex){}
      }
    },
    onhide: function(dialogRef){
       // alert('Dialog is popping down, its message is ' + dialogRef.getMessage());
       if(self.options.onhide){
          self.options.onhide(dialogRef);
      }
      var hash = self.title;
	    history.pushState('', document.title, window.location.pathname + window.location.search);
    },
    onhidden: function(dialogRef){
       // alert('Dialog is popped down.');
       var canceled=false;
       if(!self.changesApplied){
          self.cancelSettings();
          canceled=true;
       }
        if(self.options.onhidden){
          self.options.onhidden(dialogRef,canceled);
        }
    }
     });

  }
  ObjectPropertiesDlg.prototype.create=function(){
    if(!this.activeTabIndex)
      this.activeTabIndex=0;
    for(var i=0;i<this.propertyTabs.length;i++){
      var propertyTab= this.propertyTabs[i];
      if(propertyTab && propertyTab.applied){
        if(propertyTab.applied(this.obj) && propertyTab.create ){
          propertyTab.create(this.obj,this.activeTabIndex===i);
        }
      }
    }
    this.changesApplied=false
  }
  ObjectPropertiesDlg.prototype.apply=function(){
    for(var i=0;i< this.beforeApplyHandlers.length ;i++)
    {
      var evt={cancel:false}
      var beforeHandler=this.beforeApplyHandlers[i];
      beforeHandler(evt);
      if(evt.cancel){
        return false;
      }
    }
    
    for(var i=0;i< this.applyHandlers.length ;i++)
    {
      var evt={cancel:false}
      var handler=this.applyHandlers[i];
      handler(evt);
      if(evt.cancel){
        return false;
      }
    }
    return true;
  }
  ObjectPropertiesDlg.prototype.cancelSettings=function(){
   
    
    for(var i=0;i< this.cancelHandlers.length ;i++)
    {
      //var evt={cancel:false}
      var handler=this.cancelHandlers[i];
      handler();
     // if(evt.cancel){
     //   return false;
     // }
    }
    return true;
  }
  
  ObjectPropertiesDlg.prototype.show=function(){
    this.create();
    this.dlg.open();
    
    return this;
  }