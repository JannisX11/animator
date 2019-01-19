var controls, scene, gl_renderer, canvas1, loader, mouse, raycaster,
	c_height, c_width,
	Sun, lights,
	Transformer;

var cameraPers;
var framespersecond = 0;
var objects;
var three_grid = new THREE.Object3D();
var emptyMaterial;
var backgroundTHREE;


function initCanvas() {
	cameraPers = new THREE.PerspectiveCamera(45, 16 / 9, 1, 1000)
	cameraPers.position.set(-20, 10, -20)
	
	controls = new THREE.OrbitControls(cameraPers, canvas1);
	controls.minDistance = 1;
	controls.maxDistance = 150;
	controls.target.set(0, 0, 0);
	controls.enableKeys = false;


	
	//Objects
	scene = new THREE.Scene();
	
	gl_renderer = new THREE.WebGLRenderer({canvas: canvas1, antialias: true, alpha: true});
	gl_renderer.setClearColor( 0x000000, 0 )
	gl_renderer.setSize(500, 400);

	outlines = new THREE.Object3D();
	outlines.name = 'outline_group'
	scene.add(outlines)

	raycaster = new THREE.Raycaster()
	mouse = new THREE.Vector2();
	canvas1.addEventListener('mousedown', canvasClick, false)

	//TransformControls
	Transformer = new THREE.TransformControls(cameraPers, canvas1)
	Transformer.setSize(0.5)
	scene.add(Transformer)

	//Light
	Sun = new THREE.AmbientLight( 0xffffff );
	scene.add(Sun);

	lights = new THREE.Object3D()
	
	var light_top = new THREE.DirectionalLight( 0x777777 );
	light_top.position.set(8, 100, 8)
	lights.add(light_top);

	var light_west = new THREE.DirectionalLight( 0x222222 );
	light_west.position.set(-100, 8, 8)
	lights.add(light_west);

	var light_east = new THREE.DirectionalLight( 0x222222 );
	light_east.position.set(100, 8, 8)
	lights.add(light_east);

	var light_north = new THREE.DirectionalLight( 0x444444 );
	light_north.position.set(8, 8, -100)
	lights.add(light_north);

	var light_south = new THREE.DirectionalLight( 0x444444 );
	light_south.position.set(8, 8, 100)
	lights.add(light_south);

	scene.add(lights)


	backgroundTHREE = new THREE.Object3D()
	backgroundTHREE.name = 'Backgrounds'
	scene.add(backgroundTHREE)



	var img = new Image()
	img.src = 'assets/missing.png'
	var tex = new THREE.Texture(img)
	img.tex = tex;
	img.tex.magFilter = THREE.NearestFilter
	img.tex.minFilter = THREE.LinearMipMapLinearFilter
	img.onload = function() {
		this.tex.needsUpdate = true;
	}
	emptyMaterial = new THREE.MeshLambertMaterial({color: 0xffffff, map: tex})


	buildGrid()
	setScreenRatio()
}

$(window).resize(function () {
	setScreenRatio()
})
function setScreenRatio() {
	c_height = $('#preview').height();
	c_width = $('#preview').width();

	$('#timeline_frame_a').css('width', ($(window).width()-200)+'px')

	cameraPers.aspect = c_width / c_height
	cameraPers.updateProjectionMatrix();
	gl_renderer.setSize(c_width, c_height);
}


function getFacingDirection() {
	var vec = controls.object.getWorldDirection().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4).ceil()
	switch (vec.x+'_'+vec.z) {
		case '1_1':
			return 'south'
			break;
		case '0_0':
			return 'north'
			break;
		case '1_0':
			return 'east'
			break;
		case '0_1':
			return 'west'
			break;
	}
}
function getFacingHeight() {
	var y = controls.object.getWorldDirection().y
	if (y > 0.5) {
		return 'up'
	} else if (y < -0.5) {
		return 'down';
	} else {
		return 'middle'
	}
}


function buildGrid() {
	three_grid.children.length = 0;

	three_grid.name = 'grid_group'
	var size, step;
	var line_material = new THREE.LineBasicMaterial({color: 0x555a75});
	var material;


	var img = new Image();
	img.src = 'assets/north.png';
	var tex = new THREE.Texture(img);
	img.tex = tex;
	img.tex.magFilter = THREE.NearestFilter;
	img.tex.minFilter = THREE.NearestFilter;
	img.onload = function() {
		this.tex.needsUpdate = true;
	}
	var northMarkMaterial = new THREE.MeshBasicMaterial({map: tex, transparent: true, color: 0x445166})


	size = 8
	step = 1;

	var geometry = new THREE.Geometry();
	
	for ( var i = - size; i <= size; i += step) {
		geometry.vertices.push(new THREE.Vector3( -size, 0, i))
		geometry.vertices.push(new THREE.Vector3( size, 0, i))
		geometry.vertices.push(new THREE.Vector3(i, 0, -size))
		geometry.vertices.push(new THREE.Vector3(i, 0, size))
	}
	var line = new THREE.Line( geometry, line_material, THREE.LinePieces);
	line.position.set(0,0,0)
	three_grid.add(line)

	//Y
	geometry = new THREE.Geometry();
	material = new THREE.LineBasicMaterial({color: '#54EA75'});
	geometry.vertices.push(new THREE.Vector3( 0, -2, 0))
	geometry.vertices.push(new THREE.Vector3( 0, 4, 0))
	z_axis = new THREE.Line( geometry, material, THREE.LinePieces);
	three_grid.add(z_axis)

	//X
	geometry = new THREE.Geometry();
	material = new THREE.LineBasicMaterial({color: '#EE4040'});
	geometry.vertices.push(new THREE.Vector3( -8, 0, 0))
	geometry.vertices.push(new THREE.Vector3( 8, 0, 0))
	x_axis = new THREE.Line( geometry, material, THREE.LinePieces);
	three_grid.add(x_axis)

	//Z
	geometry = new THREE.Geometry();
	material = new THREE.LineBasicMaterial({color: '#547CEA'});
	geometry.vertices.push(new THREE.Vector3( 0, 0, -8))
	geometry.vertices.push(new THREE.Vector3( 0, 0, 8))
	z_axis = new THREE.Line( geometry, material, THREE.LinePieces);
	three_grid.add(z_axis)
	
	line.name = 'grid'

	geometry = new THREE.PlaneGeometry(1.8, 1.8)
	var north_mark = new THREE.Mesh(geometry, northMarkMaterial)
	north_mark.position.set(0,0,-9)
	north_mark.rotation.x = Math.PI / -2
	three_grid.add(north_mark)

	scene.add(three_grid)

}



function animate() {
	requestAnimationFrame( animate );
	controls.update();
	framespersecond++;
	gl_renderer.render(scene, cameraPers)
}

function onDocumentTouchStart( event ) {
	event.preventDefault();
	
	event.clientX = event.touches[0].clientX;
	event.clientY = event.touches[0].clientY;
	canvasClick( event )
}

var drag_top, drag_left;


function getUVArray(side) {
	var arr = [
		new THREE.Vector2(side.uv[0]/16, (16-side.uv[1])/16),   //0,1
		new THREE.Vector2(side.uv[0]/16, (16-side.uv[3])/16),   //0,0
		new THREE.Vector2(side.uv[2]/16, (16-side.uv[3])/16),   //1,0
		new THREE.Vector2(side.uv[2]/16, (16-side.uv[1])/16)	//1,1
	]
	var rot = (side.rotation+0)
	while (rot > 0) {
		arr.push(arr.shift())
		rot = rot-90;
	}
	return arr;
}

function updateUV(id) {
	if (Prop.wireframe === true) return;
	var obj = elements[id]
	var mesh = obj.display.mesh
	if (mesh === undefined) return;
	mesh.geometry.faceVertexUvs[0] = [];
	
	var obj = obj.faces
	for (var face in obj) {
		if (obj.hasOwnProperty(face)) {
			var fIndex = 0;
			switch(face) {
				case 'north':   fIndex = 10;   break;
				case 'east':	fIndex = 0;	break;
				case 'south':   fIndex = 8;	break;
				case 'west':	fIndex = 2;	break;
				case 'up':	  fIndex = 4;	break;
				case 'down':	fIndex = 6;	break;
			}
			mesh.geometry.faceVertexUvs[0][fIndex] = [ getUVArray(obj[face])[0], getUVArray(obj[face])[1], getUVArray(obj[face])[3] ];
			mesh.geometry.faceVertexUvs[0][fIndex+1] = [ getUVArray(obj[face])[1], getUVArray(obj[face])[2], getUVArray(obj[face])[3] ];
		}
	}
	mesh.geometry.elementsNeedUpdate = true;
	return mesh.geometry
}



function canvasClick( event ) {
	$(':focus').blur()
	if (Transformer.hoverAxis || event.button !== 0) return;

	event.preventDefault()

	var canvas_offset = $('#preview').offset()

	mouse.x = ((event.clientX - canvas_offset.left) / c_width) * 2 - 1;
	mouse.y = - ((event.clientY - canvas_offset.top) / c_height) * 2 + 1;

	raycaster.setFromCamera( mouse, cameraPers );


	objects = []
	/*
	scene.children.forEach(function(s) {
		if (s.isElement === true) {
			objects.push(s)
		}
	})
	*/
	Elements.forEach(function(s) {
		s.children.forEach(function(A) {
			if (A.item) {
				A.scene_obj.children[0].children[0].children.forEach(function(cube) {
					cube.armor_stand = A
					objects.push(cube)
				})
			}
		})
		if (s.gem) {
			objects.push(s.gem)
		}
	})

	var intersects = raycaster.intersectObjects( objects );
	if (intersects.length > 0) {
		if (intersects[0].object.type === 'gem') {
			intersects[0].object.npc.select()
		} else if (intersects[0].object.armor_stand) {
			intersects[0].object.armor_stand.select()
		}
	} else {
		//No Object
	}
}