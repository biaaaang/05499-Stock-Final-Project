import * as d3 from "d3";
import vegaEmbed from "vega-embed";
import { internalField } from "vega-lite";


// // Load "data.csv" and log it to the console.

var margin = {top: 10, right: 100, bottom: 30, left: 70},
    width = 900 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var svg = d3.select("#svg-div")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

var bar = d3.select("#bar-div")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");


var parseTime = d3.timeParse("%Y-%m-%d");
var parseMonth = d3.timeParse("%Y-%m");

var dataPrime = null

function calculateDataPrime(data) {
  return data.map((d, i) => {
    let new_data = {}
    for (let field of Object.keys(d)) {
      if (field == 'Date') {
        new_data[field] = d['Date']
        continue
      }
      if (i == 0) {
        new_data[field] = 0
      } else {
        new_data[field] = data[i][field] - data[i - 1][field]
      }
    }
    return new_data
  })
}

// Load Data
d3.csv("static/SP500_data.csv").then((data) => {

  dataPrime = calculateDataPrime(data)

  var allGroup = ["Dividend", "Earnings", "ConsumerPriceIndex","SP500"]

  d3.select("#selectButton")
    .selectAll('myOptions')
    .data(allGroup)
    .enter()
    .append('option')
    .text(function(d){return d;})
    .attr("value", function(d){return d;})

  var color = d3.scaleOrdinal()
    .domain(allGroup)
    .range(d3.schemeSet2);

  var x = d3.scaleTime()
    .domain(d3.extent(data, (d) => (parseTime(d.Date))))
    .range([0, width])
  svg.append('g').attr('id','xaxis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x).ticks(10));

  var y = d3.scaleLinear()
    .domain([0, d3.max(data, (d) => (+d.Dividend))])
    .range([height, 0])
  svg.append('g').attr('id', 'yaxis')
    .call(d3.axisLeft(y))


  var line = svg
    .append('g')
    .append("path")
      .datum(data)
      .attr("d", d3.line()
        .x(function(d){return x(parseTime(d.Date))})
        .y(function(d){return y(d.Dividend)})
      )
      .attr("stroke", function(d){return color("Dividend")})
      .style("stroke-width",4)
      .style("fill", "none")


  /* new graph
   */

  var newx = d3.scaleTime()
    .domain(d3.extent(dataPrime, (d) => (parseTime(d.Date))))
    .range([0, width])
  bar.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(newx).ticks(10));

  var newy = d3.scaleLinear()
    //.domain(d3.extent(data, (d) => (d[selectedGroup])))
    .domain([d3.min(dataPrime, (d) => (d.Dividend)), d3.max(dataPrime, (d) => (d.Dividend))])
    .range([0.5 * height, 0.5 * -height])

  bar.append('g')
    .call(d3.axisLeft().scale(newy))
    .attr('transform', 'translate(0,' + (0.5 * height) + ')')

  var bar_graph = bar
      .append('g')
      .append("path")
        .datum(dataPrime)
        .attr("d", d3.area()
          .x((d) => newx(parseTime(d.Date)))
          .y((d) => newy(d.Dividend))
        )
        //.attr('transform', 'translate(0,' + (-0.5 * height) + ')')
        .attr("stroke", function(d){return color("Dividend")})
        .style("stroke-width",4)
        //.style("fill", "none")
        .attr('transform', 'translate(0,' + (0.5 * height) + ')')
        .append("g")
        .append('rect')
        .attr('id', 'fill')
        .attr('fill', (d, i) => {
          if (i === 0) {
          return '#03a678';
        } else {
          return dataPrime[i - 1].Dividend > d.Dividend ? '#c0392b' : '#03a678';
        }
        })
        .attr('transform', 'translate(0,' + (0.5 * height) + ')')
  /*
      .selectAll()
      .data(dataPrime)
      .enter()
      .append("g")
      .append('rect')
      .attr('id', 'fill')
      .attr('x', d => {
        return x(parseTime(d.Date));
      })
      .attr('y', d => {
        return newy;
      })
      .attr('fill', (d, i) => {
        if (i === 0) {
        return '#03a678';
      } else {
        return dataPrime[i - 1].Dividend > d.Dividend ? '#c0392b' : '#03a678';
      }
      })
      .attr('width', 1)

      .attr('height', (d) => {
          return 20
          //return height - yVolumeScale(d["Dividend"]);
      })
      .attr('transform', 'translate(0,' + (0.5 * height) + ')')
      */

  function update(selectedGroup){
      //var dataFilter = data.map(function(d){return {Date: d.Date, value: d[selectedGroup]}})

      y.domain([0, d3.max(data, (d) => (+d[selectedGroup]))])

      d3.select('#yaxis').remove();
      d3.select('#ylabel').remove();
      d3.select('#xaxis').remove();

      svg
        .append('g').attr('id', 'yaxis')
        .call(d3.axisLeft(y))

      svg.append("text")
        .attr('id', 'ylabel')
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(selectedGroup);

      svg.append("text")
        .attr('id', 'yunit')
        .attr("y", -15)
        .attr("x", -30)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Dollars");

      line
        //.datum(dataFilter)
        .transition()
        .duration(1000)
        .attr("d", d3.line()
          .x(function(d) {return x(parseTime(d.Date))})
          .y(function(d) {return y(d[selectedGroup])})
        )
        .attr("stroke", function(d) {return color(selectedGroup)})

  }


  function newDate(fromMonth, toMonth, selectedGroup){

    var newData = data;

    newData = data.filter(function(d) {
      return (d3.timeMonth(parseTime(d.Date)) >= d3.timeMonth(parseMonth(fromMonth)))
            && (d3.timeMonth(parseTime(d.Date)) <= d3.timeMonth(parseMonth(toMonth)));
    });

    console.log(newData);

    x.domain(d3.extent(newData, (d) => (parseTime(d.Date))))
    y.domain([d3.min(newData, (d) => (+d[selectedGroup])), d3.max(newData, (d) => (+d[selectedGroup]))])

    d3.select('#yaxis').remove();
    d3.select('#xaxis').remove();
    d3.select('#ylabel').remove();
    d3.select('#yunit').remove();

    svg
      .append('g').attr('id', 'yaxis')
      .call(d3.axisLeft(y));
    svg
      .append('g').attr('id', 'xaxis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x).ticks(10));

    line
      .datum(newData)
      .transition()
      .duration(1000)
      .attr("d", d3.line()
        .x(function(d) {return x(parseTime(d.Date))})
        .y(function(d) {return y(d[selectedGroup])})
      )
      .attr("stroke", function(d) {return color(selectedGroup)})

    svg.append("text")
        .attr('id', 'ylabel')
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(selectedGroup);

      svg.append("text")
        .attr('id', 'yunit')
        .attr("y", -15)
        .attr("x", -30)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Dollars");

  }

  d3.select("#selectButton").on("change", function(d){
    var fromMonth = d3.select("#from-month").property("value")
    var toMonth = d3.select("#to-month").property("value")
    if (toMonth < fromMonth){
      return;
    }
    var selectedOption = d3.select(this).property("value")
    update(selectedOption)
    newDate(fromMonth, toMonth, selectedOption)
  })

  d3.select("#update").on("click", function(d){
    var fromMonth = d3.select("#from-month").property("value")
    var toMonth = d3.select("#to-month").property("value")
    if (toMonth < fromMonth){
      return;
    }
    var selectedOption = d3.select("#selectButton").property("value")
    newDate(fromMonth, toMonth, selectedOption)
  })
})
