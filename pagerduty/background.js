chrome.browserAction.onClicked.addListener(open_panel);
chrome.notifications.onClicked.addListener(open_panel);
chrome.alarms.onAlarm.addListener(incident_check);
chrome.alarms.create("incidentcheck", {periodInMinutes: 1});


function store_user_id(options, callback) {
    $.ajax('https://' + options["tenant"] + '.pagerduty.com/api/v1/users?query=' + options["email"], {
        contentType: 'application/json',
        dataType: 'json',
        headers: {authorization: 'Token token=' + options["token"]},
        success: function(data, textStatus, jqXHR) {
            user_id = data['users'][0]['id'];
            chrome.storage.sync.set({user_id: user_id});
            if(callback) {
                callback(user_id);
            }
        }
    });
}


function incident_check(alarm) {
    if(alarm.name != "incidentcheck") { return; }
    chrome.storage.sync.get({email: '', token: '', tenant: '', user_id: ''}, function(options) {
        if(options["email"].length > 0 && options["token"].length > 0) {
            if(options["user_id"].length == 0) {
                store_user_id(options, function(user_id) {
                    options['user_id'] = user_id;
                    fetch_incidents(options, notify);
                });
            } else {
                fetch_incidents(options, notify);
            }
        }
    });
}

function fetch_incidents(options, callback) {
    $.ajax('https://' + options["tenant"] + '.pagerduty.com/api/v1/incidents?assigned_to_user=' + options['user_id'], {
        contentType: 'application/json',
        dataType: 'json',
        headers: {authorization: 'Token token=' + options["token"]},
        success: function(data, textStatus, jqXHR) {
            callback(options, data);
        }
    });    
}

function notify(options, data) {
    if(data['total'] != 0) {
        incident_count = data['total'];
        triggered = data['incidents'].filter(function(incident) {
            return incident['status'] == 'triggered';
        });
        acknowledged = data['incidents'].filter(function(incident) {
            return incident['status'] == 'acknowledged';
        });
        chrome.browserAction.setBadgeText({text: String(data['total'])});
        if(triggered.length > 0) {
            contextMessage = 'You have ' + data['total'] + ' incidents assgined to you.';
            incidents = data['incidents'].map(function(incident) {
                message = '** No incident description found **';
                message_fields = ['description', 'subject'];
                for(var prop in message_fields) {
                    if(message_fields[prop] in incident['trigger_summary_data']) {
                        message = incident['trigger_summary_data'][message_fields[prop]];
                    }
                }
                return {
                    title: incident['service']['name'],
                    message: message
                };
            });
            if(incident_count > 1) {
                notification_details = {
                    title: 'Pagerduty - ' + incident_count + ' Incidents',
                    iconUrl: 'icon48.png',
                    type: 'list',
                    message: '',
                    contextMessage: contextMessage,
                    items: incidents
                }
            } else {
                notification_details = {
                    title: 'Pagerduty - Incident ' + data['incidents'][0]['incident_number'],
                    iconUrl: 'icon48.png',
                    type: 'basic',
                    message: incidents[0]['title'],
                    contextMessage: incidents[0]['message'],
                }
            }
            chrome.notifications.create(
                '',
                notification_details,
                function(notificationId) {}
            );
        }
    } else {
        chrome.browserAction.setBadgeText({text: ''});
    }
}


function open_panel() {
    chrome.storage.sync.get({email: '', token: '', panel_id: -1}, function(options) {
        if(options["email"].length > 0) {
            chrome.windows.getAll({}, function(window_list) {
                chrome.windows.get(options['panel_id'], function(chromeWindow) {
                    email_field = document.getElementById('email')
                    if(email_field != null) {
                        email_field.value = options.email;
                        document.getElementsByTagName('form')[0].submit()
                    }
                    if (chrome.runtime.lastError) {
                        properties = {
                            url: 'https://m.pagerduty.com/',
                            type: 'panel',
                            width: 360,
                            height: 540
                        }
                        chrome.windows.create(properties, function(chromeWindow) {
                            chrome.storage.sync.set({panel_id: chromeWindow.id}, function() {});
                        });
                    } else {
                        chrome.windows.update(chromeWindow.id, {focused: true});
                    }
                });
            });
        } else {
            chrome.tabs.create({url: "options.html"});
        }
    });
}
