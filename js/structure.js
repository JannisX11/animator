var Outliner_buttons = {
	clear: {
		icon: ' fa fa-times'
	}
}
var keyframe_clipboard;
var freeCamera = true
var ActiveSounds = []

//Constructors
class TimelineObj {
	constructor() {
		this.scene_obj;
		this.keyframes = new Keyframes()
		this.scene_obj = new THREE.Object3D()
		this.scene_obj.rotation.reorder('ZYX')
		this.uuid = guid()
	}
	setFrame() {
		var scope = this;
		var obj = this.scene_obj
		var keyframe = {
			x: obj.position.x,
			y: obj.position.y,
			z: obj.position.z,
			rot: obj.rotation.clone()
		}
		if (this.type === 'armor_stand') {
			if (itemlist._data.currentIndex >= 0) {
				keyframe.item = Items[itemlist._data.currentIndex]
			} else {
				keyframe.item = false
			}
		}
		this.keyframes.setFrame(timeline.frame, keyframe)
		timeline.update()
	}
	render(frame) {
		if (freeCamera && this.type === 'camera') return
		var frame_data = this.keyframes.calcFrame(frame)
		var obj = this.scene_obj
		if (!frame_data) return;
		obj.position.x = frame_data.x
		obj.position.y = frame_data.y
		obj.position.z = frame_data.z
		obj.rotation.copy(frame_data.rot)
		if (this.type === 'armor_stand') {
			if (frame_data.item === false) {
				this.setItem()
				if (this === selected) {
					itemlist._data.currentIndex = -1
				}
			} else if (frame_data.item) {
				this.setItem(frame_data.item)
				if (this === selected) {
					itemlist._data.currentIndex = Items.indexOf(this.item)
				}
			}
		}
	}
	select() {
		if (selected) selected.selected = false;
		timeline.selected.length = 0
		selected = this;
		this.selected = true;
		if (this.type === 'npc' || this.type === 'armor_stand') {
			Transformer.attach(this.scene_obj)
		}
		timeline.update()
		updateSelection()
	}
} 
class Element extends TimelineObj {
	constructor() {
		super()
		//Vue
		this.title = 'Element'
		this.isEl = true
		this.icon = 'fa fa-folder'
		this.isParent = true
		this.buttons = [
			Outliner_buttons.clear
		]
		this.selected = false;
		//Main
		this.type = 'single'
		this.name = 'New Rig'
		this.children = []
		//Three
		this.scene_obj.name = 'Element'
		scene.add(this.scene_obj)
		//Animation
	}
	renderAll(frame) {
		this.render(frame)
		this.children.forEach(function(s) {
			if (s.renderAll) {
				s.renderAll(frame)
			} else {
				s.render(frame)
			}
		})
	}
	init() {
		Elements.push(this)
		this.select()
	}
	remove() {
		if (this.children) {
			this.children.forEach(function(child) {
				child.remove()
			})
		}
		scene.remove(this.scene_obj)
		Elements.remove(this)
		camera.select()
	}
}
class NPC extends Element {
	constructor(elements) {
		super()
		var scope = this
		//Vue
		this.title = 'Rig'
		this.isEl = true
		this.icon = 'fa fa-user'
		//Main
		this.type = 'npc'
		this.name = 'Rig'
		Elements.forEach(function(E, Ei) {
			if (E === scope) return
			if (E.name === scope.name) {
				scope.name += ' (1)'
			}
		})
		this.name = 'Rig'
		if (elements === 0) {
			this.children = []
		} else if (elements === 1) {
			this.children = [
				new ArmorStand('model', this)
			]
		} else {
			this.children = [
				new ArmorStand('eyes', this),
				new ArmorStand('head', this),
				new ArmorStand('torso', this),
				new ArmorStand('arm_right', this),
				new ArmorStand('arm_left', this),
				new ArmorStand('leg_right', this),
				new ArmorStand('leg_left', this)
			]
		}
		//Three
		this.gem = getGem(this)
		this.scene_obj.add(this.gem)
		var x = this.scene_obj
		this.children.forEach(function(s) {
			x.add(s.scene_obj)
		})
	}
	showContextMenu(event) {
		var scope = this;
		new ContextMenu(event, [
			{icon: 'add', name: 'Add Bone', click: function() {
				scope.children.push(new ArmorStand('new_bone', scope))
			}},
			{icon: 'save', name: 'Export', click: function() {
				scope.select()
				exportCharacter()
			}},
			{icon: 'delete', name: 'Remove', click: function() {
				scope.remove()
			}}
		])
	}
}
class Camera extends Element {
	constructor() {
		super()
		//Vue
		this.title = 'Camera'
		this.icon = 'fa fa-video-camera'
		this.isParent = false
		this.buttons = [
			Outliner_buttons.clear
		]
		//Main
		this.name = 'Camera'
		this.type = 'camera'
		this.scene_obj = cameraPers
	}
	setFrame(line) {
		var scope = this;
		var obj = this.scene_obj
		var keyframe = {
			x: obj.position.x,
			y: obj.position.y,
			z: obj.position.z,
			rot: obj.getWorldRotation(),
			tx: controls.target.x,
			ty: controls.target.y,
			tz: controls.target.z
		}
		if (this.type === 'armor_stand') {
			if (itemlist._data.currentIndex >= 0) {
				keyframe.item = Items[itemlist._data.currentIndex]
			}
		}
		this.keyframes.setFrame(timeline.frame, keyframe)
		timeline.update()
	}
	render(frame) {
		if (freeCamera && this.type === 'camera') return
		var frame_data = this.keyframes.calcFrame(frame)
		var obj = this.scene_obj
		if (!frame_data) return;

		obj.position.x = frame_data.x
		obj.position.y = frame_data.y
		obj.position.z = frame_data.z

		obj.rotation.copy(frame_data.rot)

		controls.target.x = frame_data.tx ? frame_data.tx : 0 
		controls.target.y = frame_data.ty ? frame_data.ty : 0 
		controls.target.z = frame_data.tz ? frame_data.tz : 0 

		if (this.type === 'armor_stand' && frame_data.item) {
			this.setItem(frame_data.item)
			if (this === selected) {
				itemlist._data.currentIndex = Items.indexOf(this.item)
			}
		}
	}
	showContextMenu() {

	}
}
class FrameData extends Element {
	constructor() {
		super()
		//Vue
		this.title = 'FrameData'
		this.icon = 'fa fa-list-ul'
		this.isParent = false
		this.buttons = [
			Outliner_buttons.clear
		]
		//Main
		this.name = 'FrameData'
		this.type = 'framedata'
		this.scene_obj = undefined
		this.keyframes
	}
	showContextMenu(event) {
		var scope = this;
		new ContextMenu(event, [
			{icon: 'format_italic', name: 'Edit Current Frame', click: function() {
				scope.select()
				scope.setFrame()
			}},
			{icon: 'clear', name: 'Clear', click: function() {
				scope.keyframes.frames.length = 0
				scope.select()
			}}
		])
	}
	setFrame() {
		var scope = this;
		Frame_data = this;
		
		showDialog('frame_data')
		var list = $('#frame_data_list')
		list.html('')
		if (this.keyframes.frames[timeline.frame] && this.keyframes.frames[timeline.frame].data ) {} else {
			this.keyframes.frames[timeline.frame] = {data: []}
		}
		this.keyframes.frames[timeline.frame].data.forEach(function(s, i) {
			var entry = $('<li></li>')
			if (s.type === 'command') {
				entry.addClass('command_data')
				entry.append('<i class="material-icons f_left">flash_on</i>')
				entry.append('<input type="text" class="dark_bordered" value="'+s.value+'">')
			} else {
				entry.addClass('sound_data')
				entry.append('<i class="material-icons f_left">audiotrack</i>')
				entry.append('<div class="sound_data_name">'+s.name+'</div>')
				entry.append('<div class="tool f_left" onclick="Frame_data.soundDialog(this)"><i class="fa fa_big fa-file-audio-o"></i><div class="tooltip">File</div></div>')
				entry.append('<input type="text" class="audio_path hidden" value="'+s.value+'">')
			}
			entry.append('<div class="tool f_right" onclick="Frame_data.deleteEntry(this)"><i class="material-icons">delete</i><div class="tooltip">Delete</div></div>')
			list.append(entry)
		})
		timeline.update()
	}
	addCommand() {
		var entry = $('<li></li>')
		entry.addClass('command_data')
		entry.append('<i class="material-icons f_left">flash_on</i>')
		entry.append('<input type="text" class="dark_bordered" value="">')
		entry.append('<div class="tool f_right" onclick="Frame_data.deleteEntry(this)"><i class="material-icons">delete</i><div class="tooltip">Delete</div></div>')
		$('#frame_data_list').append(entry)
	}
	addSound() {
		var entry = $('<li></li>')
		entry.addClass('sound_data')
		entry.append('<i class="material-icons f_left">audiotrack</i>')
		entry.append('<div class="sound_data_name"></div>')
		entry.append('<div class="tool f_right" onclick="Frame_data.deleteEntry(this)"><i class="material-icons">delete</i><div class="tooltip">Delete</div></div>')
		entry.append('<div class="tool f_right" onclick="Frame_data.soundDialog(this)"><i class="fa fa_big fa-file-audio-o"></i><div class="tooltip">File</div></div>')
		entry.append('<input type="text" class="audio_path hidden" value="">')

		$('#frame_data_list').append(entry)
	}
	saveFrameData() {
		var scope = this;
		var line;
		timeline.lines.forEach(function(s) {
			if (s.object === scope) {
				line = s
			}
		})
		if (line === undefined) return;

		var list = $('#frame_data_list')
		var data = this.keyframes.frames[timeline.frame].data
		data.length = 0
		$('#frame_data_list > li').each(function(i, s) {
			if ($(s).hasClass('command_data')) {
				data.push({
					type: 'command',
					value: $(s).find('input').val()
				})
			} else if ($(s).hasClass('sound_data')) {
				data.push({
					type: 'sound',
					value: $(s).find('.audio_path').val(),
					name:  $(s).find('.sound_data_name').text()
				})
			}
		})
		if ($('#frame_data_list > li').length) {
			Frame_data.setFrame()
		}
		hideDialog()
	}
	renderAll(frame) {
		if (!this.keyframes.frames[frame]) return;
		this.keyframes.frames[frame].data.forEach(function(s, i) {
			if (s.type === 'sound') {
				var sound = new Audio(s.value)
				ActiveSounds.push(sound)
				sound.volume = Player.volume
				sound.onended = function() {
					var index = ActiveSounds.indexOf(this)
					if (index === -1) return;
					ActiveSounds.splice(index, 1)
				}
				sound.play()
			}
		})
	}
	select() {
		if (selected) selected.selected = false;
		selected = this;
		this.selected = true;
		timeline.update()
		updateSelection()
	}
	soundDialog(obj) {
		var jqel = $(obj).parent()
		app.dialog.showOpenDialog(app.getCurrentWindow(), {filters: [{name: 'Sounds', extensions: ['wav', 'wave', 'mp3', 'ogg']}]}, function (fileNames) {
			if (fileNames !== undefined) {
				jqel.find('.audio_path').val(fileNames[0])
				jqel.find('.sound_data_name').text(pathToName(fileNames[0], true))
			}
		})
	}
	deleteEntry(obj) {
		var jqel = $(obj).parent()
		jqel.remove()
	}
}
class ArmorStand extends TimelineObj {
	constructor(name, parent) {
		super()
		//Vue
		this.title = 'Rig'
		this.icon = 'fa fa-male'
		this.selected = false;
		this.buttons = [
		]
		//Main
		this.name = name ? name : 'Armor Stand'
		this.type = 'armor_stand'
		this.parent = parent
		this.parent.scene_obj.add(this.scene_obj)
		this.uuid = guid()
	}
	setItem(item) {
		this.item = item
		this.scene_obj.children = []
		if (item) {
			this.scene_obj.add(item.scene_obj.clone())
		}
	}
	showContextMenu(event) {
		var scope = this;
		new ContextMenu(event, [
			{icon: 'delete', name: 'Remove', click: function() {
				scope.remove()
			}}
		])
	}
	remove() {
		if (this.parent) {
			this.parent.children.remove(this)
			this.parent.select()
		}
		scene.remove(this.scene_obj)
	}
}
class Item {
	constructor(data) {
		//info
		this.type = 'item'
		this.name = 'Item'
		this.id = ''
		this.damage = 0
		this.modelname = ''
		//Main
		this.scene_obj = new THREE.Object3D()
		this.model = new Model()
		this.scene_obj.add(this.model.scene_obj)

		this.scene_obj.scale.set(0.0390625, 0.0390625, 0.0390625)
		this.scene_obj.rotation.y = Math.PI
		this.scene_obj.position.set(0, .25, 0)
		if (data) {
			$.extend(this, data)
		}
	}
	loadModel() {
		var scope = this;
		importText('json', function(s, p) {
			scope.model.generateModel(s, p)
			scope.modelname = pathToName(p, true)
			scope.modelpath = p
		})
		return this;
	}
	select() {
		if (selected && selected.type === 'armor_stand') {
			if (Items.indexOf(this) === itemlist._data.currentIndex) {
				itemlist._data.currentIndex = -1
			} else {
				itemlist._data.currentIndex = Items.indexOf(this)
			}
			selected.setFrame()
			displayFrame()
		}
		return this;
	}
	remove() {
		var scope = this;
		Items.remove(scope)
		Elements.forEach(E => {
			E.children.forEach(AS => {
				if (AS.keyframes.frames) {
					for (var index in AS.keyframes.frames) {
						var kf = AS.keyframes.frames[index]
						if (kf.item === scope) {
							kf.item = false;
						}
					}
				}
				if (AS.item === scope) {
					AS.item = false;
				}
			})
		})
		displayFrame(timeline.frame)
	}
	showContextMenu(event) {
		var scope = this;
		new ContextMenu(event, [
			{icon: 'add', name: 'Load Model', click: function() {
				scope.loadModel()
			}},
			{icon: 'delete', name: 'Remove', click: function() {
				scope.remove()
			}}
		])
	}
}
class Cube {
	constructor() {
		this.from = [0, 0, 0];
		this.to = [1, 1, 1];
		this.faces = {
			north: {uv: [0, 0, 1, 1] },
			east: {uv: [0, 0, 1, 1] },
			south: {uv: [0, 0, 1, 1] },
			west: {uv: [0, 0, 1, 1] },
			up: {uv: [0, 0, 1, 1] },
			down: {uv: [0, 0, 1, 1] }
		}
	}
}
class Texture {
	constructor(defaultpath, path, id) {
		this.id = id;
		this.material;
		this.path = defaultpath+'/textures/'+path+'.png'
	}
	load() {
		var thisTexture = this

		if (thisTexture.material !== undefined) {
			thisTexture.material.dispose()
			delete thisTexture.material
		}
		var img = thisTexture.img = new Image()

		img.src = thisTexture.path
		img.onerror = function() {
			this.src = 'assets/missing.png'
		}

		var tex = new THREE.Texture(img)
		img.tex = tex;
		img.tex.magFilter = THREE.NearestFilter
		img.tex.minFilter = THREE.LinearMipMapLinearFilter
		img.onload = function() {
			this.tex.needsUpdate = true;
			thisTexture.res = img.naturalWidth;
			thisTexture.average_color = getAverageRGB(this)
		}
		thisTexture.material = new THREE.MeshLambertMaterial({color: 0xffffff, map: tex, transparent: true});
		return this;
	}
}
var frame_limit = 1000
class Keyframes {
	constructor() {
		this.name = ''
		this.frames = {}
	}
	setFrame(frame, value) {
		if (value.mode) {
			//Nothing
		} else if (this.frames[frame] && this.frames[frame].mode) {
			value.mode = this.frames[frame].mode
		} else {
			value.mode = 'linear'
		} 
		this.frames[frame] = value
	}
	calcFrame(frame) {
		if (this.frames[frame] !== undefined) {
			return this.frames[frame]
		} else {
			//Interpolate
			var i = frame
			var previous_frame;
			var next_frame;
			while (i >= 0) {
				if (this.frames[i] !== undefined) {
					previous_frame = i
					i = -1
				}
				i--;
			}
			i = frame
			while (i <= frame_limit) {
				if (this.frames[i] !== undefined) {
					next_frame = i
					i = 10e11
				}
				i++;
			}
			if (previous_frame === undefined && next_frame === undefined) {
				return {x: 0, y: 0, z: 0, rot: new THREE.Euler()}
			} else if (previous_frame === undefined) {
				return this.frames[next_frame]
			} else if (next_frame === undefined) {
				return this.frames[previous_frame]
			} else {
				//In the Middle
				var result = {}
				var pre  = this.frames[previous_frame]
				var post = this.frames[next_frame]

				var factor = (frame - previous_frame) / (next_frame - previous_frame)

				if (( factor < 0.5 && (pre.mode  === 'ease_in'  || pre.mode  === 'ease') ) ||
					( factor > 0.5 && (post.mode === 'ease_out' || post.mode === 'ease') )) {
					factor = Math.sin( (factor-0.5) * (Math.PI) )
					factor = factor/2 + 0.5
				}



				for (var key in pre) {
					if (pre.hasOwnProperty(key) === true && key !== 'rot') {
						if (typeof pre[key] === 'number') {
							result[key] = pre[key] + (post[key] - pre[key]) * factor
						} else {
							result[key] = pre[key]
						}
					}
				}
				if (pre.rot) {
					var quat_pre = new THREE.Quaternion().setFromEuler(pre.rot)
					var quat_post = new THREE.Quaternion().setFromEuler(post.rot)
					quat_pre.slerp(quat_post, factor)
					result.rot = new THREE.Euler().setFromQuaternion(quat_pre, 'ZYX')
				}
				return result;
			}
		}
	}
	getRange() {
		if (this.getKeyframeCount() < 2) {
			//return [this.]
		}
	}
	getKeyframeIndexes() {
		n = []
		for (var key in this.frames) {
			if (this.frames.hasOwnProperty(key)) {
				n.push(key)
			}
		}
		return n;
	}
	hasFrame(frame) {
		return 
	}
	copyFrame(frame) {
		keyframe_clipboard = this.frames[frame]
	}
}

class Model {
	constructor(ast) {
		this.scene_obj = new THREE.Object3D()
		this.armor_stand = ast
	}
	generateModel(rawJson, path) {
		var scope = this;
		var data = JSON.parse(rawJson)
		scope.elements = []
		scope.textures = {}
		scope.scene_obj.children = []

		//Texture Path
		var tex_arr = path.split('/').join('\\').split('\\')


		//Create Path Array to fetch textures
		var path_arr = path.split(osfs)
		var base_path = []
		var i = 0;
		while (i < path_arr.length) {
			if (path_arr[i] === 'models') {
				i = path_arr.length
			} else {
				base_path.push(path_arr[i])
			}
			i++;
		}
		base_path = base_path.join('/')



		function fetchMaterial(face) {
			if (!face || !face.texture) {
				return emptyMaterial;
			}
			var key = face.texture.substr(1);
			if (scope.textures[key]) {
				return scope.textures[key].material;
			} else {
				return emptyMaterial;
			}
		}
		function getUVArray(side) {
			var arr = [
				new THREE.Vector2(side.uv[0]/16, (16-side.uv[1])/16),  //0,1
				new THREE.Vector2(side.uv[0]/16, (16-side.uv[3])/16),  //0,0
				new THREE.Vector2(side.uv[2]/16, (16-side.uv[3])/16),   //1,0
				new THREE.Vector2(side.uv[2]/16, (16-side.uv[1])/16)  //1,1
			]
			var rot = (side.rotation+0)
			while (rot > 0) {
				arr.push(arr.shift())
				rot = rot-90;
			}
			return arr;
		}

		if (data.textures) {
			for (var tex in data.textures) {
				if (data.textures.hasOwnProperty(tex)) {
					var obj = new Texture(base_path, data.textures[tex], tex).load()

					scope.textures[tex] = obj
				}
			}
		}

		if (data.elements) {
			data.elements.forEach(function(s) {
				base_cube = new Cube()
				$.extend(true, base_cube, s);
				for (var face in base_cube.faces) {
					if (s.faces[face] === undefined) {
						base_cube.faces[face].texture = '$transparent'
						base_cube.faces[face].uv = [0,0,0,0]
					}
				}
				scope.elements.push(base_cube)

			//Material
				var materials = []

				FaceOrder.forEach(face => {
					materials.push(fetchMaterial(base_cube.faces[face]))
				})
				var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MultiMaterial( materials ))

			//Size
				mesh.geometry.from(base_cube.from)
				mesh.geometry.to(base_cube.to)
				mesh.geometry.computeBoundingSphere()

				if (base_cube.rotation) {
					mesh.rotation.reorder('ZYX')

					mesh.position.set(base_cube.rotation.origin[0], base_cube.rotation.origin[1], base_cube.rotation.origin[2])
					mesh.geometry.translate(-base_cube.rotation.origin[0], -base_cube.rotation.origin[1], -base_cube.rotation.origin[2])

					mesh.rotation[base_cube.rotation.axis] = Math.PI / (180 /base_cube.rotation.angle)

					if (base_cube.rotation.rescale === true) {

						var rescale = getRescalingFactor(base_cube.rotation.angle);
						mesh.scale.set(rescale, rescale, rescale)
						mesh.scale[base_cube.rotation.axis] = 1
					}
				}
				mesh.position.sub(new THREE.Vector3(8, 8, 8))
				scope.scene_obj.add(mesh)
			//UV

				mesh.geometry.faceVertexUvs[0] = [];
				
				var base_cube = base_cube.faces
				for (var face in base_cube) {
					if (base_cube.hasOwnProperty(face)) {
						var fIndex = 0;
						switch(face) {
							case 'north':   fIndex = 10;   break;
							case 'east':	fIndex = 0;	break;
							case 'south':   fIndex = 8;	break;
							case 'west':	fIndex = 2;	break;
							case 'up':	  fIndex = 4;	break;
							case 'down':	fIndex = 6;	break;
						}
						mesh.geometry.faceVertexUvs[0][fIndex] = [ getUVArray(base_cube[face])[0], getUVArray(base_cube[face])[1], getUVArray(base_cube[face])[3] ];
						mesh.geometry.faceVertexUvs[0][fIndex+1] = [ getUVArray(base_cube[face])[1], getUVArray(base_cube[face])[2], getUVArray(base_cube[face])[3] ];
					}
				}
				mesh.geometry.elementsNeedUpdate = true;

				mesh.armor_stand = scope.armor_stand
				mesh.type = 'cube'
			})
		}

		if (data.display && data.display.head) {
			if (data.display.head.translation) {
				this.scene_obj.position.fromArray(data.display.head.translation)
			}
			if (data.display.head.rotation) {
				this.scene_obj.rotation.x = degreeToRad(data.display.head.rotation[0])
				this.scene_obj.rotation.y = degreeToRad(data.display.head.rotation[1])
				this.scene_obj.rotation.z = degreeToRad(data.display.head.rotation[2])
			}
			if (data.display.head.scale) {
				this.scene_obj.scale.fromArray(data.display.head.scale)
			}
		}

		return this;
	}
}


function getGem(parent) {
	var geo = new THREE.OctahedronGeometry(0.4)
	var mat = new THREE.MeshLambertMaterial({color: 0x43D01D});
	var mesh = new THREE.Mesh(geo, mat)
	mesh.position.set(0, 3, 0)
	mesh.scale.y = 1.5
	mesh.npc = parent
	mesh.type = 'gem'
	return mesh;
}

function TimelineFrame(element, frametime, lineNr) {
	this.time = frametime
	this.element = element
	this.lineNr = lineNr
	this.mode = element.keyframes.frames[frametime].mode
	this.selected = element.keyframes.frames[frametime].selected
	var scope = this;
	Vue.nextTick(function() {
		var selector = '#keyframe_'+scope.lineNr+'_'+scope.time
		$(selector).draggable({
			revert: true,
			revertDuration: 0,
			axis: 'x',
			stop: function(event, ui) {
				var target_frame = Math.floor(ui.position.left / timeline.frameWidth)
				if (
					target_frame === scope.time ||
					!scope.element ||
					target_frame >= timeline.max ||
					target_frame < 0 ||
					scope.element.keyframes.frames[target_frame]
				) return;

				scope.element.keyframes.frames[target_frame] = scope.element.keyframes.frames[scope.time]
				if (!event.altKey) {
					delete scope.element.keyframes.frames[scope.time]
				}
				timeline.update()
			}
		})
	})
}
