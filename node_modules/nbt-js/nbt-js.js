/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *\
 * Types                                                                       *
\* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var typeFields =
	['name'     , 'structure', 'format'  , 'size'];
	
var types = exports.types =
[
	['end'      , null       , null      , null  ],
	['byte'     , 'word'     , 'Int8'    , 1     ],
	['short'    , 'word'     , 'Int16BE' , 2     ],
	['int'      , 'word'     , 'Int32BE' , 4     ],
	['long'     , 'list'     , 'int'     , 2     ],
	['float'    , 'word'     , 'FloatBE' , 4     ],
	['double'   , 'word'     , 'DoubleBE', 8     ],
	['byteArray', 'list'     , 'byte'    , null  ],
	['string'   , null       , null      , null  ],
	['list'     , 'list'     , null      , null  ],
	['compound' , null       , null      , null  ],
	['intArray' , 'list'     , 'int'     , null  ]
];

types.forEach(function(typeData, typeIndex)
{
	var type = { value: typeIndex };
	typeFields.forEach(function(propertyName, propertyIndex)
	{
		type[propertyName] = typeData[propertyIndex];
	});
	types[type.value] = types[type.name] = type;
});

types.fromSchema = function(schema)
{
	return typeof schema === 'string' ? types[schema] :
		(Array.isArray(schema) ? types.list : types.compound);
};

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *\
 * Reader                                                                      *
\* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var Reader = exports.Reader = function(buffer)
{
	this.buffer = buffer;
	this.offset = 0;
};

function read(reader, object)
{
	var type = types[reader.byte().payload];
	if (type !== types.end)
	{
		var name = reader.string().payload;
		var result = reader[type.name]();
		object.schema[name] = result.schema;
		object.payload[name] = result.payload;
	}
	return type;
}

types.forEach(function(type)
{
	switch(type.structure)
	{
		case 'word':
			Reader.prototype[type.name] = function()
			{
				var word = this.buffer['read' + type.format](this.offset);
				this.offset += type.size;
				return { schema: type.name, payload: word };
			};
			break;
		case 'list':
			var isList = type === types.list;
			Reader.prototype[type.name] = function()
			{
				var typeName = type.format || types[this.byte().payload].name;
				var result = { schema: isList ? [ typeName ] : type.name, payload: [] };
				var length = type.size || this.int().payload;
				for (var i = 0; i < length; i++)
				{
					var element = this[typeName]();
					if (isList) { result.schema = [ element.schema ]; }
					result.payload.push(element.payload);
				}
				return result;
			};
			break;
	}
});

Reader.prototype[types.string.name] = function()
{
	var length = this.short().payload;
	return new Object
	({
		schema: types.string.name,
		payload: this.buffer.toString('utf8', this.offset, this.offset += length)
	});
};

Reader.prototype[types.compound.name] = function()
{
	var result = { schema: {}, payload: {} };
	while (read(this, result) !== types.end);
	return result;
};

exports.read = function(buffer)
{
	var result = { schema: {}, payload: {} };
	read(new Reader(buffer), result);
	return result;
};

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *\
 * Writer                                                                      *
\* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var write = exports.write = function()
{
	return write[types.compound.name].apply(this, arguments);
};

types.forEach(function(type)
{
	switch(type.structure)
	{
		case 'word':
			write[type.name] = function(value)
			{
				var buffer = new Buffer(type.size);
				buffer['write' + type.format](value);
				return buffer;
			};
			break;
		case 'list':
			var isList = type === types.list;
			write[type.name] = function(value, schema)
			{
				var typeName = isList ? types.fromSchema(schema[0]).name : types[schema].format;
				var buffers = [];
				if (isList) { buffers.push(write.byte(types[typeName].value)); }
				if (!type.size) { buffers.push(write.int(value.length)); }
				value.forEach(function(element)
				{
					buffers.push(write[typeName](element, schema[0]));
				});
				return Buffer.concat(buffers);
			};
			break;
	}
});

write[types.string.name] = function(value)
{
	var buffer = new Buffer(value, 'utf8');
	return Buffer.concat([write.short(buffer.length), buffer]);
};

write[types.compound.name] = function(value, schema)
{
	var buffers = [];
	for (var name in value)
	{
		var type = types.fromSchema(schema[name]);
		buffers.push(write.byte(type.value));
		buffers.push(write.string(name));
		buffers.push(write[type.name](value[name], schema[name]));
	}
	buffers.push(write.byte(types.end.value));
	return Buffer.concat(buffers);
};