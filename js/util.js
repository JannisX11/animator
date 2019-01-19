var asyncLoop = function(o){
		var i=-1;

		var async_loop = function(){
				i++;
				if(i==o.length){o.callback(); return;}
				o.functionToLoop(async_loop, i);
		} 
		async_loop();//init
}
function pathToName(path, extension) {
	var path_array = path.split('/').join('\\').split('\\')
	if (extension) {
		return path_array[path_array.length-1]
	} else {
		return path_array[path_array.length-1].split('.').slice(0, -1).join('.')
	}
}

if(Array.prototype.equals)
		console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
Array.prototype.equals = function (array) {
		if (!array)
				return false;

		if (this.length != array.length)
				return false;

		for (var i = 0, l=this.length; i < l; i++) {
				if (this[i] instanceof Array && array[i] instanceof Array) {
						if (!this[i].equals(array[i]))
								return false;			 
				}					 
				else if (this[i] != array[i]) { 
						return false;	 
				}					 
		}			 
		return true;
}
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

function omitKeys(obj, keys, dual_level) {
		var dup = {};
		for (key in obj) {
				if (keys.indexOf(key) == -1) {
						if (dual_level === true && typeof obj[key] === 'object') {
							dup[key] = {}
							for (key2 in obj[key]) {
									if (keys.indexOf(key2) == -1) {
											dup[key][key2] = obj[key][key2];
									}
							}
						} else {

							dup[key] = obj[key];
						}
				}
		}
		return dup;
}
function stringify (obj, options) {
	options = options || {}
	var indent = JSON.stringify([1], null, get(options, 'indent', 2)).slice(2, -3)
	var maxLength = (indent === '' ? Infinity : get(options, 'maxLength', 80))

	return (function _stringify (obj, currentIndent, reserved) {
		if (obj && typeof obj.toJSON === 'function') {
			obj = obj.toJSON()
		}

		var string = JSON.stringify(obj)

		if (string === undefined) {
			return string
		}

		var length = maxLength - currentIndent.length - reserved

		if (string.length <= length) {
			var prettified = prettify(string)
			if (prettified.length <= length) {
				return prettified
			}
		}

		if (typeof obj === 'object' && obj !== null) {
			var nextIndent = currentIndent + indent
			var items = []
			var delimiters
			var comma = function (array, index) {
				return (index === array.length - 1 ? 0 : 1)
			}

			if (Array.isArray(obj)) {
				for (var index = 0; index < obj.length; index++) {
					items.push(
						_stringify(obj[index], nextIndent, comma(obj, index)) || 'null'
					)
				}
				delimiters = '[]'
			} else {
				Object.keys(obj).forEach(function (key, index, array) {
					var keyPart = JSON.stringify(key) + ': '
					var value = _stringify(obj[key], nextIndent,
																 keyPart.length + comma(array, index))
					if (value !== undefined) {
						items.push(keyPart + value)
					}
				})
				delimiters = '{}'
			}

			if (items.length > 0) {
				return [
					delimiters[0],
					indent + items.join(',\n' + nextIndent),
					delimiters[1]
				].join('\n' + currentIndent)
			}
		}

		return string
	}(obj, '', 0))
}
var stringOrChar = /("(?:[^"]|\\.)*")|[:,]/g
function prettify (string) {
	return string.replace(stringOrChar, function (match, string) {
		return string ? match : match + ' '
	})
}
function capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
}

function get (options, name, defaultValue) {
	return (name in options ? options[name] : defaultValue)
}
function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}
function compareKeys(event, action) {
		if (action.code === event.which) {
				if (action.ctrl === event.ctrlKey) {
						if (action.shift === event.shiftKey) {
							if (action.alt === event.altKey) {
									event.preventDefault()
									return true;
							} else {
									return false;
							}
						} else {
								return false;
						}
				} else {
						return false;
				}
		} else {
				return false;
		}
}
function getAverageRGB(imgEl) {
		
		var blockSize = 5, // only visit every 5 pixels
				defaultRGB = {r:0,g:0,b:0}, // for non-supporting envs
				canvas = document.createElement('canvas'),
				context = canvas.getContext && canvas.getContext('2d'),
				data, width, height,
				i = -4,
				length,
				rgb = {r:0,g:0,b:0},
				count = 0;
				
		if (!context) {
				return defaultRGB;
		}
		
		height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
		width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;
		
		context.drawImage(imgEl, 0, 0);
		
		try {
				data = context.getImageData(0, 0, width, height);
		} catch(e) {
				/* security error, img on diff domain */alert('x');
				return defaultRGB;
		}
		
		length = data.data.length;
		
		while ( (i += blockSize * 4) < length ) {
				++count;
				rgb.r += data.data[i];
				rgb.g += data.data[i+1];
				rgb.b += data.data[i+2];
		}
		
		// ~~ used to floor values
		rgb.r = ~~(rgb.r/count);
		rgb.g = ~~(rgb.g/count);
		rgb.b = ~~(rgb.b/count);
		
		return rgb;	
}

function autoStringify(object) {
	if (false) {
			return JSON.stringify(object)
	} else {
			return stringify(object, {indent: '\t', maxLength: 60})
	}
}

function pluralS(arr) {
	if (arr.length > 1) {
		return 's';
	} else {
		return '';
	}
}

function getAxisLetter(number) {
	switch (number) {
		case 0: return 'x'; break;
		case 1: return 'y'; break;
		case 2: return 'z'; break;
	}
}
function getAxisNumber(letter) {
	switch (letter.toLowerCase()) {
		case 'x': return 0; break;
		case 'y': return 1; break;
		case 'z': return 2; break;
	}
}
function limitNumber(number, min, max) {
	if (number > max) number = max;
	if (number < min) number = min;
	return number;
}
function getSnapFactor(event) {
	if (event.shiftKey) {
		return canvas_grid / 4;
	} else if (event.ctrlKey) {
		return canvas_grid / 10;
	} else {
		return canvas_grid;
	}
}
function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}
function degreeToRad(deg) {
	return Math.PI / (180 / deg)
}
function radToDegree(rad) {
	return (rad * 180) / Math.PI
}
function forKeyIn(object, cb) {
		for (var key in object) {
				if (object.hasOwnProperty(key)) {
						cb(object[key], key)
				}
		}
}



$.ui.plugin.add("draggable", "alsoDrag", {
	start: function() {
		var that = $(this).data("ui-draggable"),
			o = that.options,
			_store = function (exp) {
				$(exp).each(function() {
					var el = $(this);
					el.data("ui-draggable-alsoDrag", {
						top: parseInt(el.css("top"), 10),
						left: parseInt(el.css("left"), 10)
					});
				});
			};

		if (typeof(o.alsoDrag) === "object" && !o.alsoDrag.parentNode) {
			if (o.alsoDrag.length) { o.alsoDrag = o.alsoDrag[0]; _store(o.alsoDrag); }
			else { $.each(o.alsoDrag, function (exp) { _store(exp); }); }
		}else{
			_store(o.alsoDrag);
		}
	},
	drag: function () {
		var that = $(this).data("ui-draggable"),
			o = that.options,
			os = that.originalSize,
			op = that.originalPosition,
			delta = {
				top: (that.position.top - op.top) || 0, 
				left: (that.position.left - op.left) || 0
			},

			_alsoDrag = function (exp, c) {
				$(exp).each(function() {
					var el = $(this), start = $(this).data("ui-draggable-alsoDrag"), style = {},
						css = ["top", "left"];

					$.each(css, function (i, prop) {
						var sum = (start[prop]||0) + (delta[prop]||0);
						style[prop] = sum || null;
					});

					el.css(style);
				});
			};

		if (typeof(o.alsoDrag) === "object" && !o.alsoDrag.nodeType) {
			$.each(o.alsoDrag, function (exp, c) { _alsoDrag(exp, c); });
		}else{
			_alsoDrag(o.alsoDrag);
		}
	},
	stop: function() {
		$(this).removeData("draggable-alsoDrag");
	}
});