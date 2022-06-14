const NUMBER_OF_RESULTS_DISPLAYED = 100;

let listHolder = document.getElementById("listHolder");
let input = document.getElementById("searchInput");
let tags;

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { greeting: "hello" }, function (response) {
        console.log(response);
        tags = response;
        let list = buildList(tags.slice(0, NUMBER_OF_RESULTS_DISPLAYED));
        listHolder.appendChild(list);
        insertSearchSummary(response.length);
    });
});

input.addEventListener("keyup", onTextTyped);

function buildList(values) {
    var div = document.createElement('div');
    div.classList.add('list-group');
    div.id = "listParent";

    values.forEach((value) => {
        var button = document.createElement('button');
        button.type = "button";
        button.classList.add("list-group-item");
        button.classList.add("list-group-item-action");

        button.textContent = value;
        div.appendChild(button);
    })

    return div;
}

function insertSearchSummary(numberOfResults) {
    let searchSUmmary = document.getElementById("searchSummary");

    var strong = document.createElement('strong');
    strong.textContent = numberOfResults;

    searchSUmmary.appendChild(strong);
    searchSUmmary.innerHTML += " tags found."

    if (numberOfResults > NUMBER_OF_RESULTS_DISPLAYED) {
        searchSUmmary.innerHTML += " Displaying first " + NUMBER_OF_RESULTS_DISPLAYED + ".";
    }
}

function onTextTyped(e) {
    performSearch(input.value);
}

async function performSearch(query) {
    console.log("Searching for " + query);

    let results = tags.filter((str) => {
        return str.toLowerCase().includes(query.toLowerCase());
    });

    let list = buildList(results.slice(0, NUMBER_OF_RESULTS_DISPLAYED));

    //clear list
    listHolder.innerHTML = '';
    searchSummary.innerHTML = '';

    listHolder.appendChild(list);
    insertSearchSummary(results.length);
    console.log("Search performed");

}
