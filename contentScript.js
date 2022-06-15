chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        if (request.message == "Request tags") {
            sendResponse(getValues());
            return;
        }

        if (request.message == "Select tag") {
            document.getElementById("TagName_id").value = request.tagName;
            return;
        }
    }
);

function getValues() {
    let selectElem = document.getElementById("TagName_id");
    var arr = [].slice.call(selectElem.children);
    arr = arr.map((e) => {
        return e.text;
    });

    return arr.filter((str) => {
        return str.startsWith('DSV_SRQ');
    });
}


