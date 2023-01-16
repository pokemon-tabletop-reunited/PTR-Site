function getFileContent(filePath) {
  return new Promise((resolve, reject) => {
    var req = new XMLHttpRequest();

    // Define parameters for request.
    req.open('get', filePath, true);

    // Wait for request to complete.
    req.onreadystatechange = function () {
      if (req.readyState == 4 && req.status == 200) {
        // Execute callback function and parse variables.
        resolve(req.response)
      }
    };

    // Send request.
    req.send();
  });
}

function getRandomItemFromList(list) {
  return list[Math.floor((Math.random() * list.length))];
}

window.onload = async () => {
  // compile the template
  const listSource = await getFileContent('list.hbs');
  const listTemplate = Handlebars.compile(listSource);
  const itemSource = await getFileContent('item.hbs');
  const itemTemplate = Handlebars.compile(itemSource);

  // Register handlebars capitalize function
  Handlebars.registerHelper("capitalize", function (input) {
    var i, j, str, lowers, uppers;
    str = input.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  
    // Certain minor words should be left lowercase unless 
    // they are the first or last words in the string
    lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At', 
    'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto', 'To', 'With'];
    for (i = 0, j = lowers.length; i < j; i++)
      str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'), 
        function(txt) {
          return txt.toLowerCase();
        });
  
    // Certain words such as initialisms or acronyms should be left uppercase
    uppers = ['Id', 'Tv'];
    for (i = 0, j = uppers.length; i < j; i++)
      str = str.replace(new RegExp('\\b' + uppers[i] + '\\b', 'g'), 
        uppers[i].toUpperCase());
  
    return str;
  });
  Handlebars.registerHelper("newline", function (a) { return a.replace("\\n", "\n") });
  Handlebars.registerHelper("is", function (a, b) { return a == b });
  Handlebars.registerHelper("bigger", function (a, b) { return a > b });
  Handlebars.registerHelper("biggerOrEqual", function (a, b) { return a >= b });
  Handlebars.registerHelper("and", function (a, b) { return a && b });
  Handlebars.registerHelper("or", function (a, b) { return a || b });
  Handlebars.registerHelper("not", function (a, b) { return a != b });
  Handlebars.registerHelper("lpad", function (str, len, char) {
    str = str.toString();
    while (str.length < len) str = char + str;
    return str;
  });

  // Load Data
  const monData = JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/pokemon-data.json")).map(mon => { return { ...mon, compendium: "mons" }});
  const movesData = JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/moves-data.json")).map(move => { return { ...move, compendium: "moves" }});
  const abilitiesData = JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/abilities-data.json")).map(ability => { return { ...ability, compendium: "abilities" }});
  const capabilitiesData = JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/capabilities-data.json")).map(capability => { return { ...capability, compendium: "capabilities" }});
  const edgesData = JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/edges-data.json")).map(edge => { return { ...edge, compendium: "edges" }});
  const featsData = JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/feats-data.json")).map(feat => { return { ...feat, compendium: "feats" }});
  const pokeEdgesData = JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/poke-edges-data.json")).map(pokeEdge => { return { ...pokeEdge, compendium: "poke-edges" }});
  const tmsData = JSON.parse(await $.get("https://raw.githubusercontent.com/pokemon-tabletop-reunited/PTR-Data/master/tms-data.json")).map(tm => { return { name: tm.move + " (tm)", tmNumber: tm.number, compendium: "tms" }});
  
  function getCompendium(name) {
    switch (name) {
      case "mons": return monData;
      case "moves": return movesData;
      case "abilities": return abilitiesData;
      case "capabilities": return capabilitiesData;
      case "edges": return edgesData;
      case "feats": return featsData;
      case "poke-edges": return pokeEdgesData;
      case "tms": return tmsData;
    }
  }
  function tmLinks() {
    $("[data-tm-number]").on("click", function (event) {
      const tm = event.currentTarget.dataset.tmNumber;
      const tmName = tmsData.find(x => x.tmNumber == tm).name.replace("(tm)", "").trim();
      const data = movesData.find(x => x.name == tmName);
      const html = itemTemplate(data);
      $(".data-view").replaceWith(html);
    });
  }

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
  const moveFuse = new Fuse(movesData, moveOptions);

  const abilitiesOptions = {
    includeScore: true,
    keys: [
      { name: "name", weight: 5 },
      { name: "frequency", weight: 1 },
      { name: "effect", weight: 1 },
    ],
    threshold: 0.25,
  };
  const abilitiesFuse = new Fuse(abilitiesData, abilitiesOptions);

  const capabilitiesOptions = {
    includeScore: true,
    keys: [
      { name: "name", weight: 5 },
      { name: "effect", weight: 1 },
    ],
    threshold: 0.25,
  };
  const capabilitiesFuse = new Fuse(capabilitiesData, capabilitiesOptions);

  const edgesOptions = {
    includeScore: true,
    keys: [
      { name: "name", weight: 5 },
      { name: "prerequisites", weight: 3 },
      { name: "effect", weight: 1 },
    ],
    threshold: 0.25,
  };
  const edgesFuse = new Fuse(edgesData, edgesOptions);

  const featsOptions = {
    includeScore: true,
    keys: [
      { name: "name", weight: 5 },
      { name: "prerequisites", weight: 3 },
      { name: "frequency", weight: 1 },
      { name: "effect", weight: 1 },
    ],
    threshold: 0.25,
  };
  const featsFuse = new Fuse(featsData, featsOptions);

  const pokeEdgesOptions = {
    includeScore: true,
    keys: [
      { name: "name", weight: 5 },
      { name: "effect", weight: 1 },
    ],
    threshold: 0.25,
  };
  const pokeEdgesFuse = new Fuse(pokeEdgesData, pokeEdgesOptions);

  const tmsOptions = {
    includeScore: true,
    keys: [
      { name: "tmNumber", weight: 2 },
      { name: "name", weight: 0.5 },
    ],
    threshold: 0.25,
  };
  const tmsFuse = new Fuse(tmsData, tmsOptions);

  let delayTimer;
  $(".jsonsearchinput").on("keydown", function (event) {
    if (delayTimer) clearTimeout(delayTimer);
    delayTimer = setTimeout(function () {
      const input = event.currentTarget.value;

      if (input.length > 1) {
        const results = [
          ...monFuse.search(input),
          ...moveFuse.search(input),
          ...abilitiesFuse.search(input),
          ...capabilitiesFuse.search(input),
          ...edgesFuse.search(input),
          ...featsFuse.search(input),
          ...pokeEdgesFuse.search(input),
          ...tmsFuse.search(input),
        ].sort((a, b) => a.score - b.score);

        const html = listTemplate({
          total: results.length > 12 ? 12 : results.length,
          items: results.length > 12 ? results.slice(0, 12).map(x => x.item) : results.map((x) => x.item),
        });

        $("#searchresults").replaceWith(html);
        $(".result-item").on("click", function (event) {
          const { name, id, compendium } = event.currentTarget.dataset;
          const data = getCompendium(compendium).find((x) => name ? x.name == name : x.ptuNumber == id);
          const html = itemTemplate(data);
          $(".data-view").replaceWith(html);
          
          tmLinks();
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

  const list = getRandomItemFromList(["mons","moves", "abilities", "capabilities", "edges", "feats", "poke-edges", "tms"]); 
  const item = getRandomItemFromList(getCompendium(list));
  $(".data-view").replaceWith(itemTemplate(item));
  tmLinks();
};
