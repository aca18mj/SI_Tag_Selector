const NUMBER_OF_RESULTS_DISPLAYED = 50;
const GROUPING = true;

let listHolder = document.getElementById("listHolder");
let input = document.getElementById("searchInput");
let tags;
let groupedTags;

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { message: "Request tags" }, function (response) {
        groupTags(response);

        let list = buildList(groupedTags.slice(0, NUMBER_OF_RESULTS_DISPLAYED));
        listHolder.appendChild(list);
        insertSearchSummary(groupedTags.length);
    });
});

input.addEventListener("keyup", onTextTyped);

function groupTags(tags) {
    let re = /(DSV_SRQ.*)_(\d\.\d)_rt/;

    let splitTags = tags.map((str) => {
        let match = str.match(re);
        try {
            return [match[1], parseFloat(match[2])];
        }
        catch (e) {

        }
    });

    let tagsIndex = {};
    groupedTags = [];

    splitTags.forEach((tag) => {
        if (tag != undefined)
            if (tag[0] in tagsIndex) {
                let index = tagsIndex[tag[0]];
                groupedTags[index].push(tag[1]);
            } else {
                groupedTags.push([tag[0], tag[1]]);
                tagsIndex[tag[0]] = groupedTags.length - 1;
            }
    })

    return groupedTags;
}

function buildList(values) {
    console.log(values.length);
    var div = document.createElement('div');
    div.classList.add('list-group');
    div.id = "listParent";

    values.forEach((value) => {
        //List button
        var wrapper = document.createElement('div');
        wrapper.classList.add("dropdown");

        var button = document.createElement('button');
        button.type = "button";
        button.classList.add("list-group-item");
        button.classList.add("list-group-item-action");
        button.setAttribute("data-bs-toggle", "dropdown");

        button.textContent = value[0];
        
        //Dropdown
        var list = document.createElement("ul");
        list.id = "versionDropDown";
        list.classList.add("dropdown-menu");

        value.slice(1).forEach((version) => {
            let li = document.createElement("li");
            list.appendChild(li);

            let a = document.createElement("a");
            a.classList.add("dropdown-item");

            let verString = (Number.isInteger(version)) ? version + ".0" : version;
            a.innerText = verString;

            let rtFullName = value[0] +
                "_" +
                verString +
                "_rt";

            a.setAttribute("data-rtName", rtFullName);
            a.addEventListener('click', selectTag);

            li.appendChild(a);
        })


        wrapper.appendChild(button);
        wrapper.appendChild(list);
        div.appendChild(wrapper);
    })

    return div;
}

function insertSearchSummary(numberOfResults) {
    let searchSummary = document.getElementById("searchSummary");
    searchSummary.innerHTML = "";

    var strong = document.createElement('strong');
    strong.textContent = numberOfResults;

    searchSummary.appendChild(strong);
    searchSummary.innerHTML += " tags found."

    if (numberOfResults > NUMBER_OF_RESULTS_DISPLAYED) {
        searchSummary.innerHTML += " Displaying first " + NUMBER_OF_RESULTS_DISPLAYED + ".";
    }
}

function onTextTyped(e) {
    if (GROUPING) {
        listHolder.innerHTML = "";
        var results = groupedTags.filter((arr) => {
            return arr[0]
                .toLowerCase()
                .includes(input.value.toLowerCase());
        });
        var list = buildList(results.slice(0, NUMBER_OF_RESULTS_DISPLAYED));

        listHolder.appendChild(list);

        insertSearchSummary(results.length);
    } else {
        performSearch(input.value);
    }
}

function selectTag(e) {
    let rtName = e.target.getAttribute("data-rtName");
    console.log(rtName);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id,
            { message: "Select tag", tagName: rtName });
    });
}