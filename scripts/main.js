import { Treemap } from './Treemap.js';
import Barchart from "./Barchart.js";




// 1. Set graph dimensions to be uniform.
const width = 1200;
const height = 500;


let barchart1 = new Barchart('div#barchart_energyuse', width, height, "Total Energy Use Per Year (Mtoe)");
d3.csv("data/Table1a_Direct_use.csv").then(dataset => {
    const totalData = dataset.map(d => ({
        k: d.Industry,           // year label
        v: +d.Total || 0         // numeric value
    }));
    console.log(document.querySelector('#barchart_energyuse'));
    console.log(totalData);
    barchart1.render(totalData);
    document.querySelector('#barchart_energyuse')
      .addEventListener('click', () => {
        window.location.href = 'energy.html';
      });
});







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
const myTreemap = new Treemap('#treemap-container', width, height, categories, colors);

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