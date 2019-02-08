$(document).ready(function() {

    pageTask.init();

});


var pageTask={
    init:function(){
      var me= this;
     this.initMembersLists();

      $('#submitMembers').click(function(){
        me.submitMembers();
      })
    },
   initMembersLists:function(){
    $('body').on('click', '.list-group .list-group-item', function () {
        $(this).toggleClass('active');
    });
    $('.list-arrows button').click(function () {
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
    $('.dual-list .selector').click(function () {
        var $checkBox = $(this);
        if (!$checkBox.hasClass('selected')) {
            $checkBox.addClass('selected').closest('.well').find('ul li:not(.active)').addClass('active');
            $checkBox.children('i').removeClass('glyphicon-unchecked').addClass('glyphicon-check');
        } else {
            $checkBox.removeClass('selected').closest('.well').find('ul li.active').removeClass('active');
            $checkBox.children('i').removeClass('glyphicon-check').addClass('glyphicon-unchecked');
        }
    });
    $('[name="SearchDualList"]').keyup(function (e) {
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
   },
    
   submitMembers:function(){
      var self= this;




      $.validator.unobtrusive.parse(document);
      
      var $form= $('#membersForm');
      $form.validate();
  
    
  
      
      var v1=true;
      var v2=$form.valid();
      if(! (v1 && v2 ))
      {
        var errElm=$('.input-validation-error').first();
        if(errElm){
            $('html, body').animate({
                scrollTop: errElm.offset().top-20
              }, 1000);
       
         }
  
        return;
      }
      //mainForm.submit();
      var toAddArray=[];
     var membersLi= $form.find("#listMembers li");
      membersLi.each(function(){
        var current = $(this);
        var action=current.data('action');
        if(action==='add'){
            toAddArray.push( current.data('id'));
        }
      })
      toAddArrayStr= toAddArray.join(',');
      $form.find('#addmembers').val( toAddArrayStr);
  
      var toRemoveArray=[];
      var usersLi= $form.find("#listUsers li");
      usersLi.each(function(){
         var current = $(this);
         var action=current.data('action');
         if(action==='remove'){
            toRemoveArray.push( current.data('id'));
         }
       })
       toRemoveArrayStr= toRemoveArray.join(',');
       $form.find('#removemembers').val( toRemoveArrayStr);

      $form.submit();
      
    }
  };
  
