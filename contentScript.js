const SELECT_ID = "TagName_id";

function getValues(dropDown) {
    var arr = [].slice.call(dropDown.children);
    return arr.map((e) => { return e.innerHTML; });
}

function initialise() {
    if (document.getElementById(SELECT_ID) == null) return;

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            console.log("Message: " + request.message);
            let dropDown = document.getElementById(SELECT_ID);

            if (request.message == "Request tags") {
                let results = getValues(dropDown);
                sendResponse(results);
            }
            else if (request.message == "Select tag") {
                dropDown.value = request.tagName;
            }
        }
    );
}

///////////////////
initialise();