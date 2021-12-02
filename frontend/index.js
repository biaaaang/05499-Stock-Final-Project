const addSymbolButton = document.getElementById('add-symbol-button');
const symbolInput = document.getElementById('symbol-input');
const sharesInput = document.getElementById('shares-input');
const symbolList = document.getElementById('symbol-list');
const symbols = [];
var sectorDict = {};

fetch("static/StockSector.json")
        .then(response => response.text())
        .then(data => {
            makeDict(data);
            });


const config = {
    type: 'doughnut',
    data: {
        labels: [],
        datasets: [{
            label: 'My Portfolio',
            backgroundColor: [],
            data: [],
        }]
    },
    options: {}
};

const myChart = new Chart(
    document.getElementById('chart'),
    config
);

addSymbolButton.addEventListener('click', () => {
    const symbolInputValue = symbolInput.value.toUpperCase();
    const sharesInputValue = +sharesInput.value;
    addSymbol(symbolInputValue, sharesInputValue);
    symbolInput.value = "";
    sharesInput.value = "";
});

function generatePath(symbol) {
    return "static/AllStocks/" + symbol + ".txt"
}

function cleandata(data){
    data = JSON.parse(JSON.parse(data));
    for(var i = 0; i < data.results.length; i++){
        data["results"][i]["t"] = new Date(data.results[i].t);
    }
    return data;
}

function makeDict(data) {
    data = JSON.parse(data)
    for(var i = 0; i < data.length; i ++){
        current = data[i]
        sectorDict[current.Ticker] = {sector: current.Sector, company: current.Company}
    }
}

function addSymbol(symbol, shares) {
    if (shares < 0) {
        return;
    }
    var exists = false
    for (var i = 0; i < symbols.length; i++) {
        //console.log("check exists")
        //console.log(symbols[i])
        if (symbols[i].symbol == symbol) {
            //console.log("exists")
            symbols[i].shares = symbols[i].shares + shares
            //console.log(symbols[i].shares)
            drawList();
            //addSymbolToChart(symbols[i])
            //console.log("myChart data")
            //console.log(myChart.data.datasets[0].data[i])
            myChart.data.datasets[0].data[i] = (round(symbols[i].shares * symbols[i].price));
            //console.log("myChart data after update")
            //console.log(myChart.data.datasets[0].data[i])
            myChart.update();
            exists = true
            break;
        } 
    } 
    if (exists == false) {
       fetch(generatePath(symbol))
        .then(response => response.text())
        .then(data => {
            // Do something with your data
            data = cleandata(data)
            const last = data.results.length - 1
            console.log(last)
            console.log(data.results[last].c);
            const symbolData = {symbol: symbol, lastPrice: data.results[0].c,
                price: data.results[last].c, shares: shares}
            console.log(symbolData)
            symbols.push(symbolData);
            drawList();
            addSymbolToChart(symbolData);
            updateBubbles(symbols); 
        }); 
    }
    console.log("symbols are")
    console.log(symbols)
    symbols.forEach((symbol) => {console.log(symbol)})
    console.log("bubble data is")
    console.log(getBubbleData(symbols))
    if (symbols.length > 0) {
        updateBubbles(symbols) 
    } 
}



function drawList() {
    symbolList.innerHTML = "";
    symbols.forEach((symbol) => {
        console.log(symbol);
        const li = document.createElement('li');
        li.innerText = symbol.symbol + " " + 
        symbol.shares + " x " + symbol.price + "$ = " + round(symbol.price * symbol.shares) + "$";
        symbolList.appendChild(li);
    });
}



function addSymbolToChart(symbol) {
    myChart.data.labels.push(symbol.symbol);
    myChart.data.datasets[0].data.push(round(symbol.shares * symbol.price));
    myChart.data.datasets[0].backgroundColor.push(getRandomColor());
    myChart.update();
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function round(value) {
    return Math.round(value * 100) / 100;
}

function translateData(symbols) {
    densityData = []
   for (var i = 0; i < symbols.length; i++) {
        var symbol = symbols[i]
        var lastPrice = symbol.lastPrice
        //console.log("lastPrice is")
        //console.log(lastPrice)
        var price = symbol.price
        var growth = price - lastPrice
        var percentage = (growth/lastPrice)*100
        densityData.push({x:growth * symbol.shares, y:percentage, group:'A'})
   }
   return densityData
}

function findXdomain(data) {
    xValues = []
    for (var i = 0; i < data.length; i++) {
        xValues.push(data[i].x)
    }
    //console.log("xValues are")
    //console.log(xValues)
    var max = Math.max(...xValues) + 20
    var min = Math.min(...xValues) - 20
    return [min, max]
}

function findYdomain(data) {
    yValues = []
    for (var i = 0; i < data.length; i++) {
        yValues.push(data[i].y)
    }
    //console.log("yValues are")
    //console.log(yValues)
    var max = Math.max(...yValues) + 20
    var min = Math.min(...yValues) - 20
    return [min, max]
}

function getBubbleData(symbols) {
    console.log("actuall symbols passed in")
    console.log(symbols)
    bubbleData = []
    console.log("first symbol")
    console.log(symbols[0])
   for (var i = 0; i < symbols.length; i++) {
        var symbol = symbols[i]
        var lastPrice = symbol.lastPrice
        var price = symbol.price
        var growth = price - lastPrice
        var percentage = (growth/lastPrice)*100
        var info = sectorDict[symbol.symbol]
        bubbleData.push({company: info.company, 
            sector: info.sector, change: growth * symbol.shares, 
            position: symbol.shares * symbol.price, percentage:percentage})
   }
   return bubbleData
}

function bubbleX(data) {
    xValues = []
    for (var i = 0; i < data.length; i++) {
        xValues.push(data[i].change)
    }
    //console.log("xValues are")
    //console.log(xValues)
    var max = Math.max(...xValues) + 20
    var min = Math.min(...xValues) - 20
    return [min, max]
}

function bubbleY(data) {
    yValues = []
    for (var i = 0; i < data.length; i++) {
        yValues.push(data[i].percentage)
    }
    //console.log("yValues are")
    //console.log(yValues)
    var max = Math.max(...yValues) + 20
    var min = Math.min(...yValues) - 20
    return [min, max]
}

function bubbleSize(data){
    sizes = []
    for (var i = 0; i < data.length; i++) {
        sizes.push(data[i].position)
    }
    //console.log("sizes are")
    //console.log(sizes)
    var max = Math.max(...sizes) + 20
    var min = 0
    return [min, max]
}



function updateBubbles(symbols){
    d3.select("svg").remove();
    // set the dimensions and margins of the graph
    var margin = {top: 40, right: 150, bottom: 60, left: 30},
    width = 760 - margin.left - margin.right,
    height = 600- margin.top - margin.bottom; 
    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    data = getBubbleData(symbols)

    // ---------------------------//
    //       AXIS  AND SCALE      //
    // ---------------------------//
    console.log("bubble data is ")
    console.log(data)
    // Add X axis
    var x = d3.scaleLinear()
        .domain(bubbleX(data))
        .range([ 0, width ]);
    svg.append("g")
        .attr('id', 'bubbleX')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(3));

    // Add X axis label:
    svg.append("text")
      .attr('id', 'xLabel')
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height+50 )
      .text("Position Change");

    // Add Y axis
    var y = d3.scaleLinear()
        .domain(bubbleY(data))
        .range([ height, 0]);
    svg.append("g")
        .attr('id', 'bubbleY')
        .call(d3.axisLeft(y));

    // Add Y axis label:
    svg.append("text")
        .attr('id', 'yLabel')
        .attr("text-anchor", "end")
        .attr("x", 0)
        .attr("y", -20 )
        .text("Percentage Change")
        .attr("text-anchor", "start")

    // Add a scale for bubble size
    var z = d3.scaleSqrt()
        .domain(bubbleSize(data))
        .range([2, 30]);

    // Add a scale for bubble color
    var myColor = d3.scaleOrdinal()
        .domain(["Utilities", "Technology", "Real Estate", "Industrials", 
            "Healthcare", "Financial Services", "Energy", "Consumer Defensive", 
            "Consumer Cyclical", "Communication Services", "Basic Materials"])
        .range(d3.schemeCategory20);

    // ---------------------------//
    //      TOOLTIP               //
    // ---------------------------//

    // -1- Create a tooltip div that is hidden by default:
    var tooltip = d3.select("#my_dataviz")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "black")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("color", "white")

    // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
    var showTooltip = function(d) {
        tooltip
        .transition()
        .duration(200)
        tooltip
        .style("opacity", 1)
        .html("Company: " + d.company)
        .style("left", (d3.mouse(this)[0]+30) + "px")
        .style("top", (d3.mouse(this)[1]+30) + "px")
    }
    var moveTooltip = function(d) {
        tooltip
      .style("left", (d3.mouse(this)[0]+30) + "px")
      .style("top", (d3.mouse(this)[1]+30) + "px")
    }
    var hideTooltip = function(d) {
        tooltip
        .transition()
        .duration(200)
        .style("opacity", 0)
    }

    // ---------------------------//
    //       HIGHLIGHT GROUP      //
    // ---------------------------//

    // What to do when one group is hovered
    var highlight = function(d){
        // reduce opacity of all groups
        d3.selectAll(".bubbles").style("opacity", .05)
        // expect the one that is hovered
        d3.selectAll("."+d).style("opacity", 1)
    }

    // And when it is not hovered anymore
    var noHighlight = function(d){
        d3.selectAll(".bubbles").style("opacity", 1)
    }


    // ---------------------------//
    //       CIRCLES              //
    // ---------------------------//
    console.log("bubble bubble data is ")
    console.log(data)
    // Add dots
    svg.append('g')
        //.attr('id', 'bubbles')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", function(d) { return "bubbles " + d.sector })
        .attr("cx", function (d) { return x(d.change); } )
        .attr("cy", function (d) { return y(d.percentage); } )
        .attr("r", function (d) { return z(Math.abs(d.position)); } )
        .style("fill", function (d) { return myColor(d.sector); } )
    // -3- Trigger the functions for hover
    .on("mouseover", showTooltip )
    .on("mousemove", moveTooltip )
    .on("mouseleave", hideTooltip )

    // ---------------------------//
    //       LEGEND              //
    // ---------------------------//

    // Add legend: circles
    var valuesToShow = [10000, 1000000, 100000000]
    var xCircle = 450
    var xLabel = 440
    svg
      .selectAll("legend")
      .attr('id', 'legendcircle')
      .data(valuesToShow)
      .enter()
      .append("circle")
        .attr("cx", xCircle)
        .attr("cy", function(d){ return height - 100 - z(d) } )
        .attr("r", function(d){ return z(d) })
        .style("fill", "none")
        .attr("stroke", "none")


    // Add one dot in the legend for each name.
    var size = 20
    var allgroups = ["Utilities", "Technology", "Real Estate", "Industrials", 
            "Healthcare", "Financial Services", "Energy", "Consumer Defensive", 
            "Consumer Cyclical", "Communication Services", "Basic Materials"]
    svg.selectAll("myrect")
      .attr('id', 'legenddots')
      .data(allgroups)
      .enter()
      .append("circle")
        .attr("cx", 560)
        .attr("cy", function(d,i){ return 10 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("r", 7)
        .style("fill", function(d){ return myColor(d)})
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight)

    // Add labels beside legend dots
    svg.selectAll("mylabels")
      .data(allgroups)
      .enter()
      .append("text")
        .attr('id', 'legendlabeldots')
        .attr("x", 560 + size*.8)
        .attr("y", function(d,i){ return i * (size + 5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function(d){ return myColor(d)})
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .on("mouseover", highlight)
        .on("mouseleave", noHighlight)

}


/*function updateHeatmap(symbols) {
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 40},
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
    // read data
    d3.select('#xlabel').remove();
    d3.select('#ylabel').remove();
    d3.select("svg").remove();
    data = translateData(symbols)
    // Add X axis
    var x = d3.scaleLinear()
        .domain(findXdomain(data))
        .range([ 0, width ]);
    svg.append("g")
        .attr('id', 'xlabel')
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain(findYdomain(data))
        .range([ height, 0 ]);
    svg.append("g")
        .attr('id', 'ylabel')
        .call(d3.axisLeft(y));

  // Reformat the data: d3.hexbin() needs a specific format
  var inputForHexbinFun = []
  data.forEach(function(d) {
    inputForHexbinFun.push( [x(d.x), y(d.y)] )  // Note that we had the transform value of X and Y !
  })

  // Prepare a color palette
  var color = d3.scaleLinear()
      .domain([0, 600]) // Number of points in the bin?
      .range(["transparent",  "#69b3a2"])

  // Compute the hexbin data
  var hexbin = d3.hexbin()
    .radius(9) // size of the bin in px
    .extent([ [0, 0], [width, height] ])

  // Plot the hexbins
  svg.append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", width)
      .attr("height", height)

  svg.append("g")
    .attr("clip-path", "url(#clip)")
    .selectAll("path")
    .data( hexbin(inputForHexbinFun) )
    .enter().append("path")
      .attr("d", hexbin.hexagon())
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("fill", function(d) { return color(d.length); })
      .attr("stroke", "black")
      .attr("stroke-width", "0.1")
}*/


