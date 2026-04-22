import { Treemap } from './Treemap.js';
import Barchart from "./Barchart.js";
import GroupedBarchart from "./GroupedBarchart.js";
import StackedAreaChart from "./StackedAreaChart.js";

//Global reference so the barchart can trigger treemap updates ---
let updateTreemapYear = null;


function attachTippy(selection, contentFn, options = {}) {
    selection.each(function(d) {
        const el = this;
        const content = contentFn(d);

        // If Tippy already exists on this element, update it
        if (el._tippy) {
            el._tippy.setContent(content);
        } else {
            tippy(el, {
                content,
                theme: 'light',
                placement: 'top',
                animation: 'scale',
                arrow: true,
                allowHTML: true,
                ...options
            });
        }
    });
}

//------------------------- Energy Uses -------------------------------
const INDUSTRY_GROUPS = {
  "Primary": [
    "Agriculture, forestry and fishing",
    "Mining and quarrying"
  ],
  "Secondary": [
    "Manufacturing",
    "Electricity, gas, steam and air conditioning supply",
    "Water supply; sewerage, waste management and remediation activities",
    "Construction"
  ],
  "Tertiary": [
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
  "Quaternary": [
    "Information and communication",
    "Professional, scientific and technical activities",
  ]
};

let barchart1 = new Barchart(
    'div#barchart_energyuse',
    1200,
    500,
    "A Bar Chart To Show The Total Renewable Energy Use (Mtoe)  Per Year (1990 - 2023)",
    (selectedKeys) => {
        if (updateTreemapYear && selectedKeys.length > 0) {
            updateTreemapYear(selectedKeys[selectedKeys.length - 1]);
        }
    }
);

d3.csv("data/Table1a_Direct_use.csv").then(dataset => {
    const totalData = dataset.map(d => ({
        k: d.Industry,
        v: +d.Total || 0
    }));
    barchart1.render(totalData);

    let groupedChartInitialised = false;

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


//---------------------- Grouped Bar Chart --------------------------

function showGroupedChart() {
    const groupedChart = new GroupedBarchart(
        'div#Gbar1',
        1200,
        500,
        "A Grouped Bar Chart To Compare Direct and Reallocated Renewable Energy Use (Mtoe) Per Year (1990 - 2023)"
    );

    Promise.all([
        d3.csv("data/Table1a_Direct_use.csv"),
        d3.csv("data/Table1b_Reallocated_use.csv")
    ]).then(([direct, reallocated]) => {
        const energyColumns = direct.columns.slice(1, -1);

        function attachGroupedTippy() {
            attachTippy(
                d3.select('#Gbar1').selectAll('rect'),
                d => {
                    const val  = d.value != null ? (+d.value).toFixed(2) : '0.00';
                    return `<b>${val} Mtoe</b>`; //adds the relevant MTOE to the bar when hover.
                },
                { placement: 'top', theme: 'light' }
            );
        }

        function updateCharts(column) {
            const groupedData = direct.map((d, i) => ({
                k: d.Industry,
                direct: +d[column] || 0,
                reallocated: +reallocated[i][column] || 0
            }));
            groupedChart.render(groupedData);
            attachGroupedTippy();
        }

        function updateChartsForGroup(industriesList) {
            const validIndustries = industriesList.filter(ind => energyColumns.includes(ind));
            const groupedData = direct.map((d, i) => {
                let directSum = 0;
                let reallocSum = 0;
                validIndustries.forEach(ind => {
                    directSum  += +d[ind] || 0;
                    reallocSum += +reallocated[i][ind] || 0;
                });
                return { k: d.Industry, direct: directSum, reallocated: reallocSum };
            });
            groupedChart.render(groupedData);
            attachGroupedTippy();
        }

        // --- Hierarchical buttons ---
        const buttonsContainer = d3.select("#buttons");
        buttonsContainer.html("");

        Object.entries(INDUSTRY_GROUPS).forEach(([groupName, industries]) => {
            const groupDiv = buttonsContainer.append("div")
                .attr("class", "industry-group");

            const header = groupDiv.append("button")
                .attr("class", "group-header")
                .text(groupName);

            const subDiv = groupDiv.append("div")
                .attr("class", "sub-buttons")
                .style("display", "none");

            header.on("click", () => {
                const isHidden = subDiv.style("display") === "none";
                subDiv.style("display", isHidden ? "flex" : "none");
                d3.selectAll(".industry-btn, .group-header").classed("active", false);
                d3.select(header.node()).classed("active", true);
                updateChartsForGroup(industries);
            });
            industries
                .filter(industry => energyColumns.includes(industry))
                .forEach(industry => {
                    const btn = subDiv.append("button")
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
//colours done by AI
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

  data.forEach(d => {
    const o = document.createElement('option');
    o.value = d.Year; o.textContent = d.Year;
    sel.appendChild(o);
  });

  const update = () => {
    const yearRow = data.find(d => d.Year === sel.value);
    if (yearRow) {
        myTreemap.render(yearRow);
    }
  };

  sel.addEventListener('change', update);
  sel.value = data[data.length - 1].Year;
  update();

  // Tippy on the year dropdown
  tippy('#year-select', {
      content: 'Select a year to update the treemap',
      theme: 'light',
      placement: 'right',
      animation: 'scale'
  });

  updateTreemapYear = (clickedYear) => {
      const yearExists = data.some(d => d.Year === clickedYear);
      if (yearExists) {
          sel.value = clickedYear;
          update();
      }
  };
});

//---------------------- Energy Sources Stacked Area Chart --------------------------

const stackedArea = new StackedAreaChart(
    '#stacked-area-container',
    1200,
    500,
    "A Stacked Area Chart To Show Renewable Energy Sources (Mtoe), Over Time (1990 - 2023)",
    categories,
    colors
);

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