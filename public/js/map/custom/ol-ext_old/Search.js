/*	Copyright (c) 2017 Jean-Marc VIGLINO,
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * Search Control.
 * This is the base class for search controls. You can use it for simple custom search or as base to new class.
 * @see ol.control.SearchFeature
 * @see ol.control.SearchPhoton
 *
 * @constructor
 * @extends {ol.control.Control}
 * @fires select
 * @fires change:input
 * @param {Object=} options
 *	@param {string} options.className control class name
 *	@param {Element | string | undefined} options.target Specify a target if you want the control to be rendered outside of the map's viewport.
 *	@param {string | undefined} options.label Text label to use for the search button, default "search"
 *	@param {string | undefined} options.placeholder placeholder, default "Search..."
 *	@param {string | undefined} options.inputLabel label for the input, default none
 *	@param {string | undefined} options.noCollapse prevent collapsing on input blur, default false
 *	@param {number | undefined} options.typing a delay on each typing to start searching (ms) use -1 to prevent autocompletion, default 300.
 *	@param {integer | undefined} options.minLength minimum length to start searching, default 1
 *	@param {integer | undefined} options.maxItems maximum number of items to display in the autocomplete list, default 10
 *	@param {integer | undefined} options.maxHistory maximum number of items to display in history. Set -1 if you don't want history, default maxItems
 *	@param {function} options.getTitle a function that takes a feature and return the name to display in the index.
 *	@param {function} options.autocomplete a function that take a search string and callback function to send an array
 */
ol.control.Search = function(options) {
	var self = this;
	  if (!options) options = {};
	  if (options.typing == undefined) options.typing = 300;
	// Class name for history
	this._classname = options.className || 'search';
	  var element = document.createElement("DIV");
	  var classNames = (options.className||"")+ " ol-search";
	  if (!options.target) {
	  classNames += " ol-unselectable ol-control ol-collapsed";
		  this.button = document.createElement("BUTTON");
		  this.button.setAttribute("type", "button");
		  this.button.setAttribute("title", options.label||"search");
		  this.button.addEventListener("click", function() {
		element.classList.toggle("ol-collapsed");
		if (!element.classList.contains("ol-collapsed")) {
		  element.querySelector("input.search").focus();
		  var listElements = element.querySelectorAll("li");
		  for (var i = 0; i < listElements.length; i++) {
			listElements[i].classList.remove("select");
		  }
		  // Display history
		  if (!input.value) {
			self.drawList_();
		  }
		}
	  });
		  element.appendChild(this.button);
	  }
	  element.setAttribute('class', classNames);
	  // Input label
	  if (options.inputLabel) {
		  var label = document.createElement("LABEL");
		  label.innerText = options.inputLabel;
		  element.appendChild(label);
	  }
	  // Search input
	  var tout, cur="";
	  var input = this._input = document.createElement("INPUT");
	  input.setAttribute("type", "search");
	  input.setAttribute("class", "search");
	  input.setAttribute("placeholder", options.placeholder||"Search...");
	  input.addEventListener("change", function(e) {
	  self.dispatchEvent({ type:"change:input", input:e, value:input.value });
	});
	  var doSearch = function(e) {
	  // console.log(e.type+" "+e.key)'
		  var li  = element.querySelector("ul.autocomplete li.select");
		  var	val = input.value;
		  // move up/down
		  if (e.key=='ArrowDown' || e.key=='ArrowUp' || e.key=='Down' || e.key=='Up') {
		if (li) {
		  li.classList.remove("select");
				  li = (/Down/.test(e.key)) ? li.nextElementSibling : li.previousElementSibling;
				  if (li) li.classList.add("select");
			  }
			  else element.querySelector("ul.autocomplete li").classList.add("select");
		  }
		  // Clear input
		  else if (e.type=='input' && !val) {
		self.drawList_();
		  }
		  // Select in the list
		  else if (li && (e.type=="search" || e.key =="Enter")) {
		if (element.classList.contains("ol-control")) input.blur();
			  li.classList.remove("select");
			  cur = val;
			  self._handleSelect(self._list[li.getAttribute("data-search")]);
		  }
		  // Search / autocomplete
		  else if ( (e.type=="search" || e.key =='Enter')
			  || (cur!=val && options.typing>=0)) {
		// current search
			  cur = val;
			  if (cur) {
		  // prevent searching on each typing
				  if (tout) clearTimeout(tout);
				  tout = setTimeout(function() {
			if (cur.length >= self.get("minLength")) {
			  var s = self.autocomplete (cur, function(auto) { self.drawList_(auto); });
						if (s) self.drawList_(s);
			}
			else self.drawList_();
				  }, options.typing);
			  }
			  else self.drawList_();
		  }
		  // Clear list selection
		  else {
		var li = element.querySelector("ul.autocomplete li");
			  if (li) li.classList.remove('select');
		  }
	  };
	  input.addEventListener("keyup", doSearch);
	  input.addEventListener("search", doSearch);
	  input.addEventListener("cut", doSearch);
	  input.addEventListener("paste", doSearch);
	  input.addEventListener("input", doSearch);
	  if (!options.noCollapse) {
		  input.addEventListener('blur', function() {
			  setTimeout(function(){ element.classList.add('ol-collapsed') }, 200);
		  });
		  input.addEventListener('focus', function() {
			  element.classList.remove('ol-collapsed');
		  });
	  }
	  element.appendChild(input);
	  // Autocomplete list
	  var ul = document.createElement('UL');
	  ul.classList.add('autocomplete');
	  element.appendChild(ul);
	  ol.control.Control.call(this, {
	  element: element,
	  target: options.target
	});
	  if (typeof (options.getTitle)=='function') this.getTitle = options.getTitle;
	  if (typeof (options.autocomplete)=='function') this.autocomplete = options.autocomplete;
	  // Options
	  this.set('minLength', options.minLength || 1);
	this.set('maxItems', options.maxItems || 10);
	this.set('maxHistory', options.maxHistory || options.maxItems || 10);
	// History
	  this.restoreHistory();
	  this.drawList_();
  };
  ol.inherits(ol.control.Search, ol.control.Control);
  /** Returns the text to be displayed in the menu
  *	@param {any} f feature to be displayed
  *	@return {string} the text to be displayed in the index, default f.name
  *	@api
  */
  ol.control.Search.prototype.getTitle = function (f) {
	return f.name || "No title";
  };
  /** Force search to refresh
   */
  ol.control.Search.prototype.search = function () {
	var search = this.element.querySelector("input.search");
	  this._triggerCustomEvent('search', search);
  };
  /** Trigger custom event on elemebt
   * @param {*} eventName 
   * @param {*} element 
   * @private
   */
  ol.control.Search.prototype._triggerCustomEvent = function (eventName, element) {
	var event;
	  if (window.CustomEvent) {
	  event = new CustomEvent(eventName);
	  } else {
	  event = document.createEvent("CustomEvent");
		  event.initCustomEvent(eventName, true, true, {});
	  }
	  element.dispatchEvent(event);
  };
  /** Set the input value in the form (for initialisation purpose)
  *	@param {string} value
  *	@param {boolean} search to start a search
  *	@api
  */
  ol.control.Search.prototype.setInput = function (value, search) {
	var input = this.element.querySelector("input.search");
	  input.value = value;
	  if (search) this._triggerCustomEvent("keyup", input);
  };
  /** A ligne has been clicked in the menu > dispatch event
  *	@param {any} f the feature, as passed in the autocomplete
  *	@api
  */
  ol.control.Search.prototype.select = function (f) {
	this.dispatchEvent({ type:"select", search:f });
  };
  /**
   * Save history and select
   * @param {*} f 
   * @private
   */
  ol.control.Search.prototype._handleSelect = function (f) {
	  if (!f) return;
	// Save input in history
	var hist = this.get('history');
	// Prevent error on stringify
	try {
	  var fstr = JSON.stringify(f);
	  for (var i=hist.length-1; i>=0; i--) {
		if (!hist[i] || JSON.stringify(hist[i]) === fstr) {
		  hist.splice(i,1);
		}
	  }
	} catch (e) {
	  for (var i=hist.length-1; i>=0; i--) {
		if (hist[i] === f) {
		  hist.splice(i,1);
		}
	  }
	  };
	  hist.unshift(f);
	  while (hist.length > (this.get('maxHistory')||10)) {
		  hist.pop();
	  } 
	  this.saveHistory();
	// Select feature
	  this.select(f);
	  //this.drawList_();
  };
  /** Save history (in the localstorage)
   */
  ol.control.Search.prototype.saveHistory = function () {
	if (this.get('maxHistory')>=0) {
	  try {
		localStorage["ol@search-"+this._classname] = JSON.stringify(this.get('history'));
	  } catch (e) {};
	} else {
	  localStorage.removeItem("ol@search-"+this._classname);
	}
  };
  /** Restore history (from the localstorage) 
   */
  ol.control.Search.prototype.restoreHistory = function () {
	try {
	  this.set('history', JSON.parse(localStorage["ol@search-"+this._classname]) );
	} catch(e) {
	  this.set('history', []);
	}
  };
  /**
   * Remove previous history
   */
  ol.control.Search.prototype.clearHistory = function () {
	this.set('history', []);
	  this.saveHistory();
	  this.drawList_();
  };
  /**
   * Get history table
   */
  ol.control.Search.prototype.getHistory = function () {
	return this.get('history');
  };
  /** Autocomplete function
  * @param {string} s search string
  * @param {function} cback a callback function that takes an array to display in the autocomplete field (for asynchronous search)
  * @return {Array|false} an array of search solutions or false if the array is send with the cback argument (asnchronous)
  * @api
  */
  ol.control.Search.prototype.autocomplete = function (s, cback) {
	  cback ([]);
	  return false;
	  // or just return [];
  };
  /** Draw the list
  * @param {Array} auto an array of search result
  * @private
  */
  ol.control.Search.prototype.drawList_ = function (auto) {
	  var self = this;
	  var ul = this.element.querySelector("ul.autocomplete");
	  ul.innerHTML = '';
	  this._list = [];
	  if (!auto) {
	  var input = this.element.querySelector("input.search");
	  var value = input.value;
	  if (!value) {
		auto = this.get('history');
	  } else {
		return;
	  }
	  ul.setAttribute('class', 'autocomplete history');
	} else {
	  ul.setAttribute('class', 'autocomplete');
	}
	  var max = Math.min (self.get("maxItems"),auto.length);
	  for (var i=0; i<max; i++) {	
		  if (auto[i]) {
			  if (!i || !self.equalFeatures(auto[i], auto[i-1])) {
				  var li = document.createElement("LI");
				  li.setAttribute("data-search", i);
				  this._list.push(auto[i]);
				  li.addEventListener("click", function(e) {
					  self._handleSelect(self._list[e.currentTarget.getAttribute("data-search")]);
				  });
				  li.innerHTML = self.getTitle(auto[i]);
				  ul.appendChild(li);
			  }
		  }
	  }
	  if (max && this.get("copy")) {
		  var li = document.createElement("LI");
			
			//li.classList.add("copy");
		  //li.innerHTML = this.get("copy");
			//ul.appendChild(li);
			
			li.classList.add("clear-history");
		  li.innerHTML = "Clear history";
			ul.appendChild(li);
			
			li.addEventListener("click", function(e) {
				self.clearHistory();
			});
	  }
  };
  /** Test if 2 features are equal
   * @param {any} f1
   * @param {any} f2
   * @return {boolean}
   */
  ol.control.Search.prototype.equalFeatures = function (f1, f2) {
	  return false;
  };
  
  /*	Copyright (c) 2017 Jean-Marc VIGLINO,
	  released under the CeCILL-B license (French BSD license)
	  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
  */
  /**
   * This is the base class for search controls that use a json service to search features.
   * You can use it for simple custom search or as base to new class.
   *
   * @constructor
   * @extends {ol.control.Search}
   * @fires select
   * @param {any} options extend ol.control.Search options
   *	@param {string} options.className control class name
   *	@param {Element | string | undefined} options.target Specify a target if you want the control to be rendered outside of the map's viewport.
   *	@param {string | undefined} options.label Text label to use for the search button, default "search"
   *	@param {string | undefined} options.placeholder placeholder, default "Search..."
   *	@param {number | undefined} options.typing a delay on each typing to start searching (ms), default 1000.
   *	@param {integer | undefined} options.minLength minimum length to start searching, default 3
   *	@param {integer | undefined} options.maxItems maximum number of items to display in the autocomplete list, default 10
   *  @param {function | undefined} options.handleResponse Handle server response to pass the features array to the list
   *
   *	@param {string|undefined} options.url Url of the search api
   *	@param {string | undefined} options.authentication: basic authentication for the search API as btoa("login:pwd")
   */
  ol.control.SearchJSON = function(options)
  {	options = options || {};
	  options.className = options.className || 'JSON';
	  delete options.autocomplete;
	  options.minLength = options.minLength || 3;
	  options.typing = options.typing || 800;
	  ol.control.Search.call(this, options);
	  // Handle Mix Content Warning
	  // If the current connection is an https connection all other connections must be https either
	  var url = options.url || "";
	  if (window.location.protocol === "https:") {
		  var parser = document.createElement('a');
		  parser.href = url;
		  parser.protocol = window.location.protocol;
		  url = parser.href;
	  }
	  this.set('url', url);
	  this._auth = options.authentication;
	  // Overwrite handleResponse
	  if (typeof(options.handleResponse)==='function') this.handleResponse = options.handleResponse;
  };
  ol.inherits(ol.control.SearchJSON, ol.control.Search);
  /** Autocomplete function (ajax request to the server)
  * @param {string} s search string
  * @param {function} cback a callback function that takes an array of {name, feature} to display in the autocomplete field
  */
  ol.control.SearchJSON.prototype.autocomplete = function (s, cback)
  {	var data = this.requestData(s);
	  var url = encodeURI(this.get('url'));
	  var parameters = '';
	  for (var index in data) {
		  parameters += (parameters) ? '&' : '?';
		  if (data.hasOwnProperty(index)) parameters += index + '=' + encodeURIComponent(data[index]);
	  }
	  this.ajax(url + parameters, 
		  function (resp) {
			  if (resp.status >= 200 && resp.status < 400) {
				  var data = JSON.parse(resp.response);
				  cback(this.handleResponse(data));
			  } else {
				  console.log(url + parameters, arguments);
			  }
		  }, function(){
			  console.log(url + parameters, arguments);
		  });
  };
  /** Send an ajax request (GET)
   * @param {string} url
   * @param {function} onsuccess callback
   * @param {function} onerror callback
   */
  ol.control.SearchJSON.prototype.ajax = function (url, onsuccess, onerror){
	  var self = this;
	  // Abort previous request
	  if (this._request) {
		  this._request.abort();
	  }
	  // New request
	  var ajax = this._request = new XMLHttpRequest();
	  ajax.open('GET', url, true);
	  if (this._auth) {
		  ajax.setRequestHeader("Authorization", "Basic " + this._auth);
	  }
	  this.element.classList.add('searching');
	  // Load complete
	  ajax.onload = function() {
		  self._request = null;
		  self.element.classList.remove('searching');
		  onsuccess.call(self, this);
	  };
	  // Oops, TODO do something ?
	  ajax.onerror = function() {
		  self._request = null;
		  self.element.classList.remove('searching');
		  if (onerror) onerror.call(self);
	  };
	  // GO!
	  ajax.send();
  };
  /**
   * @param {string} s the search string
   * @return {Object} request data (as key:value)
   * @api
   */
  ol.control.SearchJSON.prototype.requestData = function (s){
	  return { q: s };
  };
  /**
   * Handle server response to pass the features array to the display list
   * @param {any} response server response
   * @return {Array<any>} an array of feature
   * @api
   */
  ol.control.SearchJSON.prototype.handleResponse = function (response) {
	  return response;
  };
  
  /*	Copyright (c) 2017 Jean-Marc VIGLINO,
	  released under the CeCILL-B license (French BSD license)
	  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
  */
  /**
   * Search places using the photon API.
   *
   * @constructor
   * @extends {ol.control.SearchJSON}
   * @fires select
   * @param {Object=} Control options.
   *	@param {string} options.className control class name
   *	@param {Element | string | undefined} options.target Specify a target if you want the control to be rendered outside of the map's viewport.
   *	@param {string | undefined} options.label Text label to use for the search button, default "search"
   *	@param {string | undefined} options.placeholder placeholder, default "Search..."
   *	@param {number | undefined} options.typing a delay on each typing to start searching (ms), default 1000.
   *	@param {integer | undefined} options.minLength minimum length to start searching, default 3
   *	@param {integer | undefined} options.maxItems maximum number of items to display in the autocomplete list, default 10
   *  @param {function | undefined} options.handleResponse Handle server response to pass the features array to the list
   * 
   *	@param {string|undefined} options.url Url to photon api, default "http://photon.komoot.de/api/"
   *	@param {string|undefined} options.lang Force preferred language, default none
   *	@param {boolean} options.position Search, with priority to geo position, default false
   *	@param {function} options.getTitle a function that takes a feature and return the name to display in the index, default return street + name + contry
   */
  ol.control.SearchPhoton = function(options)
  {	options = options || {};
	  options.className = options.className || 'photon';
	  options.url = options.url || "http://photon.komoot.de/api/";
	  ol.control.SearchJSON.call(this, options);
	  this.set('lang', options.lang);
	  this.set('position', options.position);
	  this.set("copy","<a href='http://www.openstreetmap.org/copyright' target='new'>&copy; OpenStreetMap contributors</a>");
  };
  ol.inherits(ol.control.SearchPhoton, ol.control.SearchJSON);
  /** Returns the text to be displayed in the menu
  *	@param {ol.Feature} f the feature
  *	@return {string} the text to be displayed in the index
  *	@api
  */
  ol.control.SearchPhoton.prototype.getTitle = function (f)
  {	var p = f.properties;
	  return (p.housenumber||"")
		  + " "+(p.street || p.name || "")
		  + "<i>"
		  + " "+(p.postcode||"")
		  + " "+(p.city||"")
		  + " ("+p.country
		  + ")</i>";
  };
  /** 
   * @param {string} s the search string
   * @return {Object} request data (as key:value)
   * @api
   */
  ol.control.SearchPhoton.prototype.requestData = function (s)
  {	var data =
	  {	q: s,
		  lang: this.get('lang'),
		  limit: this.get('maxItems')
	  }
	  // Handle position proirity
	  if (this.get('position'))
	  {	var view = this.getMap().getView();
		  var pt = new ol.geom.Point(view.getCenter());
		  pt = (pt.transform (view.getProjection(), "EPSG:4326")).getCoordinates();
		  data.lon = pt[0];
		  data.lat = pt[1];
	  }
	  return data;
  };
  /**
   * Handle server response to pass the features array to the list
   * @param {any} response server response
   * @return {Array<any>} an array of feature
   */
  ol.control.SearchPhoton.prototype.handleResponse = function (response, cback) {
	  return response.features;
  };
  /** Prevent same feature to be drawn twice: test equality
   * @param {} f1 First feature to compare
   * @param {} f2 Second feature to compare
   * @return {boolean}
   * @api
   */
  ol.control.SearchPhoton.prototype.equalFeatures = function (f1, f2) {
	  return (this.getTitle(f1) === this.getTitle(f2)
		  && f1.geometry.coordinates[0] === f2.geometry.coordinates[0]
		  && f1.geometry.coordinates[1] === f2.geometry.coordinates[1]);
  };
  /** A ligne has been clicked in the menu > dispatch event
  *	@param {any} f the feature, as passed in the autocomplete
  *	@api
  */
  ol.control.SearchPhoton.prototype.select = function (f)
  {	var c = f.geometry.coordinates;
	  // Add coordinate to the event
	  try {
		  c = ol.proj.transform (f.geometry.coordinates, 'EPSG:4326', this.getMap().getView().getProjection());
	  } catch(e) {};
	  this.dispatchEvent({ type:"select", search:f, coordinate: c });
  };
  /**
   * Search places using the French National Base Address (BAN) API.
   *
   * @constructor
   * @extends {ol.control.Search}
   * @fires select
   * @param {Object=} Control options.
   *	@param {string} options.className control class name
   *	@param {boolean | undefined} options.polygon To get output geometry of results (in geojson format), default false.
   *	@param {Element | string | undefined} options.target Specify a target if you want the control to be rendered outside of the map's viewport.
   *	@param {string | undefined} options.label Text label to use for the search button, default "search"
   *	@param {string | undefined} options.placeholder placeholder, default "Search..."
   *	@param {number | undefined} options.typing a delay on each typing to start searching (ms), default 500.
   *	@param {integer | undefined} options.minLength minimum length to start searching, default 3
   *	@param {integer | undefined} options.maxItems maximum number of items to display in the autocomplete list, default 10
   *
   *	@param {string|undefined} options.url Url to BAN api, default "https://api-adresse.data.gouv.fr/search/"
   * @see {@link https://wiki.openstreetmap.org/wiki/Nominatim}
   */
  ol.control.SearchNominatim = function(options)
  {	options = options || {};
	  options.className = options.className || 'nominatim';
	  options.typing = options.typing || 500;
	  options.url = options.url || "https://nominatim.openstreetmap.org/search";
	  ol.control.SearchJSON.call(this, options);
	  this.set("copy","<a href='http://www.openstreetmap.org/copyright' target='new'>&copy; OpenStreetMap contributors</a>");
	  this.set("polygon", options.polygon);
  };
  ol.inherits(ol.control.SearchNominatim, ol.control.SearchJSON);
  /** Returns the text to be displayed in the menu
   *	@param {ol.Feature} f the feature
   *	@return {string} the text to be displayed in the index
   *	@api
   */
  ol.control.SearchNominatim.prototype.getTitle = function (f) {
	  var title = f.display_name+"<i>"+f.class+" - "+f.type+"</i>";
	  if (f.icon) title = "<img src='"+f.icon+"' />" + title;
	  return (title);
  };
  /** 
   * @param {string} s the search string
   * @return {Object} request data (as key:value)
   * @api
   */
  ol.control.SearchNominatim.prototype.requestData = function (s) {
	  return { 
		  format: "json", 
		  addressdetails: 1, 
		  q: s, 
		  polygon_geojson: this.get('polygon') ? 1:0,
		  limit: this.get('maxItems')
	  };
  };
  /** A ligne has been clicked in the menu > dispatch event
   *	@param {any} f the feature, as passed in the autocomplete
   *	@api
   */
  ol.control.SearchNominatim.prototype.select = function (f){
	  var c = [Number(f.lon), Number(f.lat)];
	  // Add coordinate to the event
	  try {
		  c = ol.proj.transform (c, 'EPSG:4326', this.getMap().getView().getProjection());
	  } catch(e) {};
	  this.dispatchEvent({ type:"select", search:f, coordinate: c });
  };