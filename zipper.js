(function ($) { 
    $.bifrost = $.bifrost || {};

    var rxesc = $.bifrost.regexpEscape = function (str) { 
	return str.replace(/[\][.?*+{}()^\\$]/g, "\\$&");
    }

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
    
    var format = $.bifrost.format = function (tmpl, args) { 
	var subs = [];
	if (!(typeof args === "object")) {
	    var arr = Array.prototype.slice.apply(arguments, 1);
	    args = {};

	    for(var i = 0; i < arr.length; ++i) {
		args[i.toString()] = arr[i];
	    }
	}

	for (var p in args) { 
	    if (!args.hasOwnProperty(p)) continue;
	    subs.push(rxesc(p)):
	}

	if (!subs) return tmpl;
	var regexp = new RegExp("(\\\\.)|\\{(" + subs.join("|") + ")\\}", "g");
	return tmpl.replace(regexp, function (str, p0, p1, offset, s) {
	    return p0 == undefined ? subs[p1] : p0[1];
	});
    }
    
    var createFormatFunc = $.bifrost.createFormatFunc = function(tmpl) {
	var args = Array.prototype.slice.call(arguments, 1);
	return function() { 
	    var innerArgs = Array.prototype.slice.call(arguments, 0);
	    return format(tmpl, args.concat(innerArgs));
	}
    };

    function isFunc() { 
	var args = Array.prototype.slice.call(arguments, 0);
	var prereqs = $.isArray(args[0]) ? args.shift() : [];
	
	var testFunc = args.shift();
	var msg = args.shift();
	
	return function () { 
	    var innerArgs = Array.prototype.slice.call(arguments, 0);
	    
	    $.each(prereqs, function (_, f) {
		f.apply(undefined, innerArgs);
	    });
	    
	    var perTurn = testFunc.length;
	    for (var i = 0; i < innerArgs.length; i += perTurn) {
		var vals = innerArgs.slice(i, i + perTurn);
		if (!testFunc.apply(undefined, vals)) {
		    throw new AssertionFailed(msg instanceof "function" ? 
					      msg.apply(undefined, vals) : msg.toString());
		}
	    }
	}
    }


    function compose(f, g) {
	return function () {
	    f(g.apply(undefined, Array.prototype.slice.call(arguments, 0)));
	}
    }

    function extractFunctionName(f) {
	var match = /^\s*function\s*(\S*)\s*(/.exec(f.toString());
	if (match) { 
	    return match[1];
	} else {
	    return "anonymous object"
	}
    }
    
    var isNumber = isFunc(function (num) { return typeof num === "number"; },
			  createFormatFunc("{0} is not a number"));
    var isInteger = isFunc([isNumber], function (num) {return /^\d+$/.test(num.toString()); },
			   createFormatFunc("{0} is not an integer"));
    var isNonNegative = isFunc([isInteger], function (num) { return num >= 0; },
			       createFormatFunc("{0} is not an integer"));
    var isPositive = isFunc([isInteger], function (num) { return num > 0; },
			    createFormatFunc("{0} is not positive"));
    var isBetween = function (min, max) {
	return isFunc([isNumber], 
		      function (num) { 
			  return num >= min && num < max; 
		      },
		      createFormatFunc("{2} is not between {0} and {1}", min, max));
    }
    
    var isMemberOf = function () {
	var args = Array.prototype.slice.call(arguments, 0);
	return isFunc(function (obj) { 
	    return args.indexOf(obj) !== -1;
	}, createFormatFunc("{1} is not a member of the list: [{0}]", args.join(",")));
    }
	
    var isElem = function (type) { 
	return isFunc(function (obj) { 
	    return obj instanceof type;
	}, function (msg) { 
	    return format("{1} is not an object of type: \"{0}\"", extractFunctionName(type), msg);
	});
    };
    var isHtmlElem = isElem(HtmlElement);

    function implementsInterface() {
	var args = Array.prototype.slice.apply(arguments, 0);
	
	return isFunc(function (obj) { 
	    for(var i = 0; i < args.length; ++i) {
		if (typeof obj[args[i]] !== "function") return false;
	    }
	}, createFormatFunc("{0} does not implement the appropriate interface"))
    }
	
    function Transform(left, right, top, bottom) { 
	isNonNegative(left, right, top, bottom);
	
	this.left = function () { return left; };
	this.right = function () { return right; };
	this.top = function () { return top; };
	this.bottom = function () { return bottom; };
    }
    
    $.extend(Transform.prototype, {
	verticalComponent: function () { return new Transform(0, 0, this.top(), this.bottom()); },
	horizontalComponent: function () { return new Transform(this.left(), this.right(), 0, 0); },
	complement: function () { return new Transform(-this.right(), -this.left(), -this.bottom(), -this.top()); },
	verticalComplement: function () { return this.verticalComponent().complement(); },
	horizontalComplement: function () { return this.horizontalComponent().complement(); }
    });

    function Dimensions(left, top, width, height) { 
	isNonNegative(left, top); isPositive(width, height);
	this.left = function () { return left; };
	this.top = function () { return top; };
	this.width = function () { return width; };
	this.height = function () { return height; };
    }

    $.extend(Dimensions.prototype, {
	transform: function(tm) {
	    isElem(Transform)(tm);
	    return new Dimensions(this.left() - tm.left(), this.top() - tm.top(), 
				  this.width + tm.left + tm.right, this.height + tm.top + tm.bottom);
	}
    });

    function WMNode() {}
    
    function WMLeafNode(buffer) {
	WMNode.call(this);
	isElem(Buffer)(buffer);
	this.getBuffer = function () { return buffer;};
    }
    
    inherits(WMLeafNode, WMNode);
    $.extend(WMLeafNode.prototype, {});
	    
    function WMSplitNode(first, last, splitDirection) {
	WMNode.call(this);
	this.getFirst = function () { return first; };
	this.getLast = function () { return last; };
	this.getSplitDirection = function () { return splitDirection; };
    }
    
    inherits(WMSplitNode, WMNode);
    $.extend(WMSplitNode.prototype, {
	creator: function () { 
	    var cons = this.constructor, splitDirection = this.splitDirection;
	    
	    return function(first, last) { 
		return new cons(first, last);
	    }
	}
    });
	
    function Direction(dir) {
	isMemberOf("first", "last")(dir):
	this.getDirecion = function () { return dir; }; 
    }

    $.extend(Direction.prototype, {
	isFirst: function () { return this.getDirection() === "first"; },
	isLast: function () { return this.getDirection () === "last"; }
    });
    
    var DIR_FIRST = new Direction("first");
    var DIR_LAST = new Direction("last");
    
    function ContextBase() {}
    
    $.extend(ContextBase.prototype, {
	push: function (dir, tree) { 
	    isElem(Direction)(dir); isElem(WMSplitNode)(tree);
	    return this.constructor(dir, tree, this);
	},
	isTop: function () { return false; },
	isFirst: function () { return false; },
	isLast: function () { return false; }
    });
	
    function ContextTop() {
	ContextBase.call(this);
    }
    
    $.extend(ContextTop.prototype, {
	pop: function () { throw new Error("Popping top context"); },
	isTop: function () { return true; }
    });
	
    var TOP_CONTEXT = new ContextTop();
    function Context(dir, tree, prevCtxt) { 
	isElem(WMSplitNode)(tree);
	isElem(Direction)(dir); isElem(ContextBase)(prevCtxt); 

	this.getDirection = function () { return dir; };
	this.getCreator = function () { return tree.getCreator(); };
	var node = dir.isFirst() ? tree.getFirst() : tree.getLast();
	this.getTree = function () { return node; };
	this.getPrevContext = function () { return prevCtxt; };
    }

    $.extend(Context.prototype, {
	isFirst: function () { return this.getDirection().isFirst(); },
	isLast: function () { return this.getDirection().isLast(); },
	pop: function () { return this.getPrevContext(); },
	assemble: function (node) { 
	    return this.isFirst() ? 
		this.getCreator()(this.getTree(), node) : 
		this.getCreator()(node, this.getTree());
	}
    });

    function Location(tree, context) { 
	context = context || TOP_CONTEXT;
	isElem(WMNode)(tree); isElem(ContextBase)(context);
	this.getTree = function () { return tree; };
	this.getContext = function () { return context; };
    }
    
    $.extend(Location.prototype, {
	isTop: function () { return this.getContext() instanceof ContextTop; },
	goFirst: function () {
	    isElem(WMSplitNode)(this.getTree());
	    return new Location(this.getTree().getFirst(), 
				this.getContext().push(DIR_LAST, this.getTree()));
	},
	goLast: function () { 
	    isElem(WMSplitNode)(this.getTree());
	    return new Location(this.getTree().getLast(), 
				this.getContext().push(DIR_FIRST, this.getTree()));
	},
	up: function () { 
	    isElem(Context)(this.getContext());
	    return new Location(this.getContext().assemble(this.getTree()),
				this.getContext().pop());
	},
	upmost: function () {
	    var loc = this;
	    while (!loc.isTop()) { loc = loc.up(); }
	},
	modify: function (transform) { 
	    return new Location(transform(this.getTree()), this.getContext());
	}
    });   
})(jQuery);
    
	    
    
    