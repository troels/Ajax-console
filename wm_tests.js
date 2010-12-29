(function ($) { 
    function makeTestDiv(width, height) {
	var div = $(document.createElement("div"))
            .css("height", (height || 200) + "px").css("width", (width || 200) + "px");
	$("body").append(div);
	return [div.windowManager(), div];
    }
	
    $(function () { 
	module("test_array_extensions");
	
	test("test reduce", function () { 
	    equals([0].reduce(function () {}), 0);
	    equals([1,2].reduce(function (a,b) {return a + b; }), 3);
	    equals([0, 1].reduce(function (a,b) { return a + b; }, 1), 2);
	    equals([].reduce(function (a,b) { return a + b; }, 1), 1);
	    equals([1].reduce(function (a,b) { return a + b; }, 1), 2);
	    raises(function () { 
		[].reduce(function (a,b) {}); 
	    });
	});

	test("test_sum", function () { 
	    equals([1].sum(), 1);
	    equals([].sum(), 0);
	    equals([].sum(2), 2);
	    equals([1,2,3].sum(4), 10);
	});

	test("test make basic tree", function () {
	    var res = makeTestDiv(), wm = res[0], div = res[1], child = wm.getChild();
	    equals(wm.getWidth(), 200);
	    equals(wm.getHeight(), 200);
	    equals(child.getWidth(), 200);
	    equals(child.getHeight(), 200);
	    
	    wm.setHeight(300);
	    equals(wm.getHeight(), 300);
	    wm.setWidth(300);
	    equals(wm.getWidth(), 300);
	    equals(child.getWidth(), 300);
	    equals(child.getHeight(), 300);
	});

	test("test horizontal split", function () { 
	    var res = makeTestDiv(), wm = res[0], div = res[1], child = wm.getChild();
	    child.splitHorizontal();
	    child = wm.getChild();
	    equals(child.getNumberOfChildren(), 2);
	    equals(child.getFirstChild().getWidth(), 100);
	    equals(child.getFirstChild().getNextSibling().getWidth(), 100);
	    var p = child.getFirstChild().getPos();
	    child.resizeFromLeft(50);
	    equals(child.getFirstChild().getWidth(), 50);
	    equals(child.getFirstChild().getPos().getX(), p.getX() + 50);
	});
	    
    });
})(jQuery);
     
	    