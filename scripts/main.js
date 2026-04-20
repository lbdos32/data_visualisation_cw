import Barchart from "./Barchart.js";
import StackedBarchart from "./StackedBarchart.js";
import GroupedBarchart from "./GroupedBarchart.js";
import LineChart from "./LineChart.js";
import MultiLineChart from "./MultiLineChart.js";
import Treemap from './Treemap.js';

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

d3.csv('./data/Table1c_Use_fromsources.csv').then(data => {
  console.log('✅ Loaded energy data:', data.length);

  // These are the source columns to include (skip meta columns)
  const excludedCols = ['Source', 'Energy from renewable & waste sources', 'Total energy consumption of primary fuels and equivalents'];

  // Group sources into categories for a 2-level hierarchy
  const categories = {
    'Water & Wind': ['Hydroelectric power', 'Wind, wave, tidal [note1]'],
    'Solar & Geothermal': ['Solar photovoltaic', 'Geothermal aquifers'],
    'Gas': ['Landfill gas', 'Sewage gas', 'Biogas'],
    'Waste': ['Municipal solid waste: biomass fraction', 'Non-municipal solid waste: biomass fraction'],
    'Animal & Plant': ['Animal Biomass', 'Plant Biomass', 'Straw'],
    'Wood & Derivatives': ['Wood', 'Wood - Dry', 'Wood - Seasoned', 'Wood - Wet', 'Coffee logs', 'Woodchip', 'Wood Pellets', 'Wood Briquettes', 'Charcoal'],
    'Liquid Biofuels': ['Liquid bio-fuels', 'Bioethanol [note 2]', 'Biodiesel [note 2]', 'Sustainable Aviation Fuel (SAF) - bio based']
  };

  // Pick a specific year or sum across all years
  const selectedYear = '2023'; // change this, or loop to animate

  const yearRow = data.find(d => d.Source === selectedYear);

  // Parse value safely (handle '[low]' and missing)
  const parseVal = v => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  // Build hierarchy
  const root = {
    name: 'Renewable Energy',
    children: Object.entries(categories).map(([catName, sources]) => ({
      name: catName,
      children: sources.map(source => ({
        name: source,
        value: parseVal(yearRow?.[source] ?? 0)
      })).filter(d => d.value > 0) // drop zero-value leaves
    })).filter(d => d.children.length > 0) // drop empty categories
  };

  // Build D3 hierarchy
  const hierarchyEnergy = d3.hierarchy(root)
  .sum(d => Math.sqrt(d.value))
  .sort((a, b) => b.value - a.value);

  // Render Treemap
  const treemapChart = new Treemap('div#treemap', 1900, 900);
  treemapChart.render(hierarchyEnergy);
});