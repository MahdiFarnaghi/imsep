function DlgTaskBase(id,title,mapContainer,obj,options) {
     var self=this;    
     self.id=id || 'DlgTaskBase';
      this.mapContainer= mapContainer;
      this.obj=obj;
      
      this.options = options || {};
      this.title=title|| options.title;
      var _closable=(typeof options.closable !=='undefined')?options.closable:true;
      
      var dialogSize=(typeof options.dialogSize!=='undefined')?options.dialogSize: BootstrapDialog.SIZE_NORMAL;
      var showOKButton=(typeof options.showOKButton!=='undefined')?options.showOKButton: true;
      var showApplyButton= options.showApplyButton || false;
      var okButtonTitle=options.okButtonTitle || 'OK';
      var cancelButtonTitle=options.cancelButtonTitle || 'Cancel';
      var applyButtonTitle=options.applyButtonTitle || 'Apply';
      if(!this.title){
          this.title='Task Dialog';
      }
      this.cancelHandlers=[];
      this.beforeApplyHandlers=[];
      this.applyHandlers=[];

      this.body= $('<div></div>');
      var mainPanelHtml= '<div id="'+ self.id+ '_Panel">';
      mainPanelHtml+='</div>';
      this.mainPanel= $(mainPanelHtml).appendTo(this.body);
       
      this.dlg = new BootstrapDialog({
        title: this.title,
        message: this.body,
        draggable:true,
        size: dialogSize,
        closable: _closable,
            closeByBackdrop: true,
            closeByKeyboard: true,
        buttons: [{
          id:'btn-apply',
          label: applyButtonTitle,
          cssClass: 'btn-info',
          action: function(dialogRef){
            var e={data:{},dialogAction:'apply'};
              if(self.apply(e)){
                self.changesApplied=true;
                if(self.options.onapply){
                  self.options.onapply(dialogRef,e.data,e.dialogAction);
                }
              }
          }
        },
           {
             id:'btn-ok',
          label: okButtonTitle,
          cssClass: 'btn-primary',
          action: function(dialogRef){
            var e={data:{},dialogAction:'ok'};
              if(self.apply(e)){
                self.changesApplied=true;
                dialogRef.close();
                if(self.options.onapply){
                  self.options.onapply(dialogRef,e.data,e.dialogAction);
                }
                self.closed();
              }
          }
      },{
          label: cancelButtonTitle,
          action: function(dialogRef){
              dialogRef.close();
              self.closed();
          }
      }
    ],
      onshow: function(dialogRef){
        var helpLink= self.options.helpLink;
        if(!helpLink){
          helpLink='/help#'+ self.id;
        }
        if(helpLink){
          var aLink='<a title="Help" class="close" style=" float: right; margin-right: .5em;" ';
          aLink+= ' target="_blank" href="' + helpLink+'"';
          aLink+='>?</a>';
          dialogRef.getModalHeader().find('.bootstrap-dialog-header').append(aLink);
        }
  
        if(!showOKButton){
          dialogRef.getButton('btn-ok').hide();
        }
        if(!showApplyButton){
          dialogRef.getButton('btn-apply').hide();
        }
        if(self.options.onshow){
          self.options.onshow(dialogRef);
        }
        var hash = self.title;
        window.location.hash = hash;
        window.onhashchange = function() {
          if (!location.hash){
            dialogRef.close();
            self.closed();
          }
        }
    },
    onshown: function(dialogRef){
      if(self.options.onshown){
        self.options.onshown(dialogRef);
      }
    },
    onhide: function(dialogRef){
       if(self.options.onhide){
          self.options.onhide(dialogRef);
      }
      var hash = self.title;
	    history.pushState('', document.title, window.location.pathname + window.location.search);
    },
    onhidden: function(dialogRef){
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
  DlgTaskBase.prototype.closed=function(){

  }
  DlgTaskBase.prototype.close=function(){
    this.dlg.close();
    this.closed();
  }

  DlgTaskBase.prototype.create=function(){
    if(this.createUI){
      this.createUI();
    }
    this.changesApplied=false
  }
  DlgTaskBase.prototype.apply=function(e){
    var data=e.data;
    for(var i=0;i< this.beforeApplyHandlers.length ;i++)
    {
      var evt={cancel:false,data:data,dialogAction:e.dialogAction}
      var beforeHandler=this.beforeApplyHandlers[i];
      beforeHandler(evt);
      if(evt.cancel){
        return false;
      }
    }
    
    for(var i=0;i< this.applyHandlers.length ;i++)
    {
      var evt={cancel:false,data:data,dialogAction:e.dialogAction}
      var handler=this.applyHandlers[i];
      handler(evt);
      if(evt.cancel){
        return false;
      }
    }
    return true;
  }
  DlgTaskBase.prototype.cancelSettings=function(){
   for(var i=0;i< this.cancelHandlers.length ;i++)
    {
      var handler=this.cancelHandlers[i];
      var evt={dialogAction:'cancel'};
      handler(evt);
    }
    return true;
  }
  DlgTaskBase.prototype.show=function(){
    this.create();
    this.dlg.open();
    
    return this;
  }
  