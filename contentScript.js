chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
            sendResponse(getValues());
    }
);

function getValues()
{
    let selectElem = document.getElementById("TagName_id");
    var arr = [].slice.call(selectElem.children);
    arr = arr.map((e) => {
        return e.text;
    });

    return arr.filter((str) => {
        //return str.includes('PUIG');
        return str.startsWith('DSV_SRQ');
    });
}


