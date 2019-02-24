
function DlgOSMTagSelection(mapContainer,obj,options) {
  options=options||{};
  options.dialogSize= BootstrapDialog.SIZE_WIDE;
  DlgTaskBase.call(this, 'DlgOSMTagSelection'
      ,(options.title || 'Select shape type')
      ,  mapContainer,obj,options);   

}
DlgOSMTagSelection.prototype = Object.create(DlgTaskBase.prototype);


DlgOSMTagSelection.prototype.createUI=function(){
  var self=this;
  var tags= this.obj;
  

  var htm='<div class="scrollable-content" ><form id="'+self.id+'_form" class="modal-body form-horizontal">';  
  // htm+='  <p>';
  // //htm+='Clip  features of ('+ layer.get('title') +') with layer:';
  // htm+='  </p>';
  // htm+='<div class="form-group">';
  
  // htm+=' </div>';

  
        
  
  //htm += '<div class="panel-body">';
  htm += '   <p>Select tags to be used as layer attribute fields:</p>';
  htm += '              <div class="row">';
  htm += '                  <div class="dual-list list-left col-md-5">';
  htm += '                  <h4 class="text-left text-info">Available tags</h4>';
  htm += '                      <div class="well text-left" style="padding: 4px;">';
                      
  htm += '                          <div class="row">';
  htm += '                              <div class="col-md-2">';
  htm += '                                  <div class="btn-group">';
  htm += '                                      <a class="btn btn-default selector" title="select all"><i class="glyphicon glyphicon-unchecked"></i></a>';
  htm += '                                  </div>';
  htm += '                              </div>';
  htm += '                              <div class="col-md-10">';
  htm += '                                  <div class="input-group" style="display:none">';
  htm += '                                      <input type="text" name="SearchDualList" class="form-control" placeholder="search" />';
  htm += '                                      <span class="input-group-addon glyphicon glyphicon-search"></span>';
  htm += '                                  </div>';
  htm += '                              </div>';
  htm += '                          </div>';
  htm += '                          <ul id="listTags"  class="list-group">';
  for(var i=0;i< tags.length ;i++){
    var tag= tags[i];
    if(i>5){
      if(tag.name && tag.count){
        htm += '                          <li class="list-group-item" data-name="'+tag.name+'" data-action="add" >' +tag.name+' ('+tag.count+')</li>';      
      }
   }
  }
 //                             @model.availableUsers.forEach(function(user) {
//                                  <li class="list-group-item" data-id="@user.id" data-action="add" >@user.userName</li>
//                              })
htm += '                          </ul>';
htm += '                      </div>';
htm += '                  </div>';

htm += '                  <div class="list-arrows col-md-1 text-center">';

htm += '                      <button type="button" class="btn btn-default btn-sm move-right">';
htm += '                          <span class="glyphicon glyphicon-chevron-right"></span>';
htm += '                      </button>';

htm += '                      <button type="button" class="btn btn-default btn-sm move-left">';
htm += '                          <span class="glyphicon glyphicon-chevron-left"></span>';
htm += '                      </button>';


htm += '                  </div>';
htm += '                  <div class="dual-list list-right col-md-5">';
htm += '                  <h4 class="text-success">Selected tags (Fields)</h4>';
htm += '                      <div class="well" style="padding: 4px;">';
htm += '                          <div class="row">';
htm += '                              <div class="col-md-2">';
htm += '                                  <div class="btn-group">';
htm += '                                      <a class="btn btn-default selector" title="select all"><i class="glyphicon glyphicon-unchecked"></i></a>';
htm += '                                  </div>';
htm += '                              </div>';
htm += '                              <div class="col-md-10">';
htm += '                                  <div class="input-group"  style="display:none">';
htm += '                                      <input type="text" name="SearchDualList" class="form-control" placeholder="search" />';
htm += '                                      <span class="input-group-addon glyphicon glyphicon-search"></span>';
htm += '                                  </div>';
htm += '                              </div>';
htm += '                          </div>';
htm += '                          <ul id="listSelectedTags" class="list-group">';
for(var i=0;i< tags.length ;i++){
  var tag= tags[i];
  if(i<=5){
    if(tag.name && tag.count){
      htm += '                          <li class="list-group-item" data-name="'+tag.name+'" data-action="add" >' +tag.name+' ('+tag.count+')</li>';      
    }
 }
}
//                              @model.memberUsers.forEach(function(user) {
//                                   @if(!html.equals(user.userName, 'superadmin')){
//                                      <li class="list-group-item" data-id="@user.id" data-action="remove" >@user.userName</li>
//                                   }
//                              })
htm += '                          </ul>';
htm += '                      </div>';
htm += '                  </div>';

htm += '            </div>';
          

//htm += '  </div>';





  htm += '</form>';
  htm+='  </div>';
  var content=$(htm).appendTo( this.mainPanel); 

  content.on('click', '.list-group .list-group-item', function () {
      $(this).toggleClass('active');
  });
  content.find('.list-arrows button').click(function () {
      var $button = $(this), actives = '';
      if ($button.hasClass('move-left')) {
          actives = $('.list-right ul li.active');
          actives.clone().appendTo('.list-left ul');
          actives.remove();
      } else if ($button.hasClass('move-right')) {
          actives = $('.list-left ul li.active');
          actives.clone().appendTo('.list-right ul');
          actives.remove();
      }
  });
  content.find('.dual-list .selector').click(function () {
      var $checkBox = $(this);
      if (!$checkBox.hasClass('selected')) {
          $checkBox.addClass('selected').closest('.well').find('ul li:not(.active)').addClass('active');
          $checkBox.children('i').removeClass('glyphicon-unchecked').addClass('glyphicon-check');
      } else {
          $checkBox.removeClass('selected').closest('.well').find('ul li.active').removeClass('active');
          $checkBox.children('i').removeClass('glyphicon-check').addClass('glyphicon-unchecked');
      }
  });
  content.find('[name="SearchDualList"]').keyup(function (e) {
      var code = e.keyCode || e.which;
      if (code == '9') return;
      if (code == '27') $(this).val(null);
      var $rows = $(this).closest('.dual-list').find('.list-group li');
      var val = $.trim($(this).val()).replace(/ +/g, ' ').toLowerCase();
      $rows.show().filter(function () {
          var text = $(this).text().replace(/\s+/g, ' ').toLowerCase();
          return !~text.indexOf(val);
      }).hide();
  });


  var $form = $(content.find('#'+self.id +'_form'));
  $form.on('submit', function(event){
    // prevents refreshing page while pressing enter key in input box
    event.preventDefault();
  });
  this.beforeApplyHandlers.push(function(evt){
    var origIgone= $.validator.defaults.ignore;
    $.validator.setDefaults({ ignore:'' });
    $.validator.unobtrusive.parse($form);
    $.validator.setDefaults({ ignore:origIgone });

    $form.validate();
    if(! $form.valid()){
      evt.cancel= true;
      var errElm=$form.find('.input-validation-error').first();
      if(errElm){
        var offset=errElm.offset().top;
        //var tabOffset= tabHeader.offset().top;
        var tabOffset=0;
        //tabOffset=self.mainPanel.offset().top;
        tabOffset=$form.offset().top;
        self.mainPanel.find('.scrollable-content').animate({
              scrollTop: offset - tabOffset //-60//-160
            }, 1000);
    
      }
    }
  });

  this.applyHandlers.push(function(evt){
      evt.data.tags=tags;
      var selectedTags=[];
      var toAddArray=[];
      var selLi= $form.find("#listSelectedTags li");
      selLi.each(function(){
         var current = $(this);
         var action=current.data('action');
         if(action==='add'){
            selectedTags.push( current.data('name'));
         }
       })
    
      evt.data.selectedTags= selectedTags;
      
  });

  this.changesApplied=false
}
