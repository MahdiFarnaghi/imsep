
//#region Base64
/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/

var Base64 = {

    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode: function(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        if (!input)
            return input;
        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    // public method for decoding
    decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    // private method for UTF-8 encoding
    _utf8_encode: function (string) {
        if (!string)
            return string;
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode: function(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}
//#endregion Base64

$(function () {
  $.fn.select2.defaults.set( "theme", "bootstrap" );

    app.name = 'iMSEP';
  
	$('.convertTolocalDateTime').each(function(index){
		var val=$(this).text();
		var date = new Date(val);
		var str=date.toString();
		str=date.toLocaleString();
		//str=date.toLocaleString('en', { timeZone: 'UTC' });
		//str=date.toLocaleString('en', { timeZone: 'Asia/Tehran' });
		//str=date.toLocaleString('en', { timeZone: 'Europe/Stockholm' });
		//str=date.toLocaleString('en', { timeZone: 'Asia/Bishkek' });
		var title=$(this).attr('title');
		if(!title){
			title='';
		}
		title= title+' ('+date.toLocaleString('en', { timeZone: 'UTC' })+' GMT)';
		$(this).attr('title',title);
		$(this).text(str);

		// var val=$(this).text();
		// var date = new Date(val);
		
		// var title=$(this).attr('title');
		// if(!title){
		// 	title='';
		// }
		// title= title+' ('+date.toLocaleString()+')';
		// $(this).attr('title',title);
		
	});

	 $('div[data-notify="true"]').each(function( index ) {
		$.notify({
			message: $(this).html()
		},{
			type:$(this).data('notify-type') ||'info',
			delay:$(this).data('notify-delay'),
			animate: {
				enter: 'animated fadeInDown',
				exit: 'animated fadeOutUp'
			}
		});
	  });
 
});

/*
 * HTML5 Sortable jQuery Plugin
 * http://farhadi.ir/projects/html5sortable
 *
 * Copyright 2012, Ali Farhadi
 * Released under the MIT license.
 */
(function($) {
	var dragging, placeholders = $();
	$.fn.sortable = function(options) {
		var method = String(options);
		options = $.extend({
			connectWith: false
		}, options);
		return this.each(function() {
			if (/^(enable|disable|destroy)$/.test(method)) {
				var items = $(this).children($(this).data('items')).attr('draggable', method == 'enable');
				if (method == 'destroy') {
					items.add(this).removeData('connectWith items')
						.off('dragstart.h5s dragend.h5s selectstart.h5s dragover.h5s dragenter.h5s drop.h5s');
				}
				return;
			}
			var isHandle, index, items = $(this).children(options.items);
			var placeholder = $('<' + (/^(ul|ol)$/i.test(this.tagName) ? 'li' : 'div') + ' class="sortable-placeholder">');
			items.find(options.handle).mousedown(function() {
				isHandle = true;
			}).mouseup(function() {
				isHandle = false;
			});
			$(this).data('items', options.items)
			placeholders = placeholders.add(placeholder);
			if (options.connectWith) {
				$(options.connectWith).add(this).data('connectWith', options.connectWith);
			}
			items.attr('draggable', 'true').on('dragstart.h5s', function(e) {
				if (options.handle && !isHandle) {
					return false;
				}
				isHandle = false;
				var dt = e.originalEvent.dataTransfer;
				dt.effectAllowed = 'move';
				dt.setData('Text', 'dummy');
				index = (dragging = $(this)).addClass('sortable-dragging').index();
			}).on('dragend.h5s', function() {
				if (!dragging) {
					return;
				}
				dragging.removeClass('sortable-dragging').show();
				placeholders.detach();
				if (index != dragging.index()) {
					dragging.parent().trigger('sortupdate', {item: dragging});
				}
				dragging = null;
			}).not('a[href], img').on('selectstart.h5s', function() {
				this.dragDrop && this.dragDrop();
				return false;
			}).end().add([this, placeholder]).on('dragover.h5s dragenter.h5s drop.h5s', function(e) {
				if (!items.is(dragging) && options.connectWith !== $(dragging).parent().data('connectWith')) {
					return true;
				}
				if (e.type == 'drop') {
					e.stopPropagation();
					placeholders.filter(':visible').after(dragging);
					dragging.trigger('dragend.h5s');
					return false;
				}
				e.preventDefault();
				e.originalEvent.dataTransfer.dropEffect = 'move';
				if (items.is(this)) {
					if (options.forcePlaceholderSize) {
						placeholder.height(dragging.outerHeight());
					}
					dragging.hide();
					$(this)[placeholder.index() < $(this).index() ? 'after' : 'before'](placeholder);
					placeholders.not(placeholder).detach();
				} else if (!placeholders.is(this) && !$(this).children(options.items).length) {
					placeholders.detach();
					$(this).append(placeholder);
				}
				return false;
			});
		});
	};
	})(jQuery);

(function ($) {
   
    //Note:
   // Don't make the mistake of putting your custom validation functions and adapters in the jQuery document ready function.
   // This is too late in the process. Here we are just wrapping our code in a javascript closure and passing in the jQuery object aliased as $.

   
// Same as url, but TLD is optional
	$.validator.addMethod( "url2", function( value, element ) {
		return this.optional( element ) || /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)*(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test( value );
	}, $.validator.messages.url );
	$.validator.unobtrusive.adapters.add('url2', [], function (options) {
		options.rules['url2'] = options.params;
		if (options.message) {
			options.messages['url2'] = options.message;
		}
	});

   $.validator.addMethod('positivenumber', function (value, element, params) {
	
        return Number(value) > 0;
    }, '');

		
	$.validator.unobtrusive.adapters.add('positivenumber', [], function (options) {
		options.rules['positivenumber'] = options.params;
		if (options.message) {
			options.messages['positivenumber'] = options.message;
		}
	});
	$.validator.addMethod( "integer", function( value, element ) {
		return this.optional( element ) || /^-?\d+$/.test( value );
	}, "A positive or negative non-decimal number please" );
	$.validator.unobtrusive.adapters.add('integer', [], function (options) {
		options.rules['integer'] = options.params;
		if (options.message) {
			options.messages['integer'] = options.message;
		}
	});

	// used in dataLayer_vector.vash
	$.validator.addMethod('lessthanorequal', function (value, element, params) {
		if(value==="")
			return true;
		try{
			value=parseFloat(value);
		}catch(e){}
		var other = params.other;
		var otherValue=value;
		var $element = $(element);
		var otherElem = $element.closest('form').find('[name=' + other + ']');
		try{
			otherValue=parseFloat(otherElem.val());
		}catch(ex){}
		
		return value <= otherValue;
	}, '');

	$.validator.unobtrusive.adapters.add('lessthanorequal', ['other'], function (options) {
		options.rules['lessthanorequal'] = options.params;
		if (options.message) {
			options.messages['lessthanorequal'] = options.message;
		}
	});

    $.validator.addMethod('filesize', function (value, element, params) {
        var maxSize = params.maxsize;
        try{
            maxSize=parseFloat(maxSize);
        }catch(ex){}
        var $element = $(element);
        var files = $element.closest('form').find(':file[name=' + $element.attr('name') + ']');
        var totalFileSize = 0;
        files.each(function () {
            var file = $(this)[0].files[0];
            if (file && file.size) {
                totalFileSize += file.size;
            }
        });
        return totalFileSize < maxSize;
    }, '');

    $.validator.unobtrusive.adapters.add('filesize', ['maxsize'], function (options) {
        options.rules['filesize'] = options.params;
        if (options.message) {
            options.messages['filesize'] = options.message;
        }
    });
  


    $.validator.unobtrusive.adapters.add('filetype', ['validtypes'], function (options) {
        options.rules['filetype'] = { validtypes: options.params.validtypes.split(',') };
        options.messages['filetype'] = options.message;
    });
    
    $.validator.addMethod("filetype", function (value, element, param) {
        for (var i = 0; i < element.files.length; i++) {
            var extension = getFileExtension(element.files[0].name);
            if ($.inArray(extension, param.validtypes) === -1) {
                return false;
            }
        }
        return true;
    });
    
    function getFileExtension(fileName) {
        if (/[.]/.exec(fileName)) {
            return /[^.]+$/.exec(fileName)[0].toLowerCase();
        }
        return null;
    }


	$.validator.addMethod('requiredif',   function (value, element, parameters) {
        var id = '#' + parameters['dependentproperty'];
 
        // get the target value (as a string, 
        // as that's what actual value will be)
        var targetvalue = parameters['targetvalue'];
        targetvalue = (targetvalue == null ? '' : targetvalue).toString();
 
        // get the actual value of the target control
        // note - this probably needs to cater for more 
        // control types, e.g. radios
        var control = $(id);
        var controltype = control.attr('type');
        var actualvalue =
            (controltype === 'checkbox' ||  controltype === 'radio')  ?
            control.attr('checked').toString() :
            control.val();
 
        // if the condition is true, reuse the existing 
        // required field validator functionality
        if ($.trim(targetvalue) === $.trim(actualvalue) || ($.trim(targetvalue) === '*' && $.trim(actualvalue) !== ''))
            return $.validator.methods.required.call(
              this, value, element, parameters);
 
        return true;
    });
 
$.validator.unobtrusive.adapters.add(
    'requiredif',
    ['dependentproperty', 'targetvalue'],
    function (options) {
        options.rules['requiredif'] = {
            dependentproperty: options.params['dependentproperty'],
            targetvalue: options.params['targetvalue']
        };
        options.messages['requiredif'] = options.message;
    });


  } (jQuery));



  /**
 * Module for displaying "Waiting for..." dialog using Bootstrap
 *
 * @author Eugene Maslovich <ehpc@em42.ru>
 */
//https://bootsnipp.com/snippets/featured/quotwaiting-forquot-modal-dialog

var waitingDialog = waitingDialog || (function ($) {
    'use strict';

	// Creating modal dialog's DOM
	var $dialog = $(
		'<div class="modal fade" data-backdrop="static" data-keyboard="false" tabindex="-1" role="dialog" aria-hidden="true" style="padding-top:15%; overflow-y:visible;">' +
		'<div class="modal-dialog modal-m">' +
		'<div class="modal-content">' +
			'<div class="modal-header"><h3 style="margin:0;"></h3></div>' +
			'<div class="modal-body">' +
				'<div class="progress progress-striped active" style="margin-bottom:0;"><div class="progress-bar" style="width: 100%"></div></div>' +
			'</div>' +
		'</div></div></div>');

	return {
		/**
		 * Opens our dialog
		 * @param message Custom message
		 * @param options Custom options:
		 * 				  options.dialogSize - bootstrap postfix for dialog size, e.g. "sm", "m";
		 * 				  options.progressType - bootstrap postfix for progress bar type, e.g. "success", "warning".
		 */
		show: function (message, options) {
			// Assigning defaults
			if (typeof options === 'undefined') {
				options = {};
			}
			if (typeof message === 'undefined') {
				message = 'Loading';
			}
			var settings = $.extend({
				dialogSize: 'm',
				progressType: '',
				onHide: null // This callback runs after the dialog was hidden
			}, options);

			// Configuring dialog
			$dialog.find('.modal-dialog').attr('class', 'modal-dialog').addClass('modal-' + settings.dialogSize);
			$dialog.find('.progress-bar').attr('class', 'progress-bar');
			if (settings.progressType) {
				$dialog.find('.progress-bar').addClass('progress-bar-' + settings.progressType);
			}
			$dialog.find('h3').html(message);
			// Adding callbacks
			if (typeof settings.onHide === 'function') {
				$dialog.off('hidden.bs.modal').on('hidden.bs.modal', function (e) {
					settings.onHide.call($dialog);
				});
			}
			// Opening dialog
			$dialog.modal();
		},
		/**
		 * Closes dialog
		 */
		hide: function () {
			$dialog.modal('hide');
		}
	};

})(jQuery);


var waitingDialog2 = waitingDialog2 || (function ($) {
    'use strict';

	// Creating modal dialog's DOM
	var $dialog = $(
		'<div class="modal fade" id="pleaseWaitDialog" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">'+
        '<div class="modal-dialog modal-m">'+
		'<div class="modal-content">'+
        '    <div class="modal-header">'+
        '        <h1>Processing...</h1>'+
        '    </div>'+
        '    <div class="modal-body">'+
        '      <div class="progress">'+
        '        <div class="progress-bar progress-bar-success progress-bar-striped active" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width: 100%">'+
        '          <span class="sr-only"></span>'+
        '        </div>'+
        '      </div>'+
        '    </div>'+
        '  </div>'+
        '</div>'+
        '</div>');

	return {
		/**
		 * Opens our dialog
		 * @param message Custom message
		 * @param options Custom options:
		 * 				  options.dialogSize - bootstrap postfix for dialog size, e.g. "sm", "m";
		 * 				  options.progressType - bootstrap postfix for progress bar type, e.g. "success", "warning".
		 */
		show: function (message, options) {
			// Assigning defaults
			if (typeof options === 'undefined') {
				options = {};
			}
			if (typeof message === 'undefined') {
				message = 'Loading';
			}
			var settings = $.extend({
				dialogSize: 'm',
				progressType: '',
				onHide: null // This callback runs after the dialog was hidden
			}, options);

			// Configuring dialog
			$dialog.find('.modal-dialog').attr('class', 'modal-dialog').addClass('modal-' + settings.dialogSize);
			$dialog.find('.progress-bar').attr('class', 'progress-bar');
			if (settings.progressType) {
				$dialog.find('.progress-bar').addClass('progress-bar-' + settings.progressType);
			}
			$dialog.find('h1').text(message);
			// Adding callbacks
			if (typeof settings.onHide === 'function') {
				$dialog.off('hidden.bs.modal').on('hidden.bs.modal', function (e) {
					settings.onHide.call($dialog);
				});
			}
			// Opening dialog
			$dialog.modal();
		},
		/**
		 * Closes dialog
		 */
		hide: function () {
			$dialog.modal('hide');
        },
        setProgressType:function(progressType){
			$dialog.find('.progress-bar').attr('class', 'progress-bar');
			if (progressType) {
				$dialog.find('.progress-bar').addClass('progress-bar-' + progressType);
			}
        },
        setMessage:function(message){
            $dialog.find('h1').text(message);
        }
	};

})(jQuery);


function ConfirmDialog(){
	var $dialog = $(
		'<div class="modal fade" style="z-index:1055" id="confirmDialog" role="dialog">'+
		'<div class="modal-dialog ">'+
		 ' <div class="modal-content">'+
		 '	<div class="modal-header">'+
		 '	  <button type="button" class="close" data-dismiss="modal">&times;</button>'+
		 '	  <h4 class="modal-title">Confirm</h4>'+
		 '	</div>'+
		 '	<div class="modal-body">'+
		 '	  <p id="confirmDialog_content">Please Confirm</p>'+
		 '	</div>'+
		 '	<div class="modal-footer">'+
		 '	  <button id="confirmDialog_yes" type="button" class="btn btn-default" data-dismiss="modal">Yes</button>'+
		 '	  <button  id="confirmDialog_no" type="button" class="btn btn-default" data-dismiss="modal">No</button>'+
		 '	</div>'+
		 '</div>'+
		 '</div>'+
		 '</div>');
	this.dialog=$dialog;
}
ConfirmDialog.prototype.show= function (message,callback, options) {
	// Assigning defaults
	var $dialog= this.dialog;
	if (typeof options === 'undefined') {
		options = {};
	}
	if (typeof message === 'undefined') {
		message = 'Please Confirm';
	}
	var settings = $.extend({
		title:'Confirm',
		yesTitle:'Yes',
		noTitle:'No',
		dialogSize: 'm',
		alertType:'warning'
	}, options);

	// Configuring dialog
	$dialog.find('.modal-dialog').attr('class', 'modal-dialog').addClass('modal-' + settings.dialogSize);
	if (settings.alertType) {
		$dialog.find('.modal-body').addClass('alert-' + settings.alertType);
	}
	$dialog.find('.modal-title').text(settings.title);
	$dialog.find('#confirmDialog_yes').text(settings.yesTitle);
	$dialog.find('#confirmDialog_no').text(settings.noTitle);
	$dialog.find('#confirmDialog_yes').click(function(){
		if(callback){
			callback(true);
		}
		$dialog.modal('hide');
	});
	$dialog.find('#confirmDialog_no').click(function(){
		if(callback){
			callback(false);
		}
		$dialog.modal('hide');
	});

	$dialog.find('#confirmDialog_content').html(message);
	// Opening dialog
	$dialog.modal();
}
/**
 * Closes dialog
 */
ConfirmDialog.prototype.hide= function () {
	this.dialog.modal('hide');
}

ConfirmDialog.prototype.setMessage=function(message){
	this.dialog.find('#confirmDialog_content').html(message);
}
var confirmDialog= new ConfirmDialog();

