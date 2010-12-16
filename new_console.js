(function ($) {
    function createElem(tag, ctxt) { 
	return $((ctxt || document).createElement(tag));
    }

    function noop() {}
    
    function htmlesc(str) { 
	return str.replace(/&/g, "&amp;")
	          .replace(/</g, "&lt;")
	          .replace(/>/g, "&gt;")
	          .replace(/"/g, "&quot;")
	          .replace(/'/g, "&#146;")
	          .replace(/ /g, "&nbsp");
    }
    
    function regexp_escape(str) { 
	return str.replace(/[\][.?*+{}()^\\$]/g, "\\$&");
    }

    function make_breakable(str) {
	var outp = [];
	function split_up(str, escape_func) { 
	    var out = [];
	    escape_func = escape_func || htmlesc;
	    for (var j = 0; j <= str.length / 8; j++) {
		out.push(escape_func(str.substring(j * 8, Math.min(j * 8 + 8, str.length))));
	    }
	    return out;
	}
	    
	var i = 0;
	while (i < str.length) { 
	    var m = /^\s*/.exec(str.substring(i));
	    if (m) {
		outp = outp.concat(split_up(str.substring(i, i + m[0].length), 
					    function (str) { 
						return str.replace(/ /g, "&nbsp;"); 
					    }));
		i += m[0].length;
	    }

	    var m = /^[^\s]*/.exec(str.substring(i));
	    if (m) {
		var substr = str.substring(i, i + m[0].length);
		outp = outp.concat(split_up(substr));
		i += m[0].length;
	    }
	}
	
	return outp.join("<wbr />");
    }
    
    function isprintable(c) { 
	return /^[^\x00-\x1F]/.test(c);
    }

    function isspace(c) {
	return /^\s/.test(c);
    }

    function isword(c) { 
	return /^\w/.test(c);
    }
    
    function SearchPointer(wheel_pointer) { 
	this.wheel_pointer = wheel_pointer;
	this.idx = this.wheel_pointer.size();
    }
    
    SearchPointer.prototype = {
	traverse: function (search_term, traverse_method) {

	    var nr = this.wheel_pointer.size();
	    while (nr-- > 0) {
		this.wheel_pointer[traverse_method]();
		if (search_term.test(this.wheel_pointer.getElem())) {
		    return true;
		}
	    }
	    return false;
	},
	getElem: function () { 
	    return this.wheel_pointer.getElem();
	},
	goBack: function (search_term) {
	    return this.traverse(search_term, 'goBack');
	},
	goForward: function (search_term) { 
	    return this.traverse(search_term, 'goForward');
	}
    }
	
    function ModifiableSpinningWheelPointer(wheel) {
	this.wheel = wheel;
	this.idx = wheel.size() - 1;
	this.sparse_wheel = [];
	this.pushes = 0;
    }

    ModifiableSpinningWheelPointer.prototype = {
	size: function () { return this.wheel.size() + this.pushes;; },
	hasElem: function () { return this.size() > 0; },
	getElem: function () { 
	    if (this.sparse_wheel.hasOwnProperty(this.idx)) { 
		return this.sparse_wheel[this.idx];
	    } else {
		return this.wheel.getIdx(this.idx);
	    }
	},
	goBack: function () { 
	    this.idx--;
	    if (this.idx < 0) this.idx = this.size() - 1;
	},
	goForward: function () { 
	    this.idx++;
	    if(this.idx >= this.size()) this.idx -= this.size();
	},
	push: function (elem) { this.sparse_wheel[this.size()] = elem; this.pushes++; },
	modify: function (elem) { 
	    this.sparse_wheel[this.idx] = elem;
	}	    
    };

    function SpinningWheelPointer(wheel, additional) { 
	this.wheel = wheel;
	this.idx = wheel.size() - 1;
	this.additional = additional || [];
    }
    
    SpinningWheelPointer.prototype = {
	size: function () { return this.wheel.size() + this.additional.length; },
	hasElem: function () { return this.size() > 0; },
	getElem: function () { 
	    if (this.wheel.size() > this.idx) { 
		return this.wheel.getIdx(this.idx); 
	    } else {
		return this.additional[this.idx - this.wheel.size()];
	    }
	},
	goBack: function () { 
	    this.idx--;
	    if (this.idx < 0) this.idx = this.size() + this.idx;
	},
	goForward: function () { 
	    this.idx++;
	    if (this.idx >= this.size()) this.idx = this.idx - this.size();
	}
    };

    function SpinningWheel(max) {
	this.max = typeof max === "undefined" ? 1000 : max;
	this.container = [];
    }
    
    SpinningWheel.prototype = {
	hasMax: function () {
	    return this.max > 0;
	},
	push: function (elem) { 
	    this.container.push(elem);
	    if (this.hasMax() && this.container.length > this.max) { 
		this.container = this.container.slice(-this.max);
	    }
	},
	getPointer: function () {
	    return new SpinningWheelPointer(this); 
	},
	getModifiablePointer: function () { 
	    return new ModifiableSpinningWheelPointer(this);
	},
	getIdx: function (idx) { 
	    return this.container[idx];
	},
	size: function () {
	    return this.container.length;
	}
    };
    
    $.newHistory = function (len) { return new SpinningWheel(len || 1000); };
    
    var GLOBAL_KILLRING = new SpinningWheel(1000);

    $.getGlobalKillring = function () { 
	return GLOBAL_KILLRING;
    }

    $.fn.searchHistoryPrompt = function (userConfig) { 
	var defaultConfig = { 
	    hasFocus: function () { return true; },
	    historyPointer: (new SpinningWheel(1000)).getPointer(),
	    onStop: noop,
	    onUpdatePrompt: noop,
	    startString: ""
	};
	var promptDisplay = $(this);
	var direction = "goBack";
	var is_blinking = false;

	if (promptDisplay.length == 0) return null;
	if (promptDisplay.length != 1) {
	    throw new Error("Need one element to work with");
	}
	
	var config = $.extend({}, defaultConfig, userConfig);
	var string = config.startString;
	var searchPointer = new SearchPointer(config.historyPointer);
	
	$(document).bind('keypress', keyPress);
	$(document).bind('keydown', keyDown);
	
	updatePrompt();

	return {
	    stop: stop,
	    getString: function () { return string; }
	};

	function keyPress(e) { 
	    if (!config.hasFocus()) return true;

	    if (e.charCode && !e.ctrlKey) { 
		var new_string = string + String.fromCharCode(e.charCode);
		if(searchPointer.goBack(makeRegexp(new_string))) {
		    string = new_string;
		} else { 
		    blink();
		}
		updatePrompt();
		return false;
	    }
	    return true;
	}

	function blink () {
	    if (!is_blinking) { 
		is_blinking = true;
		promptDisplay.fadeTo(200, 0.1).fadeTo(200, 1.0, function () { 
		    config.onUpdatePrompt(); 
		    is_blinking = false 
		});
	    }
	}
	function makeRegexp(str) { 
	    return new RegExp(regexp_escape(str), "i");
	}
	
	function keyDown(e) { 
	    if(!config.hasFocus()) return true;
	    
	    if (e.keyCode && e.ctrlKey) {
		if (e.keyCode == 82) { // C-r
		    searchPointer.goBack(makeRegexp(string));
		    updatePrompt();
		    return false;
		} else if (e.keyCode == 83) { // C-s
		    searchPointer.goForward(makeRegexp(string));
		    updatePrompt();
		    return false;
		} else if (e.keyCode == 71) { // C-g
		    stop(config.startString);
		    return false;
		}
	    } else if (e.altKey && e.keyCode) {
		if (e.keyCode == 8) { 
		    string = "";
		    updatePrompt();
		    return false;
		}
	    } else if (e.keyCode) { 
		if (e.keyCode == 8) {  // backspace
		    if (string) {
			string = string.substring(0, string.length - 1);
			    updatePrompt();
			return false;
		    }
		} else if (e.keyCode == 13) { // enter
		    stop();
		}
	    }
	    return false;
	}
	
	function updatePrompt() { 
	    $(promptDisplay).empty()
		.html("Searching(" + make_breakable(string || "") + ")&gt; " + 
		      make_breakable(searchPointer.getElem() || ""));
	    config.onUpdatePrompt();
	}

	function stop(stopElem) { 
	    $(document).unbind('keypress', keyPress);
	    $(document).unbind('keydown', keyDown);
	    config.onStop(stopElem || searchPointer.getElem());
	}
    }
	
    $.fn.ajaxConsolePrompt = function (userConfig) { 
	var container = $(this);
	if (container.length == 0) return null;
	if ($(this).size() != 1) { 
	    throw new Error("Need one element in container to work");
	}
		
	var defaultConfig = {
	    prompt: '> ',
	    killring: $.getGlobalKillring(),
	    history: new SpinningWheel(1000),
	    promptExecutor: noop,
	    onUpdatePrompt: noop
	};

	var config = $.extend({}, defaultConfig, userConfig || {}), 
	    has_focus = true, alive = true,
            prompt = createElem("span").addClass("jac-prompt"), 
	    cursor_pos = 0,
	    string = "",
	    ignore_input = false;
	
	
	var ops = {
	    37: backwardChar, // left
	    39: forwardChar, // right
	    38: upHistory, // up
	    40: downHistory, // down
	    8: backDelete, //backspace
	    46: forwardDelete, //delete
	    35: moveToEnd, //end
	    36: moveToStart, //start
	    13: promptExecutor, //return
	    // 18: noop //tab
	};
	    
	var ctrlOps = {
	    65: moveToStart, // C-a
	    69: moveToEnd, // C-e
	    68: forwardDelete, // C-d
	    78: noop, // C-n
	    80: noop, // C-p
	    82: historySearch, // C-r
	    83: historySearch, // C-s
	    70: forwardChar, // C-f
	    66: backwardChar, // C-b
	    75: deleteTilEnd, // C-k
	    89: yank // C-y
	};
	
	var altOps = {
	    8: backwardDeleteWord, // M-backspace,
	    66: backwardWord, // M-b
	    70: forwardWord, // M-f
	    78: downHistory, // M-n
	    80: upHistory, // M-p
	    68: forwardDeleteWord, // M-d
	    89: nextYank // M-y
	};

	
	container.append(prompt);
	
	updatePrompt();
	$(document).bind('keydown', keyDown);
	$(document).bind('keypress', keyPress);

	return {
	    isAlive: isAlive,
	    hasFocus: hasFocus,
	    stop: stop,
	    takeFocus: function () { has_focus = true; },
	    dropFocus: function () { has_focus = false; },
	    getString: function () { return string; },
	    getCursorPos: function () { return cursor_pos; }
	};
	
	function keyDownCmd(e) { 
	    var code = e.keyCode || charcode2keycode(e.charCode);
	    
	    if (e.ctrlKey) {
		return ctrlOps[code];
	    } else if (e.altKey) { 
		return altOps[code ];
	    } else {
		return ops[code];
	    }
	}
	
	function keyDown(e) { 
	    if (!hasFocus() || !isAlive() || ignore_input) return;

	    var cmd = keyDownCmd(e);
	    if (!cmd) return;
	    
	    var res = cmd();
	    if (!res || !res.noUpdatePrompt) updatePrompt();
	    if (!res || !res.dontSetLastCommand) last_command = cmd;
	    repeat_command = false;
	    return false;
	}
	    
	function keyPress(e) { 
	    if (!hasFocus() || !isAlive() || ignore_input) return;
	    
	    if(e.charCode && !e.ctrlKey && !e.altKey) {
		var c = String.fromCharCode(e.charCode);
		addChar(c);
		last_command = null;
		return false;
	    } else { 
		var cmd = keyDownCmd(e);
		if (cmd) { 
		    if (cmd == last_command) { 
			if (repeat_command) {
			    cmd();
			    updatePrompt();
			} else { 
			    repeat_command = true;
			}
		    }
		    return false;
		}
	    }
	}

	function promptExecutor() { 
	    return config.promptExecutor(string);
	}

	function charcode2keycode(charcode) { 
	    return charcode - 32;
	}

	var last_command, repeat_command;

	var history_pointer;
	function getHistoryPointer() { 
	    if (!history_pointer) {
		history_pointer = config.history.getModifiablePointer();
		history_pointer.push(string);
		history_pointer.goForward();
	    }
	    return history_pointer;
	}

	function updateHistory() { 
	    getHistoryPointer().modify(string);
	}

	function upHistory() { 
	    updateHistory();
	    getHistoryPointer().goBack();
	    string = getHistoryPointer().getElem();
	    cursor_pos = string.length;
	}
	
	function downHistory() { 
	    updateHistory();
	    getHistoryPointer().goForward();
	    string = getHistoryPointer().getElem();
	    cursor_pos = string.length;
	}
	    
	var kill_pointer, last_yank_cursor_pos;
	    
	function yank() {
	    var kp = config.killring.getPointer();
	    if (kp.hasElem()) {
		kill_pointer = kp;
		last_yank_cursor_pos = cursor_pos;
		var to_insert = kill_pointer.getElem();
		string = string.substring(0,cursor_pos) + to_insert + string.substring(cursor_pos);
		cursor_pos += to_insert.length;
	    }
	}

	function nextYank() {
	    if (last_command != yank && last_command != nextYank || !kill_pointer || !kill_pointer.hasElem()) {
		kill_pointer = null;
		return;
	    }
	    
	    var last_insert = kill_pointer.getElem();
	    var start_string = string.substring(0, last_yank_cursor_pos),
	        end_string = string.substring(last_yank_cursor_pos + last_insert.length);
	    kill_pointer.goBack();
	    var to_insert = kill_pointer.getElem();
	    string = start_string + to_insert + end_string;
	    cursor_pos = last_yank_cursor_pos + to_insert.length;
	}

	function addToKillRing(arg) { 
	    config.killring.push(arg);
	}

	function deleteTilEnd() { 
	    if (cursor_pos < string.length) {
		addToKillRing(string.substring(cursor_pos));
	    }
	    string = string.substring(0, cursor_pos);
	}
	
	function _forwardWord(pointer) {
	    while(pointer < string.length && !isword(string.substring(pointer))) pointer++;
	    while(pointer < string.length && isword(string.substring(pointer))) pointer++;
	    return pointer;
	}

	function _backwardWord(pointer) { 
	    while (pointer > 0 && !isword(string.substring(pointer - 1))) pointer--;
	    while (pointer > 0 && isword(string.substring(pointer - 1))) pointer--;
	    return pointer;
	}

	function backwardChar() { 
	    if (cursor_pos > 0) cursor_pos--;
	}

	function forwardChar() { 
	    if (cursor_pos < string.length) cursor_pos++; 
	} 

	function forwardDeleteWord() { 
	    delete_til = _forwardWord(cursor_pos);
	    string = string.substring(0, cursor_pos) + string.substring(delete_til);
	}

	function backwardDeleteWord() { 
	    delete_til = _backwardWord(cursor_pos);
	    string = string.substring(0, delete_til) + string.substring(cursor_pos);
	    cursor_pos = delete_til;
	}

	function backDelete() { 
	    if (!string || cursor_pos == 0) return; 
	    string = string.substring(0, cursor_pos - 1) + string.substring(cursor_pos);
	    cursor_pos--;
	}

	function forwardDelete() {
	    if (!string || cursor_pos == string.length) return;
	    string = string.substring(0, cursor_pos) + string.substring(cursor_pos + 1);
	}
	
	function historySearch() {
	    ignore_input = true;
	    prompt.searchHistoryPrompt({
		historyPointer: getHistoryPointer(),
		hasFocus: hasFocus,
		onUpdatePrompt: config.onUpdatePrompt,
		onStop: function (str) { 
		    if (str) {
			string = str || "";
			cursor_pos = string.length;
		    }
		    ignore_input = false;
		    updatePrompt();
		},
		startString: string
	    });
	    return { 
		noUpdatePrompt: true,
		dontSetLastCommand: true
	    }
	}

	function forwardWord() {
	    cursor_pos = _forwardWord(cursor_pos);
	}

	function backwardWord() {
	    cursor_pos = _backwardWord(cursor_pos);
	}
	 
	function moveToEnd() { 
	    cursor_pos = string.length;
	}

	function moveToStart() { 
	    cursor_pos = 0;
	}

	function updatePrompt () { 
	    if (!isAlive()) {
		prompt.empty().append(config.prompt).append(
		    createElem("span").addClass("jac-before-cursor").html(make_breakable(string)));
	    } else if (cursor_pos >= string.length) { 
		prompt.empty()
		    .append(config.prompt)
		    .append(createElem("span").addClass("jac-before-cursor").html(make_breakable(string)))
		    .append(createElem("span").addClass("jac-cursor").html("&nbsp;&nbsp;"));
	    } else {
		var string_start = string.substring(0, cursor_pos),
         	    string_middle = string[cursor_pos],
	            string_end = string.substring(cursor_pos + 1);
		
		prompt.empty()
		    .append(config.prompt)
                    .append(createElem("span").addClass("jac-before-cursor").html(make_breakable(string_start)))
                    .append(createElem("span").addClass("jac-cursor").html(htmlesc(string_middle)))
		    .append(createElem("span").addClass("jac-after-cursor").html(make_breakable(string_end)));
	    }
	    
	    config.onUpdatePrompt();
	}
	
	function addChar(c) { 
	    string = string.substring(0, cursor_pos) + c + string.substring(cursor_pos);
	    cursor_pos += c.length;
	    updatePrompt();
	}

	function isAlive() { 
	    return alive;
	}
	
	function hasFocus() { 
	    return has_focus;
	}

	function stop() { 
	    alive = has_focus = false;
	    $(document).unbind('keypress', keyPress);
	    $(document).unbind('keydown', keyDown);
	    updatePrompt();
	}
    };	
	
    $.fn.ajaxConsole = function (userConfig) {
	var defaultConfig = { 
	    execCmd: noop
	};

	var config = $.extend({}, defaultConfig, userConfig || {}),
            container = $(this),
	    console = createElem("div").addClass("jac-inner"),
	    history = new SpinningWheel(1000),
	    promptController;

	container.empty().append(console);

	newPrompt();
	return this;

	function newPrompt() { 
	    if(promptController) {
		promptController.stop();
	    }
	    var prompt = createElem("div");
	    promptController = prompt.ajaxConsolePrompt({ 
		promptExecutor: promptExecutor,
		onUpdatePrompt: scrollToBottom,
		history: history
	    });
	    console.append(prompt);
	    scrollToBottom();
	}

	function scrollToBottom() { 
	    console.attr({scrollTop: console.attr("scrollHeight") });
	}

	function promptExecutor(line) { 
	    history.push(line);
	    newPrompt();
	}
    };

})(jQuery);