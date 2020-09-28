
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
// used in edit_metadata.vash
$.validator.addMethod('dateafterorequal', function (value, element, params) {
	if(value==="")
		return true;
	try{
		value=value+'';
	}catch(e){}
	var other = params.other;
	var otherValue=value;
	var $element = $(element);
	var otherElem = $element.closest('form').find('[name=' + other + ']');
	try{
		otherValue=(otherElem.val()+'');
	}catch(ex){}
	
	return value >= otherValue;
}, '');

$.validator.unobtrusive.adapters.add('dateafterorequal', ['other'], function (options) {
	options.rules['dateafterorequal'] = options.params;
	if (options.message) {
		options.messages['dateafterorequal'] = options.message;
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
		var actualvalue =control.val();
		if(!actualvalue){
			actualvalue= (controltype === 'checkbox' ||  controltype === 'radio')  ?
			//control.attr('checked').toString() :
			control.attr('checked') :
			control.val();
		}
 
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
	var self=this;
	self._confirm=false;
	var $dialog= this.dialog;
	if (typeof options === 'undefined') {
		options = {};
	}
	
	if (typeof message === 'undefined') {
		message = 'Please Confirm';
	}
	var settings = $.extend({
		title:(app.language==='fa')? 'تایید کنید':'Confirm',
		yesTitle:(app.language==='fa')?'بله':'Yes',
		noTitle:(app.language==='fa')?'خیر':'No',
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
		
		self._confirm=true;
		$dialog.modal('hide');
		window.history.back();
	});
	$dialog.find('#confirmDialog_no').click(function(){
		
		self._confirm=false;
		$dialog.modal('hide');
		window.history.back();
	});

	$dialog.find('#confirmDialog_content').html(message);


	$dialog.on('hidden.bs.modal', function () {
		// do something…
		if(callback){
			callback(self._confirm);
		}
		
		var hash = settings.title;
		
	    history.pushState('', document.title, window.location.pathname + window.location.search);
	});

	var hash = settings.title;
	window.location.hash = hash;
	
		window.onhashchange = function() {
				if (!location.hash){
				$dialog.modal('hide');
				}
		};
	
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
;//chrome.exe --remote-debugging-port=9222
var app = {
    name: 'untitled',
    layout:'ltr',
    language:'en',
    version: '1.0.0',
    identity: undefined,
    pageData:{},
    eventHandlers:[],
    snapInteractions:[],
    // init map extent settings are filled in layout.vash from env settings
    initMap_Lon:37.41,
    initMap_Lat:9,
    initMap_Zoom:4,

    DROPDOWN_NULL:'[Not filled]',
    
    OSM_REQUEST_TIMEOUT:20000,//ms
    OSM_FEATURE_COUNT_LIMIT1:100000,//confirm zone
    OSM_FEATURE_COUNT_LIMIT2:500000,

    MAx_TABLE_VIEW_RECORDS:1000,
    get_uploadattachments_url:function(){
        return '/dataset/uploadattachments';
     },
     get_attachment_url:function(datasetId,attachmentId,thumbnail){
         if(thumbnail){
             return "/dataset/"+datasetId+"/attachment/"+attachmentId+"?thumbnail=true";
             
         }else{
             return "/dataset/"+datasetId+"/attachment/"+attachmentId;
         }
     },
    //openrouteservice
    routeServiceTokens:[],
    //overpassApiServer:'https://overpass-api.de/api/interpreter',
    overpassApiServer:'//overpass-api.de/api/interpreter',
    //overpassApiServer:'//overpass.openstreetmap.fr/api/interpreter',
    
    setIdentity: function (identityJsonStr) {
        this.identity = JSON.parse(identityJsonStr);
        //alert(JSON.stringify(identity));
       // alert(this.identity.name);
    },
    set_UPLOAD_RASTER_MAX_SIZE_MB:function(v){
        this.UPLOAD_RASTER_MAX_SIZE_MB=v;
    },
    set_UPLOAD_SHAPEFILE_MAX_SIZE_MB: function(v){
        this.UPLOAD_SHAPEFILE_MAX_SIZE_MB=v;
    },
    set_UPLOAD_FILE_MAX_SIZE_MB:function(v){
        this.UPLOAD_FILE_MAX_SIZE_MB=v;
    },
    set_ROUTE_SERVICE_TOKENS: function(v){
        if(v){
         this.routeServiceTokens= v.split(',');   
        }
    },
    render:function(template,model){
        if (!model){
            model=this;
        }
        if(typeof vash !=='undefined'){
            var tpl = vash.compile( template );
            return tpl(model);
        }else{
            return 'vash engine is not loaded';
        }
    },
    sanitizeHtml:function(html,options){
        //options:{SAFE_FOR_JQUERY: true}
       return DOMPurify.sanitize(html,options );
    },
    sanitizeHtml_JQuery:function(html,options){
        options=options||{};
        options['SAFE_FOR_JQUERY']= true;
       return DOMPurify.sanitize(html,options );
    },
    htmlEncode:function(value){
        //return $('<div/>').text(value).html();
        if(!value){
            return value;
        }
        var buf = [];
			
			for (var i=value.length-1;i>=0;i--) {
				buf.unshift(['&#', value[i].charCodeAt(), ';'].join(''));
			}
			
			return buf.join('');
      },
      
    htmlDecode:function(value){
        
      //  return $('<div/>').html(value).text();
      value=value+'';
      return value.replace(/&#(\d+);/g, function(match, dec) {
        return String.fromCharCode(dec);
       });
    },
    test: function (str) {
        alert(str);
    },isMobile:function(){
        var isMobile_ = false; //initiate as false
        // device detection
        if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
            || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
            isMobile_ = true;
        }
        return isMobile_
    },
    registerEventhandler:function (type,handler) {
        var handlers= this.eventHandlers[type];
        if(!handlers){
            handlers=[];
            this.eventHandlers[type] =handlers;
        }
        handlers.push(handler);
    },
    unRegisterEventhandler:function (type,handler) {
        var handlers= this.eventHandlers[type];
        if(!handlers){
            handlers=[];
            this.eventHandlers[type] =handlers;
        }
        var index= handlers.findIndex(function (handler_) {
            if(handler && (handler== handler_)){
                return true;
            }
            return false;
        });
        if(index>-1){
            handlers.splice(index,1);
        }
    },
    dispatchEvent: function (type,eventArgs) {
        var handlers= this.eventHandlers[type];
        if(!handlers){
            handlers=[];
            this.eventHandlers[type] =handlers;
        } 
        var ii=handlers.length;
        for (var i = 0; i < ii; i++) {

            if (handlers[i] && (handlers[i].call(this, eventArgs) === false || (eventArgs && eventArgs.propagationStopped))) {
              break;
            }
          } 
          
    },
    registerSnapInteraction:function(interaction){
        this.snapInteractions.push(interaction);

    },
    addSnapInteractions:function(map){
        if(!map){
            return;
        }
        for(var i=0;i<this.snapInteractions.length;i++){
            map.removeInteraction(this.snapInteractions[i]);
            if(this.snapInteractions[i].getActive()){
                map.addInteraction(this.snapInteractions[i]);
            }
        }
    },
    removeSnapInteractions:function(map){
        if(!map){
            return;
        }
        for(var i=0;i<this.snapInteractions.length;i++){
            map.removeInteraction(this.snapInteractions[i]);
        }
    },
    url_needs_proxy:function(url){
        var result=false;
        if(!url){
            return result;
        }
        url=(url +'').toLowerCase();
        if(url.indexOf('/')==0){
            return result;
        }
        var pageUrl = window.location.href;
        var arr = pageUrl.split("/");
        var pageBase =arr[0] + "//" + arr[2];
        pageBase=pageBase.toLowerCase();
        
        if(url.indexOf(pageBase)==0){
            result=false;
        }else{
            result=true;
        }
        return result;

    },
    get_proxy_url:function(url){
        return '/proxy/?url='+ encodeURIComponent(url);
    }

};

