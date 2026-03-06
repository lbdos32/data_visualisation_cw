import Barchart from "./Barchart.js";
import StackedBarchart from "./StackedBarchart.js";
import GroupedBarchart from "./GroupedBarchart.js";
import LineChart from "./LineChart.js";
import MultiLineChart from "./MultiLineChart.js";
//import the reusable chart classes
'use strict';
//global function for linked-highlight between my barcharts
function updateLinkedCharts(selectedKeys) {
    barchart1.selectedKeys = selectedKeys;
    barchart2.selectedKeys = selectedKeys;
    // re-render all charts
    barchart1.render(barchart1.data);
    barchart2.render(barchart2.data);
    }

let barchart1 = new Barchart('div#bar1', 1200, 500, "Total Direct Energy Use Per Year (Mtoe)", updateLinkedCharts);
d3.csv("data/Table1a_Direct_use.csv").then(dataset => {
    const totalData = dataset.map(d => ({
        k: d.Industry,           // year label
        v: +d.Total || 0         // numeric value
    }));
    console.log(totalData);
    barchart1.render(totalData);
});
let barchart2 = new Barchart('div#bar2', 1200, 500, "Reallocated Energy Use Per Year (Mtoe)", updateLinkedCharts );
d3.csv("data/Table1b_Reallocated_use.csv").then(dataset => {
    const totalData = dataset.map(d => ({
        k: d.Industry,   // year label
        v: +d.Total || 0 // numeric value
    }));
    console.log(totalData);
    barchart2.render(totalData);
});
//let stackedChart = new StackedBarchart('div#Sbar1', 1200, 500, "Stacked bar Test"); //if added back remember to add div in index.html
let groupedChart = new GroupedBarchart('div#Gbar1', 1200, 500, "A graph to show energy Use (Mtoe)");
Promise.all([
    d3.csv("data/Table1a_Direct_use.csv"),
    d3.csv("data/Table1b_Reallocated_use.csv")
]).then(([direct, reallocated]) => {
    const energyColumns = direct.columns.slice(1, -1);
    let selectedEnergy = energyColumns[0]; //array for which category is showing
    function updateCharts(column) {
        const groupedData = direct.map((d, i) => ({
            k: d.Industry,
            direct: +d[column] || 0,
            reallocated: +reallocated[i][column] || 0
        }));
       // stackedChart.render(cleaned);
        groupedChart.render(groupedData);
    }
    updateCharts(selectedEnergy); //changes chart to new one
    d3.select("#buttons")
        .selectAll("button")
        .data(energyColumns)
        .join("button")
        .text(d => d)
        .on("click", (event, column) => {
            updateCharts(column);
        });
});
let MultiLinechart1 = new MultiLineChart('div#Multiline1', 1200, 500, "Top 10 Energy Sources 1990-2023 (Mtoe)");
d3.csv("data/Table1c_Use_fromsources.csv").then(dataset => {
const sources = dataset.columns.slice(1, dataset.columns.length - 3);
    // clean values
    dataset.forEach(d => {
        sources.forEach(s => {
            d[s] = d[s] === "[low]" || d[s] === "" ? 0 : +d[s];
        });
    });
    // aggregate totals
    const totals = sources.map(s => ({
        source: s,
        total: d3.sum(dataset, d => d[s])
    }));

    // top x sources
    const topSources = totals
        .sort((a,b) => b.total - a.total)
        .slice(0,3) //change to filter top x sources
        .map(d => d.source);
    const lineData = topSources.map(source => ({
        source: source,
        values: dataset.map(d => ({
            year: d.Source,
            value: d[source]
        }))
    }));
    MultiLinechart1.render(lineData);
});

let linechart1 = new LineChart('div#line1', 1200, 500, "Reallocated Energy Use Per Year (Mtoe)");
d3.csv("data/Table1b_Reallocated_use.csv").then(dataset => {
    const totalData = dataset.map(d => ({
        k: d.Industry,   // year label
        v: +d.Total || 0 // numeric value
    }));
    console.log(totalData);
    linechart1.render(totalData)
});

