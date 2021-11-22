import * as d3 from "d3";
import vegaEmbed from "vega-embed";
import { internalField } from "vega-lite";
// import * as yahooFinance from "yahoo-finance"

// // Load "data.csv" and log it to the console.

var margin = {top: 10, right: 100, bottom: 60, left: 100},
    width = 1250 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var svg = d3.select("#svg-div")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");


var parseTime = d3.timeParse("%Y-%m-%d");

function convertDate(input) {
    return [(input.getDate()), (input.getMonth()+1), input.getFullYear()].join('/')
}

function cleandata(data){
    data = JSON.parse(JSON.parse(data));
    for(var i = 0; i < data.results.length; i++){
        data["results"][i]["t"] = new Date(data.results[i].t);
    }
    return data;
}

var symbols = d3.select("#inputSymbol").property("value").toUpperCase().split(" ");
console.log(symbols)


var color = d3.scaleOrdinal()
    .domain(symbols)
    .range(d3.schemeSet3);



var path = "static/AllStocks/symbol.txt";

var allData = [];
var REALallData = [];
var allSymbols = [];

d3.csv("static/AllStocks/StockList.csv").then((data) =>{
    console.log(data);
    
    for(var i = 0; i < data.length; i++){
        var newPath = path.replace("symbol", data[i].MMM);
        d3.text(newPath).then((data) => {
            REALallData.push(cleandata(data));
        })
    }

    d3.text("static/AllStocks/A.txt").then((data) =>{
        console.log(REALallData);

        for(var i = 0; i < symbols.length; i++){
            for(var j = 0; j < REALallData.length; j++){
                if(REALallData[j].ticker == symbols[i]){
                    allData.push(REALallData[j]);
                }
            }
        }
        console.log(allData);
        
        data = allData[0]; 
        var mouseData = allData;
    
        var max = [];
        var min = [];
        for(var i = 0; i < allData.length; i++){
            max.push(d3.max(allData[i].results, (d) => (d.c)));
            min.push(d3.min(allData[i].results, (d) => (d.c)));
        }
    
        var x = d3.scaleTime()
            .domain(d3.extent(data.results, (d) => (d.t)))
            .range([0, width])
        svg.append('g').attr('id','xaxis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x).ticks(10));
    
        var y = d3.scaleLinear()
            .domain([0, d3.max(max)])
            .range([height, 0])
        svg.append('g').attr('id', 'yaxis')
            .call(d3.axisLeft(y))
        
        var lines = [];
    
    
        for(var i = 0; i < allData.length; i++){
            var line = svg
                .append('g')
                .append("path")
                .datum(allData[i].results)
                .attr("d", d3.line()
                    .x(function(d){return x(d.t)})
                    .y(function(d){return y(d.c)})
                )
                .attr("stroke", function(d){return color(allData[i].ticker)})
                .style("stroke-width",4)
                .style("fill", "none")
            
            lines.push(line);
        }
    


        function update(){
            symbols = d3.select("#inputSymbol").property("value").toUpperCase().split(" ");
            console.log(symbols);

            allData = [];
            for(var i = 0; i < symbols.length; i++){
                for(var j = 0; j < REALallData.length; j++){
                    if(REALallData[j].ticker == symbols[i]){
                        allData.push(REALallData[j]);
                    }
                }
            }

            color = d3.scaleOrdinal()
                .domain(symbols)
                .range(d3.schemeSet3);
            
            
            for(var i = 0; i < lines.length; i++){
                lines[i].remove();
            }
            
            lines = [];
            for(var i = 0; i < allData.length; i++){
                var line = svg
                    .append('g')
                    .append("path")
                    .datum(allData[i].results)
                    .attr("d", d3.line()
                        .x(function(d){return x(d.t)})
                        .y(function(d){return y(d.c)})
                    )
                    .attr("stroke", function(d){return color(allData[i].ticker)})
                    .attr("class", allData[i].ticker)
                    .style("stroke-width",4)
                    .style("fill", "none")
                
                lines.push(line);
            }
        }
    
        function newDate(fromDate, toDate){

            var newData = JSON.parse(JSON.stringify(allData));
            mouseData = newData;
    
            for(var i = 0; i < newData.length; i++){
                newData[i].results = allData[i].results.filter(function(d) {
                return (d.t >= parseTime(fromDate))
                        && (d.t <= parseTime(toDate));
                });
    
            }
            console.log(allData);
            console.log(newData);
            
    
            var max = [];
            var min = [];
            for(var i = 0; i < newData.length; i++){
                max.push(d3.max(newData[i].results, (d) => (d.c)));
                min.push(d3.min(newData[i].results, (d) => (d.c)));
            }
    
            x.domain(d3.extent(newData[0].results, (d) => (d.t)))
            y.domain([d3.min(min)-10, d3.max(max)])
    
    
            d3.select('#yaxis').remove();
            d3.select('#xaxis').remove();
    
            svg
            .append('g').attr('id', 'yaxis')
            .call(d3.axisLeft(y));
            svg
            .append('g').attr('id', 'xaxis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x).ticks(10));
    
    
            for(var i = 0; i < newData.length; i++){
                lines[i]
                .datum(newData[i].results)
                .transition()
                .duration(1000)
                .attr("d", d3.line()
                    .x(function(d) {return x(d.t)})
                    .y(function(d) {return y(d.c)})
                )
                .attr("stroke", function(d) {return color(newData[i].ticker)})
            }
        }
    
    
        d3.select("#update").on("click", function(d){
            var fromDate = d3.select("#from-date").property("value")
            var toDate = d3.select("#to-date").property("value")
            if (toDate < fromDate){
                return;
            }
            newDate(fromDate, toDate)
        })
        d3.select("#updateSymbols").on("click", function(d){
            var fromDate = d3.select("#from-date").property("value")
            var toDate = d3.select("#to-date").property("value")
            if (toDate < fromDate){
                return;
            }
            update();
            newDate(fromDate, toDate);
            
            d3.selectAll(".mouse-per-line").remove();

            var mousePerLine = mouseG.selectAll('.mouse-per-line')
            .data(mouseData)
            .enter()
            .append("g")
            .attr("class", "mouse-per-line");
    
        mousePerLine.append("circle")
            .attr("r", 7)
            .style("stroke", function(d) {
                return color(d.ticker);
            })
            .style("fill", "none")
            .style("stroke-width", "1px")
            .style("opacity", "0");
    
        mousePerLine.append("text")
            .attr("transform", "translate(10,3)")
            .attr("fill", function(d){
                return color(d.ticker);
            });
    
        mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
            .attr("width", width)
            .attr("height", height) // can't catch mouse events on a g element
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mouseout', function() { // on mouse out hide line, circles and text
                d3.select(".mouse-line")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line circle")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line text")
                    .style("opacity", "0");
            })
            .on('mouseover', function() { // on mouse in show line, circles and text
                d3.select(".mouse-line")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line circle")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line text")
                    .style("opacity", "1");
            })
            .on('mousemove', function(event) { // mouse moving over canvas
                var mouse = d3.pointer(event);
                console.log(mouse)
                d3.select(".mouse-line")
                    .attr("d", function() {
                        var d = "M" + mouse[0] + "," + height;
                        d += " " + mouse[0] + "," + 0;
                        return d;
                    });
        
                d3.selectAll(".mouse-per-line")
                    .attr("transform", function(d, i) {
                        console.log(width/mouse[0])
                        var xDate = x.invert(mouse[0]),
                            bisect = d3.bisector(function(d) { return d[i].t; }).right,
                            idx = bisect(mouseData[0], xDate);
                        
                        var beginning = 0,
                            end = lines[i].node().getTotalLength(),
                            target = null;
            
                        while (true){
                            target = Math.floor((beginning + end) / 2);
                            var pos = lines[i].node().getPointAtLength(target);
                            if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                                break;
                            }
                            if (pos.x > mouse[0])      end = target;
                            else if (pos.x < mouse[0]) beginning = target;
                            else break; //position found
                        }
                        
                        d3.select(this).select('text')
                            .text(mouseData[i].ticker + " : " + y.invert(pos.y).toFixed(2));
                            
                        return "translate(" + mouse[0] + "," + pos.y +")";
                    });
                })
                
        })

        var mouseG = svg.append("g")
        .attr("class", "mouse-over-effects");
  
        mouseG.append("path") // this is the black vertical line to follow mouse
            .attr("class", "mouse-line")
            .style("stroke", "white")
            .style("stroke-width", "1px")
            .style("opacity", "0");
            
    
        var mousePerLine = mouseG.selectAll('.mouse-per-line')
            .data(mouseData)
            .enter()
            .append("g")
            .attr("class", "mouse-per-line");
    
        mousePerLine.append("circle")
            .attr("r", 7)
            .style("stroke", function(d) {
                return color(d.ticker);
            })
            .style("fill", "none")
            .style("stroke-width", "1px")
            .style("opacity", "0");
    
        mousePerLine.append("text")
            .attr("transform", "translate(10,3)")
            .attr("fill", function(d){
                return color(d.ticker);
            });
    
        mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
            .attr("width", width)
            .attr("height", height) // can't catch mouse events on a g element
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mouseout', function() { // on mouse out hide line, circles and text
                d3.select(".mouse-line")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line circle")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line text")
                    .style("opacity", "0");
            })
            .on('mouseover', function() { // on mouse in show line, circles and text
                d3.select(".mouse-line")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line circle")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line text")
                    .style("opacity", "1");
            })
            .on('mousemove', function(event) { // mouse moving over canvas
                var mouse = d3.pointer(event);
                console.log(mouse)
                d3.select(".mouse-line")
                    .attr("d", function() {
                        var d = "M" + mouse[0] + "," + height;
                        d += " " + mouse[0] + "," + 0;
                        return d;
                    });
        
                d3.selectAll(".mouse-per-line")
                    .attr("transform", function(d, i) {
                        console.log(width/mouse[0])
                        var xDate = x.invert(mouse[0]),
                            bisect = d3.bisector(function(d) { return d[i].t; }).right,
                            idx = bisect(mouseData[0], xDate);
                        
                        var beginning = 0,
                            end = lines[i].node().getTotalLength(),
                            target = null;
            
                        while (true){
                            target = Math.floor((beginning + end) / 2);
                            var pos = lines[i].node().getPointAtLength(target);
                            if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                                break;
                            }
                            if (pos.x > mouse[0])      end = target;
                            else if (pos.x < mouse[0]) beginning = target;
                            else break; //position found
                        }
                        
                        d3.select(this).select('text')
                            .text(mouseData[i].ticker + " : " + y.invert(pos.y).toFixed(2));
                            
                        return "translate(" + mouse[0] + "," + pos.y +")";
                    });
                })
            })
})




svg.append("text")
    .attr('id', 'ylabel')
    .attr("transform", "rotate(-90)")
    .attr("y", -60)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Closing Price")
    .style("fill", "white");

svg.append("text")
    .attr('id', 'yunit')
    .attr("y", -15)
    .attr("x", -30)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Dollars")
    .style("fill", "white");

svg.append("text")
    .attr('id', 'time')
    .attr("y", height+20)
    .attr("x", width/2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Time")
    .style("fill", "white");