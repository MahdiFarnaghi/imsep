
/*	Copyright (c) 2015 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * @classdesc OpenLayers 3 Layer Switcher Control.
 * @require jQuery
 * @fires drawlist
 * 
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} options
 *	@param {function} displayInLayerSwitcher function that takes a layer and return a boolean if the layer is displayed in the switcher, default test the displayInLayerSwitcher layer attribute
 *	@param {boolean} options.show_progress show a progress bar on tile layers, default false
 *	@param {boolean} mouseover show the panel on mouseover, default false
 *	@param {boolean} reordering allow layer reordering, default true
 *	@param {boolean} trash add a trash button to delete the layer, default false
 *	@param {function} oninfo callback on click on info button, if none no info button is shown DEPRECATED: use on(info) instead
 *	@param {boolean} extent add an extent button to zoom to the extent of the layer
 *	@param {function} onextent callback when click on extent, default fits view to extent
 *
 * Layers attributes that control the switcher
 *	- allwaysOnTop {boolean} true to force layer stay on top of the others while reordering, default false
 *	- displayInLayerSwitcher {boolean} display in switcher, default true
 *	- noSwitcherDelete {boolean} to prevent layer deletion (w. trash option = true), default false
 */
/*//modified by iranshahi
    -noSwitcherInfo {boolean} to prevent layer information button, default false
*	@param {function} onClick callback on click layer 
*/
ol.control.LayerSwitcher = function (options) {
	options = options || {};
	var self = this;
	this._activeLayer=undefined;
	this.dcount = 0;
	this.show_progress = options.show_progress;
	this.toggleVisiblityOnLabelClick= options.toggleVisiblityOnLabelClick;
	this.oninfo = (typeof (options.oninfo) == "function" ? options.oninfo : null);
	this.onClick = (typeof (options.onClick) == "function" ? options.onClick : null);
	this.onDblClick = (typeof (options.onDblClick) == "function" ? options.onDblClick : null);
	this.onextent = (typeof (options.onextent) == "function" ? options.onextent : null);
	this.hasextent = options.extent || options.onextent;
	this.hastrash = options.trash;
	this.reordering = (options.reordering !== false);
	// displayInLayerSwitcher
	if (typeof (options.displayInLayerSwitcher) === 'function') {
		this.displayInLayerSwitcher = options.displayInLayerSwitcher;
	}
	var element;
	if (options.target) {
		element = $("<div>").addClass(options.switcherClass || "ol-layerswitcher");
	}
	else {
		element = $("<div>").addClass((options.switcherClass || 'ol-layerswitcher') + ' ol-unselectable ol-control ol-collapsed');
		this.button = $("<button>")
			.attr('type', 'button')
			.on("touchstart", function (e) {
				element.toggleClass("ol-collapsed");
				e.preventDefault();
				self.overflow();
			})
			.click(function () {
				element.toggleClass("ol-forceopen").addClass("ol-collapsed");
				self.overflow();
			})
			.appendTo(element);
		if (options.mouseover) {
			$(element).mouseleave(function () { element.addClass("ol-collapsed"); })
			.mouseover(function () { element.removeClass("ol-collapsed"); });
		}
		this.topv = $("<div>").addClass("ol-switchertopdiv")
			.click(function () { self.overflow("+50%"); })
			.appendTo(element);
		this.botv = $("<div>").addClass("ol-switcherbottomdiv")
			.click(function () { self.overflow("-50%"); })
			.appendTo(element);
	}
	this.panel_ = $("<ul>").addClass("panel")
		.appendTo(element);
	this.panel_.on('mousewheel DOMMouseScroll onmousewheel', function (e) {
		if (self.overflow(Math.max(-1, Math.min(1, (e.originalEvent.wheelDelta || -e.originalEvent.detail))))) {
			e.stopPropagation();
			e.preventDefault();
		}
	});
	this.header_ = $("<li>").addClass("ol-header").appendTo(this.panel_);
	ol.control.Control.call(this,
		{
			element: element.get(0),
			target: options.target
		});
	// Enable jQuery dataTransfert
	// $.event.props.push('dataTransfer');
	this.target = options.target;
};
ol.ext.inherits(ol.control.LayerSwitcher, ol.control.Control);
/** List of tips for internationalization purposes
*/
ol.control.LayerSwitcher.prototype.tip =
	{
		up: "up/down",
		//up: app.i18n['up/down'],
		down: "down",
		//down: app.i18n['down'],
		info: "informations...",
		//info: app.i18n['Info'],
		extent: "zoom to extent",
		//extent: app.i18n['ZoomToExtent'],
		trash: "remove layer",
		//trash: app.i18n['Dataset.RemoveLayer'],
		f: "expand/shrink"
	};
/** Test if a layer should be displayed in the switcher
 * @param {ol.layer} layer
 * @return {boolean} true if the layer is displayed
 */
ol.control.LayerSwitcher.prototype.displayInLayerSwitcher = function (layer) {
	if(layer.get('custom') && layer.get('custom').hiddenInToc)
		return false;
	return (layer.get("displayInLayerSwitcher") !== false);
};
/**
 * Set the map instance the control is associated with.
 * @param {_ol_Map_} map The map instance.
 */
ol.control.LayerSwitcher.prototype.setMap = function (map) {
	ol.control.Control.prototype.setMap.call(this, map);
	this.drawPanel();
	if (this._listener) {
		if (this._listener) ol.Observable.unByKey(this._listener.change);
		if (this._listener) ol.Observable.unByKey(this._listener.moveend);
		if (this._listener) ol.Observable.unByKey(this._listener.size);
		if (this._listener) ol.Observable.unByKey(this._listener.remove);
		
	}
	this._listener = null;
	this.map_ = map;
	// Get change (new layer added or removed)
	if (map) {
	this._listener = {
		change: map.getLayerGroup().on('change', this.drawPanel.bind(this)),
		moveend: map.on('moveend', this.viewChange.bind(this)),
		size: map.on('change:size', this.overflow.bind(this)),
		remove: map.getLayers().on('remove', this.onLayerRemoved.bind(this)),
	}
	}
};

ol.control.LayerSwitcher.prototype.setActiveLayer = function (layer) {
	if(layer !==this._activeLayer){
		this._activeLayer= layer;
		this.dispatchEvent({type:'activeLayerChanged'});
		this.drawPanel();
	}
	
};

ol.control.LayerSwitcher.prototype.getActiveLayer = function () {
	return this._activeLayer;
};
/** Add a custom header
*/
ol.control.LayerSwitcher.prototype.setHeader = function (html) {
	this.header_.html(html);
};
/** Calculate overflow and add scrolls
*	@param {Number} dir scroll direction -1|0|1|'+50%'|'-50%'
*/
ol.control.LayerSwitcher.prototype.overflow = function (dir) {
	if (this.button) {	// Nothing to show
		if (this.panel_.css('display') == 'none') {
			$(this.element).css("height", "auto");
			return;
		}
		// Calculate offset
		var h = $(this.element).outerHeight();
		var hp = this.panel_.outerHeight();
		var dh = this.button.position().top + this.button.outerHeight(true);
		var top = this.panel_.position().top - dh;
		if (hp > h - dh) {	// Bug IE: need to have an height defined
			$(this.element).css("height", "100%");
			switch (dir) {
				case 1: top += 2 * $("li.visible .li-content", this.panel_).height(); break;
				case -1: top -= 2 * $("li.visible .li-content", this.panel_).height(); break;
				case "+50%": top += Math.round(h / 2); break;
				case "-50%": top -= Math.round(h / 2); break;
				default: break;
			}
			// Scroll div
			if (top + hp <= h - 3 * dh / 2) {
				top = h - 3 * dh / 2 - hp;
				this.botv.hide();
			}
			else {
				this.botv.css("display", "");//show();
			}
			if (top >= 0) {
				top = 0;
				this.topv.hide();
			}
			else {
				this.topv.css("display", "");
			}
			// Scroll ?
			this.panel_.css('top', top + "px");
			return true;
		}
		else {
			$(this.element).css("height", "auto");
			this.panel_.css('top', "0px");
			this.botv.hide();
			this.topv.hide();
			return false;
		}
	}
	else return false;
};
/**
 * On view change hide layer depending on resolution / extent
 * @param {ol.event} map The map instance.
 * @private
 */
ol.control.LayerSwitcher.prototype.viewChange = function (e) {
	var map = this.map_;
	var res = this.map_.getView().getResolution();
	$("li", this.panel_).each(function () {
		var l = $(this).data('layer');
		if (l) {
			if (l.getMaxResolution() <= res || l.getMinResolution() >= res) $(this).addClass("ol-layer-hidden");
			else {
				var ex0 = l.getExtent();
				if (ex0) {
					var ex = map.getView().calculateExtent(map.getSize());
					if (!ol.extent.intersects(ex, ex0)) {
						$(this).addClass("ol-layer-hidden");
					}
					else $(this).removeClass("ol-layer-hidden");
				}
				else $(this).removeClass("ol-layer-hidden");
			}
		}
	});
};
/**
 *	Draw the panel control (prevent multiple draw due to layers manipulation on the map with a delay function)
 */
ol.control.LayerSwitcher.prototype.drawPanel = function (e) {
	if (!this.getMap()) return;
	var self = this;
	// Multiple event simultaneously / draw once => put drawing in the event queue
	this.dcount++;
	setTimeout(function () { self.drawPanel_(); }, 0);
};
ol.control.LayerSwitcher.prototype.onLayerRemoved = function (e) {
	if (!this.getMap()) return;
	var self = this;
	
	if(e.element == this._activeLayer){
		this.setActiveLayer(null);
	}
};
/** Delayed draw panel control 
 * @private
 */
ol.control.LayerSwitcher.prototype.drawPanel_ = function (e) {
	if (--this.dcount || this.dragging_) return;
	$("li", this.panel_).not(".ol-header").remove();
	this.drawList(this.panel_, this.getMap().getLayers());
};
/** Change layer visibility according to the baselayer option
 * @param {ol.layer}
 * @param {Array<ol.layer>} related layers
 */
ol.control.LayerSwitcher.prototype.switchLayerVisibility = function (l, layers,visible) {
	if (!l.get('baseLayer')) {
		var vis=!l.getVisible();
		if(typeof visible !=='undefined'){
			vis= visible;
		}
		l.setVisible(vis);
		var parent= l.get('_parent');
		if(parent && vis){
			this.switchLayerVisibility(parent,layers,vis);
		}
	}
	else {
		if (!l.getVisible()) l.setVisible(true);
		layers.forEach(function (li) {
			if (l !== li && li.get('baseLayer') && li.getVisible()) li.setVisible(false);
		});
	}
};
/** Check if layer is on the map (depending on zoom and extent)
 * @param {ol.layer}
 * @return {boolean}
 */
ol.control.LayerSwitcher.prototype.testLayerVisibility = function (layer) {
	if (this.map_) {
		var res = this.map_.getView().getResolution();
		if (layer.getMaxResolution() <= res || layer.getMinResolution() >= res) return false;
		else {
			var ex0 = layer.getExtent();
			if (ex0) {
				var ex = this.map_.getView().calculateExtent(this.map_.getSize());
				return ol.extent.intersects(ex, ex0);
			}
			return true;
		}
	}
	return true;
};
/** Start ordering the list
*	@param {event} e drag event
*	@private
*/
ol.control.LayerSwitcher.prototype.dragOrdering_ = function (e) {
	var drag = e.data;
	switch (e.type) {	// Start ordering
		case 'mousedown':
		case 'touchstart':
			{
				
				e.stopPropagation();
				e.preventDefault();
				var pageY = e.pageY
					|| (e.originalEvent.touches && e.originalEvent.touches.length && e.originalEvent.touches[0].pageY)
					|| (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length && e.originalEvent.changedTouches[0].pageY);
				drag =
					{
						self: drag.self,
						elt: $(e.currentTarget).closest("li"),
						start: true,
						element: drag.self.element,
						panel: drag.self.panel_,
						pageY: pageY
					};
				drag.elt.parent().addClass('drag');
				$(document).on("mouseup mousemove touchend touchcancel touchmove", drag, drag.self.dragOrdering_);
				break;
			}
		// Stop ordering
		case 'touchcancel':
		case 'touchend':
		case 'mouseup':
			{
				if (drag.target) {	// Get drag on parent
					var drop = drag.layer;
					var target = drag.target;
					if (drop && target) {
						var collection;
						if (drag.group) collection = drag.group.getLayers();
						else collection = drag.self.getMap().getLayers();
						var layers = collection.getArray();
						// Switch layers
						for (var i = 0; i < layers.length; i++) {
							if (layers[i] == drop) {
								collection.removeAt(i);
								break;
							}
						}
						for (var j = 0; j < layers.length; j++) {
							if (layers[j] == target) {
								if (i > j) collection.insertAt(j, drop);
								else collection.insertAt(j + 1, drop);
								break;
							}
						}
					}
				}
				$("li", drag.elt.parent()).removeClass("dropover dropover-after dropover-before");
				drag.elt.removeClass("drag");
				drag.elt.parent().removeClass("drag");
				$(drag.element).removeClass('drag');
				if (drag.div) drag.div.remove();
				$(document).off("mouseup mousemove touchend touchcancel touchmove", drag.self.dragOrdering_);
				break;
			}
		// Ordering
		case 'mousemove':
		case 'touchmove':
			{	// First drag (more than 2 px) => show drag element (ghost)
				var pageY = e.pageY
					|| (e.originalEvent.touches && e.originalEvent.touches.length && e.originalEvent.touches[0].pageY)
					|| (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length && e.originalEvent.changedTouches[0].pageY);
				if (drag.start && Math.abs(drag.pageY - pageY) > 2) {
				drag.start = false;
					drag.elt.addClass("drag");
					drag.layer = drag.elt.data('layer');
					drag.target = false;
					drag.group = drag.elt.parent().parent().data('layer');
					// Ghost div
					drag.div = $("<li>").appendTo(drag.panel);
					drag.div.css({ position: "absolute", "z-index": 10000, left: drag.elt.position().left, opacity: 0.5 })
						.html($(drag.elt).html())
						.addClass("ol-dragover")
						.width(drag.elt.outerWidth())
						.height(drag.elt.height());
					$(drag.element).addClass('drag');
				}
				if (!drag.start) {
					e.preventDefault();
					e.stopPropagation();
					// Ghost div
					drag.div.css({ top: pageY - drag.panel.offset().top + drag.panel.scrollTop() + 5 });
					var li;
					if (!e.originalEvent.touches) li = $(e.target);
					else li = $(document.elementFromPoint(e.originalEvent.touches[0].clientX, e.originalEvent.touches[0].clientY));
					if (li.hasClass("ol-switcherbottomdiv")) {
						drag.self.overflow(-1);
						console.log('bottom')
					}
					else if (li.hasClass("ol-switchertopdiv")) {
						drag.self.overflow(1);
					}
					if (!li.is("li")) li = li.closest("li");
					if (!li.hasClass('dropover')) $("li", drag.elt.parent()).removeClass("dropover dropover-after dropover-before");
					if (li.parent().hasClass('drag') && li.get(0) !== drag.elt.get(0)) {
						var target = li.data("layer");
						// Don't mix layer level
						if (target && !target.get("allwaysOnTop") == !drag.layer.get("allwaysOnTop")) {
							li.addClass("dropover");
							li.addClass((drag.elt.position().top < li.position().top) ? "dropover-after" : "dropover-before");
							drag.target = target;
						}
						else {
						drag.target = false;
						}
						drag.div.show();
					}
					else {
					drag.target = false;
						if (li.get(0) === drag.elt.get(0)) drag.div.hide();
						else drag.div.show();
					}
					if (!drag.target) drag.div.addClass("forbidden");
					else drag.div.removeClass("forbidden");
				}
				break;
			}
		default: break;
	}
};
/** Change opacity on drag 
*	@param {event} e drag event
*	@private
*/
ol.control.LayerSwitcher.prototype.dragOpacity_ = function (e) {
	var drag = e.data;
	switch (e.type) {	// Start opacity
		case 'mousedown':
		case 'touchstart':
			{
				e.stopPropagation();
				e.preventDefault();
				drag.start = e.pageX
					|| (e.originalEvent.touches && e.originalEvent.touches.length && e.originalEvent.touches[0].pageX)
					|| (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length && e.originalEvent.changedTouches[0].pageX);
				drag.elt = $(e.target);
				drag.layer = drag.elt.closest("li").data('layer')
				drag.self.dragging_ = true;
				$(document).on("mouseup touchend mousemove touchmove touchcancel", drag, drag.self.dragOpacity_);
				break;
			}
		// Stop opacity
		case 'touchcancel':
		case 'touchend':
		case 'mouseup':
			{
				$(document).off("mouseup touchend mousemove touchmove touchcancel", drag.self.dragOpacity_);
				drag.layer.setOpacity(drag.opacity);
				drag.elt.parent().next().text(Math.round(drag.opacity * 100));
				drag.self.dragging_ = false;
				drag = false;
				break;
			}
		// Move opcaity
		default:
			{
				var x = e.pageX
					|| (e.originalEvent.touches && e.originalEvent.touches.length && e.originalEvent.touches[0].pageX)
					|| (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length && e.originalEvent.changedTouches[0].pageX);
				var dx = Math.max(0, Math.min(1, (x - drag.elt.parent().offset().left) / drag.elt.parent().width()));
				drag.elt.css("left", (dx * 100) + "%");
				drag.elt.parent().next().text(Math.round(drag.opacity * 100));
				drag.opacity = dx;
				drag.layer.setOpacity(dx);
				break;
			}
	}
}
/** Render a list of layer
 * @param {elt} element to render
 * @layers {Array{ol.layer}} list of layer to show
 * @api stable
 */
ol.control.LayerSwitcher.prototype.drawList = function (ul, collection) {
	var self = this;
	var parentId= $(ul).attr('id') || '';
	var layers = collection.getArray();
	var setVisibility = function (e) {
		e.stopPropagation();
		e.preventDefault();
		var l = $(this).parent().parent().data("layer");
		self.switchLayerVisibility(l, collection);
	};
	var setVisibility2 = function (e) {
		e.stopPropagation();
		e.preventDefault();
		var l = $(this).parent().parent().data("layer");
		if(self.toggleVisiblityOnLabelClick){
			self.switchLayerVisibility(l, collection);
		}
		if(e.clientX>32){
			self.setActiveLayer(l);
		}
	};
	function moveLayer(l, layers, inc) {
		for (var i = 0; i < layers.getLength(); i++) {
			if (layers.item(i) === l) {
				layers.remove(l);
				layers.insertAt(i + inc, l);
				return true;
			}
			if (layers.item(i).getLayers && moveLayer(l, layers.item(i).getLayers(), inc)) return true;
		}
		return false;
	};
	function moveLayerUp(e) {
		e.stopPropagation();
		e.preventDefault();
		moveLayer($(this).closest('li').data("layer"), self.map_.getLayers(), +1);
	};
	function moveLayerDown(e) {
		e.stopPropagation();
		e.preventDefault();
		moveLayer($(this).closest('li').data("layer"), self.map_.getLayers(), -1);
	};
	function onInfo(e) {
		e.stopPropagation();
		e.preventDefault();
		var l = $(this).closest('li').data("layer");
		self.oninfo(l);
		self.dispatchEvent({ type: "info", layer: l });
	};

	function onClickItemContainer(e) {
		e.stopPropagation();
		e.preventDefault();
		var l = $(this).data("layer");
		self.onClick(l);
		self.dispatchEvent({ type: "click", layer: l });

		self.setActiveLayer(l);
	};
	function onDblClickItemContainer(e) {
		e.stopPropagation();
		e.preventDefault();
		var l = $(this).data("layer");
		self.onDblClick(l);
		self.dispatchEvent({ type: "dblclick", layer: l });

		self.setActiveLayer(l);
	};
	function zoomExtent(e) {
		e.stopPropagation();
		e.preventDefault();
		var l = $(this).closest('li').data("layer");
		if (self.onextent) self.onextent(l);
		else self.map_.getView().fit(l.getExtent(), self.map_.getSize());
		self.dispatchEvent({ type: "extent", layer: l });
	};
	function removeLayer(e) {
		e.stopPropagation();
		e.preventDefault();

		var li = $(this).closest("ul").parent();
		var li_layer_parent=li.data("layer");
		if (li_layer_parent) {
			
			
			var layerToRemove=$(this).closest('li').data("layer");
			var args={
				type:'beforeLayerRemoved',
				layer:layerToRemove,
				parentLayer:li_layer_parent,
				cancel:false
			};
			self.dispatchEvent(args);
			if(args.cancel)
			{
				return;
			}
			if(self._activeLayer== layerToRemove){
				self.setActiveLayer(null);
			}
			self.map_.removeLayer(layerToRemove);
			li_layer_parent.getLayers().remove(layerToRemove);

			if (li_layer_parent.getLayers().getLength() == 0 && !li_layer_parent.get('noSwitcherDelete')) {
				removeLayer.call($(".layerTrash", li), e);
			}
		}
		else {
			var nl=$(this).closest('li');
			var layerToRemove=$(this).closest('li').data("layer");

			var args={
				type:'beforeLayerRemoved',
				layer:layerToRemove,
				cancel:false
			};
			self.dispatchEvent(args);
			if(args.cancel)
			{
				return;
			}
			if(self._activeLayer== layerToRemove){
				self.setActiveLayer(null);
			}
			self.map_.removeLayer(layerToRemove);
		}
	};
	// Add the layer list
	for (var i = layers.length - 1; i >= 0; i--) {
		var layer = layers[i];
		var elementId=parentId+'_'+i;

		if (!self.displayInLayerSwitcher(layer)) continue;
		var li = $('<li id="'+elementId+'">').addClass((layer.getVisible() ? "visible " : " ") + (layer.get('baseLayer') ? "baselayer" : ""))
			.data("layer", layer).appendTo(ul);
		
		//var layer_buttons=li;
		li.on('click', onClickItemContainer);
		li.on('dblclick', onDblClickItemContainer);
		var d = $("<div>").addClass('li-content').appendTo(li);
		var layer_buttons = $("<div>").addClass("ol-layerswitcher-buttons").appendTo(li);
		if (!this.testLayerVisibility(layer)) d.addClass("ol-layer-hidden");
		var isBaseLayer = layer.get('baseLayer');
	
		if (layer instanceof ol.layer.Vector) {
			this.setLoadingStatus_(layer);

		}
		if (layer instanceof ol.layer.Image || layer instanceof ol.layer.Tile) {
			this.setLoadingStatus_(layer);

		}
		//  up/down
		if (this.reordering) {
			if ((i < layers.length - 1 && (layer.get("allwaysOnTop") || !layers[i + 1].get("allwaysOnTop")))
				|| (i > 0 && (!layer.get("allwaysOnTop") || layers[i - 1].get("allwaysOnTop")))) {

				$("<div>").addClass("layerup2 glyphicon glyphicon-move")
				.on("mousedown touchstart", { self: this }, this.dragOrdering_)
				.attr("title", this.tip.up)
				.appendTo(layer_buttons);

				//test for dragging main item		
				//li.on("mousedown touchstart", { self: this },function(e){ onClickItemContainer(e); self.dragOrdering_(e)});
			}
		}
		// Show/hide sub layers
		if (layer.getLayers) {
			var nb = 0;
			layer.getLayers().forEach(function (l) {
				if (self.displayInLayerSwitcher(l)) nb++;
			});
			if (nb) {
				//
				//$("<span>").addClass(layer.get("openInLayerSwitcher") ? "expand-collapse glyphicon glyphicon-minus" : "expand-collapse glyphicon glyphicon-plus")
				//$("<span>").addClass(layer.get("openInLayerSwitcher") ? "expand-collapse fa fa-folder-open-o" : "expand-collapse fa fa-folder-o")
				//$("<span>").addClass(layer.get("openInLayerSwitcher") ? "expand-collapse fa fa-folder-open" : "expand-collapse fa fa-folder")
				$("<span>").addClass(layer.get("openInLayerSwitcher") ? "expand-collapse glyphicon glyphicon-folder-open" : "expand-collapse glyphicon glyphicon-folder-close")
				.click(function () {
					var l = $(this).closest('li').data("layer");
					l.set("openInLayerSwitcher", !l.get("openInLayerSwitcher"))
				})
				.attr("title", this.tip.plus)
				//.appendTo(layer_buttons);
				.appendTo(d);
			}
		}
		// Visibility
		if(!layer.get('switcherTable')){
			$("<input>")
			.attr('type', layer.get('baseLayer') ? 'radio' : 'checkbox')
			.attr("checked", layer.getVisible())
			.on('click', setVisibility)
			.appendTo(d);
		}else{
			$("<span>")
			.addClass('fa fa-table')
			.appendTo(d);
		}
	// Label
	layer.layerswitcher_label = $("<label>").text(layer.get("title") || layer.get("name"))
		.attr('title', layer.get("title") || layer.get("name"))
		.on('click', setVisibility2)

		.attr('unselectable', 'on')
		.css('user-select', 'none')
		.on('selectstart', false)
		.appendTo(d);
		// $("<div>").addClass("ol-separator").appendTo(layer_buttons);
		// Info button
		if (this.oninfo && !layer.get("noSwitcherInfo")) {
			$("<div>").addClass("layerInfo")
			.on('click', onInfo)
			.attr("title", this.tip.info)
			.appendTo(layer_buttons);
		}
		// Layer remove
		if (this.hastrash && !layer.get("noSwitcherDelete")) {
			$("<div>").addClass("layerTrash2 glyphicon glyphicon-trash")
			.on('click', removeLayer)
			.attr("title", this.tip.trash)
			.appendTo(layer_buttons);
		}
		// Layer extent
		if (this.hasextent && layers[i].getExtent()) {
			var ex = layers[i].getExtent();
			if (ex.length == 4 && ex[0] < ex[2] && ex[1] < ex[3]) {
				$("<div>").addClass("layerExtent")
				.on('click', zoomExtent)
				.attr("title", this.tip.extent)
				.appendTo(layer_buttons);
			}
		}
		// Progress
		if (this.show_progress && layer instanceof ol.layer.Tile) {
			var p = $("<div>")
				.addClass("layerswitcher-progress")
				.appendTo(d);
			this.setprogress_(layer);
			layer.layerswitcher_progress = $("<div>").appendTo(p);
		}
		// Opacity
		var showopacityBar=false;
		if(showopacityBar){
			var opacity = $("<div>").addClass("layerswitcher-opacity")
				.on("click", function (e) {
					e.stopPropagation();
					e.preventDefault();
					var x = e.pageX
						|| (e.originalEvent.touches && e.originalEvent.touches.length && e.originalEvent.touches[0].pageX)
						|| (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length && e.originalEvent.changedTouches[0].pageX);
					var dx = Math.max(0, Math.min(1, (x - $(this).offset().left) / $(this).width()));
					$(this).closest("li").data('layer').setOpacity(dx);
				})
				.appendTo(d);
			$("<div>").addClass("layerswitcher-opacity-cursor")
				.on("mousedown touchstart", { self: this }, self.dragOpacity_)
				.css('left', (layer.getOpacity() * 100) + "%")
				.appendTo(opacity);
			// Percent
			$("<div>").addClass("layerswitcher-opacity-label")
				.text(Math.round(layer.getOpacity() * 100))
				.appendTo(d);
		}	
		li.addClass('ol-layer-item');
		if(layer==this._activeLayer){
			//activeLayerExists=true;
			li.addClass('layerswitcher-active-layer');
		}
		// Layer group
		if (layer.getLayers) {
			li.addClass('ol-layer-group');
			if (layer.get("openInLayerSwitcher") === true) {
				this.drawList($('<ul class="chl" id="'+elementId+'_layers">').appendTo(li), layer.getLayers());
			}
		}
		else if (layer instanceof ol.layer.Vector) li.addClass('ol-layer-vector');
		else if (layer instanceof ol.layer.VectorTile) li.addClass('ol-layer-vector');
		else if (layer instanceof ol.layer.Tile) li.addClass('ol-layer-tile');
		else if (layer instanceof ol.layer.Image) li.addClass('ol-layer-image');
		else if (layer instanceof ol.layer.Heatmap) li.addClass('ol-layer-heatmap');
		// Dispatch a dralist event to allow customisation
		layer.set('layerswitcher_el_id',elementId);
		this.dispatchEvent({ type: 'drawlist', layer: layer, li: li.get(0) });
	}
	this.viewChange();
	if (ul == this.panel_) this.overflow();
};
/** Handle progress bar for a layer
*	@private
*/
ol.control.LayerSwitcher.prototype.setprogress_ = function (layer) {
	if (!layer.layerswitcher_progress) {
		var loaded = 0;
		var loading = 0;
		function draw() {
			if (loading === loaded) {
				loading = loaded = 0;
				layer.layerswitcher_progress.width(0);
			}
			else {
				layer.layerswitcher_progress.css('width', (loaded / loading * 100).toFixed(1) + '%');
			}
		}
		layer.getSource().on('tileloadstart', function () {
			loading++;
			draw();
		});
		layer.getSource().on('tileloadend', function () {
			loaded++;
			draw();
		});
		layer.getSource().on('tileloaderror', function () {
			loaded++;
			draw();
		});
	}
};

ol.control.LayerSwitcher.prototype.setLoadingStatus_ = function (layer) {
	var thisLayer = layer;
	function draw() {
		if (thisLayer.layerswitcher_label) {
			thisLayer.layerswitcher_label.removeClass('vector-loading_status-started');
			thisLayer.layerswitcher_label.removeClass('vector-loading_status-complete');
			thisLayer.layerswitcher_label.removeClass('vector-loading_status-failed');
			thisLayer.layerswitcher_label.removeClass('vector-loading_status-out_of_date');

			

			thisLayer.layerswitcher_label.addClass('vector-loading_status-' + thisLayer.getSource().get('loading_status'));
			if(thisLayer.getSource().get('loading_status')=='failed'){
				thisLayer.layerswitcher_label.attr('title', thisLayer.getSource().get('loading_details'))
			}else if(thisLayer.getSource().get('loading_status')=='out_of_date'){
				thisLayer.layerswitcher_label.attr('title', thisLayer.getSource().get('loading_details'))
			}else{
				thisLayer.layerswitcher_label.attr('title', thisLayer.get("title") || thisLayer.get("name"))
			}
		//	$(thisLayer.layerswitcher_label).tooltip(); 
		}
	}
	draw();
	thisLayer.getSource().on('change:loading_status', function (evt) {
		draw();
	});


};