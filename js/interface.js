
function showDialog(dialog) {
	$('.dialog').hide(0)
	$('#blackout').fadeIn(200)
	$('.dialog#'+dialog).fadeIn(200)
	setTimeout(function() {
		$('.context_handler.ctx').removeClass('ctx')
	}, 64)
	open_dialog = dialog
	if (dialog === 'file_loader') {
		$('#file_upload').val('')
		$('#file_folder').val('')
		$('#web_import_btn').unbind()
	} else if (dialog === 'selection_creator') {
		$('#selection_creator input#selgen_name').select()
	}
}
function hideDialog() {
	$('#blackout').fadeOut(200)
	$('.dialog').fadeOut(200)
	open_dialog = false;
}
function setSettingsTab(tab) {
	$('#settings .tab.open').removeClass('open')
	$('#settings .tab#'+tab).addClass('open')
	$('#settings .tab_content').addClass('hidden')
	$('#settings .tab_content#'+tab).removeClass('hidden')
	if (tab === 'keybindings') {
		//Keybinds
		$('#keybindlist').css('max-height', ($(window).height() - 320) +'px')
	} else if (tab === 'setting') {
		//Settings
		$('#settingslist').css('max-height', ($(window).height() - 320) +'px')
	}
}
function textPrompt(title, var_string, value, callback) {
	showDialog('text_input')
	$('#text_input h2').text(title)
	if (value === true) {
		//Get Previous Value For Input
		eval('value = '+var_string)
		try {
			eval('value = '+var_string)
		} catch(err) {
			console.error(err)
		}
	}
	$('#text_input input#text_input_field').val(value).select()
	$('#text_input button.confirm_btn').off()
	$('#text_input button.confirm_btn').click(function() {
		var s = $('#text_input input#text_input_field').val()
		if (callback !== undefined) {
			callback(s)
		}
		if (var_string == '') return;
		try {
			eval(var_string + ' = "'+s+'"')
		} catch(err) {
			console.error(err)
		}
	})
	// textPrompt('Texture Name', 'textures[0].name')
}



function showQuickMessage(message) {
	var quick_message_box = $('<div id="quick_message_box" class="hidden"></div>') 
	$('body').append(quick_message_box)
	
	quick_message_box.text(message)
	quick_message_box.fadeIn(100)
	setTimeout(function() {
		quick_message_box.fadeOut(100)
		setTimeout(function() {
			quick_message_box.remove()
		}, 100)
	}, 1000)
}
function showStatusMessage(message) {		   //Shows a quick message in the status bar
	var status_message = $('#status_message')
	var status_name	= $('#status_name')

	status_message.text(message)

	status_name.hide(100)
	status_message.show(100)

	setTimeout(function() {
		status_message.hide(100)
		status_name.show(100)
	}, 600)
}
function setProgressBar(id, val, time) {
	$('#'+id+' > .progress_bar_inner').animate({width: val*488}, time-1)
}

//Tooltip

function showShiftTooltip() {
	$(':hover').find('.tooltip_shift').show()
}
$(document).keyup(function(event) {
	if (event.which === 16) {
		$('.tooltip_shift').hide()
	}
})
