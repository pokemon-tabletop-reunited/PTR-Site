function getFileContent(filePath) {
    return new Promise((resolve, reject) => {
        var req = new XMLHttpRequest();
    
        // Define parameters for request.
        req.open('get', 'list.hbs', true);
    
        // Wait for request to complete.
        req.onreadystatechange = function(){
            if (req.readyState == 4 && req.status == 200){
                // Execute callback function and parse variables.
                resolve(req.response)
            }
        };
    
        // Send request.
        req.send();
    });
}

window.onload = async () => {
    // compile the template
    const listSource = await getFileContent('list.hbs');
    const listTemplate = Handlebars.compile(listSource);
    const itemSource = await getFileContent('item.hbs');
    const itemTemplate = Handlebars.compile(itemSource);

    // Register handlebars capitalize function
    Handlebars.registerHelper("capitalize", function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Load Data
    const monData = JSON.parse(
        await $.get(
            "https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/pokemon-data.json"
        )
    );
    const moveData = JSON.parse(
        await $.get(
            "https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/moves-data.json"
        )
    );

    const monOptions = {
        includeScore: true,
        keys: [
            { name: "_id", weight: 5 },
            { name: "number", weight: 3 },
            { name: "ptuNumber", weight: 1 },
            { name: "Type", weight: 2 },
        ],
        threshold: 0.25,
    };
    const monFuse = new Fuse(monData, monOptions);

    const moveOptions = {
        includeScore: true,
        keys: [
            { name: "name", weight: 5 },
            { name: "type", weight: 2 },
            { name: "category", weight: 2 },
            { name: "effect", weight: 1 },
        ],
        threshold: 0.25,
    };
    const moveFuse = new Fuse(moveData, moveOptions);

    let delayTimer;
    $(".jsonsearchinput").on("keydown", function (event) {
        if (delayTimer) clearTimeout(delayTimer);
        delayTimer = setTimeout(function () {
            const input = event.currentTarget.value;

            if (input.length > 2) {
                const results = [
                    ...monFuse.search(input),
                    ...moveFuse.search(input)
                ].sort((a, b) => a.score - b.score);
                
                const html = listTemplate({
                    total: results.length > 12 ? 12 : results.length,
                    items: results.length > 12 ? results.slice(0, 12).map(x => x.item) : results.map((x) => x.item),
                });

                $("#searchresults").replaceWith(html);
                $(".result-item").on("click", function (event) {
                    const { name, id } = event.currentTarget.dataset;
                    const data = id > 0 ? monData.find((x) => x.ptuNumber == id) : moveData.find((x) => x.name == name);
                    $(".data-view").replaceWith(itemTemplate(data));
                })

                if (results.length == 1) {
                    $(".result-item").click();
                }
            }

            if (input.length < 3) {
                $("#searchresults").hide();
            }
        }, 250);
    });
};

