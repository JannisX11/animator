function loadPropertyBar() {
	$('#project_name').val(Prop.name)
	$('#timeline_length').val(timeline.max)
	$('#property_item').hide()
	if (selected) {
		$('#property_element').show()
		$('#element_name').val(selected.name)
		if (selected.type === 'armor_stand') {
			$('#property_item').show()
		}
	} else {
		$('#property_element').hide()
	}
}
function savePropertyBar() {
	//Project
	Prop.name = $('#project_name').val()

	timeline_limit = limitNumber(parseInt($('#timeline_length').val()), 1, 160000)
	if (timeline_limit !== timeline.max) {
		timeline.max = timeline_limit
		timeline.update()
	}
	//Object
	if ($('#property_element').is(':visible') && selected) {
		var name = $('#element_name').val()
		selected.name = name
	}
	//Item
	if ($('#property_item').is(':visible') && selected) {
		var item = $('#item_id').val()
		var dmg = $('#item_damage').val()
	}
}

function createItem() {
	var item = new Item()
	Items.push(item)
}