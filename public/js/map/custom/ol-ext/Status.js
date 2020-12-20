/* @constructor
* @extends {ol.control.Control}
* @param {Object=} options Control options.
*	@param {String} options.className class of the control
*  @param {string} options.status status, default none
*  @param {string} options.position position of the status 'top', 'left', 'bottom' or 'right', default top
*/
ol.control.Status = function(options) {
	var self = this;
	  if (!options) options = {};
	  if (options.typing == undefined) options.typing = 300;
	// Class name for history
	this._classname = options.className ;
	  var element = document.createElement("DIV");
	  var classNames = (options.className||"")+ " ol-status ol-bottom";
	  if (!options.target) {
		classNames += " ol-unselectable ol-control";
		  if(!options.noCollapse){
			  classNames += " ol-collapsed";
		  }
	  }
	  element.setAttribute('class', classNames);
	  
	  
	 
	  ol.control.Control.call(this, {
	  element: element,
	  target: options.target
	});
	if (options.position) this.setPosition(options.position);
	this.status(options.status || '');
  };
  ol.ext.inherits(ol.control.Status, ol.control.Control);
  

/** Show status on the map
 * @param {string|Element} html status text or DOM element
 */
ol.control.Status.prototype.status = function(html) {
	var s = html || '';
	if (s) {
	  //ol_ext_element.show(this.element);
	  this.element.style.display = '';
	  if (typeof(s)==='object' && !(s instanceof String)) {
		s = '';
		for (var i in html) {
		  s += '<label>'+i+':</label> '+html[i]+'<br/>';
		}
	  }
	  //ol_ext_element.setHTML(this.element, s);
	  if (s instanceof Element){
			this.element.appendChild(s);
		}else if (s!==undefined){
				this.element.innerHTML = s;
		}
	} else {
	  this.element.style.display = 'none';
	  
	}
  };
 /** Set status position
 * @param {string} position position of the status 'top', 'left', 'bottom' or 'right', default top
 */
ol.control.Status.prototype.setPosition = function(position) {
	this.element.classList.remove('ol-left');
	this.element.classList.remove('ol-right');
	this.element.classList.remove('ol-bottom');
	this.element.classList.remove('ol-center');
	if (/^left$|^right$|^bottom$|^center$/.test(position)) {
	  this.element.classList.add('ol-'+position);
	}
  };

  
/** Show the status
 * @param {boolean} show show or hide the control, default true
 */
ol.control.Status.prototype.show = function(show) {
	if (show===false)this.element.style.display = 'none';
	else this.element.style.display = '';
  };
  
  /** Hide the status
   */
  ol.control.Status.prototype.hide = function() {
	
	this.element.style.display = 'none';
  };
  
  /** Toggle the status
   */
  ol.control.Status.prototype.toggle = function() {
	this.element.style.display = (element.style.display==='none' ? '' : 'none');
  };
  
  /** Is status visible
   */
  ol.control.Status.prototype.isShown = function() {
	return this.element.style.display!=='none';
	
  };
  