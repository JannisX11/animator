class Exporter {
	constructor() {
		this.folder = undefined;
		this.id;
		this.frames_per_file = 10
	}
	open() {
		showDialog('exporter')
	}
	startExport() {
		var scope = this;
		app.dialog.showOpenDialog(currentwindow, {
		    title:"Select your functions folder",
		    properties: ["openDirectory"]
		}, (paths) => {
			if (paths && paths[0]) {
		    	scope.prepareFolder(paths[0])
			}
		});
	}
	prepareFolder(path) {
		var scope = this;

		this.id = $('#export_id').val().split(' ').join('_');
		this.namespace = path.split(osfs)[path.split(osfs).length-2]
		if ($('#export_namespace').val()) this.namespace = $('#export_namespace').val()
		if (this.id === '') this.id = 'scene_' + Math.round(Math.random() * 99)

		this.folder = path + osfs + 'scenes' + osfs + this.id;
		this.exportCam = $('input#export_camera').is(':checked')
		this.endMode = $('#export_end_mode option:selected').attr('id')
		this.relativeStart = $('input#relative_start_position').is(':checked')
		this.frames_per_file = limitNumber(
			parseInt($('#export_slice').val()),
			1, 1000
		)

		fs.readdir(scope.folder, function(err) {
		    if (err) {
		        fs.mkdir(scope.folder, function(a) {
		        	scope.write();
		        })
		    } else {
		        scope.write();
		    }
		})
	}
	write() {
		var scope = this;

        var path_arr = this.folder.split(osfs)
        path_arr[path_arr.length-1] = 'core.mcfunction'
		fs.readFile(path_arr.join(osfs), (err, data) => {
			if (err) {
				data = 'scoreboard objectives add scene dummy'
			}
			if (!data.includes('execute as @e[type=area_effect_cloud,name='+scope.id+'_controller]')) {
				data += '\nexecute as @e[type=area_effect_cloud,name='+scope.id+'_controller] at @s run function '+scope.namespace+':scenes/'+scope.id+'/loop'
				fs.writeFile(path_arr.join(osfs), data, function (err) {})
			}
		});


		var start_mf = 'summon area_effect_cloud '
			start_mf += (this.relativeStart || !Prop.spawn_position ? '~ ~ ~' : Prop.spawn_position.join(' ') )
			start_mf += ' {Duration:2147483647,CustomName:"{\\"text\\":\\"'+this.id+'_controller\\"}"}'
			start_mf += '\n'
		Elements.forEach(function(E) {
			if (E.type === 'npc') {
				E.children.forEach(function(A, Ai) {
					A.tag = 's_'+ scope.id +'_'+ E.name +'_'+ A.name
					var frameData = A.keyframes.calcFrame(0)
					var pos = new THREE.Vector3(frameData.x, frameData.y, frameData.z)
					start_mf += '\nsummon armor_stand ~'+pos.x +' ~'+pos.y +' ~'+pos.z+
						' {Pose:{Head:['+radToDegree(frameData.rot.x)+'f,'+radToDegree(frameData.rot.y)+'f,'+radToDegree(frameData.rot.z)+'f]},'+
						'Invisible:1,NoGravity:1,Tags:["'+A.tag+'","scene_'+scope.id+'"]'+
						(frameData.item ? ',ArmorItems:[{},{},{},{Count:1b,Damage:'+frameData.item.damage+'s,id:"minecraft:'+frameData.item.id+'"}]' : '')+
						'}'
				})
			}
		})

		var cancel_mf = 'kill @s'
		cancel_mf += '\nkill @e[tag=scene_'+scope.id+']'

		var end_mf = 'kill @s'
		if (scope.endMode === 'loop' || scope.endMode === 'remove') {
			end_mf += '\nkill @e[tag=scene_'+scope.id+']'
		}
		if (scope.endMode === 'loop') {
			end_mf += '\nfunction '+scope.namespace+':scenes/'+scope.id+'/start'
		}

		//  BREAK FUNCTION !!!

		var loop_mf = 'scoreboard players add @s scene 1'
		loop_mf += '\nexecute if score @s scene matches '+timeline.max+' run function '+scope.namespace+':scenes/'+this.id+'/end'

		var frameCmds = this.getFrames()
		var slices = []
		while(frameCmds.length) {
		    slices.push(frameCmds.splice(0,this.frames_per_file));
		}
		if (slices.length > 40) return; //!

		slices.forEach(function(s, i) {
			fs.writeFile(scope.folder+osfs+'slice_'+i+'.mcfunction', s.join('\n'), function (err) {})
			loop_mf += '\nexecute if score @s scene matches '+ scope.frames_per_file * i +'..'+ (scope.frames_per_file * i + s.length) +' run function '+scope.namespace+':scenes/'+scope.id+'/slice_'+i
		})
		fs.writeFile(this.folder+osfs+'start.mcfunction', start_mf, function (err) {})
		fs.writeFile(this.folder+osfs+'end.mcfunction', end_mf, function (err) {})
		fs.writeFile(this.folder+osfs+'cancel.mcfunction', cancel_mf, function (err) {})
		fs.writeFile(this.folder+osfs+'loop.mcfunction', loop_mf, function (err) {})

		hideDialog()
	}
	getFrames() {
		var scope = this;
		var frame = 0;
		var frames = []
		while (frame < timeline.max) {
			var cmds = []
			var selector = 'execute if score @s scene matches '+frame+' '
			Elements.forEach(function(E) {
				if (E.type === 'npc') {
					var e_frameData = E.keyframes.calcFrame(frame)
					var e_pos = new THREE.Vector3(e_frameData.x, e_frameData.y, e_frameData.z)

					E.children.forEach(function(A, Ai) {
						var frameData = A.keyframes.calcFrame(frame)
						var item_nbt = ''
						if (frameData.item === false) {
							var code = 'clear'
							if (code !== A.previousItem) {
								A.previousItem = code
								item_nbt = ',ArmorItems:[{},{},{},{}]'
							}
						} else if (frameData.item) {
							var code = frameData.item.id+frameData.item.damage
							if (code !== A.previousItem) {
								A.previousItem = code
								item_nbt = ',ArmorItems:[{},{},{},{Count:1b,Damage:'+frameData.item.damage+'s,id:"minecraft:'+frameData.item.id+'"}]'
							}
						} else {
							A.previousItem = ''
						}

						var pos = new THREE.Vector3(frameData.x, frameData.y, frameData.z)

						pos.applyEuler(e_frameData.rot)
						pos.add(e_pos)

						cmds.push(selector+'run teleport @e[type=armor_stand,tag='+A.tag+'] ~'+pos.x +' ~'+pos.y +' ~'+pos.z)
						cmds.push(selector+'as @e[type=armor_stand,tag='+A.tag+'] run data merge entity @s {Pose:{Head:['+
							radToDegree(frameData.rot.x + e_frameData.rot.x)+'f,'+
							radToDegree(frameData.rot.y + e_frameData.rot.y)+'f,'+
							radToDegree(frameData.rot.z + e_frameData.rot.z)+'f]}'+
							item_nbt + '}')
					})
				} else if (E.type === 'framedata') {
					//Custom Commands
					if (E.keyframes.frames[frame]) {
						E.keyframes.frames[frame].data.forEach(function(s) {
							if (s.type === 'command') {
								cmds.push(selector + 'run ' + s.value)
							}
						})
					}
				}
			})
			//Camera
			if (scope.exportCam) {
				var frameData = camera.keyframes.calcFrame(frame)
				camera.render(frame)
				cmds.push(selector+'run teleport @a[tag=camera]'+
					' ~'+frameData.x +
					' ~'+frameData.y +
					' ~'+frameData.z +
					' ' + -radToDegree(Math.atan2( controls.object.getWorldDirection().x, controls.object.getWorldDirection().z ) ) +
					' ' +(camera.scene_obj.getWorldDirection().y * -90)
				)
			}


			frames.push(cmds.join('\n'))
			frame++;
		}
		return frames;
	}
}
const exporter = new Exporter()
