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
    
    var id_counter = 0;
    function getNextTreeNodeId() { 
	return id_counter++;
    }

    function AbstractTreeNode(parent, prevSibling, nextSibling) {
	this.setId(getNextTreeNodeId());
	this.setParent(parent);
	this.setPrevSibling(prevSibling);
	this.setNextSibling(nextSibling);
    };
    
    AbstractTreeNode.prototype = {
	setId: function (id) { this.id = id; },
	getId: function () { return this.id; },
	setParent: function (parent) { this.parent = parent; },
	getParent: function () { return this.parent; },
	setPrevSibling: function (prevSibling) { this.prevSibling = prevSibling; },
	getPrevSibling: function () { return this.prevSibling; },
	setNextSibling: function (nextSibling) { this.nextSibling = nextSibling; },
	getNextSibling: function () { return this.nextSibling; },
	unlink: function () { this.setParent(null); this.setPrevSibling(null); this.setNextSibling(null); },
	remove: function () { }
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

    function AbstractSplitTreeNode(treeNode1, treeNode2, height, width, parent, prevSibling, nextSibling) { 
	AbstractTreeNode.call(this, parent, prevSibling, nextSibling);
	treeNode1.setPrevSibling(null);
	treeNode1.setNextSibling(treeNode2);
	treeNode1.setParent(this);
	treeNode2.setPrevSibling(treeNode1);
	treeNode2.setNextSibling(null);
	treeNode2.setParent(this);
	this.setFirstChild(treeNode1);
	this.setWidth(width);
	this.setHeight(height);
    }
    
    inherits(SplitTreeNode, AbstractTreeNode);
    
    $.extend(SplitTreeNode.prototype, {
	getWidth: function () { return this.width; },
	setWidth: function (width) { this.adjustWidth(width); this.width = width; },
	getHeight: function () { return this.height; },
	setHeight: function (height) { this.adjustHeight(height); this.height = height; },
	getFirstChild: function () { return this.firstChild; },
	setFirstChild: function (child) { this.firstChild = child; },
	getLastChild: function () { return this.mapChildren(function (child) { return child; }).pop(); },
	getNumberOfChildren: function () { return this.mapChildren(function() { return 1; }).sum(); },
	mapChildren: function (f) { 
	    var outp = [];
	    var node = this.getFirstChild();
	    while (node) {
		outp.push(f(node));
		node = node.getNextSibling();
	    }
	    return outp;
	},
	addChild: function (child, pos) { 
	    if (arguments.length == 1) 
		pos = 0;
	    var node = this.getFirstChild(), 
	        prev_node = null;
	    while(node && pos-- != 0) {
		prev_node = node;
		node = this.getNextSibling();
	    }
	    
	    if (prev_node) { 
		prev_node.setNextSibling(child);
	    } else {
		this.setFirstChild(child);
	    }
	    if (node) node.setPrevSibling(node);
	    child.setNextSibling(node);
	    child.setPrevSibling(prev_node);
	    child.setParent(this);
	    
	    child[this.constantDimSetter].call(child, this[this.constantDimGetter].call(this));
	    
	    var shared_node = node || prev_node;
	    if (shared_node) {
		var old_node_dim = shared_node[this.variableDimGetter].call(shared_node);
		var new_node_dim = Math.floor(old_node_dim / 2);
		shared_node[this.variableDimSetter].call(shared_node, 
							 new_node_dim + (old_node_dim % 2 == 1 ? 1 : 0));
		child[this.variableDimSetter].call(child, new_node_dim);
	    } else { 
		child[this.variableDimSetter].call(child, this[this.variableDimGetter].call(this));
	    }
	    return child;
	},
	removeChild: function (pos) { 
	    if (arguments.length == 0) pos = 0;
	    var node = this.getFirstChild();
	    
	    while(node && pos-- != 0) { 
		node = node.getNextSibling();
	    }

	    if (!node) return null;
	    if (this.getNumberOfChildren() == 2) {
		var otherNode = node.getPrevSibling() || node.getNextSibling();
		this.getParent().substituteNode(this.getNodeId(), otherNode);
		node.unlink();
		return node;
	    }

	    if (node.getPrevSibling()) {
		node.getPrevSibling().setNextSibling(node.getNextSibling());
	    } 
	    if (node.getNextSibling()) {
		node.getNextSibling().setPrevSibling(node.getPrevSibling()); 
	    }
	    
	    var resizable_sibling = node.getNextSibling() || node.getPrevSibling();
	    resizable_sibling[this.variableDimSetter].call(
		resizable_sibling, 
		resizable_sibling[this.variableDimGetter].call(resizable_sibling) + 
		    node[this.variableDimGetter].call(node));

	    return node;
	},
	substituteNode: function (id, newNode) { 
	    var $this = this;
	    this.mapChildren(function (child) { 
		if (child.getId() == id) {
		    newNode.setParent($this);
		    newNode.setPrevSibling(child.getPrevSibling());
		    newNode.setNextSibling(child.getNextSibling());
		    newNode.setWidth(child.getWidth());
		    newNode.setHeight(child.getHeight());
		    child.unlink();
		}
	    });
	},
	delegateVariableDimensions: function (new_dims) { 
	    var current_dims = this.mapChildren(function (child) { 
		return child[this.variableDimGetter].call(child);
	    }),
	    current_dims_total = current_dims.sum();
	    if(current_dims_total != new_dims) { 
		var ratio = new_dims / current_dims_total,
		    new_dim_cands = this.mapChildren(function (child) { 
			return Math.floor(child[this.variableDimGetter].call(child) * ratio);
		    }),
		    new_dim_cands_sum = new_dim_cands.sum(),
                    diff = new_dim_cands_sum - new_dims, 
		    nr_children = this.getNumberOfChildren(),
		    constant_diff = Math[diff > 0 ? "floor" : "ceil"].call(Math, diff / nr_children),
		    spare = diff - constant_diff * nr_children;

		this.mapChildren(function (child) { 
		    var correction = new_dim_cands.shift() + constant_diff;
		    if (spare > 0) {
			spare--;
			correction++;
		    } else if (spare < 0) {
			spare++
			correction--;
		    }
		    child[this.variableDimSetter].call(child, correction);
		});
	    }
	}
    }));
})(jQuery);