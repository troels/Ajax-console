(function ($) { 
    $(function () { 
	module("test_array_extensions");
	
	test("test reduce", function () { 
	    equals([0].reduce(function () {}), 0);
	});
    })
});
     
	    