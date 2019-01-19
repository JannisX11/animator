var timeline = {
    max: 80,
    frameWidth: 24,
    frame: 0,
    lines: [],
    timecode: [1],
    showSeconds: false,
    selected: [],
    update: function(noWidth) {
        timeline.lines.length = 0
        timeline.timecode.length = 0
        if (!selected) return;
        if (selected.isEl) {
            var el = selected
        } else if (!selected) {
            return
        } else {
            var el = selected.parent
        }
        if (!el) return;

        //Create Object Line
        timeline.lines.push({
            name: el.name,
            object: el,
            frames: []
        })
        el.timeline = timeline.lines[0]

        //Create Children Lines
        el.children.forEach(function(s) {
            timeline.lines.push({
                name: s.name,
                object: s,
                frames: []
            })
            s.timeline = timeline.lines[timeline.lines.length-1]
        })

        //Timecode
        var i = 0;
        var divider = Math.round(30 / timeline.frameWidth)
        while (i < timeline.max) {
            var label = ''
            if (i % divider === 0) {
                label = (timeline.showSeconds) ? Math.floor(i / 20) + ':' + (i % 20) : i
            }
            timeline.timecode.push({
                id: i,
                label: label
            })
            i++;
        }

        timeline.lines.forEach(function(s, i) {
            for (var frame in s.object.keyframes.frames) {
                s.frames.push(new TimelineFrame(s.object, frame, i))
            }
        })

        if (noWidth) return;

        Vue.nextTick(function() {

            $('.keyframe').css('width', timeline.frameWidth+'px')
            $('#scroll_panel').width(timeline.frameWidth * timeline.max)

            $('#timeline_frame_a .keyframe.timebar:not(.init)').addClass('init').mousedown(function(e) {
                timeline.marker.triggerHandler(e);
            });

        })
    },
    marker: $('<div id="timeline_marker"></div>'),
    setMarkerToFrame: function(frame) {
        frame = limitNumber(frame, 0, timeline.max-1)
        timeline.frame = frame
        $('.keyframe.timebar#'+frame).append(timeline.marker)
        var offset = timeline.marker.offset().left
        if (offset > $(window).width()-6) {
            $('#timeline_frame_a').scrollTo(timeline.marker)
        } else if (offset < 195) {
            $('#timeline_frame_a').scrollTo(timeline.marker)
        }
    },
    setWidth: function(val) {
        if (val) timeline.frameWidth = val
        $('.keyframe').css('width', timeline.frameWidth+'px')
        $('#scroll_panel').width(timeline.frameWidth * timeline.max)
        timeline.update(true)
    },
    mm: {
        active: false,
        prevFrame: 0,
        init: function() {
            timeline.marker.draggable({
                revert: true,
                revertDuration: 0,
                axis: 'x',
                helper: function() {return $('<div></div>')},
                drag: function(event, ui) {
                    var offset = event.clientX - $('#scroll_panel').offset().left
                    var frame = offset / timeline.frameWidth
                    frame = Math.round(frame)
                    if (frame !== timeline.mm.prevFrame) {
                        displayFrame(frame)
                    }
                    timeline.mm.prevFrame = frame
                }
            })
        }
    }
}

function timelinezoomIn() {
        if (timeline.frameWidth < 100) timeline.frameWidth += 4;
        timeline.setWidth()
        $('#timeline_frame_a').scrollTo(timeline.marker)
    }
function timelinezoomOut() {
        if (timeline.frameWidth > 15) timeline.frameWidth -= 4;
        timeline.setWidth()
        $('#timeline_frame_a').scrollTo(timeline.marker)
    }

function initializeTimeline() {
    timeline.vue = new Vue({
        el: '#timeline_area',
        data: {
            lines: timeline.lines,
            timecode: timeline.timecode
        },
        methods: {
            loadFrame: function(a) {
                if (held_keys.leftclick) {
                    displayFrame(a)
                }
            },
            addFrame: function() {

            },
            frameContext: function(frame, line) {
                var frameNumber = line.frames.indexOf(frame)
                var F = frame.element.keyframes.frames[frame.time]
                new ContextMenu(event, [
                    {icon: 'clear', name: 'Delete', click: function() {
                        delete frame.element.keyframes.frames[frame.time]
                        timeline.update()
                    }},

                    {icon: 'fa-square', name: 'Linear', click: function() {
                        F.mode = frame.mode = 'linear'
                    }},
                    {icon: 'fa-circle', name: 'Ease', click: function() {
                        F.mode = frame.mode = 'ease'
                    }},
                    {icon: 'fa-arrow-circle-right', name: 'Ease In', click: function() {
                        F.mode = frame.mode = 'ease_in'
                    }},
                    {icon: 'fa-arrow-circle-left', name: 'Ease Out', click: function() {
                        F.mode = frame.mode = 'ease_out'
                    }}
                ])
            },
            selectFrame: function(frame, line, event) {
                var frameNumber = line.frames.indexOf(frame)
                var F = frame.element.keyframes.frames[frame.time]
                if (event.shiftKey) {
                    if (!timeline.selected.includes(F)) {
                        timeline.selected.push(F)
                    }
                } else {
                    timeline.selected.length = 0
                    timeline.selected.push(F)
                }
            },
        }
    })
    timeline.update()
    Vue.nextTick(function() {
        timeline.setMarkerToFrame(0)
    })
    timeline.mm.init()
}
function displayFrame(frame, sounds) {
    if (frame === undefined) frame = timeline.frame
    timeline.setMarkerToFrame(frame)
    Elements.forEach(function(s) {
        if (s.type !== 'framedata' || sounds === true) {
            s.renderAll(frame)
            Transformer.update()
        }
    })
}
Audio.prototype.fadeOut = function(time) {
    var decreaseAmount = this.volume / time
    var scope = this;
    function decrease() {
        var new_vol = scope.volume - decreaseAmount
        if (new_vol <= 1 && new_vol >= 0) scope.volume = new_vol
        time = time-1;
        if (time > 0) {
            setTimeout(decrease, 1)
        } else {
            scope.pause()
        }
    }
    decrease()

}
var Player = {
    interval: null,
    volume: 1,
    playing: false,
    start: function() {
        if (Player.playing) {
            Player.pause()
            return;
        }
        var button = $('#play_button')
        button.find('i').text('pause')
        button.find('.tooltop').text('Pause')
        if (timeline.frame+1 === timeline.max) {
            timeline.frame = 0
        }
        Player.interval = setInterval(function() {
            if (timeline.frame < timeline.max-1) {
                displayFrame(timeline.frame, true)
                timeline.frame++
            } else {
                Player.pause()
            }
        }, 50)
        Player.playing = true
    },
    pause: function() {
        if (Player.playing === false) return;
        var button = $('#play_button')
        button.find('i').text('play_arrow')
        button.find('.tooltop').text('Play')
        clearInterval(Player.interval)
        timeline.setMarkerToFrame(timeline.frame)
        ActiveSounds.forEach(function(s) {
            s.fadeOut(20)
        })
        ActiveSounds.length = 0
        Player.playing = false
    },
    toStart: function() {
        Player.pause()
        timeline.frame = 0
        displayFrame(timeline.frame)
    },
    toEnd: function() {
        Player.pause()
        timeline.frame = timeline.max-1
        displayFrame(timeline.frame)
    },
    changeVolume: function() {
        Player.volume = parseInt($('#volume').val()) / 100
        ActiveSounds.forEach(function(s) {
            s.volume = Player.volume
        })
    },
    skip: function(frames) {
        timeline.frame += frames
        if (timeline.frame >= 0 && timeline.frame < timeline.max) {
            displayFrame(timeline.frame, true)
            return true;
        } else {
            timeline.frame -= frames
            return false
        }
    }
}