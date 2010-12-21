(function ($) { 
    function inherits(to, from) {
	function F() {}
	F.prototype = from.prototype;
	to.prototype = new F();
	to.prototype.constructor = from;
    }
    
    Array.prototype.reduce = Array.prototype.reduce || 
	function (f, initialValue) { 
	    var previousValue, currentValue, counter = 0;
	    if (arguments.length >= 2) {
		previousValue = initialValue; 
		if (this.length == 0) { return previousValue; } 
		currentValue = this[counter++];
	    } else {
		if (this.length == 0) 
		    throw new TypeError();
		if(this.length == 1) 
		    return this[counter++];
		previousValue = this[counter++];
		nextValue = this[counter++];
	    }

	    while(true) {
		previousValue = f(previousValue, currentValue, counter - 1, this);
		if (counter >= this.length) return previousValue;
		currentValue = this[counter++];
	    };
	}

    Array.prototype.sum = function (initial) { 
	if (arguments.length == 0) 
	    initial = 0;
	for (var i = 0; i < this.length; ++i) {
	    if (i in this) { 
		initial += this[i];
	    }
	}
	return initial;
    };

    function AbstractTreeNode(parent, prevSibling, nextSibling) {
	this.setParent(parent);
	this.setPrevSibling(prevSibling);
	this.setNextSibling(nextSibling);
    };
    
    AbstractTreeNode.prototype = {
	setParent: function (parent) { this.parent = parent; },
	getParent: function () { return this.parent; },
	setPrevSibling: function (prevSibling) { this.prevSibling = prevSibling; },
	getPrevSibling: function () { return this.prevSibling; },
	setNextSibling: function (nextSibling) { this.nextSibling = nextSibling; },
	getNextSibling: function () { return this.nextSibling; }
    };
    
    function LeafTreeNode(domContent, height, width, parent, prevSibling, nextSibling) { 
	AbstractTreeNode.call(this, parent, prevSibling, nextSibling);
	this.setDomContent(domContent);
	this.setHeight(height);
	this.setWidth(width);
    }

    inherits(LeafTreeNode, AbstractTreeNode);
    
    $.extend(LeafTreeNode.prototype, {
	setDomContent: function (domContent) { this.domContent = domContent; } ,
	getDomContent: function () { return this.domContent; },
	getWidth: function() { return this.domContent.getWidth(); },
	setWidth: function (width) { this.domContent.setWidth(width); },
	getHeight: function () { return this.domContent.getHeight(); },
	setHeight: function (height) { return this.domContent.setHeight(height); },
	resizeFromLeft: function (offset) { this.setWidth(this.getWidth() + offset); },
	resizeFromRight: function (offset) { this.setWidth(this.getWidth() + offset); },
	resizeFromTop: function (offset) { this.setHeight(this.getHeight() + offset); },
	resizeFromBottom: function (offset) { this.setHeight(this.getHeight() + offset); }
    });

    function HorizontalSplitTreeNode(treeNode1, treeNode2, height, width, parent, prevSibling, nextSibling) { 
	AbstractTreeNode.call(this, parent, prevSibling, nextSibling);
	treeNode1.setPrevSibling(null);
	treeNode1.setNextSibling(treeNode2);
	treeNode2.setPrevSibling(treeNode1);
	treeNode2.setNextSibling(null);
	this.setFirstChild(treeNode1);
	this.setWidth(width);
	this.setHeight(height);
    }

    inherits(HorizontalSplitTreeNode, AbstractTreeNode);
    
    $.extend(HorizontalSplitTreeNode.prototype, {
	setFirstChild: function (node) { this.firstChild = node; },
	getFirstChild: function () { return this.firstChild; },
	getLastChild: function () { 
	    var node = this.getFirstChild(), new_node;
	    while (new_node = node.getNextSibling()) node = new_node;
	    return node;
	},
	getNumberOfChildren: function () { 
	    var node = this.getFirstChild(), outp = 0;
	    while (node) { outp++; node = node.getNextSibling(); }
	    return outp;
	},
	mapChildren: function (f) { 
	    var outp = [];
	    var node = this.getFirstChild();
	    while (node) {
		outp.push(f(node));
		node = node.getNextSibling();
	    }
	    return outp;
	},
	totalChildrenWidth: function () { 
	    return this.mapChildren(function (child) { return child.getWidth(); })
		       .reduce(function (accum, x) { return accum + x; }, 0); 
	},
	getWidth: function () {return this.width; },
	setWidth: function (width) { 
	    var currentWidth = this.totalChildrenWidth();
	    if (currentWidth != width) { 
		var nr_children = this.getNumberOfChildren();
		var spare = width % nr_children;
		var new_base_width = Math.floor(width / nr_children);
		this.mapChildren(function (child) {
		    if (spare > 0) { 
			spare--;
			child.setWidth(new_base_width + 1);
		    } else { 
			child.setWidth(new_base_width);
		    }
		});
	    }
	    this.width = width;
	},
	getHeight: function () { return this.height; },
	setHeight: function (height) { 
	    if (height != this.getHeight()) { 
		this.mapChildren(function (child) { child.setHeight(height); });
	    }
	    this.height = height;
	},
	resizeFromLeft: function(offset) {
	    var first_child = this.getFirstChild();
	    first_child.setWidth(first_child.getWidth() + offset);
	    this.setWidth(this.getWidth() + offset);
	},
	resizeFromRight: function (offset) { 
	    var last_child = this.getLastChild();
	    last_child.setWidth(last_child.getWidth() + offset);
	    this.setWidth(this.getWidth() + offset);
	},
	resizeFromTop: function (offset) { 
	    this.setHeight(this.getHeight() + offset);
	},
	resizeFromBottom: function (offset) {
	    this.setHeight(this.getHeight() + offset);
	},
	addChild: function (child, pos) { 
	    if (arguments.length == 1) 
		pos = 0;
	    var node = this.getFirstChild(), 
	        prev_node = null;
	    while(node) {
		if (pos-- == 0) break;
		prev_node = node;
		node = this.getNextSibling();
	    }

	    if (prev_node) prev_node.setNextSibling(child);
	    if (node) node.setPrevSibling(node);
	    child.setNextSibling(node);
	    child.setPrevSibling(prev_node);
	    child.setParent(this);

	    child.setHeight(this.getHeight());
	    var reduced_node = node || prev_node;
	    if (reduced_node) {
		var new_node_width = Math.floor(reduced_node.getWidth() / 2);
		reduced_node.setWidth(new_node_width + (old_node_width % 2 == 1 ? 1 : 0));
		child.setWidth(new_node_width);
	    } else { 
		child.setWidth(this.getWidth());
	    }
	},
	removeChild: function (pos) { 
	    if (arguments.length == 0) pos = 0;
	    var node = this.getFirstChild();
	    
	    while(node) { 
		if (pos-- == 0) break;
		node = node.getNextSibling();
	    }
	    if (!node) return null;
	    if (node.getPrevSibling()) {
		node.getPrevSibling().setNextSibling(node.getNextSibling());
	    } 
	    if (node.getNextSibling()) {
		node.getNextSibling().setPrevSibling(node.getPrevSibling());
	    }
	    node.setParent(null);
	    node.setNextSibling(null);
	    node.setPrevSibling(null);
	    return node;
	}
    });
    
    
})(jQuery);