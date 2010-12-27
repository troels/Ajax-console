(function ($) { 
    function inherits(to, from) {
	function F() {}
	F.prototype = from.prototype;
	to.prototype = new F();
	to.prototype.constructor = to;
	to.prototype.superClass_ = from.prototype;
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

    $.fn.windowManager = function() { 
	var $elem = $(this);
	if ($elem.size() != 1) throw TypeError();
	var width = $elem.width(), height = $elem.height(),
	    point = new Point($elem.offset().left, $elem.offset().top),
	    window = new Window($(document.createElement("div")), point)
            leafnode = new LeafTreeNode(window, point, width, height, null, null, null),
            root = new RootTreeNode(leafnode, point, width, height);
	return root;
    }
    
    function Point(x, y) { 
	this.x = x;
	this.y = y;
    }

    $.extend(Point.prototype, {
	getX: function () { return this.x; },
	getY: function () { return this.y; },
	plus: function (point) { 
	    return new Point(this.getX() + point.getX(), 
			     this.getY() + point.getY());
	},
	plusX: function (x) { 
	    return new Point(this.getX() + x,
			     this.getY());
	},
	plusY: function (y) { 
	    return new Point(this.getX(), this.getY() + y);
	}
    });
    
    function Window(domContent, pos) { 
	this.setDomContent($(domContent).css("position", "absolute"));
	this.setPos(pos);
    }

    $.extend(Window.prototype, {
	setDomContent: function (domContent) { this.domContent = $(domContent); },
	getDomContent: function () { return this.domContent; },
	setPos: function (pos) { 
	    this.pos = pos; 
	    this.getDomContent().css("left", pos.getX() + "px").css("top", pos.getY() + "px");
	},
	getPos: function () { return this.pos; },
	setWidth: function (width) { this.cachedWidth = width; this.getDomContent().css("width", width + "px"); },
	getWidth: function () { 
	    return this.hasOwnProperty('cachedWidth') ? this.cachedWidth : this.getDomContent().width(); 
	},
	setHeight: function(height) { this.cachedHeight = height; this.getDomContent().css("height", height + "px");},
	getHeight: function () { 
	    return this.hasOwnProperty('cachedHeight') ? this.cachedHeight : this.getDomContent().height();
	},
	remove: function () { this.getDomContent.detach(); }
    });
	
	    
    function AbstractTreeNode(parent, prevSibling, nextSibling) {
	this.setId(getNextTreeNodeId());
	this.setParent(parent);
	this.setPrevSibling(prevSibling);
	this.setNextSibling(nextSibling);
    };
    
    $.extend(AbstractTreeNode.prototype, {
	setId: function (id) { this.id = id; },
	getId: function () { return this.id; },
	setParent: function (parent) { this.parent = parent; },
	getParent: function () { return this.parent; },
	setPrevSibling: function (prevSibling) { this.prevSibling = prevSibling; },
	getPrevSibling: function () { return this.prevSibling; },
	setNextSibling: function (nextSibling) { this.nextSibling = nextSibling; },
	getNextSibling: function () { return this.nextSibling; },
	unlink: function () { this.setParent(null); this.setPrevSibling(null); this.setNextSibling(null); },
	remove: function () { this.unlink(); },
	isRoot: function () { return false; }
    });
    
    function RootTreeNode(child, pos, width, height) { 
	AbstractTreeNode.call(this, null, null, null);
	this.setChild(child);
	this.setPos(pos);
	this.setHeight(height);
	this.setWidth(width);
    }

    inherits(RootTreeNode, AbstractTreeNode);
    
    $.extend(RootTreeNode.prototype, {
	getChild: function() { return this.child; },
	setChild: function (child) { this.child = child; this.child.setParent(this);  },
	setPos: function (pos) { this.getChild().setPos(pos); },
	getPos: function () { return this.getChild().getPos(); },
	setWidth: function (width) { this.getChild().setWidth(width); },
	getWidth: function () { return this.getChild().getWidth(); },
	setHeight: function (height) { this.getChild().setHeight(height); },
	getHeight: function () { return this.getChild().getHeigth(); },
	resizeFromLeft: function (offset) { this.getChild().resizeFromLeft(offset); },
	resizeFromRight: function (offset) { this.getChild().resizeFromRight(offset); },
	resizeFromTop: function (offset) { this.getChild().resizeFromTop(offset); },
	resizeFromBottom: function (offset) { this.getChild().resizeFromBottom(offset); },
	substituteNode: function (id, node) { 
	    var child = this.getChild();
	    if (child.getId() == id) { 
		this.setChild(node);
		child.unlink();
	    }
	}
    });
	
    function LeafTreeNode(domContent, pos, width, height, parent, prevSibling, nextSibling) { 
	AbstractTreeNode.call(this, parent, prevSibling, nextSibling);
	this.setDomContent(domContent);
	this.setPos(pos);
	this.setHeight(height);
	this.setWidth(width);
    }
    
    inherits(LeafTreeNode, AbstractTreeNode);
    
    $.extend(LeafTreeNode.prototype, {
	setDomContent: function (domContent) { this.domContent = domContent; } ,
	getDomContent: function () { return this.domContent; },
	setPos: function (pos) { this.getDomContent().setPos(pos) },
	getPos: function () { return this.getDomCOntent().getPos(); },
	getWidth: function() { return this.getDomContent().getWidth(); },
	setWidth: function (width) { this.getDomContent().setWidth(width); },
	getHeight: function () { return this.getDomContent().getHeight(); },
	setHeight: function (height) { return this.getDomContent().setHeight(height); },
	remove: function () { this.unlink(); this.getDomContent().remove(); },
	resizeFromLeft: function (offset) { 
	    this.setPos(this.getPos().plusX(-offset));
	    this.setWidth(this.getWidth() + offset); 
	},
	resizeFromRight: function (offset) { this.setWidth(this.getWidth() + offset); },
	resizeFromTop: function (offset) { 
	    this.setPos(this.getPos().plusY(-offset));
	    this.setHeight(this.getHeight() + offset); 
	},
	resizeFromBottom: function (offset) {this.setHeight(this.getHeight() + offset); }
    });
    
    function AbstractSplitTreeNode(treeNode1, treeNode2, pos, width, height, parent, prevSibling, nextSibling) { 
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
	this.setPos(pos);
    }
    
    inherits(AbstractSplitTreeNode, AbstractTreeNode);
    
    $.extend(AbstractSplitTreeNode.prototype, {
	getWidth: function () { return this.width; },
	setWidth: function (width) { if (this.width != width) { this.width = width; this.setupChildren(); } },
	getHeight: function () { return this.height; },
	setHeight: function (height) { if (this.height != height) { this.height = height; this.setupChildren(); } },
	setPos: function (pos) { 
	    if (!this.position || (this.position.getX() != pos.getX() || this.position.getY() != pos.getY())) {
		this.position = pos; this.setupChildren(); 
	    }
	},
	getPos: function () { return this.position; },
	getFirstChild: function () { return this.firstChild; },
	setFirstChild: function (child) { this.firstChild = child; },
	getLastChild: function () { return this.mapChildren(function (child) { return child; }).pop(); },
	getNumberOfChildren: function () { return this.mapChildren(function() { return 1; }).sum(); },
	mapChildren: function (f) { 
	    var outp = [];
	    var node = this.getFirstChild();
	    while (node) {
		outp.push(f.call(this, node));
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
		node.remove();
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
	setupChildren: function () { 
	    var width = this.getWidth(), 
	        height = this.getHeight(),
	        pos = this.getPos();
	   
	    if (width == null || height == null || pos == null) return;
	    var current_dims_total = this.mapChildren(this.getVariableDim).sum();
	    
	    var ratio = new_dims / current_dims_total,
	        new_dim_cands = this.mapChildren(function (child) { 
		    return Math.floor(this.getVariableDim(child) * ratio);
		}),
	        new_dim_cands_sum = new_dim_cands.sum(),
	        diff = new_dim_cands_sum - new_dims, 
	        nr_children = this.getNumberOfChildren(),
	        constant_diff = Math[diff > 0 ? "floor" : "ceil"].call(Math, diff / nr_children),
	        spare = diff - constant_diff * nr_children;

	    var pos_add_method = (this.getVariableDim() == "width" ) ? "plusX" : "plusY";
	    
	    this.mapChildren(function (child) { 
		var correction = new_dim_cands.shift() + constant_diff;
		if (spare > 0) {
		    spare--;
		    correction++;
		} else if (spare < 0) {
		    spare++
		    correction--;
		}
		this.setVariableDim(child, correction);
		child.setPos(pos);
		pos = pos[pos_add_method].call(pos, correction);
	    });
	}
    });

    function HorizontalSplitTreeNode(treeNode1, treeNode2, pos, width, height, parent, prevSibling, nextSibling) { 
	AbstractSplitTreeNode.call(this, treeNode1, treeNode2, pos, width, height, parent, prevSibling, nextSibling);
    }
    
    inherits(HorizontalSplitTreeNode, AbstractSplitTreeNode);
    
    $.extend(HorizontalSplitTreeNode.prototype, {
	variableDim: function () { return "width"; },
	setVariableDim: function (victim, value) { victim.setWidth(value); },
	getVariableDim: function (victim) { return victim.getWidth(); }
    });

    function VerticalSplitTreeNode(treeNode1, treeNode2, pos, width, height, parent, prevSibling, nextSibling) { 
	AbstractSplitTreeNode.call(this, treeNode1, treeNode2, pos, width, height, parent, prevSibling, nextSibling);
    }
    
    inherits(VerticalSplitTreeNode, AbstractSplitTreeNode);
    
    $.extend(VerticalSplitTreeNode.prototype, {
	variableDim: function () { return "height"; },
	setVariableDim: function (victim, value) { victim.setHeight(value); },
	getVariableDim: function (victim) { return victim.getHeight(); }
    });
 
})(jQuery);