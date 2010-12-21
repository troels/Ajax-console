(function ($) {
    function createElem(tag, ctxt) { 
	return $((ctxt || document).createElement(tag));
    }

    function Window(content, width, height) { 
	this.window = createElem("div");
	this.setHeight(height);
	this.setWidth(width);
	this.setContent(content);
    }
	
    Window.prototype = {
	getHeight: function () { return this.height; },
	getWidth: function () { return this.width; },
	setHeight: function (height) { 
	    this.window.css("height", height + "px"); 
	    this.height = height; 
	},
	setWidth: function (width) { 
	    this.window.css("width", width + "px"); 
	    this.width = width; 
	},
	setContent: function (content) { 
	    this.content = $(content);
	    this.content.css("height", this.getHeight() + "px").css("width", this.getWidth() + "px")
		        .css("position", "relative");
	    this.window.empty().append(this.content);
	},
	getContent: function () { 
	    return this.content;
	},
	insertWindow: function(frame) { 
	    this.window.css('position','float').css('float', 'left');
	    $(frame).append(this.window); 
	},
	removeWindow: function() {
	    this.window.detach();
	}
    };
    
    function TreeNode() {}
    
    TreeNode.prototype = {
	getParent: function () { return this.parent; },
	getPrevSibling: function() { return this.prevSibling; },
	getNextSibling: function() { return this.nextSibling; },
	setNextSibling: function (nextSibling) { this.nextSibling = nextSibling; },
	setPrevSivling: function (prevSibling) { this.prevSibling = prevSibling; },
	setParent: function (parent) { this.parent = parent; },
	setFirstChild: function (child) { this.firstChild = child; },
	getFirstChild: function (child) { return this.firstChild; },
	destroy: function () { 
	    for (var attr in this) { 
		if (this.hasOwnProperty(attr)) { 
		    this[attr] = null;
		}
	    }
	}
    }
    
    
    function TreeNodeLeaf (win, height, width, parent, prevSibling, nextSibling) {
	win.setHeight(height);
	win.setWidth(width);
	this.window = win;
	this.setParent(parent);
	this.setPrevSibling(prevSibling);
	this.setNextSibling(nextSibling);
	this.setFirstChild(null);
    }
    
    TreeNodeLeaf.prototype = new TreeNode();
    $.extend(TreeNodeLeaf.prototype, {
	getType: function() { return "leaf"; },
	getHeight: function() { return this.window.getHeight(); },
	getWidth: function() { return this.window.getWidth(); },
	setHeight: function(height) { this.window.setHeight(height); },
	setWidth: function(width) { this.window.setWidth(width); }
    });
    
    function TreeNodeHorizontalSplit(win1, win2, height, width, parent, prevSibling, nextSibling) {
	var leaf1 = new TreeNodeLeaf(win1, height, width / 2, this, null, null);
	var leaf2 = new TreeNodeLeaf(win2, height, width / 2, this, leaf1, null);
	leaf1.setNextSibling(leaf2);
	this.setFirstChild(leaf1);
	this.setParent(parent);
	this.setPrevSibling(prevSibling);
	this.setNextSibling(nextSibling);
	this.setWidth(width);
	this.setHeight(height);
    }
    
    TreeNodeHorizontalSplit.prototype = new TreeNode();
    $.extend(TreeNodeHorizontalSplit.prototype, {
	setWidth: function () { 
	    
    function WindowLayout(width, height) { 
	this.width = width;
	this.height = height;
	this.current_window = this.windows = { 
	    type: "leaf",
	    window: new Window(this.defaultDummyWindow(width, height)),
	    parent: null
	};
    }

    WindowLayout.prototype = {
	defaultDummyWindow: function (width, height) {
	    var dummy_window_content = createElem("div").text("Nothing to show");
	    return new Window(dummy_window_content, width, height);
	},
	splitHorizontally: function () { 
	    var cw = this.current_window;
	    var height = cw.window.getHeight();
	    var width = cw.window.getWidth();
	    var parent = cw.parent;

	    var new_window = { 
		type: "horizontalSplit",
		width: width,
		height: height,
		parent: cw.parent
	    }
	}
    };
	
    $.fn.windowManager = function(userConfig) {
	var defaultConfig = {};
	var config = $.extend({}, defaultConfig, userConfig);
	
	var frame = $(this);
	if (frame.length == 0) return;
	if (frame.length > 1) throw new Error("Need one element to work with"); 
	
	
	
	
    }
});

    