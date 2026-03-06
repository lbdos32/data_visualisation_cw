export default class LineChart {
    constructor(container, width, height, chartTitle) {
        this.container = container;
        this.width = width;
        this.height = height;
        this.chartTitle = chartTitle;
        this.margin = { top: 60, right: 150, bottom: 60, left: 60 };

        this.svg = d3.select(container)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.chartGroup = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    }

    render(data) {
        this.chartGroup.selectAll("*").remove(); // clear previous chart

        const chartWidth = this.width;
        const chartHeight = this.height;

        // x-axis = years
        const allYears = data[0].values.map(d => d.year);

        const xScale = d3.scalePoint()
            .domain(allYears)
            .range([0, chartWidth]);

        // y-axis = numeric values across all lines
        const yMax = d3.max(data, line => d3.max(line.values, d => d.value));
        const yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([chartHeight, 0])
            .nice();

        // axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        this.chartGroup.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-45)")
            .attr("font-size", "10px");

        this.chartGroup.append("g")
            .call(yAxis);

        // line generator
        const lineGenerator = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value));

        // draw lines
        this.chartGroup.selectAll(".line")
            .data(data)
            .join("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", d => this.colorScale(d.source))
            .attr("stroke-width", 2)
            .attr("d", d => lineGenerator(d.values))
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke-width", 4);
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("stroke-width", 2);
            });

        // legend
        const legend = this.svg.append("g")
            .attr("transform", `translate(${this.width + this.margin.left + 20}, ${this.margin.top})`);

        data.forEach((d, i) => {
            const g = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            g.append("rect")
                .attr("width", 12)
                .attr("height", 12)
                .attr("fill", this.colorScale(d.source));

            g.append("text")
                .attr("x", 16)
                .attr("y", 10)
                .text(d.source)
                .attr("font-size", "12px")
                .attr("alignment-baseline", "middle");
        });

        // title
        this.svg.append("text")
            .attr("x", (this.width + this.margin.left + this.margin.right) / 2)
            .attr("y", this.margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(this.chartTitle);
    }
}