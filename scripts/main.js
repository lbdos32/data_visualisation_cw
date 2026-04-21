import { Treemap } from './Treemap.js';
import Barchart from "./Barchart.js";
import GroupedBarchart from "./GroupedBarchart.js";
import StackedAreaChart from "./StackedAreaChart.js";

Global reference so the barchart can trigger treemap updates ---
let updateTreemapYear = null;

//------------------------- Energy Uses -------------------------------
//Category grouping for industries.
const INDUSTRY_GROUPS = {
  "Primary": [ //raw materials
    "Agriculture, forestry and fishing",
    "Mining and quarrying"
  ],

  "Secondary": [ //manufacturing/processing raw materials
    "Manufacturing",
    "Electricity, gas, steam and air conditioning supply",
    "Water supply; sewerage, waste management and remediation activities",
    "Construction"
  ],

  "Tertiary": [ //service sector
    "Wholesale and retail trade; repair of motor vehicles and motorcycles",
    "Transport and storage",
    "Accommodation and food services",
    "Public administration and defence; compulsory social security",
    "Education",
    "Human health and social work activities",
    "Arts, entertainment and recreation",
    "Other service activities",
    "Real estate activities",
    "Financial and insurance activities",
    "Administrative and support service activities"
  ],

  "Quaternary": [ //research/technology based.
    "Information and communication",
    "Professional, scientific and technical activities",
  ]
};

let barchart1 = new Barchart(
    'div#barchart_energyuse', //id for index.html
    1200, //width
    500, //height
    "Total Energy Use Per Year (Mtoe)", //title
    (selectedKeys) => { //linked highlight between barchart and treemap
        if (updateTreemapYear && selectedKeys.length > 0) {
            updateTreemapYear(selectedKeys[selectedKeys.length - 1]); // use most recently clicked year
        }
    }
);

d3.csv("data/Table1a_Direct_use.csv").then(dataset => {
    const totalData = dataset.map(d => ({
        k: d.Industry,           // industry label
        v: +d.Total || 0         // numeric value
    }));
    console.log(document.querySelector('#barchart_energyuse'));
    console.log(totalData);
    barchart1.render(totalData);

    let groupedChartInitialised = false; // to prevent the grouped chart from rendering multiple times when you go back to barchart

    document.querySelector('#compare-direct-reallocated')
      .addEventListener('click', () => {
        document.getElementById('barchart_energyuse').style.display = 'none';
        document.getElementById('grouped-view').style.display = 'block';
        if (!groupedChartInitialised) {
            showGroupedChart();
            groupedChartInitialised = true;
        }
    });

    document.getElementById('back-to-main')
      .addEventListener('click', () => {
        document.getElementById('grouped-view').style.display = 'none';
        document.getElementById('barchart_energyuse').style.display = 'block';
    });
});


//---------------------- Grouped Area Chart --------------------------

function showGroupedChart() {
    const groupedChart = new GroupedBarchart( 'div#Gbar1', 1200, 500, "A graph to show energy Use (Mtoe)");

    Promise.all([
        d3.csv("data/Table1a_Direct_use.csv"),
        d3.csv("data/Table1b_Reallocated_use.csv")
    ]).then(([direct, reallocated]) => {
        const energyColumns = direct.columns.slice(1, -1);
        let selectedEnergy = energyColumns[0];

        function updateCharts(column) {
            const groupedData = direct.map((d, i) => ({
                k: d.Industry,
                direct: +d[column] || 0,
                reallocated: +reallocated[i][column] || 0
            }));
            groupedChart.render(groupedData);
        }

        function updateChartsForGroup(industriesList) {
            const validIndustries = industriesList.filter(ind => energyColumns.includes(ind));

            const groupedData = direct.map((d, i) => {
                let directSum = 0;
                let reallocSum = 0;

                // Loop through all valid child industries and add them up for this year
                validIndustries.forEach(ind => {
                    directSum += +d[ind] || 0;
                    reallocSum += +reallocated[i][ind] || 0;
                });

                return {
                    k: d.Industry,
                    direct: directSum,
                    reallocated: reallocSum
                };
            });
            groupedChart.render(groupedData);
        }

        // --- Hierarchical buttons ---
        const buttonsContainer = d3.select("#buttons");
        buttonsContainer.html(""); // Clear existing buttons

        Object.entries(INDUSTRY_GROUPS).forEach(([groupName, industries]) => {
            // Group wrapper
            const groupDiv = buttonsContainer.append("div")
                .attr("class", "industry-group");

            // Group header button
            const header = groupDiv.append("button")
                .attr("class", "group-header")
                .text(groupName);

            // Sub-buttons container (hidden by default)
            const subDiv = groupDiv.append("div")
                .attr("class", "sub-buttons")
                .style("display", "none");

            header.on("click", () => {
                // Toggle sub-menu visibility
                const isHidden = subDiv.style("display") === "none";
                subDiv.style("display", isHidden ? "flex" : "none");

                d3.selectAll(".industry-btn, .group-header").classed("active", false);
                d3.select(header.node()).classed("active", true);

                updateChartsForGroup(industries);
            });

            // Industry sub-buttons
            industries
                .filter(industry => energyColumns.includes(industry))
                .forEach(industry => {
                    subDiv.append("button")
                        .attr("class", "industry-btn")
                        .text(industry)
                        .on("click", (event) => {
                            event.stopPropagation();

                            d3.selectAll(".industry-btn, .group-header").classed("active", false);
                            d3.select(event.currentTarget).classed("active", true);

                            updateCharts(industry);
                        });
                });
        });

        // select the first available single industry on load
        updateCharts(energyColumns[0]);
    });
}

//------------------------- Energy Sources -------------------------------

const categories = {
  'Water & wind':       ['Hydroelectric power', 'Wind, wave, tidal'],
  'Solar & geothermal': ['Solar photovoltaic', 'Geothermal aquifers'],
  'Gas':                ['Landfill gas', 'Sewage gas', 'Biogas'],
  'Waste':              ['Municipal solid waste: biomass fraction', 'Non-municipal solid waste: biomass fraction'],
  'Animal & plant':     ['Animal Biomass', 'Plant Biomass', 'Straw'],
  'Wood & derivatives': ['Wood', 'Wood - Dry', 'Wood - Seasoned', 'Wood - Wet', 'Coffee logs', 'Woodchip', 'Wood Pellets', 'Wood Briquettes', 'Charcoal'],
  'Liquid biofuels':    ['Liquid bio-fuels', 'Bioethanol', 'Biodiesel', 'Sustainable Aviation Fuel (SAF) - bio based']
};

const colors = {
  'Water & wind':       { fill: '#B5D4F4', stroke: '#185FA5', text: '#0C447C' },
  'Solar & geothermal': { fill: '#FAC775', stroke: '#BA7517', text: '#633806' },
  'Gas':                { fill: '#9FE1CB', stroke: '#0F6E56', text: '#085041' },
  'Waste':              { fill: '#D3D1C7', stroke: '#5F5E5A', text: '#444441' },
  'Animal & plant':     { fill: '#C0DD97', stroke: '#3B6D11', text: '#27500A' },
  'Wood & derivatives': { fill: '#F5C4B3', stroke: '#993C1D', text: '#712B13' },
  'Liquid biofuels':    { fill: '#CECBF6', stroke: '#534AB7', text: '#3C3489' }
};


//---------------------- Energy Sources Tree Map --------------------------


const myTreemap = new Treemap('#treemap-container', 1200, 500, categories, colors);

d3.csv('data/Table1c_Use_fromsources.csv').then(data => {
  const sel = document.getElementById('year-select');

  // Populate dropdown
  data.forEach(d => {
    const o = document.createElement('option');
    o.value = d.Year; o.textContent = d.Year;
    sel.appendChild(o);
  });

  const update = () => {
    const yearRow = data.find(d => d.Year === sel.value);
    if(yearRow) myTreemap.render(yearRow);
  };

  sel.addEventListener('change', update);
  sel.value = data[data.length - 1].Year;
  update();

  updateTreemapYear = (clickedYear) => {
      const yearExists = data.some(d => d.Year === clickedYear);

      if (yearExists) {
          sel.value = clickedYear;
          update();
      }
  };
});

//---------------------- Energy Sources Stacked Area Chart --------------------------

const stackedArea = new StackedAreaChart('#stacked-area-container', 1200, 500, "Energy Use by Source Over Time (Mtoe)", categories, colors);

d3.csv('data/Table1c_Use_fromsources.csv').then(dataset => {
    const sources = dataset.columns.slice(1, dataset.columns.length - 3);

    dataset.forEach(d => {
        sources.forEach(s => {
            d[s] = d[s] === "[low]" || d[s] === "" ? 0 : +d[s];
        });
    });

    const cleaned = dataset.map(d => {
        const row = { Year: +d.Year };
        sources.forEach(s => row[s] = d[s]);
        return row;
    });

    stackedArea.render(cleaned);
});