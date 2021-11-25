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


var dataPrime = null


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

    // for(var i = 0; i < today.length; i++){
    //     today[i].name = today[i].GICS
    //     today[i].children = today[i].companies
    //     for(var j = 0; j < today[i].children.length; j++){
    //         today[i].children[j].name = today[i].children[j].symbol
    //     }
    // }

    console.log(today)


    let hierarchy = d3.hierarchy(today).sum((node) => {
      return node.marketcap
    }).sort((node1, node2) => {
      return node2.marketcap  - node1.marketcap
    })

    console.log(hierarchy)
  

  
    let createTreemap = d3.treemap()
                    .size([1000, 600])
                    .padding(2)
  
    createTreemap(hierarchy)

    let tiles = hierarchy.leaves()
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
            .transition(1000)
    }


    d3.select("#update").on("click", function(d){
        var onDate = d3.select("#on-date").property("value")
        update(onDate)
    })

    // let tooltip = d3.select('#tooltip')
  
    // let block = svg.selectAll('g')
    //               .data(tiles)
    //               .enter()
    //               .append('g')
    //               .attr('transform', (Node) =>{
    //                 return 'translate(' + Node['x0'] + ', ' + Node['y0'] + ')'
    //               })
  
    // block.append('rect')
    //       .attr('class', 'tile')
    //       .attr('fill', (Node)=>{
    //         return color(Node.data.GICS)
    //       })
    //       .attr('width', (Node) => {
    //         return Node['x1'] - Node['x0']
    //       })
    //       .attr('height', (Node) => {
    //         return Node['y1'] - Node['y0']
    //       })
    
    // block.append('text')
    //      .text((Node) => {
    //        return Node.data.GICS
    //      })
    //      .attr('x', 5)
    //      .attr('y',30)
  
  
    //      .on('mouseover', (Node) => {
    //        tooltip.transition()
    //               .style('visibility', 'visible')
    //        tooltip.text(
    //          Node.data.GICS + ' : $' + Node.data.total
    //        )
    //        })
    //      .on('mouseout', (Node) => {
    //        tooltip.transition()
    //               .style('visibility', 'hidden')
    //      })
  
})