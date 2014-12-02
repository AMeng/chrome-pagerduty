function save_options() {
    var email = document.getElementById('email').value;
    var tenant = document.getElementById('tenant').value;
    var token = document.getElementById('token').value;
    chrome.storage.sync.set({email: email, token: token, tenant: tenant, user_id: ''}, function() {
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() { status.textContent = ''; restore_options(); }, 1500);
    });
}

function restore_options() {
    chrome.storage.sync.get({email: '', token: '', tenant: ''}, function(items) {
        console.log(items);
        document.getElementById('email').value = items.email;
        document.getElementById('tenant').value = items.tenant;
        document.getElementById('token').value = items.token;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
