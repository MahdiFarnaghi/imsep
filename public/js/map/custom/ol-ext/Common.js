/**
 * ol-ext - A set of cool extensions for OpenLayers (ol) in node modules structure
 * @description ol3,openlayers,popup,menu,symbol,renderer,filter,canvas,interaction,split,statistic,charts,pie,LayerSwitcher,toolbar,animation
 * @version v3.1.7
 * @author Jean-Marc Viglino
 * @see https://github.com/Viglino/ol-ext#,
 * @license BSD-3-Clause
 */
/** @namespace  ol.ext
 */
/*global ol*/
if (window.ol && !ol.ext) {
	ol.ext = {};
  }
  /** Inherit the prototype methods from one constructor into another.
   * replace deprecated ol method
   *
   * @param {!Function} childCtor Child constructor.
   * @param {!Function} parentCtor Parent constructor.
   * @function module:ol.inherits
   * @api
   */
  ol.ext.inherits = function(child,parent) {
	child.prototype = Object.create(parent.prototype);
	child.prototype.constructor = child;
  };
  // Compatibilty with ol > 5 to be removed when v6 is out
  if (window.ol) {
	if (!ol.inherits) ol.inherits = ol.ext.inherits;
  }
  /* IE Polyfill */
  // NodeList.forEach
  if (window.NodeList && !NodeList.prototype.forEach) {
	NodeList.prototype.forEach = Array.prototype.forEach;
  }
  // Element.remove
  if (window.Element && !Element.prototype.remove) {
	Element.prototype.remove = function() {
	  if (this.parentNode) this.parentNode.removeChild(this);
	}
  }
  /* End Polyfill */
  
  /** Ajax request
   * @fires success
   * @fires error
   * @param {*} options
   *  @param {string} options.auth Authorisation as btoa("username:password");
   *  @param {string} options.dataType The type of data that you're expecting back from the server, default JSON
   */
  ol.ext.Ajax = function(options) {
	options = options || {};
	  ol.Object.call(this);
	this._auth = options.auth;
	this.set('dataType', options.dataType || 'JSON');
  };
  ol.ext.inherits(ol.ext.Ajax, ol.Object);
  /** Helper for get
   * @param {*} options
   *  @param {string} options.url
   *  @param {string} options.auth Authorisation as btoa("username:password");
   *  @param {string} options.dataType The type of data that you're expecting back from the server, default JSON
   *  @param {string} options.success
   *  @param {string} options.error
   *  @param {*} options.options get options
   */
  ol.ext.Ajax.get = function(options) {
	var ajax = new ol.ext.Ajax(options);
	if (options.success) ajax.on('success', function(e) { options.success(e.response, e); } );
	if (options.error) ajax.on('error', function(e) { options.error(e); } );
	ajax.send(options.url, options.data, options.options);
  };
  /** Send an ajax request (GET)
   * @fires success
   * @fires error
   * @param {string} url
   * @param {*} data Data to send to the server as key / value
   * @param {*} options a set of options that are returned in the 
   *  @param {boolean} options.abort false to prevent aborting the current request, default true
   */
  ol.ext.Ajax.prototype.send = function (url, data, options){
	options = options || {};
	  var self = this;
	// Url
	var encode = (options.encode !== false) 
	if (encode) url = encodeURI(url);
	// Parameters
	var parameters = '';
	  for (var index in data) {
		  if (data.hasOwnProperty(index) && data[index]!==undefined) {
		parameters += (parameters ? '&' : '?') + index + '=' + (encode ? encodeURIComponent(data[index]) : data[index]);
	  }
	}
	  // Abort previous request
	  if (this._request && options.abort!==false) {
		  this._request.abort();
	  }
	  // New request
	  var ajax = this._request = new XMLHttpRequest();
	  ajax.open('GET', url + parameters, true);
	  if (this._auth) {
		  ajax.setRequestHeader("Authorization", "Basic " + this._auth);
	  }
	// Load complete
	this.dispatchEvent ({ type: 'loadstart' });
	  ajax.onload = function() {
		  self._request = null;
	  self.dispatchEvent ({ type: 'loadend' });
	  if (this.status >= 200 && this.status < 400) {
		var response;
		// Decode response
		try {
		  switch (self.get('dataType')) {
			case 'JSON': {
			  response = JSON.parse(this.response);
			  break;
			}
			default: {
			  response = this.response;
			}
		  }
		} catch(e) {
		  // Error
		  self.dispatchEvent ({ 
			type: 'error',
			status: 0,
			statusText: 'parsererror',
			error: e,
			options: options,
			jqXHR: this
		  });
		  return;
		}
		// Success
		//console.log('response',response)
		self.dispatchEvent ({ 
		  type: 'success',
		  response: response,
		  status: this.status,
		  statusText: this.statusText,
		  options: options,
		  jqXHR: this
		});
	  } else {
		self.dispatchEvent ({ 
		  type: 'error',
		  status: this.status,
		  statusText: this.statusText,
		  options: options,
		  jqXHR: this
		});
	  }
	  };
	  // Oops
	  ajax.onerror = function() {
	  self._request = null;
	  self.dispatchEvent ({ type: 'loadend' });
	  self.dispatchEvent ({ 
		type: 'error',
		status: this.status,
		statusText: this.statusText,
		options: options,
		jqXHR: this
	  });
	};
	  // GO!
	  ajax.send();
  };
  
  /** Vanilla JS helper to manipulate DOM without jQuery
   * @see https://github.com/nefe/You-Dont-Need-jQuery
   * @see https://plainjs.com/javascript/
   * @see http://youmightnotneedjquery.com/
   */
   ol.ext.element = {};
  /**
   * Create an element
   * @param {string} tagName The element tag, use 'TEXT' to create a text node
   * @param {*} options
   *  @param {string} options.className className The element class name 
   *  @param {Element} options.parent Parent to append the element as child
   *  @param {Element|string} options.html Content of the element
   *  @param {string} options.* Any other attribut to add to the element
   */
  ol.ext.element.create = function (tagName, options) {
	options = options || {};
	var elt;
	// Create text node
	if (tagName === 'TEXT') {
	  elt = document.createTextNode(options.html||'');
	  if (options.parent) options.parent.appendChild(elt);
	} else {
	  // Other element
	  elt = document.createElement(tagName);
	  if (/button/i.test(tagName)) elt.setAttribute('type', 'button');
	  for (var attr in options) {
		switch (attr) {
		  case 'className': {
			if (options.className && options.className.trim) elt.setAttribute('class', options.className.trim());
			break;
		  }
		  case 'html': {
			if (options.html instanceof Element) elt.appendChild(options.html)
			else if (options.html!==undefined) elt.innerHTML = options.html;
			break;
		  }
		  case 'parent': {
			options.parent.appendChild(elt);
			break;
		  }
		  case 'style': {
			this.setStyle(elt, options.style);
			break;
		  }
		  case 'change':
		  case 'click': {
			ol.ext.element.addListener(elt, attr, options[attr]);
			break;
		  }
		  case 'on': {
			for (var e in options.on) {
			  ol.ext.element.addListener(elt, e, options.on[e]);
			}
			break;
		  }
		  case 'checked': {
			elt.checked = !!options.checked;
			break;
		  }
		  default: {
			elt.setAttribute(attr, options[attr]);
			break;
		  }
		}
	  }
	}
	return elt;
  };
  /** Set inner html or append a child element to an element
   * @param {Element} element
   * @param {Element|string} html Content of the element
   */
  ol.ext.element.setHTML = function(element, html) {
	if (html instanceof Element) element.appendChild(html)
	else if (html!==undefined) element.innerHTML = html;
  };
  /** Append text into an elemnt
   * @param {Element} element
   * @param {string} text text content
   */
  ol.ext.element.appendText = function(element, text) {
	element.appendChild(document.createTextNode(text||''));
  };
  /**
   * Add a set of event listener to an element
   * @param {Element} element
   * @param {string|Array<string>} eventType
   * @param {function} fn
   */
  ol.ext.element.addListener = function (element, eventType, fn) {
	if (typeof eventType === 'string') eventType = eventType.split(' ');
	eventType.forEach(function(e) {
	  element.addEventListener(e, fn);
	});
  };
  /**
   * Add a set of event listener to an element
   * @param {Element} element
   * @param {string|Array<string>} eventType
   * @param {function} fn
   */
  ol.ext.element.removeListener = function (element, eventType, fn) {
	if (typeof eventType === 'string') eventType = eventType.split(' ');
	eventType.forEach(function(e) {
	  element.removeEventListener(e, fn);
	});
  };
  /**
   * Show an element
   * @param {Element} element
   */
  ol.ext.element.show = function (element) {
	element.style.display = '';
  };
  /**
   * Hide an element
   * @param {Element} element
   */
  ol.ext.element.hide = function (element) {
	element.style.display = 'none';
  };
  /**
   * Test if an element is hihdden
   * @param {Element} element
   * @return {boolean}
   */
  ol.ext.element.hidden = function (element) {
	return ol.ext.element.getStyle(element, 'display') === 'none';
  };
  /**
   * Toggle an element
   * @param {Element} element
   */
  ol.ext.element.toggle = function (element) {
	element.style.display = (element.style.display==='none' ? '' : 'none');
  };
  /** Set style of an element
   * @param {DOMElement} el the element
   * @param {*} st list of style
   */
  ol.ext.element.setStyle = function(el, st) {
	for (var s in st) {
	  switch (s) {
		case 'top':
		case 'left':
		case 'bottom':
		case 'right':
		case 'minWidth':
		case 'maxWidth':
		case 'width':
		case 'height': {
		  if (typeof(st[s]) === 'number') {
			el.style[s] = st[s]+'px';
		  } else {
			el.style[s] = st[s];
		  }
		  break;
		}
		default: {
		  el.style[s] = st[s];
		}
	  }
	}
  };
  /**
   * Get style propertie of an element
   * @param {DOMElement} el the element
   * @param {string} styleProp Propertie name
   * @return {*} style value
   */
  ol.ext.element.getStyle = function(el, styleProp) {
	var value, defaultView = (el.ownerDocument || document).defaultView;
	// W3C standard way:
	if (defaultView && defaultView.getComputedStyle) {
	  // sanitize property name to css notation
	  // (hypen separated words eg. font-Size)
	  styleProp = styleProp.replace(/([A-Z])/g, "-$1").toLowerCase();
	  value = defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
	} else if (el.currentStyle) { // IE
	  // sanitize property name to camelCase
	  styleProp = styleProp.replace(/-(\w)/g, function(str, letter) {
		return letter.toUpperCase();
	  });
	  value = el.currentStyle[styleProp];
	  // convert other units to pixels on IE
	  if (/^\d+(em|pt|%|ex)?$/i.test(value)) { 
		return (function(value) {
		  var oldLeft = el.style.left, oldRsLeft = el.runtimeStyle.left;
		  el.runtimeStyle.left = el.currentStyle.left;
		  el.style.left = value || 0;
		  value = el.style.pixelLeft + "px";
		  el.style.left = oldLeft;
		  el.runtimeStyle.left = oldRsLeft;
		  return value;
		})(value);
	  }
	}
	if (/px$/.test(value)) return parseInt(value);
	return value;
  };
  /** Get outerHeight of an elemen
   * @param {DOMElement} elt
   * @return {number}
   */
  ol.ext.element.outerHeight = function(elt) {
	return elt.offsetHeight + ol.ext.element.getStyle(elt, 'marginBottom')
  };
  /** Get outerWidth of an elemen
   * @param {DOMElement} elt
   * @return {number}
   */
  ol.ext.element.outerWidth = function(elt) {
	return elt.offsetWidth + ol.ext.element.getStyle(elt, 'marginLeft')
  };
  /** Get element offset rect
   * @param {DOMElement} elt
   * @return {*} 
   */
  ol.ext.element.offsetRect = function(elt) {
	var rect = elt.getBoundingClientRect();
	return {
	  top: rect.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0),
	  left: rect.left + (window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0),
	  height: rect.height || (rect.bottom - rect.top),
	  width: rect.widtth || (rect.right - rect.left)
	}
  };
  /** Make a div scrollable without scrollbar.
   * On touch devices the default behavior is preserved
   * @param {DOMElement} elt
   * @param {function} onmove a function that takes a boolean indicating that the div is scrolling
   */
  ol.ext.element.scrollDiv = function(elt, options) {
	var pos = false;
	var speed = 0;
	var d, dt = 0;
	var onmove = (typeof(options.onmove) === 'function' ? options.onmove : function(){});
	var page = options.vertical ? 'pageY' : 'pageX';
	var scroll = options.vertical ? 'scrollTop' : 'scrollLeft';
	// Prevent image dragging
	elt.querySelectorAll('img').forEach(function(i) {
	  i.ondragstart = function(){ return false; };
	});
	// Start scrolling
	ol.ext.element.addListener(elt, ['mousedown'], function(e) {
	  pos = e[page];
	  dt = new Date();
	  elt.classList.add('ol-move');
	});
	// Register scroll
	ol.ext.element.addListener(window, ['mousemove'], function(e) {
	  if (pos !== false) {
		var delta = pos - e[page];
		elt[scroll] += delta;
		d = new Date();
		if (d-dt) {
		  speed = (speed + delta / (d - dt))/2;
		}
		pos = e[page];
		dt = d;
		// Tell we are moving
		if (delta) onmove(true);
	  } else {
		// Not moving yet
		onmove(false);
	  }
	});
	// Stop scrolling
	ol.ext.element.addListener(window, ['mouseup'], function(e) {
	  elt.classList.remove('ol-move');
	  dt = new Date() - dt;
	  if (dt>100) {
		// User stop: no speed
		speed = 0;
	  } else if (dt>0) {
		// Calculate new speed
		speed = ((speed||0) + (pos - e[page]) / dt) / 2;
	  }
	  elt[scroll] += speed*100;
	  pos = false;
	  speed = 0;
	  dt = 0;
	});
	// Handle mousewheel
	if (options.mousewheel && !elt.classList.contains('ol-touch')) {
	  ol.ext.element.addListener(elt, 
		['mousewheel', 'DOMMouseScroll', 'onmousewheel'], 
		function(e) {
		  var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		  elt.classList.add('ol-move');
		  elt[scroll] -= delta*30;
		  return false;
		}
	  );
	}
  };
  
  /** Get a canvas overlay for a map (non rotated, on top of the map)
   * @param {ol.Map} map
   * @return {canvas}
   */
  ol.ext.getMapCanvas = function(map) {
	if (!map) return null;
	var canvas = map.getViewport().getElementsByClassName('ol-fixedoverlay')[0];
	if (!canvas && map.getViewport().querySelector('.ol-layers')) {
	  // Add a fixed canvas layer on top of the map
	  canvas = document.createElement('canvas');
	  canvas.className = 'ol-fixedoverlay';
	  map.getViewport().querySelector('.ol-layers').after(canvas);
	  // Clear before new compose
	  map.on('precompose', function (e){
		canvas.width = map.getSize()[0] * e.frameState.pixelRatio;
		canvas.height = map.getSize()[1] * e.frameState.pixelRatio;
	  });
	}
	return canvas;
  };
	
  /* global ol */
  /* Create ol.sphere for backward compatibility with ol < 5.0
   * To use with Openlayers package
   */
  if (window.ol && !ol.sphere) {
	ol.sphere = {};
	ol.sphere.getDistance = function (c1, c2, radius) {
	  var sphere = new ol.Sphere(radius || 6371008.8);
	  return sphere.haversineDistance(c1, c2);
	}
	ol.sphere.getArea = ol.Sphere.getArea;
	ol.sphere.getLength = ol.Sphere.getLength;
  }