function OlPanelControl(opt_options) {

        var options = opt_options || {};

        var this_ = this;
        var handleRotateNorth = function() {
          this_.getMap().getView().setRotation(0);
        };

        //button.addEventListener('click', handleRotateNorth, false);
        //button.addEventListener('touchstart', handleRotateNorth, false);

        var element = document.createElement('div');
        element.className = 'custom-ol-panel-control  ol-unselectable ol-control ' + options.class || '';
        //element.appendChild(button);
        element.innerHTML='This is a test';
        element.id= options.id;
        element.style.top= options.top || undefined;
        element.style.width=options.width||  undefined;
        element.style.height=options.height||undefined;
        element.style.left=options.left|| undefined;
        if(options.cssText){
          element.style.cssText=options.cssText;
        }
        ol.control.Control.call(this, {
          element: element,
          target: options.target
        });

      };
      ol.inherits(OlPanelControl, ol.control.Control);
