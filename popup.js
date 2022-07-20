const NUMBER_OF_RESULTS_DISPLAYED = 50;

var listHolder;
var input;
var grouping = true;
var tags;
var groupedTags;
var lastSearches = [];
var lastSearchesContainer;
var isLastSearchDisplayed = true;

//TODO: make this nicer
function groupTags(tags) {
    let re = /(^\s?DSV_SRQ.*)_(\d+)\.(\d+)_rt$/;

    let splitTags = tags.reduce(function (filtered, option) {
        let match = option.match(re);
        if (match && match[1] && match[2] && match[3])
            filtered.push([match[1], parseInt(match[2]), parseInt(match[3])]);
        
        return filtered;
    }, []);

    let tagsIndex = {};
    tagsGrouped = [];

    splitTags.forEach((tag) => {
        if (tag[0] in tagsIndex) {
            let index = tagsIndex[tag[0]];
            tagsGrouped[index][1].push([tag[1], tag[2]]);
        } else {
            tagsGrouped.push([
                tag[0],
                [[tag[1], tag[2]]]
            ]);
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
        list.classList.add("versionDropDown");
        list.classList.add("dropdown-menu");

        //Sort versions
        value[1].sort(function (a, b) {
            if (a[0] === b[0])
                return a[1] - b[1];
            else
                return a[0] - b[0];
        });

        //Dropdown elements (versions)
        value[1].forEach((version) => {
            let li = document.createElement("li");
            list.appendChild(li);

            let a = document.createElement("a");
            a.classList.add("dropdown-item");

            let verString = version[0] + "." + version[1];
            a.innerText = verString;

            let rtFullName = value[0] +
                "_" +
                verString +
                "_rt";

            a.setAttribute("data-rtName", rtFullName);
            a.addEventListener('click', selectTag);

            li.appendChild(a);
        });

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

//search for tags based on input
function onTextTyped() {
    let list;
    let results;
    let query = input.value.toLowerCase();


    if (isLastSearchDisplayed && query != "" && lastSearches.length > 0) {
        lastSearchesContainer.style.display = "none";
        isLastSearchDisplayed = false;
    } else if (!isLastSearchDisplayed && query == "" && lastSearches.length > 0) {
        lastSearchesContainer.style.display = "block";
        isLastSearchDisplayed = true;
    }

    if (grouping) {
        results = groupedTags.filter((arr) => {
            return arr[0]
                .toLowerCase()
                .includes(query);
        });
        list = buildGroupedList(results.slice(0, NUMBER_OF_RESULTS_DISPLAYED));
    } else {
        results = tags.filter((tagName) => {
            return tagName
                .toLowerCase()
                .includes(query);
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
            { message: "select-tag", tagName: rtName });
    });

    //save last searches
    let re = /(^\s?DSV_SRQ.*)_\d/;
    let match = rtName.match(re);
    if (match) {
        if (lastSearches.includes(match[1]) == false) {
            lastSearches.unshift(match[1]);
            if (lastSearches.length > 4) lastSearches.pop();
            chrome.storage.local.set({ "lastSearches": lastSearches });
        }
    }

    window.close();
}

//load grouping preference from browser storage
async function getGroupingPreference() {
    let data = await chrome.storage.local.get("grouping");
    return data.grouping;
}

async function getLastSearches() {
    let data = await chrome.storage.local.get("lastSearches");
    return data.lastSearches;
}

//get tags from main page
async function getTags() {
    try {
        let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        let allTags = await chrome.tabs.sendMessage(tabs[0].id, { message: "request-tags" });
        return {
            groupedTags: groupTags(allTags),
            tags: allTags
        };
    } catch (e) { 
        console.log(e);
        return null };
}

//build list on startup
async function initialiseList(allTags) {
    tags = allTags.tags;
    groupedTags = allTags.groupedTags;

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
}

//adds last searches to the page
async function initialiseLastSearches(lastSearcheData) {
    isLastSearchDisplayed = true;
    lastSearches = lastSearcheData;

    lastSearchesContainer = document.getElementById("LastSearchesContainer");
    lastSearchesContainer.style.display = "block"
    let lastSearchesList = document.getElementById("LastSearchesList");

    lastSearcheData.forEach((search) => {
        let button = document.createElement("button");
        button.classList.add("list-group-item");
        button.classList.add("list-group-item-action");
        button.textContent = search;
        button.setAttribute("data-searchValue", search);
        button.addEventListener("click", (e) => {
            let search = e.target.getAttribute("data-searchValue");
            input.value = search;
            onTextTyped();
        });

        lastSearchesList.appendChild(button);
    });
}

//initialises the popup
async function initialise() {
    listHolder = document.getElementById("listHolder");
    input = document.getElementById("searchInput");

    let [groupingPreference, allTags, lastSearchesData] = await Promise.all([
        getGroupingPreference(),
        getTags(),
        getLastSearches()]);

    if (groupingPreference != undefined) grouping = groupingPreference;

    if (allTags == null) {
        document.getElementById("TagsNotFound").style.display = "block";
        document.getElementById("ListsWrapper").style.display = "none";
        document.getElementById("switchContainer").style.display = "none";
        input.style.display = "none";
    } else {
        initialiseList(allTags);
        if (lastSearchesData != undefined && lastSearchesData.length > 0)
            initialiseLastSearches(lastSearchesData);
    }

    let groupingSwitch = document.getElementById("groupingSwitch");
    if (!grouping)
        groupingSwitch.removeAttribute("checked");

    groupingSwitch.addEventListener("click", () => {
        grouping = !grouping;
        onTextTyped();
        chrome.storage.local.set({ "grouping": grouping });
    });

    input.addEventListener("keyup", onTextTyped);
    input.focus();
}

//////////////////////////////////////

initialise();