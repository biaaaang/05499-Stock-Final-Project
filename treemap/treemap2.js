import * as d3 from "d3";
import vegaEmbed from "vega-embed";
import { internalField } from "vega-lite";
import { forEach } from "vega-lite/build/src/encoding";
// import {treemap} from "https://cdn.skypack.dev/d3-hierarchy@3";
// import { saveAs } from 'file-saver';


// // Load "data.csv" and log it to the console.

var margin = {top: 10, right: 100, bottom: 30, left: 100},
    width = 1200 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom;

var svg = d3.select("#svg-div")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");


function color(change){
    if(change < -0.03) return "#F63538";
    else if(change < -0.02) return "#BF4045";
    else if(change < -0.01) return "#8B4441";
    else if(change < 0.01) return "#414554";
    else if(change < 0.02) return "#35764E";
    else if(change < 0.03) return "#2F9E4F";
    else if(change > 0.03) return "#30CC5A";
}



var parseTime1 = d3.timeParse("%Y/%m/%d");
var parseTime2 = d3.timeParse("%Y-%m-%d");
var formatDate = d3.timeFormat("%Y-%m-%d");

var GICSSectors = ["Communication Services", "Utilities", "Industrials", "Consumer Staples", "Financials", "Information Technology", "Materials", "Real Estate", "Comsumer Discretionary", "Health Care", "Energy"]


d3.json("static/MarketCapData.JSON").then(function(data){
    
    var onDate = d3.select("#on-date").property("value")
      
    console.log(data)

    var today = {
        "name": "all",
        "children": []
    };
    
    for(var i = 0; i < data.length; i++){
        if(parseTime1(data[i].date).getTime() === parseTime2(onDate).getTime()){
            for(var k = 0; k < data[i].values.length; k++){
                var temp = {
                    "name": data[i].values[k].GICS,
                    "children": []
                }
                for(var j = 0; j < data[i].values[k].companies.length; j++){
                    var yprice = 1;
                    for(var l = 0; l < data[i-1].values[k].companies.length; l++){
                        if(data[i].values[k].companies[j].symbol == data[i-1].values[k].companies[l].symbol){
                            yprice = +data[i-1].values[k].companies[l].price;
                        }
                    }
                    var temp2 = {
                        "name": data[i].values[k].companies[j].symbol,
                        "marketcap": data[i].values[k].companies[j].marketcap,
                        "change": (+(data[i].values[k].companies[j].price) - yprice)/yprice
                    }
                    temp.children.push(temp2)
                }
                today.children.push(temp)
            }
        }
    }

    console.log(today)


    let hierarchy = d3.hierarchy(today).sum((node) => {
      return node.marketcap
    }).sort((node1, node2) => {
      return node2.marketcap  - node1.marketcap
    })

    console.log(hierarchy)
  

  
    let createTreemap = d3.treemap()
                    .size([1500, 600])
                    .paddingTop(20)
                    .padding(20)
                    .paddingInner(3)
                    .paddingOuter(9)
  
    createTreemap(hierarchy)

    let tiles = hierarchy.leaves()
    console.log(tiles)

    // for(var i = 0; i < tiles.length; i++){
    //     tiles[i] = d3.hierarchy(tiles[i].)
    // }

    var tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("background-color", "purple")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("color", "white")
        .style("opacity", 1)
    

    svg.selectAll("rect")
        .data(tiles)
        .enter()
        .append("rect")
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .style("stroke", "black")
        .style("fill", function(d){return color(d.data.change);})
        .on('mouseover', function(event, node) {
            // var comp = {
            //     "name": "hello",
            //     "marketcap": 2888
            // }
            tooltip
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("left", (d3.pointer(event)[0]+30) + "px")
            .style("top", (d3.pointer(event)[1]+200) + "px")
            // .text(comp.name + " : " + comp.marketcap);

            tooltip.html(`<div>${node.data.name} : ${node.data.marketcap}</div>`)

        })
        .on('mousemove', function(event, node) {
            tooltip
            .style("left", (d3.pointer(event)[0]+30) + "px")
            .style("top", (d3.pointer(event)[1]+200) + "px")
            .style("display", "inline-block")
            // .text(`${comp.name}:${comp.marketcap} `);
            // .text(comp.name + " : " + comp.marketcap);

            tooltip.html(`<div>${node.data.name}, Market Cap ($): ${node.data.marketcap}</div>`)
        
            console.log(node)
        })
        .on('mouseout', function() {
            tooltip
            .transition()
            .duration(200)
            .style("opacity", 0)
        });


        svg.selectAll("text")
        .data(tiles)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr('x', function(d) {return (d.x0+d.x1)/2})
        .attr('y', function(d) {return (d.y0+d.y1)/2})
        .text(function(d) {if(d.x1-d.x0>20 && d.y1-d.y0>20) return d.data.name})
        .attr("font-size", function(d) {return (d.x1-d.x0)/5})
        .attr("fill", "white");
 
     svg.selectAll("text2")
        .data(hierarchy.children)
        .enter()
        .append("text")
        .attr('x', function(d) {return d.x0+10})
        .attr('y', function(d) {return d.y0+5})
        .text(function(d) {if(d.x1-d.x0>20 && d.y1-d.y0>20) return d.data.name})
        .attr("font-size", "18px")
        .attr("fill", "white");


    function update(onDate){
        svg.selectAll("rect").remove()
        today = {
            "name": "all",
            "children": []
        };
        
        for(var i = 0; i < data.length; i++){
            if(parseTime1(data[i].date).getTime() === parseTime2(onDate).getTime()){
                for(var k = 0; k < data[i].values.length; k++){
                    var temp = {
                        "name": data[i].values[k].GICS,
                        "children": []
                    }
                    for(var j = 0; j < data[i].values[k].companies.length; j++){
                        var yprice = 1;
                        for(var l = 0; l < data[i-1].values[k].companies.length; l++){
                            if(data[i].values[k].companies[j].symbol == data[i-1].values[k].companies[l].symbol){
                                yprice = +data[i-1].values[k].companies[l].price;
                            }
                        }
                        var temp2 = {
                            "name": data[i].values[k].companies[j].symbol,
                            "marketcap": data[i].values[k].companies[j].marketcap,
                            "change": (+(data[i].values[k].companies[j].price) - yprice)/yprice
                        }
                        temp.children.push(temp2)
                    }
                    today.children.push(temp)
                }
            }
        }
    
        // for(var i = 0; i < today.length; i++){
        //     today[i].name = today[i].GICS
        //     today[i].children = today[i].companies
        //     for(var j = 0; j < today[i].children.length; j++){
        //         today[i].children[j].name = today[i].children[j].symbol
        //     }
        // }
    
        console.log(today)
    
    
        hierarchy = d3.hierarchy(today).sum((node) => {
          return node.marketcap
        }).sort((node1, node2) => {
          return node2.marketcap  - node1.marketcap
        })
    
        console.log(hierarchy)
      
        createTreemap(hierarchy)
    
        tiles = hierarchy.leaves()
        console.log(tiles)
    
        // for(var i = 0; i < tiles.length; i++){
        //     tiles[i] = d3.hierarchy(tiles[i].)
        // }
    
        svg.selectAll("rect")
        .data(tiles)
        .enter()
        .append("rect")
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .style("stroke", "black")
        .style("fill", function(d){return color(d.data.change);})
        .on('mouseover', function(event, node) {
            tooltip
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("left", (d3.pointer(event)[0]+30) + "px")
            .style("top", (d3.pointer(event)[1]+200) + "px")
            // .text(comp.name + " : " + comp.marketcap);

            tooltip.html(`<div>${node.data.name} : ${node.data.marketcap}</div>`)

        })
        .on('mousemove', function(event, node) {
            tooltip
            .style("left", (d3.pointer(event)[0]+30) + "px")
            .style("top", (d3.pointer(event)[1]+200) + "px")
            .style("display", "inline-block")

            tooltip.html(`<div>${node.data.name}, Market Cap ($): ${node.data.marketcap}</div>`)
        
            console.log(node)
        })
        .on('mouseout', function() {
            tooltip
            .transition()
            .duration(200)
            .style("opacity", 0)
        });

    }



    function dragupdate(i){
        svg.selectAll("rect").remove()
        today = {
            "name": "all",
            "children": []
        };
        
        var date = formatDate(parseTime1(data[i].date));
        console.log(date);

        document.getElementById("on-date").value = date;
        
        for(var k = 0; k < data[i].values.length; k++){
            var temp = {
                "name": data[i].values[k].GICS,
                "children": []
            }
            for(var j = 0; j < data[i].values[k].companies.length; j++){
                var yprice = 1;
                for(var l = 0; l < data[i-1].values[k].companies.length; l++){
                    if(data[i].values[k].companies[j].symbol == data[i-1].values[k].companies[l].symbol){
                        yprice = +data[i-1].values[k].companies[l].price;
                    }
                }
                var temp2 = {
                    "name": data[i].values[k].companies[j].symbol,
                    "marketcap": data[i].values[k].companies[j].marketcap,
                    "change": (+(data[i].values[k].companies[j].price) - yprice)/yprice
                }
                temp.children.push(temp2)
            }
            today.children.push(temp)
        }
    
    
        console.log(today)
    
    
        hierarchy = d3.hierarchy(today).sum((node) => {
          return node.marketcap
        }).sort((node1, node2) => {
          return node2.marketcap  - node1.marketcap
        })
    
        console.log(hierarchy)
      
        createTreemap(hierarchy)
    
        tiles = hierarchy.leaves()
        console.log(tiles)
    
        svg.selectAll("rect")
        .data(tiles)
        .enter()
        .append("rect")
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .style("stroke", "black")
        .style("fill", function(d){return color(d.data.change);})
        .on('mouseover', function(event, node) {
            tooltip
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("left", (d3.pointer(event)[0]+30) + "px")
            .style("top", (d3.pointer(event)[1]+200) + "px")
            // .text(comp.name + " : " + comp.marketcap);

            tooltip.html(`<div>${node.data.name} : ${node.data.marketcap}</div>`)

        })
        .on('mousemove', function(event, node) {
            tooltip
            .style("left", (d3.pointer(event)[0]+30) + "px")
            .style("top", (d3.pointer(event)[1]+200) + "px")
            .style("display", "inline-block")
            // .text(`${comp.name}:${comp.marketcap} `);
            // .text(comp.name + " : " + comp.marketcap);

            tooltip.html(`<div>${node.data.name}, Market Cap ($): ${node.data.marketcap}</div>`)
        
            console.log(node)
        })
        .on('mouseout', function() {
            tooltip
            .transition()
            .duration(200)
            .style("opacity", 0)
        });

    }


    d3.select("#update").on("click", function(d){
        var onDate = d3.select("#on-date").property("value")
        update(onDate)
        svg.selectAll("text")
           .remove()
        
        svg.selectAll("text")
        .data(tiles)
        .enter()
        .append("text")
        .attr('x', function(d) {return d.x0+5})
        .attr('y', function(d) {return (d.y0+d.y1)/2})
        .text(function(d) {if(d.x1-d.x0>30 && d.y1-d.y0>30) return d.data.name})
        .attr("font-size", "10px")
        .attr("fill", "white")   

        svg.selectAll("text2")
       .data(hierarchy.children)
       .enter()
       .append("text")
       .attr('x', function(d) {return d.x0+5})
       .attr('y', function(d) {return d.y0+20})
       .text(function(d) {if(d.x1-d.x0>20 && d.y1-d.y0>20) return d.data.name})
       .attr("font-size", "20px")
       .attr("fill", "white");
    })

    var slider = document.getElementById("myRange");
    var output = 0;
    output = slider.value; // Display the default slider value

    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
        output = this.value;
        console.log(output)
        dragupdate(output);

        svg.selectAll("text")
           .remove()
        

       svg.selectAll("text")
        .data(tiles)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr('x', function(d) {return (d.x0+d.x1)/2})
        .attr('y', function(d) {return (d.y0+d.y1)/2})
        .text(function(d) {if(d.x1-d.x0>20 && d.y1-d.y0>20) return d.data.name})
        .attr("font-size", function(d) {return (d.x1-d.x0)/5})
        .attr("fill", "white");
 
     svg.selectAll("text2")
        .data(hierarchy.children)
        .enter()
        .append("text")
        .attr('x', function(d) {return d.x0+10})
        .attr('y', function(d) {return d.y0+5})
        .text(function(d) {if(d.x1-d.x0>20 && d.y1-d.y0>20) return d.data.name})
        .attr("font-size", "18px")
        .attr("fill", "white");
    }


})