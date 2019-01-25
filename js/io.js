var app		   = require('electron').remote,
	fs			= require('fs'),
	nativeImage   = require('electron').nativeImage,
	exec		  = require('child_process').exec,
	originalFs	= require('original-fs'),
	http		  = require('http'),
	nbt		   = require('nbt-js'),
	zlib		  = require('zlib'),
	currentwindow = app.getCurrentWindow(),
	latest_version= false,
	preventClosing= true;
const shell = require('electron').shell;
const {clipboard} = require('electron')
var cwin = app.getCurrentWindow()


function importText(type, cb) {
	type = type.replace('.', '')
	app.dialog.showOpenDialog(cwin, {filters: [{name: type, extensions: [type]}]}, function (fileNames) {
		if (fileNames !== undefined) {
			fs.readFile(fileNames[0], 'utf-8', function (err, data) {
				if (err) {
					console.log(err)
					return;
				}
				cb(data, fileNames[0])
			})
		}
	})
}
function importStructure() {
	app.dialog.showOpenDialog(cwin, {filters: [{extensions: ['dat', 'nbt']}]}, function (fileNames) {
		if (fileNames !== undefined) {
			var data = zlib.gunzipSync(fs.readFileSync(fileNames[0]))
			data = nbt.read(data).payload[""]
			buildStructureBackground(data.blocks, data.palette, pathToName(fileNames[0]))
		}
	})
}

function exportText(content, name, type) {
	type = type.replace('.', '')
	app.dialog.showSaveDialog(cwin, {
		filters: [ {
			name: type,
			extensions: [type]
		} ],
		defaultPath: name
	}, function (fileName) {
		if (fileName === undefined) {
			return;
		}
		fs.writeFile(fileName, content, function (err) {
			if (err) {
				console.log('Error Exporting File: '+err)
			}
		})
	})
}


function saveProject() {
	exportText(autoStringify(getProjectJSON()), Prop.name, 'ani')
}




function getProjectJSON() {
	var file = {
		name: Prop.name,
		elements: [],
		items: []
	}
	Elements.forEach(function(E, Ei) {
		var el = {
			name: E.name,
			frames: {},
			type: E.type
		}
		if (E.children && E.children.length > 0) {
			el.children = []
			E.children.forEach(function(A, Ai) {
				var AS = {
					name: A.name,
					frames: {}
				}
				forKeyIn(A.keyframes.frames, function(F, key) {
					var frame = $.extend(true, {}, F)
					if (frame.item) {
						frame.item = Items.indexOf(frame.item)
					}
					AS.frames[key] = frame
				})
				el.children.push(AS)
			})
		if (E.type === 'npc' || E.type === 'camera')
			forKeyIn(E.keyframes.frames, function(F, key) {
				var frame = $.extend(true, {}, F)
				el.frames[key] = frame
			})

		} else if (E.type === 'framedata') {

			forKeyIn(E.keyframes.frames, function(F, key) {
				var data = {}
				F.data.forEach(function(L) {
					data.push(L)
				})
				el.frames[key] = data
			})
		}
		file.elements.push(el)
	})
	Items.forEach(function(I, Ii) {
		var item = {
			damage: I.damage,
			id: I.id,
			modelname: I.modelname,
			modelpath: I.modelpath,
			name: I.name
		}
		file.items.push(item)
	})
	return file
}

function parseProjectJSON(data) {
	Prop.name = data.name

	if (data.items) {
		Items.length = 0
		data.items.forEach(function(I, Ii) {
			var item = new Item({
				damage: I.damage,
				id: I.id,
				modelname: I.modelname,
				modelpath: I.modelpath,
				name: I.name
			})
			Items.push(item)

			fs.readFile(I.modelpath, 'utf-8', function (err, data) {
				item.model.generateModel(data, I.modelpath)
			})

		})
	}
	if (data.elements) {
		Elements.length = 0
		data.elements.forEach(function(E, Ei) {
			if (E.type === 'camera') {

				forKeyIn(camera.keyframes.frames, function(a, key) {
					delete camera.keyframes.frames[key]
				})
				forKeyIn(E.frames, function(a, key) {
					camera.keyframes.frames[key] = a
				})

			} else if (E.type === 'npc') {
				var el = new NPC(0)
				el.name = E.name
				el.length

				forKeyIn(E.frames, function(F, key) {
					el.keyframes.frames[key] = F.data
				})
				E.children.forEach(function(A, Ai) {
					var AS = new ArmorStand(A.name, el)
					forKeyIn(A.frames, function(F, key) {
						AS.keyframes.frames[key] = F
						if (F.item !== undefined && Items[F.item]) {
							F.item = Items[F.item]
						}
						console.log(F)
					})
					el.children.push(AS)
				})
				Elements.push(el)

			} else if (E.type === 'framedata') {

				var el = new FrameData()
				forKeyIn(E.frames, function(F, key) {
					el.keyframes.frames[key] = F.data
				})
				Elements.push(el)
			}
		})
	}
	displayFrame(0)
}

function exportCharacter() {
	if (selected.type === 'npc') {
		var E = selected
	} else {return;}

	var char = {
		name: E.name,
		bones: []
	}
	E.children.forEach(function(A, i) {
		var bone = {}
		var frameData = A.keyframes.calcFrame(timeline.frame)
		bone.name = A.name
		bone.x = frameData.x
		bone.y = frameData.y
		bone.z = frameData.z
		bone.rx = frameData.rot.x
		bone.ry = frameData.rot.y
		bone.rz = frameData.rot.z
		if (frameData.item) {
			bone.item = {
				id: frameData.item.id,
				damage: frameData.item.damage,
				name: frameData.item.name,
				modelname: frameData.item.modelname,
				modelpath: frameData.item.modelpath,
			}
		}

		char.bones.push(bone)
	})

	exportText(JSON.stringify(char), Prop.name, 'char')
}
function importCharacter() {
	importText('char', function(data) {
		data = JSON.parse(data)
		var char = new NPC()
		char.children = []
		data.bones.forEach(function(b, i) {
			var A = new ArmorStand(b.name, char)
			A.keyframes.frames[0] = {
				x:  b.x,
				y:  b.y,
				z:  b.z,
				rot: new THREE.Euler(b.rx,b.ry,b.rz)
			}
			if (b.item) {
				var item;
				var i = 0
				while (i < Items.length) {
					if (
						Items[i].id === b.item.id &&
						Items[i].damage === b.item.damage &&
						Items[i].modelpath === b.item.modelpath
					) {
						item = Items[i]
					}
					i++;
				}
				if (!item) {
					var item = new Item()
					var content = fs.readFileSync(b.item.modelpath, {encoding: 'utf-8'})
					item.model.generateModel(content, b.item.modelpath)
					item.modelname = b.item.modelname
					item.modelpath = b.item.modelpath
					item.id = b.item.id
					item.damage = b.item.damage
					item.name = b.item.name
					Items.push(item)
				}

				A.keyframes.frames[0].item = item
			}
			char.children.push(A)
		})
		var exists = false
		Elements.forEach(function(E, Ei) {
			if (E.name === data.name) {
				data.name += ' (1)'
			}
		})
		char.name = data.name
		Elements.push(char)
		timeline.update()
		displayFrame()
	})
}