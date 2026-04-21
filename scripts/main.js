import { Treemap } from './Treemap.js';
import Barchart from "./Barchart.js";
import GroupedBarchart from "./GroupedBarchart.js";



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

let barchart1 = new Barchart('div#barchart_energyuse', 1200, 500, "Total Energy Use Per Year (Mtoe)");
d3.csv("data/Table1a_Direct_use.csv").then(dataset => {
    const totalData = dataset.map(d => ({
        k: d.Industry,           // year label
        v: +d.Total || 0         // numeric value
    }));
    console.log(document.querySelector('#barchart_energyuse'));
    console.log(totalData);
    barchart1.render(totalData);
    let groupedChartInitialised = false; // to prevent the grouped chart from rendering multiple times when you go back to barchart

    document.querySelector('#barchart_energyuse')
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

function showGroupedChart() {

    const groupedChart = new GroupedBarchart(
        'div#Gbar1',
        1200,
        500,
        "A graph to show energy Use (Mtoe)"
    );

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

        // --- Hierarchical buttons ---
        const buttonsContainer = d3.select("#buttons");
        buttonsContainer.html(""); // Clear existing buttons

        Object.entries(INDUSTRY_GROUPS).forEach(([groupName, industries]) => {

            // Group wrapper
            const groupDiv = buttonsContainer.append("div")
                .attr("class", "industry-group");

            // Group header button (toggles sub-buttons visibility)
            const header = groupDiv.append("button")
                .attr("class", "group-header")
                .text(groupName);

            // Sub-buttons container (hidden by default)
            const subDiv = groupDiv.append("div")
                .attr("class", "sub-buttons")
                .style("display", "none");

            // Toggle sub-buttons on header click
            header.on("click", () => {
                const isHidden = subDiv.style("display") === "none";
                subDiv.style("display", isHidden ? "flex" : "none");
            });

            // Industry sub-buttons — only show if they exist as energy columns
            industries
                .filter(industry => energyColumns.includes(industry))
                .forEach(industry => {
                    subDiv.append("button")
                        .attr("class", "industry-btn")
                        .text(industry)
                        .on("click", (event) => {
                            event.stopPropagation(); // Prevent header toggle
                            d3.selectAll(".industry-btn").classed("active", false);
                            d3.select(event.currentTarget).classed("active", true);
                            updateCharts(industry);
                        });
                });
        });

        // Auto-select first available industry
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

// 2. Initialize Class
const myTreemap = new Treemap('#treemap-container', 1200, 500, categories, colors);

// 3. Load Data and Render
d3.csv('data/Table1c_Use_fromsources.csv').then(data => {
  const sel = document.getElementById('year-select');

  // Populate dropdown
  data.forEach(d => {
    const o = document.createElement('option');
    o.value = d.Year; o.textContent = d.Year;
    sel.appendChild(o);
  });

  // Initial Render
  const update = () => {
    const yearRow = data.find(d => d.Year === sel.value);
    myTreemap.render(yearRow);
  };

  sel.addEventListener('change', update);
  sel.value = data[data.length - 1].Year;
  update();
});