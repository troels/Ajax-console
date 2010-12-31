(function ($) { 
    function inherits(to, from) {
    }
    
    Array.prototype.reduce = Array.prototype.reduce || 
	function (f, initialValue) { 

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
    function getNextNodeId() { 
	return id_counter++;
    }

    $.fn.windowManager = function() { 
	var $elem = $(this);
	if ($elem.size() != 1) throw TypeError();
	var width = $elem.width(), height = $elem.height(),
	    point = new Point($elem.offset().left, $elem.offset().top),
	    window = new Window($(document.createElement("div")), point)
            leafnode = new LeafNode(window, point, width, height, null, null, null),
            root = new RootNode(leafnode, point, width, height);
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
	this.setPos(pos || (new Point(0, 0)));
    }

    $.extend(Window.prototype, {
	setDomContent: function (domContent) { this.domContent = $(domContent); return this; },
	getDomContent: function () { return this.domContent; },
	setPos: function (pos) { 
	    this.pos = pos; 
	    if (this.pos) {
		this.getDomContent().css("left", pos.getX() + "px").css("top", pos.getY() + "px");
	    }
	},
	getPos: function () { return this.pos; },
	setWidth: function (width) { this.cachedWidth = width; 
				     this.getDomContent().css("width", width + "px"); 
				     return this; },
	getWidth: function () {  return this.cachedWidth; },
	setHeight: function(height) { this.cachedHeight = height; 
				      this.getDomContent().css("height", height + "px"); 
				      return this; 
				    },
	getHeight: function () { return this.cachedHeight; },
	remove: function () { this.getDomContent().detach(); }
    });
	
	    
    function AbstractNode(parent, prevSibling, nextSibling) {
	this.setId(getNextNodeId());
	this.setParent(parent);
	this.setPrevSibling(prevSibling);
	this.setNextSibling(nextSibling);
    };
    
    $.extend(AbstractNode.prototype, {
	setId: function (id) { this.id = id; return this; },
	getId: function () { return this.id; },
	setParent: function (parent) { this.parent = parent; return this; },
	getParent: function () { return this.parent; },
	setPrevSibling: function (prevSibling) { this.prevSibling = prevSibling; return this; },
	getPrevSibling: function () { return this.prevSibling; },
	setNextSibling: function (nextSibling) { this.nextSibling = nextSibling; return this; },
	getNextSibling: function () { return this.nextSibling; },
	unlink: function () { this.setParent(null); this.setPrevSibling(null); this.setNextSibling(null); 
			      return this; },
	remove: function () { this.unlink(); return this; },
	isRoot: function () { return false; }
    });
    
    function RootNode(child, pos, width, height) { 
	AbstractNode.call(this, null, null, null);
	this.setChild(child);
	this.setPos(pos);
	this.setHeight(height);
	this.setWidth(width);
    }

    inherits(RootNode, AbstractNode);
    
    $.extend(RootNode.prototype, {
	getChild: function() { return this.child; },
	setChild: function (child) { this.child = child; this.child.setParent(this);  },
	setPos: function (pos) { this.cachedPos = pos; this.getChild().setPos(pos); return this; },
	getPos: function () { return this.cachedPos; },
	setWidth: function (width) { this.cachedWidth = width; this.getChild().setWidth(width); return this; },
	getWidth: function () { return this.cachedWidth; },
	setHeight: function (height) { this.cachedHeight = height; this.getChild().setHeight(height); return this; },
	getHeight: function () { return this.cachedHeight; },
	resizeFromLeft: function (offset) { this.getChild().resizeFromLeft(offset); },
	resizeFromRight: function (offset) { this.getChild().resizeFromRight(offset); },
	resizeFromTop: function (offset) { this.getChild().resizeFromTop(offset); },
	resizeFromBottom: function (offset) { this.getChild().resizeFromBottom(offset); },
	substituteNode: function (id, node) { 
	    var child = this.getChild();
	    if (child.getId() == id) { 
		this.setChild(node);
		node.setPrevSibling(null);
		node.setNextSibling(null);
		node.setWidth(this.getWidth());
		node.setHeight(this.getHeight());
		node.setPos(this.getPos());
		child.unlink();
	    }
	}
    });
	
    function LeafNode(domContent, pos, width, height, parent, prevSibling, nextSibling) { 
	AbstractNode.call(this, parent, prevSibling, nextSibling);
	this.setDomContent(domContent);
	this.setPos(pos);
	this.setHeight(height);
	this.setWidth(width);
    }
    
    inherits(LeafNode, AbstractNode);
    
    $.extend(LeafNode.prototype, {
	setDomContent: function (domContent) { this.domContent = domContent; } ,
	getDomContent: function () { return this.domContent; },
	setPos: function (pos) { this.getDomContent().setPos(pos) },
	getPos: function () { return this.getDomContent().getPos(); },
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
	resizeFromBottom: function (offset) {this.setHeight(this.getHeight() + offset); },
	splitHorizontal: function () {
	    this.getParent().substituteNode(this.getId(), 
					    new HorizontalSplitNode(new LeafNode(this.getDomContent()), 
								    new LeafNode(
									new Window($(document.createElement("div")))),
								    this.getPos(),
								    this.getWidth(),
								    this.getHeight()));
	},
	splitVertical: function () {
	    this.getParent().substituteNode(this.getId(), 
					    new VerticalSplitNode(new LeafNode(this.getDomContent()), 
								  new LeafNode(
								      new Window($(document.createElement("div")))),
								  this.getPos(),
								  this.getWidth(),
								  this.getHeight()));
	}
    });
    
    function AbstractSplitNode(treeNode1, treeNode2, pos, width, height, parent, prevSibling, nextSibling) { 
	AbstractNode.call(this, parent, prevSibling, nextSibling);
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
	this.setupChildren();
    }
    
    inherits(AbstractSplitNode, AbstractNode);
    
    $.extend(AbstractSplitNode.prototype, {
	getWidth: function () { return this.width; },
	setWidth: function (width) { this.width = width; },
	getHeight: function () { return this.height; },
	setHeight: function (height) { this.height = height; },
	setPos: function (pos) { this.position = pos; },
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
	    
	    console.log(width, height, pos);
	    if (width == null || height == null || pos == null) return;
	    
	    var nr_children = this.getNumberOfChildren(),
	        current_dims_total = this.mapChildren(this.getVariableDim).sum(),
	        width_per_child = Math.floor(width / nr_children),
	        ratio = isNaN(current_dims_total) || current_dims_total == 0 ? 
		        1 : this.getVariableDim(this) / current_dims_total,
	        new_dim_cands = this.mapChildren(function (child) { 
		    return Math.floor((this.getVariableDim(child) || width_per_child) * ratio);
		}),
	        new_dim_cands_sum = new_dim_cands.sum(),
	        diff = new_dim_cands_sum - this.getVariableDim(this),
	        constant_diff = Math[diff > 0 ? "floor" : "ceil"].call(Math, diff / nr_children),
	        spare = diff - constant_diff * nr_children;

	    var pos_add_method = (this.getVariableDim(this) == "width" ) ? "plusX" : "plusY";
	    
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
	},
	resizeFromLeft: function (offset) { 
	    var firstChild = this.getFirstChild();
	    firstChild.resizeFromLeft(offset);
	    this.setPos(this.getPos().plusX(-offset));
	}
    });

    function HorizontalSplitNode(treeNode1, treeNode2, pos, width, height, parent, prevSibling, nextSibling) { 
	AbstractSplitNode.call(this, treeNode1, treeNode2, pos, width, height, parent, prevSibling, nextSibling);
    }
    
    inherits(HorizontalSplitNode, AbstractSplitNode);
    
    $.extend(HorizontalSplitNode.prototype, {
	variableDim: function () { return "width"; },
	setVariableDim: function (victim, value) { 
	    if (arguments.length == 1) this.setWidth(value) 
	    else victim.setWidth(value); 
	},
	getVariableDim: function (victim) { return (victim || this).getWidth(); }
    });

    function VerticalSplitNode(treeNode1, treeNode2, pos, width, height, parent, prevSibling, nextSibling) { 
	AbstractSplitNode.call(this, treeNode1, treeNode2, pos, width, height, parent, prevSibling, nextSibling);
    }
    
    inherits(VerticalSplitNode, AbstractSplitNode);
    
    $.extend(VerticalSplitNode.prototype, {
	variableDim: function () { return "height"; },
	setVariableDim: function (victim, value) { victim.setHeight(value); },
	getVariableDim: function (victim) { return victim.getHeight(); }
    });
})(jQuery);