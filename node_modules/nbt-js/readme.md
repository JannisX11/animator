nbt-js
======

Copyright (c) 2016 Jonathan Faulch

About
-----

nbt-js is an [NBT](http://wiki.vg/NBT) parser written in JavaScript for
[Node.js](https://nodejs.org).

Usage
-----

```javascript
var fs    = require('fs');
var zlib  = require('zlib');
var nbt   = require('nbt-js');

var file  = fs.readFileSync('level.dat');
var level = zlib.gunzipSync(file);
var tag   = nbt.read(level);

console.log(JSON.stringify(tag.payload));
```

License
-------

nbt-js is licensed under the MIT License.  See license.md.