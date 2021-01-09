/* 
The MIT License (MIT)

Copyright (c) 2013 Tobias Bieniek

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
(https://github.com/Turbo87/sidebar-v2/blob/master/LICENSE)
*/

ol.control.Sidebar = function (settings) {

    // var options = settings ? settings : {};
    // options.element=undefined;
    // var element = document.createElement('div');
    // element.className = options.className !== undefined ? options.className : 'ol-control ol-slidebar';
    
	// ol.control.Control.call(this,
	// 	{	element: element,
	// 		//render: options.render || render,
	// 		target: options.target
	// 	});

	
	
	// this.coordinateDiv = $('<div class="ol-coordinates-panel">').appendTo(element);
    
    //var element = document.createElement('div');
    //element.setAttribute('class', 'ol-control');

    var defaults = {
        element: undefined,
        position: 'left'
    }, i, child;
    this._options = Object.assign({}, defaults, settings);
    
    
    //element.appendChild (document.getElementById(this._options.element));
    ol.control.Control.call(this, {
        element: document.getElementById(this._options.element),
      //  element:element,
        target: this._options.target
    });

    // Attach .sidebar-left/right class
    this.element.classList.add('sidebar-' + this._options.position);

    
    this.element.addEventListener("pointermove", function(e){ e.stopPropagation(); });
    // this.element.addEventListener("mousedown", function(e){ e.stopPropagation(); });
    // this.element.addEventListener("mousemove", function(e){ 
    //     e.stopPropagation(); 
    // });
    // this.element.addEventListener("mouseup", function(e){ e.stopPropagation(); });
    // this.element.addEventListener("touchstart", function(e){ e.stopPropagation(); });

    // Find sidebar > div.sidebar-content
    var children=this.element.children;
    if(this.element.children && this.element.children.length){
        //children= this.element.children[0].children;
    }
    if(children && children.length){
        for (i = children.length - 1; i >= 0; i--) {
            child = children[i];
            if (child.tagName === 'DIV' &&
                    child.classList.contains('sidebar-content')) {
                this._container = child;
            }
        }
    }

    // Find sidebar ul.sidebar-tabs > li, sidebar .sidebar-tabs > ul > li
    this._tabitems = this.element.querySelectorAll('ul.sidebar-tabs > li, .sidebar-tabs > ul > li');
    for (i = this._tabitems.length - 1; i >= 0; i--) {
        this._tabitems[i]._sidebar = this;
    }

    // Find sidebar > div.sidebar-content > div.sidebar-pane
    this._panes = [];
    this._closeButtons = [];
    if(this._container){
        for (i = this._container.children.length - 1; i >= 0; i--) {
            child = this._container.children[i];
            if (child.tagName == 'DIV' &&
                    child.classList.contains('sidebar-pane')) {
                this._panes.push(child);

                var closeButtons = child.querySelectorAll('.sidebar-close');
                for (var j = 0, len = closeButtons.length; j < len; j++) {
                    this._closeButtons.push(closeButtons[j]);
                }
            }
        }
    }
};

if ('inherits' in ol) {
    ol.inherits(ol.control.Sidebar, ol.control.Control);
} else {
    // ol.control.Sidebar.prototype = Object.create(ol.control.Control.prototype);
    // ol.control.Sidebar.prototype.constructor = ol.control.Sidebar;
    ol.ext.inherits(ol.control.Sidebar, ol.control.Control);
}

ol.control.Sidebar.prototype.setMap = function(map) {
    var i, child;
    ol.control.Control.prototype.setMap.call(this, map);
    if(this._tabitems){
    for (i = this._tabitems.length - 1; i >= 0; i--) {
        child = this._tabitems[i];
        var sub = child.querySelector('a');
        if (sub.hasAttribute('href') && sub.getAttribute('href').slice(0,1) == '#') {
            sub.onclick = this._onClick.bind(child);
        }
    }
    }
    if(this._closeButtons){
    for (i = this._closeButtons.length - 1; i >= 0; i--) {
        child = this._closeButtons[i];
        child.onclick = this._onCloseClick.bind(this);
    }
    }
};

ol.control.Sidebar.prototype.open = function(id) {
    var i, child;

    // hide old active contents and show new content
    for (i = this._panes.length - 1; i >= 0; i--) {
        child = this._panes[i];
        if (child.id == id)
            child.classList.add('active');
        else if (child.classList.contains('active'))
            child.classList.remove('active');
    }

    // remove old active highlights and set new highlight
    for (i = this._tabitems.length - 1; i >= 0; i--) {
        child = this._tabitems[i];
        if (child.querySelector('a').hash == '#' + id)
            child.classList.add('active');
        else if (child.classList.contains('active'))
            child.classList.remove('active');
    }

    // open sidebar (if necessary)
    if (this.element.classList.contains('collapsed')) {
        this.element.classList.remove('collapsed');
    }

    return this;
};

ol.control.Sidebar.prototype.close = function() {
    // remove old active highlights
    for (var i = this._tabitems.length - 1; i >= 0; i--) {
        var child = this._tabitems[i];
        if (child.classList.contains('active'))
            child.classList.remove('active');
    }

    // close sidebar
    if (!this.element.classList.contains('collapsed')) {
        this.element.classList.add('collapsed');
    }

    return this;
};

ol.control.Sidebar.prototype._onClick = function(evt) {
    evt.preventDefault();
    if (this.classList.contains('active')) {
        this._sidebar.close();
    } else if (!this.classList.contains('disabled')) {
        this._sidebar.open(this.querySelector('a').hash.slice(1));
    }
};

ol.control.Sidebar.prototype._onCloseClick = function() {
    this.close();
};