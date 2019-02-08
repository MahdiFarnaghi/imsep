
/*	Copyright (c) 2016 Jean-Marc VIGLINO,
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).

/** A simple push button control
* @constructor
* @extends {ol.control.Control}
* @param {Object=} options Control options.
*	@param {String} options.className class of the control
*	@param {String} options.title title of the control
*	@param {String} options.html html to insert in the control
*	@param {function} options.handleClick callback when control is clicked (or use change:active event)
*/
ol.control.Button = function(options)
{	options = options || {};
	var element = $("<div>").addClass((options.className||"") + ' ol-button ol-unselectable ol-control');
	var self = this;
	var bt = $("<button>").html(options.html || "")
				.attr('type','button')
				.attr('title', options.title)
				.on("touchstart click", function(e)
				{	if (e && e.preventDefault)
					{	e.preventDefault();
						e.stopPropagation();
					}
					if (options.handleClick) options.handleClick.call(self, e);
				})
				.appendTo(element);
	// Try to get a title in the button content
	if (!options.title) bt.attr("title", bt.children().first().attr('title'));
	ol.control.Control.call(this,
	{	element: element.get(0),
		target: options.target
	});
	if (options.title) this.set("title", options.title);
};
ol.inherits(ol.control.Button, ol.control.Control);
/** Set the control visibility
* @param {boolean} b
*/
ol.control.Button.prototype.setVisible = function (val) {
	if (val) $(this.element).show();
	else $(this.element).hide();
}
/** Get the control visibility
* @return {boolean} b
*/
ol.control.Button.prototype.getVisible = function ()
{	return ($(this.element).css('display') != 'none');
}

/** A simple push button control drawn as text
 * @constructor
 * @extends {ol.control.Button}
 * @param {Object=} options Control options.
 *	@param {String} options.className class of the control
 *	@param {String} options.title title of the control
 *	@param {String} options.html html to insert in the control
 *	@param {function} options.handleClick callback when control is clicked (or use change:active event)
 */
ol.control.TextButton = function(options)
{	options = options || {};
    options.className = (options.className||"") + " ol-text-button";
    ol.control.Button.call(this, options);
};
ol.inherits(ol.control.TextButton, ol.control.Button);


/** A simple toggle control
 * The control can be created with an interaction to control its activation.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @fires change:active, change:disable
 * @param {Object=} options Control options.
 *	@param {String} options.className class of the control
 *	@param {String} options.title title of the control
 *	@param {String} options.html html to insert in the control
 *	@param {ol.interaction} options.interaction interaction associated with the control
 *	@param {bool} options.active the control is created active, default false
 *	@param {bool} options.disable the control is created disabled, default false
 *	@param {ol.control.Bar} options.bar a subbar associated with the control (drawn when active if control is nested in a ol.control.Bar)
 *	@param {bool} options.autoActive the control will activate when shown in an ol.control.Bar, default false
 *	@param {function} options.onToggle callback when control is clicked (or use change:active event)
 */
ol.control.Toggle = function(options)
{	options = options || {};
	var self = this;
	this.interaction_ = options.interaction;
	if (this.interaction_)
	{	this.interaction_.on("change:active", function(e)
		{	self.setActive(!e.oldValue);
		});
	}
	if (options.toggleFn) options.onToggle = options.toggleFn; // compat old version
	this._onToggle= options.onToggle;
	options.handleClick = function()
		{	self.toggle();
			if (options.onToggle) options.onToggle.call(self, self.getActive());
		};
	options.className = (options.className||"") + " ol-toggle";
	ol.control.Button.call(this, options);
	this.set("title", options.title);
	this.set ("autoActivate", options.autoActivate);
	if (options.bar)
	{	this.subbar_ = options.bar;
		this.subbar_.setTarget(this.element);
		$(this.subbar_.element).addClass("ol-option-bar");
	}
	this.setActive (options.active);
	this.setDisable (options.disable);
};
ol.inherits(ol.control.Toggle, ol.control.Button);
/**
 * Set the map instance the control is associated with
 * and add interaction attached to it to this map.
 * @param {_ol_Map_} map The map instance.
 */
ol.control.Toggle.prototype.setMap = function(map)
{	if (!map && this.getMap())
	{	if (this.interaction_)
		{	this.getMap().removeInteraction (this.interaction_);
		}
		if (this.subbar_) this.getMap().removeControl (this.subbar_);
	}
	ol.control.Control.prototype.setMap.call(this, map);
	if (map)
	{	if (this.interaction_) map.addInteraction (this.interaction_);
		if (this.subbar_) map.addControl (this.subbar_);
	}
};
/** Get the subbar associated with a control
* @return {ol.control.Bar}
*/
ol.control.Toggle.prototype.getSubBar = function ()
{	return this.subbar_;
};
/**
 * Test if the control is disabled.
 * @return {bool}.
 * @api stable
 */
ol.control.Toggle.prototype.getDisable = function()
{	return $("button", this.element).prop("disabled");
};
/** Disable the control. If disable, the control will be deactivated too.
* @param {bool} b disable (or enable) the control, default false (enable)
*/
ol.control.Toggle.prototype.setDisable = function(b)
{	if (this.getDisable()==b) return;
	$("button", this.element).prop("disabled", b);
	if (b && this.getActive()) this.setActive(false);
	this.dispatchEvent({ type:'change:disable', key:'disable', oldValue:!b, disable:b });
};
/**
 * Test if the control is active.
 * @return {bool}.
 * @api stable
 */
ol.control.Toggle.prototype.getActive = function()
{	return $(this.element).hasClass("ol-active");
};
/** Toggle control state active/deactive
*/
ol.control.Toggle.prototype.toggle = function()
{	if (this.getActive()) this.setActive(false);
	else this.setActive(true);
};
ol.control.Toggle.prototype.raiseOnToggle = function()
{	
	if (this._onToggle){
		this._onToggle.call(this, this.getActive());
	} 
};
/** Change control state
* @param {bool} b activate or deactivate the control, default false
*/
ol.control.Toggle.prototype.setActive = function(b)
{	if (this.getActive()==b) return;
	if (b) $(this.element).addClass("ol-active");
	else $(this.element).removeClass("ol-active");
	if (this.interaction_) this.interaction_.setActive (b);
	if (this.subbar_) this.subbar_.setActive(b);
	this.dispatchEvent({ type:'change:active', key:'active', oldValue:!b, active:b });
};
/** Set the control interaction
* @param {_ol_interaction_} i interaction to associate with the control
*/
ol.control.Toggle.prototype.setInteraction = function(i)
{	this.interaction_ = i;
};
/** Get the control interaction
* @return {_ol_interaction_} interaction associated with the control
*/
ol.control.Toggle.prototype.getInteraction = function()
{	return this.interaction_;
};



/** Control bar for OL3
 * The control bar is a container for other controls. It can be used to create toolbars.
 * Control bars can be nested and combined with ol.control.Toggle to handle activate/deactivate.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} options Control options.
 *	@param {String} options.className class of the control
 *	@param {bool} options.group is a group, default false
 *	@param {bool} options.toggleOne only one toggle control is active at a time, default false
 *	@param {bool} options.autoDeactivate used with subbar to deactivate all control when top level control deactivate, default false
 *	@param {Array<_ol_control_>} options.controls a list of control to add to the bar
 */
ol.control.Bar = function(options)
{	if (!options) options={};
	var element = $("<div>").addClass('ol-unselectable ol-control ol-bar');
	if (options.className) element.addClass(options.className);
	if (options.group) element.addClass('ol-group');
	ol.control.Control.call(this,
	{	element: element.get(0),
		target: options.target
	});
	this.set('toggleOne', options.toggleOne);
	this.set('autoDeactivate', options.autoDeactivate);
	this.controls_ = [];
	if (options.controls instanceof Array)
	{	for (var i=0; i<options.controls.length; i++)
		{	this.addControl(options.controls[i]);
		}
	}
};
ol.inherits(ol.control.Bar, ol.control.Control);
/** Set the control visibility
* @param {boolean} b
*/
ol.control.Bar.prototype.setVisible = function (val) {
	if (val) $(this.element).show();
	else $(this.element).hide();
}
/** Get the control visibility
* @return {boolean} b
*/
ol.control.Bar.prototype.getVisible = function ()
{	return ($(this.element).css('display') != 'none');
}
/**
 * Set the map instance the control is associated with
 * and add its controls associated to this map.
 * @param {_ol_Map_} map The map instance.
 */
ol.control.Bar.prototype.setMap = function (map)
{	ol.control.Control.prototype.setMap.call(this, map);
	for (var i=0; i<this.controls_.length; i++)
	{	var c = this.controls_[i];
		// map.addControl(c);
		c.setMap(map);
	}
};
/** Get controls in the panel
*	@param {Array<_ol_control_>}
*/
ol.control.Bar.prototype.getControls = function ()
{	return this.controls_;
};
/** Set tool bar position
*	@param {top|left|bottom|right} pos
*/
ol.control.Bar.prototype.setPosition = function (pos)
{	$(this.element).removeClass('ol-left ol-top ol-bottom ol-right');
	pos=pos.split ('-');
	for (var i=0; i<pos.length; i++)
	{	switch (pos[i])
		{	case 'top':
			case 'left':
			case 'bottom':
			case 'right':
				$(this.element).addClass ("ol-"+pos[i]);
				break;
			default: break;
		}
	}
};
/** Add a control to the bar
*	@param {_ol_control_} c control to add
*/
ol.control.Bar.prototype.addControl = function (c)
{	this.controls_.push(c);
	c.setTarget(this.element);
	if (this.getMap())
	{	this.getMap().addControl(c);
	}
	// Activate and toogleOne
	c.on ('change:active', this.onActivateControl_.bind(this));
	if (c.getActive && c.getActive())
	{	c.dispatchEvent({ type:'change:active', key:'active', oldValue:false, active:true });
	}
};
/** Deativate all controls in a bar
* @param {_ol_control_} except a control
*/
ol.control.Bar.prototype.deactivateControls = function (except)
{	for (var i=0; i<this.controls_.length; i++)
	{	if (this.controls_[i] !== except && this.controls_[i].setActive)
		{	this.controls_[i].setActive(false);
		}
	}
};
ol.control.Bar.prototype.getActiveControls = function ()
{	var active = [];
	for (var i=0, c; c=this.controls_[i]; i++)
	{	if (c.getActive && c.getActive()) active.push(c);
	}
	return active;
}
/** Auto activate/deactivate controls in the bar
* @param {boolean} b activate/deactivate
*/
ol.control.Bar.prototype.setActive = function (b)
{	if (!b && this.get("autoDeactivate"))
	{	this.deactivateControls();
	}
	if (b)
	{	var ctrls = this.getControls();
		for (var i=0, sb; (sb = ctrls[i]); i++)
		{	if (sb.get("autoActivate")) sb.setActive(true);
		}
	}
}
/** Post-process an activated/deactivated control
*	@param {ol.event} e :an object with a target {_ol_control_} and active flag {bool}
*/
ol.control.Bar.prototype.onActivateControl_ = function (e) {
	if (this.get('toggleOne'))
	{	if (e.active)
		{	var n;
			var ctrl = e.target;
			for (n=0; n<this.controls_.length; n++)
			{	if (this.controls_[n]===ctrl) break;
			}
			// Not here!
			if (n==this.controls_.length) return;
			this.deactivateControls (this.controls_[n]);
		}
		else
		{	// No one active > test auto activate
			if (!this.getActiveControls().length)
			{	for (var i=0, c; c=this.controls_[i]; i++)
				{	if (c.get("autoActivate"))
					{	c.setActive();
						break;
					}
				}
			}
		}
	}
};
