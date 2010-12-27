(function ($) { 
    function makeTestDiv() {
	var div = $(document.createElement("div")).css("display", "none")
                  .css("height", "200px").css("width", "500px");
	return div.windowManager();
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
	    var wm = makeTestDiv();
	});
    });
})(jQuery);
     
	    