export default class StackedAreaChart {
    constructor(container, width, height, chartTitle, categories = null, colors = null) {
        this.container = container;
        this.width = width;
        this.height = height;
        this.chartTitle = chartTitle;
        this.categories = categories;
        this.colors = colors;
        this.margin = { top: 60, right: 180, bottom: 60, left: 70 };

        this.svg = d3.select(container)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.chartGroup = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "stacked-area-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0,0,0,0.78)")
            .style("color", "#fff")
            .style("padding", "8px 12px")
            .style("border-radius", "6px")
            .style("font-size", "13px")
            .style("pointer-events", "none")
            .style("opacity", 0);
    }

    render(data) {
        this.chartGroup.selectAll("*").remove();
        this.svg.selectAll(".chart-title").remove();

        const chartWidth  = this.width  - this.margin.left - this.margin.right;
        const chartHeight = this.height;
        const self = this;

        // --- Aggregate into categories if provided ---
        let keys, parsed, colorFn;

        if (this.categories) {
            // Sum subcategory columns into their parent category per row
            keys = Object.keys(this.categories);

            parsed = data.map(d => {
                const row = { year: +d.Year };
                keys.forEach(cat => {
                    const subSources = this.categories[cat];
                    row[cat] = d3.sum(subSources, s => +d[s] || 0);
                });
                return row;
            });

            // Use the matching fill colours from the colors object
            colorFn = key => this.colors[key]?.fill || "#ccc";

        } else {
            keys = Object.keys(data[0]).filter(k => k !== "Year" && k !== "Source");
            parsed = data.map(d => {
                const row = { year: +d.Year };
                keys.forEach(k => row[k] = +d[k] || 0);
                return row;
            });
            colorFn = d3.scaleOrdinal().domain(keys).range(d3.schemeTableau10);
        }

        const stack   = d3.stack().keys(keys).order(d3.stackOrderNone).offset(d3.stackOffsetNone);
        const stacked = stack(parsed);

        const years  = parsed.map(d => d.year);
        const xScale = d3.scaleLinear()
            .domain(d3.extent(years))
            .range([0, chartWidth]);

        const yMax   = d3.max(stacked, layer => d3.max(layer, d => d[1]));
        const yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([chartHeight, 0]);

        const area = d3.area()
            .x(d => xScale(d.data.year))
            .y0(d => yScale(d[0]))
            .y1(d => yScale(d[1]))
            .curve(d3.curveMonotoneX);

        // --- Draw layers ---
        this.chartGroup.selectAll(".area-layer")
            .data(stacked)
            .join("path")
            .attr("class", "area-layer")
            .attr("fill", d => colorFn(d.key))
            .attr("stroke", d => this.colors?.[d.key]?.stroke || "none")
            .attr("stroke-width", 0.8)
            .attr("opacity", 0.85)
            .attr("d", area)
            .on("mousemove", function(event, d) {
                const [mx]  = d3.pointer(event, self.chartGroup.node());
                const year  = Math.round(xScale.invert(mx));
                const row   = parsed.find(r => r.year === year);
                const val   = row ? row[d.key].toFixed(2) : "N/A";

                self.tooltip
                    .style("opacity", 1)
                    .html(`<strong>${d.key}</strong><br>Year: ${year}<br>Value: ${val} Mtoe`)
                    .style("left", (event.pageX + 14) + "px")
                    .style("top",  (event.pageY - 28) + "px");

                d3.select(this).attr("opacity", 1).attr("stroke-width", 2);
            })
            .on("mouseleave", function(event, d) {
                self.tooltip.style("opacity", 0);
                d3.select(this)
                    .attr("opacity", 0.85)
                    .attr("stroke-width", 0.8);
            });

        // --- Axes ---
        this.chartGroup.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(years.length))
            .selectAll("text")
            .attr("font-size", "11px");

        this.chartGroup.append("g")
            .call(d3.axisLeft(yScale))
            .selectAll("text")
            .attr("font-size", "11px");

        // Y-axis label
        this.chartGroup.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -chartHeight / 2)
            .attr("y", -55)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#555")
            .text("Energy Use (Mtoe)");

        // --- Legend ---
        const legend = this.chartGroup.append("g")
            .attr("transform", `translate(${chartWidth + 20}, 0)`);

        keys.forEach((key, i) => {
            const row = legend.append("g")
                .attr("transform", `translate(0, ${i * 22})`);

            row.append("rect")
                .attr("width", 14)
                .attr("height", 14)
                .attr("fill", colorFn(key))
                .attr("stroke", this.colors?.[key]?.stroke || "none")
                .attr("stroke-width", 1)
                .attr("opacity", 0.85);

            row.append("text")
                .attr("x", 20)
                .attr("y", 11)
                .attr("font-size", "11px")
                .attr("fill", this.colors?.[key]?.text || "#333")
                .text(key);
        });

        // --- Title ---
        this.svg.append("text")
            .attr("class", "chart-title")
            .attr("x", (this.width - this.margin.right) / 2)
            .attr("y", this.margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(this.chartTitle);
    }
}