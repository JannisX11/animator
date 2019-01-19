var appVersion = '1.1.0'
var File, i;
var keybinds, settings, display_presets;
var _vect;
var osfs = '/'
var open_dialog = false;
var currently_renaming = false;
var g_makeNew = false;
var pe_list;
var holding_shift = false;
var All = [];
var outliner, itemlist;
var Elements, Items;
var selected;
var Frame_data, camera;
var osfs = '\\'
var held_keys = {
    shift: false,
    leftclick: false,
    rightclick: false
}
var Prop = {
}
var Backgrounds = []
var cl = console.log

Array.prototype.remove = function(tag) {
    var index = this.indexOf(tag);
    if (index >= 0) {
        var val = this[index];
        this.splice(index, 1);
        return val;
    }
}
/*

*/

$(document).mousedown(function(e) {
    if (e.which === 1) held_keys.leftclick = true
    if (e.which === 3) held_keys.rightclick = true
})

$(document).mouseup(function(e) {
    held_keys.leftclick = false
    held_keys.rightclick = false
})

$(document).keydown(function(e) {

    if ($('input[type="text"]:focus, input[type="number"]:focus, div[contenteditable="true"]:focus').length > 0) {
        return;
    }


    holding_shift = e.shiftKey;
    if (event.which === 16) {
        showShiftTooltip()
    }
    if (e.ctrlKey === true && e.shiftKey === true && e.which == 73) {
        app.getCurrentWindow().toggleDevTools()
    }


    if (e.which === 190) {
        Player.skip(1)
    } else if (e.which === 188) {
        Player.skip(-1)
    } else if (e.which === 73) {
        if (selected) selected.setFrame()
    }
})
$(document).keyup(function(e) {
    holding_shift = false;
});
 
if (require('os').platform().includes('win32') === true) osfs = '\\'

function c(m) {
    console.log(m)
}

class ContextMenu {
    constructor(event, array) {
        var ctxmenu = $('<ul class="contextMenu"></ul>')

        array.forEach(function(s, i) {
            if (s.local_only && !isApp) return;

            var icon = ''
            if (s.icon.substr(0, 2) === 'fa') {
                icon = '<i class="fa fa_big ' + s.icon + '"></i>'
            } else if (s.icon) {
                icon = '<i class="material-icons">' + s.icon + '</i>'
            }
            var entry = $('<li>' + icon + s.name + '</li>')

            entry.click(s.click)
            ctxmenu.append(entry)
        })
        $('body').append(ctxmenu)

        var el_width = ctxmenu.width()

        var offset_left = event.clientX
        var offset_top  = event.clientY

        if (offset_left > $(window).width() - el_width) offset_left -= el_width
        if (offset_top  > $(window).height() - 35 * array.length ) offset_top -= 35 * array.length

        ctxmenu.css('left', offset_left+'px')
        ctxmenu.css('top',  offset_top +'px')

        ctxmenu.click(function() {
            this.remove()
        })
    }
}

function lockCamera() {
    $('#cameraLockButton i').removeClass('fa-chain-broken')
    $('#cameraLockButton i').removeClass('fa-link')
    freeCamera = !freeCamera
    if (freeCamera) {
        $('#cameraLockButton i').addClass('fa-chain-broken')
    } else {
        $('#cameraLockButton i').addClass('fa-link')
    }
}

function initializeApp() {
    console.log('Animator ' + appVersion)
    camera = new Camera()
    Elements = [
        camera
    ]

    outliner = new Vue({
        el: '#tree_view',
        data: {
            option: {
                root: {
                    name: 'Scene',
                    isParent: true,
                    isOpen: true,
                    onOpened: function (node) {console.log(node)},
                    select: function() {},
                    children: Elements
                }
            }
        }
    })

    Items = []
    itemlist = new Vue({
        el: '#item_list',
        data: {
            showAll: false,
            currentIndex: -1,
            items: Items
        },
        computed: {
            filteredItems() {
                var name = $('#item_search_bar').val().toUpperCase()
                return this.items.filter(item => {

                    //Red Highlight
                    
                    item.isOnModel = false
                    if (this.items.indexOf(item) === this.currentIndex) {
                        item.isOnModel = true
                    }

                    //Search
                    if (item.id.toUpperCase().includes(name) || item.modelname.toUpperCase().includes(name)) {
                        return true;
                    } else {
                        return false;
                    }
                })
            }
        }
    })
    itemlist.updateSearch = function() {
        itemlist._data.currentIndex += 1
        itemlist._data.currentIndex -= 1
    }

    setInterval(function() {
        //Prop.fps = framespersecond;
        framespersecond = 0;
    }, 1000)

    $(document).mousedown(function(event) {
        if ($('.ctx').find(event.target).length === 0) {
            $('.context_handler.ctx').removeClass('ctx')
        }
        if ($('.contextMenu').find(event.target).length === 0) {
            $('.contextMenu').remove()
        }
    })
    $('.context_handler').on('click', function() {
        $(this).addClass('ctx')
    })

    Mousetrap.bind('space', Player.start)


    initializeTimeline()
    camera.select()
    Vue.nextTick(function() {
        timeline.setMarkerToFrame(0)
    })
}

//Selection
function updateSelection() {
    if (!selected) {
        itemlist._data.currentIndex = -1
    } else {
        if (selected.type === 'armor_stand' && selected.item) {
            itemlist._data.currentIndex = Items.indexOf(selected.item)
        } else {
            itemlist._data.currentIndex = -1
        }
        if (selected.type !== 'npc' && selected.type !== 'armor_stand') {
            Transformer.detach()
        }

    }
    loadPropertyBar()
}

function setTool(tool) {
    $('.tool.sel').removeClass('sel')
    $('.tool#'+tool).addClass('sel')
    if (tool === 'move') {
        Transformer.setMode('translate')
    } else {
        Transformer.setMode('rotate')
    }
}

function applyPositionDialog() {
    hideDialog()

    if (!Prop.posDialogObj) {
        return;
    } else if (typeof Prop.posDialogObj === 'function') {
        Prop.posDialogObj(
            parseInt($('#position_x').val()),
            parseInt($('#position_y').val()),
            parseInt($('#position_z').val())
        )
    } else {
        Prop.posDialogObj.position.set(
            parseInt($('#position_x').val()),
            parseInt($('#position_y').val()),
            parseInt($('#position_z').val())
        )
    }
}



//Menu
const {remote} = require('electron')
const {Menu, MenuItem} = remote

var menu_template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'New Project',
                click: function() {
                    currentwindow.reload()
                }
            },
            {
                label: 'Export Functions',
                click: function() {
                    exporter.open()
                }
            },
            {
                label: 'Open Project',
                click: function() {
                    importText('ani', function(data) {
                        parseProjectJSON(JSON.parse(data))
                    })
                }
            },
            {
                label: 'Save Project',
                click: function() {
                    saveProject()
                }
            }
        ]
    },
    {
        label: 'Background',
        submenu: [
            {
                label: 'Backgrounds',
                submenu: Backgrounds
            },
            {
                label: 'Add Background',
                click: function() {
                    importStructure()
                }
            }
        ]
    },
    {
        label: 'Animation',
        submenu: [
        /*
            {
                label: 'Backgrounds',
                submenu: Backgrounds
            },
            {
                label: 'Add Background',
                click: function() {
                    importStructure()
                }
            }
            */
        ]
    }
]
var menu_bar = Menu.buildFromTemplate(menu_template)
Menu.setApplicationMenu(menu_bar)





function buildStructureBackground(blocks, palette, name) {
    var MatIndexes = {
        north: 5,
        east: 0,
        south: 4,
        west: 1,
        up: 2,
        down: 3
    }
    var full_blocks = {}
    function clearFaces(mesh, pos, solid_faces) {
        full_blocks[(pos[0] + '_' + pos[1] + '_' + pos[2])] = mesh
        mesh.solidFaces = solid_faces

        solid_faces.forEach(function(f) {
            var offset = [0, 0, 0]
            var mat_index = 0;
            var opposite = 'north'
            switch (f) {
                case 'north':
                    offset = [0, 0, -1]
                    opposite  = 'south'
                    break;
                case 'east':
                    offset = [1, 0, 0]
                    opposite  = 'west'
                    break;
                case 'south':
                    offset = [0, 0, 1]
                    opposite  = 'north'
                    break;
                case 'west':
                    offset = [-1, 0, 0]
                    opposite  = 'east'
                    break;
                case 'up':
                    offset = [0, 1, 0]
                    opposite  = 'down'
                    break;
                case 'down':
                    offset = [0, -1, 0]
                    opposite  = 'up'
                    break;
            }
            var adjacent_block = (
                (pos[0] + offset[0]) + '_' +
                (pos[1] + offset[1]) + '_' +
                (pos[2] + offset[2])
            )
            adjacent_block = full_blocks[adjacent_block]
            if (adjacent_block && adjacent_block.solidFaces.includes(opposite)) {

                mesh.geometry.faces.forEach(function(s) {
                    if (s.materialIndex === MatIndexes[f]) {
                        mesh.geometry.faces.splice(mesh.geometry.faces.indexOf(s), 2)
                    }
                })
                mesh.geometry.elementsNeedUpdate = true
                
                adjacent_block.geometry.faces.forEach(function(s) {
                    if (s.materialIndex === MatIndexes[opposite]) {
                        adjacent_block.geometry.faces.splice(adjacent_block.geometry.faces.indexOf(s), 2)
                    }
                })
                adjacent_block.geometry.elementsNeedUpdate = true
            }
        })
    }
    var i = 0
    var structure = new THREE.Object3D()
    var material = new THREE.MeshLambertMaterial({ color: 0x555b6a })
    while (i < blocks.length) {
        var blockType = palette[blocks[i].state].Name
        if (blocks[i].pos && 
            palette[blocks[i].state].Name !== 'minecraft:air' &&
            palette[blocks[i].state].Name !== 'minecraft:tallgrass' &&
            palette[blocks[i].state].Name !== 'minecraft:double_plant'
        ) {
            var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)

            if (blockType === 'minecraft:carpet' || blockType.includes('repeater') || blockType.includes('comparator')) {
                mesh.geometry.from([0, 0, 0])
                mesh.geometry.to([1, 0.0625, 1])
                clearFaces(mesh, blocks[i].pos, ['down'])

            } else if (blockType === 'minecraft:chest') {
                mesh.geometry.from([0.0625, 0, 0.0625])
                mesh.geometry.to([0.9375, 0.9375, 0.9375])

            } else if (blockType.includes('torch')) {
                mesh.geometry.from([0.4, 0, 0.4])
                mesh.geometry.to([0.6, 0.8, 0.6])

            } else if (blockType.includes('flower')) {
                mesh.geometry.from([0.4, 0, 0.4])
                mesh.geometry.to([0.6, 0.5, 0.6])

            } else if (blockType.includes('slab')) {
                if (palette[blocks[i].state].Properties.half === 'top') {
                    mesh.geometry.from([0, 0.5, 0])
                    mesh.geometry.to([1, 1, 1])
                    clearFaces(mesh, blocks[i].pos, ['up'])
                } else if (palette[blocks[i].state].Properties.half === 'bottom') {
                    mesh.geometry.from([0, 0, 0])
                    mesh.geometry.to([1, 0.5, 1])
                    clearFaces(mesh, blocks[i].pos, ['down'])
                } else {
                    mesh.geometry.from([0, 0, 0])
                    mesh.geometry.to([1, 1, 1])
                    clearFaces(mesh, blocks[i].pos, ['north', 'east', 'south', 'west', 'up', 'down'])
                }

            } else if (blockType === 'minecraft:air') {
                mesh.geometry.from([0, 0, 0])
                mesh.geometry.to([1, 1, 1])

            } else {
                mesh.geometry.from([0, 0, 0])
                mesh.geometry.to([1, 1, 1])
                clearFaces(mesh, blocks[i].pos, ['north', 'east', 'south', 'west', 'up', 'down'])

            }
            mesh.position.set(blocks[i].pos[0], blocks[i].pos[1], blocks[i].pos[2])
            structure.add(mesh)
        }
        i++;
    }
    backgroundTHREE.add(structure)
    structure.name = 'background_scene'
    var bg = {
        label: name,
        submenu: [
            {
                label: 'Align',
                click: function() {
                    Prop.posDialogObj = structure
                    showDialog('position_dialog')
                    $('#position_x').val(structure.position.x)
                    $('#position_y').val(structure.position.y)
                    $('#position_z').val(structure.position.z)
                }
            },
            {
                label: 'Set Corner Position',
                click: function() {
                    Prop.posDialogObj = function(x, y, z) {
                        Prop.spawn_position = [
                            x - structure.position.x,
                            y - structure.position.y,
                            z - structure.position.z
                        ]
                    }
                    showDialog('position_dialog')
                    $('#position_x').val(structure.position.x)
                    $('#position_y').val(structure.position.y)
                    $('#position_z').val(structure.position.z)
                }
            },
            {
                label: 'Remove',
                click: function() {
                    backgroundTHREE.remove(structure)
                    Backgrounds.remove(bg)
                    Menu.setApplicationMenu(Menu.buildFromTemplate(menu_template))
                }
            }
        ]
    }
    Backgrounds.push(bg)
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu_template))
}