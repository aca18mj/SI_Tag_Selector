const SELECT_ID = "TagName_id";

function getValues(dropDown) {
    var arr = [].slice.call(dropDown.children);
    return arr.map((e) => { return e.innerHTML; });
}

function initialise() {
    const dropDown = document.getElementById(SELECT_ID);
    if (dropDown == null) {
        chrome.runtime.sendMessage('tags-not-found');
        return;
    };

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            console.log("Message: " + request.message);

            if (request.message == "request-tags") {
                let results = getValues(dropDown);
                sendResponse(results);
            }
            else if (request.message == "select-tag") {
                dropDown.value = request.tagName;
            }
        }
    );

    chrome.runtime.sendMessage('extension-ready');
}

///////////////////
initialise();