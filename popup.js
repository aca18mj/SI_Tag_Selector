const NUMBER_OF_RESULTS_DISPLAYED = 50;

var listHolder;
var input;
var grouping;
var tags;
var groupedTags;

function groupTags(tags) {
    let re = /(\s?DSV_SRQ.*)_(\d\.\d)_rt/;

    let splitTags = tags.map((str) => {
        let match = str.match(re);
        try {
            return [match[1], parseFloat(match[2])];
        }
        catch (e) { }
    });

    let tagsIndex = {};
    tagsGrouped = [];

    splitTags.forEach((tag) => {
        if (tag == undefined) return;

        if (tag[0] in tagsIndex) {
            let index = tagsIndex[tag[0]];
            tagsGrouped[index].push(tag[1]);

        } else {
            tagsGrouped.push([tag[0], tag[1]]);
            tagsIndex[tag[0]] = tagsGrouped.length - 1;
        }
    });

    return tagsGrouped;
}

//grouped list
function buildGroupedList(values) {
    let div = document.createElement('div');
    div.classList.add('list-group');
    div.id = "listParent";

    values.forEach((value) => {
        //List button
        let wrapper = document.createElement('div');
        wrapper.classList.add("dropdown");

        let button = document.createElement('button');
        button.type = "button";
        button.classList.add("list-group-item");
        button.classList.add("list-group-item-action");
        button.setAttribute("data-bs-toggle", "dropdown");

        button.textContent = value[0];

        //Dropdown
        let list = document.createElement("ul");
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

//non-grouped list
function buildList(values) {
    let div = document.createElement('div');
    div.classList.add('list-group');
    div.id = "listParent";

    values.forEach((value) => {
        //List button
        let button = document.createElement('button');
        button.type = "button";
        button.classList.add("list-group-item");
        button.classList.add("list-group-item-action");
        button.textContent = value;

        button.setAttribute("data-rtName", value);
        button.addEventListener('click', selectTag);

        div.appendChild(button);
    });

    return div;
}

function insertSearchSummary(numberOfResults) {
    let searchSummary = document.getElementById("searchSummary");
    searchSummary.innerHTML = "";

    let strong = document.createElement('strong');
    strong.textContent = numberOfResults;
    searchSummary.appendChild(strong);

    searchSummary.innerHTML += " tags found."

    if (numberOfResults > NUMBER_OF_RESULTS_DISPLAYED)
        searchSummary.innerHTML += " Displaying first " + NUMBER_OF_RESULTS_DISPLAYED + ".";
}

function onTextTyped(e) {
    let list;
    let results;

    if (grouping) {
        results = groupedTags.filter((arr) => {
            return arr[0]
                .toLowerCase()
                .includes(input.value.toLowerCase());
        });
        list = buildGroupedList(results.slice(0, NUMBER_OF_RESULTS_DISPLAYED));
    } else {
        results = tags.filter((tagName) => {
            return tagName
                .toLowerCase()
                .includes(input.value.toLowerCase());
        });
        list = buildList(results.slice(0, NUMBER_OF_RESULTS_DISPLAYED));
    }

    listHolder.innerHTML = "";
    listHolder.appendChild(list);
    insertSearchSummary(results.length);
}

//selects tag in the page
function selectTag(e) {
    let rtName = e.target.getAttribute("data-rtName");

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id,
            { message: "Select tag", tagName: rtName });
    });
}

async function getGroupingPreference() {
    let data = await chrome.storage.local.get(["grouping"]);
    return data.grouping;
}

async function getTags() {
    let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    let allTags = await chrome.tabs.sendMessage(tabs[0].id, { message: "Request tags" });
    return {
        groupedTags: groupTags(allTags),
        tags: allTags
    };
}

async function initialise() {
    listHolder = document.getElementById("listHolder");
    input = document.getElementById("searchInput");

    let [groupingPreference, allTags] = await Promise.all([getGroupingPreference(), getTags()]);

    grouping = groupingPreference;
    tags = allTags.tags;
    groupedTags = allTags.groupedTags;

    let groupingSwitch = document.getElementById("groupingSwitch");
    if (!grouping)
        groupingSwitch.removeAttribute("checked");

    let list;
    if (grouping) {
        list = buildGroupedList(groupedTags.slice(0, NUMBER_OF_RESULTS_DISPLAYED));
        insertSearchSummary(groupedTags.length);
    }
    else {
        list = buildList(tags.slice(0, NUMBER_OF_RESULTS_DISPLAYED));
        insertSearchSummary(tags.length);
    }

    listHolder.appendChild(list);

    groupingSwitch.addEventListener("click", (e) => {
        grouping = !grouping;
        onTextTyped(null);
        //save preference
        chrome.storage.local.set({ "grouping": grouping });
    });

    input.addEventListener("keyup", onTextTyped);
}

//////////////////////////////////////

initialise();