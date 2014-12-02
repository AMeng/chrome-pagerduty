chrome.storage.sync.get({email: ''}, function(items) {
    if(items["email"].length > 0) {
        document.getElementById('email').value = items.email;
        document.getElementsByTagName('form')[0].submit()
    }
})
