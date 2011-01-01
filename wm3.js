(function ($) { 
    $.bifrost = $.bifrost || {};

    var inherits = $.bifrost.inherits = function (to, from) { 
	function F() {}
	F.prototype = from.prototype;
	to.prototype = new F();
	to.prototype.constructor = to;
	to.prototype.superClass_ = from.prototype;
    }
    
    function AssertionFailed(msg) {
	Error.call(this, msg);
    }
    
    inherits(AssertionFailed, Error);

    var assert = $.bifrost.assert = function (condition, msg) { 
	if (!condition) { 
	    throw new AssertionFailed("Assertion failed in: " + arguments.callee + (msg || ""));
	}
    }
    
    function isNumber(num) { return typeof num == "number"; }
    function isInteger(num) { return isNumber(num) && /^\d+$/.test(num.toString()); }
    function isNonNegative(num) { return isInteger(num) && num >= 0; }
    function isPositive(num) { return isInteger(num) && num > 0; }
    function isBetween(num, min, max) { return num >= min && num < max; }
    function isHtmlElem(obj) { return $(obj).get(0) instanceof HtmlElement; }

    function px(num) { assert(isPositiveInteger(num)); return num + "px"; }
    
    function Counter(startValue) { 
	assert(!startValue || isInteger(startValue));
	var counter = startValue || 0;
	this.next = function () { return counter++; }
    }
    
    $.bifrost.sum = function (array, initial) {
	assert($.isArray(array) && isBetween(arguments.length, 1, 3));
	var accum = arguments.length  <= 1 ? 0 : initial;
	for (var i = 0; i < array.length; ++i) { 
	    if (i in array) { 
		accum += array[i];
	    }
	}
	return accum;
    }
    
    function Dimensions(left, top, width, height) { 
	assert(isNonNegative(left) && isNonNegative(top) && 
	       isPositive(width) && isPositive(height));
	this.left = function () { return left; }; this.top = function () { return top; };
	this.width = function () { return width; }; this.height = function () { return height; };
    }
    
    $.extend(Dimensions.prototype, {
	apply: function(elem) { 
	    $(elem).css("position", "absolute").css("left", px(this.left())).css("top", px(this.top()))
	        .css("width", px(this.width())).css("height", px(this.height()));
	},
	addWidth: function (width) { assert(isPositive(width + this.width()));
				     return new Dimensions(this.left(), this.top(), 
							   this.width() + width, this.height()); },
	addHeight: function (height) { assert(isPositive(height + this.height()));
				       return new Dimensions(this.left(), this.top(), 
							     this.width(), this.height() + height);},
	addLeft: function (left) { assert(isNonNegative(this.left() + left));
				   return new Dimensions(this.left() + left, this.top(),
							 this.width(), this.height()); },
	addTop: function (top) { assert(isNonNegative(this.top() + top)); 
				 return new Dimensions(this.left(), this.top() + top,
						       this.width(), this.height()); },
	splitHorizontally: function () { 
	    var secondWidth = Math.floor(this.width() / 2);
	    var firstWidth = this.width() - secondWidth;
	    
	    return [new Dimensions(this.left(), this.top(), firstWidth, this.height()),
		    new Dimensions(this.left() + firstWidth, this.top(), secondWidth(), this.height())]
	},
	splitVertically: function () {
	    var secondHeight = Math.floor(this.height() / 2);
	    var firstHeight = this.height() - secondHeight;
	    return [new Dimensions(this.left(), this.top(), this.width(), firstHeight),
		    new Dimensions(this.left(), this.top() + firstHeight, this.width(), secondHeight)];
	}
    });

    $.fn.setDimensions = function (dims) { 
	assert(dims instanceof Dimensions);
	dims.apply($(this));
    };

    function Buffer(domContent, dimensions) {
	assert(isHtmlElem(domContent) && dimensions instanceof Dimensions);
	this.getDomContent = function () { return domContent; };
	this.getDimensions = function () { return dimensions; };
    }

    $.extends(Buffer.prototype, {
	render: function () { $(this.getDomContent()).setDimensions(this.getDimensions()); },
	hide: function () { $(this.getDomContent()).hide(); },
	setDimensions: function (dims) { assert(dims instanceof Dimensions);
				   return new Buffer(this.getDomContent(), dims); }
    });

    function isNode(node) { return node instanceof AbstractNode; }
    function isNonRootNode(node) { return isNode(node) && !(node instanceof RootNode); }

    nodeIdCounter = new Counter();

    function AbstractNode(parent, dims) { 
	assert((parent === null || parent instanceof AbstractNode) && 
	       dims instanceof Dimensions)
	this.getParent = function () { return parent; };
	this.getDimensions = function () { return dims; };
				       
	var id = nodeIdCounter.next();
	this.getId = function () { return id; }
    }
    
    $.extend(AbstractNode.prototype, { 
	isLeft: function () { 
	    return this.getParent() instanceof HorizontalSplitNode && 
		this.getParent.getFirstChild() == this;
	},
	isRight: function () { 
	    return this.getParent() instanceof HorizontalSplitNode && 
		this.getParent.getSecondChild() == this;
	},
	isBottom: function () { 
	    return this.getParent() instanceof VerticalSplitNode && 
		this.getParent().getSecondChild() == this;
	}, 
	isTop: function () { 
	    return this.getParent() instanceof VerticalSplitNode && 
		this.getParent().getFirstChild() == this;
	}
    });

    function RootNode(child, dims) { 
	assert((child === null || child instanceof Buffer || isNonRootNode(child)) &&
	       dims instanceof Dimensions);
	AbstractNode.call(this, null, dims);
	child = this._makeChildNode(node);
	this.getChild = function () { return child; }
    }
    
    inherits(RootNode, AbstractNode);

    $.extend(RootNode.prototype, {
	_makeChildNode: function (node) { 
	    assert(node === null || node instanceof Buffer || isNonRootNode(node));
	    return node ? node instanceof Buffer ? new LeafNode(node, this, dims) : 
	           node.setDimensions(this.getDimensions()) : this._defaultNode();
	},
	_defaultNode: function () { 
	    return this._makeChildNode(new Buffer(document.createElement("div"), this.getDimensions())); 
	},
	substituteNode: function (id, newNode) { 
	    assert(isNonRootNode(newNode) && isNumber(id));
	    return this.getChild().getId() == id ? new RootNode(newNode, this.getDimensions()) : this;
	},
	render: function () { this.getChild().render(); },
	setDimensions: function (dims) { return new RootNode(this.getChild(), dims); }
    });

    function LeafNode(buffer, parent, dims) { 
	assert((parent === null || isNode(parent)) && buffer instanceof Buffer && dims instanceof Dimensions);
	AbstractNode.call(this, parent, dims);
	buffer = buffer.setDimensions(dims);
	this.getBuffer = function () { return buffer; };
    }
    
    inherits(LeafNode, AbstractNode);
    
    $.extend(LeafNode.prototype, {
	render: function () { this.getBuffer().render(); },
	hide: function () { this.getBuffer().hide(); },
	setDimensions: function (dims) { assert(dims instanceof Dimensions); 
					 return new LeafNode(this.getBuffer(), this.getParent(), dims); },
	setParent: function (parent) { assert(isNode(parent));
				       return new LeafNode(this.getBuffer(), parent, this.getDimensions()); }
    });
    
    function AbstractSplitNode(node1, node2, parent, dims) {
	assert(isNonRootNode(node1) && isNonRootNode(node2) && dims instanceof Dimensions);
	AbstractNode.call(this, parent, dims);
	
	node1 = node1.setParent(this); node2 = node2.setParent(this);
	this.getFirstChild = function () { return node1; };
	this.getSecondChild = function () { return node2; };
    }

    inherits(AbstractSplitNode, AbstractNode);
    
    $.extend(AbstractSplitNode.prototype, {
	render: function () { this.getFirstChild().render(); this.getSecondChild().render(); },
	hide: function () { this.getFirstChild().hide(); this.getSecondChild().hide(); },
	substituteNode: function (id, newNode) {
	    assert(isInteger(id) && isNonRootNode(newNode));
	    if (this.getFirstChild().getId() === id) {
		return new this.constructor(newNode, this.getFirstChild().getDimensions(),
					    this.getSecondChild(), this.getSecondChild().getDimensions(), 
					    this.getParent());
	    } else if (this.getSecondChild().getId() == id){
		return this.constructor(this.getFirstChild(), this.getFirstChild.getDimensions(),
					newNode, this.getSecondChild().getDimensions(), 
					this.getParent());
	    } else {
		return this;
	    }
	},
	setParent: function (parent) { 
	    assert(isNode(parent));
	    return new this.constructor(this.getFirstChild(), this.getFirstChild().getDimensions(),
					this.getSecondChild(), this.getSecondChild().getDimensions(), parent);
	}
    });
    
    function HorizontalSplitNode(node1, node1dims, node2, node2dims, parent) {
	assert(isNonRootNode(node1) && isNonRootNode(node2) && 
	       (parent === null || isNode(parent)) &&
	       dims instanceof Dimensions && 
	       (node1dims instanceof Dimensions && node2dims instanceof Dimensions &&
		node1dims.left() + node1dims.width() === node2dims.left() && 
		node1dims.height() == node2dims.height() && node1dims.top() == node2dims.top()));
	
	node1 = node1.setDimensions(node1dims); node2 = node2.setDimensions(node2dims);
	var dims = new Dimensions(node1dims.left(), node1dims.top(), 
				  node1dims.width() + node2dims.width(), node1dims.height());
	AbstractSplitNode.call(this, node1, node2, parent, dims);
    }

    inherits(HorizontalSplitNode, AbstractSplitNode);
    
    $.extend(HorizontalSplitNode.prototype, {
	setDimensions: function (dims) { 
	    assert(dims instanceof Dimensions);
	    
	    var secondWidth = Math.floor(
		   dims.width() * this.getSecondChild().getDimensions().width() / this.getDimensions().width()),
	        firsthWidth = dims.width() - secondWidth,
	        node1dims = new Dimensions(dims.left(), dims.top(), firstWidth, dims.height()),
	        node2dims = new Dimensions(dims.left() + firstWidth, dims.top(), secondWidth, dims.height());
	    return new this.constructor(node1, node1dims, node2, node2dims, parent);
	}
    });
    
    function VerticalSplitNode(node1, node1dims, node2, node2dims, parent) {
	assert(isNonRootNode(node1) && isNonRootNode(node2) && 
	       (parent === null || isNode(parent)) && 
	       (node1dims instanceof Dimensions && node2dims instanceof Dimensions &&
		node1dims.left() === node2dims.left() && node1dims.width() === node2dims.width() && 
		node1dims.top() + node1dims.height() === node2dims.top()));
	node1 = node1.setDimensions(node1dims); node2 = node2.setDimensions(node2dims);
	var dims = new Dimensions(node1dims.left(), node1dims.top(),
				  node1dims.width(), node1dims.height() + node2dims.height());
	AbstractSplitNode.call(this, node1, node2, parent, dims);
    }
    
    inherits(VerticalSplitNode, AbstractSplitNode);

    $.extend(VerticalSplitNode.prototype, {
	setDimensions: function (dims) {
	    assert(dims instanceof Dimensions);
	    
	    var secondHeight = Math.floor(
		    dims.width() * this.getSecondChild().getDimensions.height() / this.getDimensions().height()),
	        firstHeight = dims.height()  - secondHeight,
	        node1dims = new Dimensions(dims.left(), dims.top(), dims.width(), firstHeight),
	        node2dims = new Dimensions(dims.left(), dims.top() + firstHeight, dims.width(), secondHeight);
	    return new this.constructor(node1, node1dims, node2, node2dims, parent);
	}
    });
})(jQuery);
