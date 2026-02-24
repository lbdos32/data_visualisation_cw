import Barchart from "./Barchart.js";
'use strict';

let barchart1 = new Barchart('div#bar1', 1200, 500, "Industry Direct Use 1990");

d3.csv("data/Table1a_Direct_use.csv").then(dataset => {

    // Pick the row for 1990
    const row = dataset.find(d => d.Industry === "1990");

    // Get all columns except the first (Industry) and last (Total)
    const columns = dataset.columns.slice(1, -1);

    // Map data, convert non-numeric to 0
    const barData = columns.map(col => ({
        k: col,
        v: isNaN(+row[col]) ? 0 : +row[col]
    }));

    console.log(barData); // verify the array

    // Render the chart
    barchart1.render(barData);
});