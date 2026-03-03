import Barchart from "./Barchart.js";
'use strict';

let barchart1 = new Barchart('div#bar1', 1200, 500, "Total Direct Energy Use Per Year");
d3.csv("data/Table1a_Direct_use.csv").then(dataset => {

    const totalData = dataset.map(d => ({
        k: d.Industry,           // year label
        v: +d.Total || 0         // numeric value
    }));
    console.log(totalData);
    barchart1.render(totalData);
});

let barchart2 = new Barchart('div#bar2', 1200, 500, "Reallocated Energy Use Per Year");
d3.csv("data/Table1b_Reallocated_use.csv").then(dataset => {
    const totalData = dataset.map(d => ({
        k: d.Industry,   // year label
        v: +d.Total || 0 // numeric value
    }));
    console.log(totalData);
    barchart2.render(totalData);
});