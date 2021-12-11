// ------- Scroll reveal animation -------
const sr = ScrollReveal({
    distance: "30px",
    duration: 1800,
    reset: true,
});

sr.reveal(
    `.home__data, .map_container,
            .scatter_container,
            .sunburst_container`,
    {
        origin: "top",
        interval: 200,
    }
);

sr.reveal(`h2`, {
    origin: "left",
});
// ____________________ streamgraph __________________________________________

let box_stream = document.querySelector(".scatter_card");
var width_stream = 920;
var height_stream = 320;
var margin = { top: 10, right: 10, bottom: 10, left: 10 };

var country_select = "World";

function updateStream(country_select) {
    d3.select("#stream g").remove();
    d3.select("#stream g").remove();

    var svg_stream = d3
        .select("#stream")
        .attr("width", width_stream + margin.left + margin.right)
        .attr("height", height_stream + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var dataCsv = d3.csv("ghg_streamgraph.csv");
    dataCsv.then(function (data) {
        country_data = data.filter(function (d) {
            return d.Country == country_select;
        });
        country_data.columns = data.columns;
        var keys = country_data.columns.slice(2);

        //add x axis
        var x = d3
            .scaleLinear()
            .domain(
                d3.extent(data, function (d) {
                    return d.Year;
                })
            )
            .range([0, width_stream]);
        svg_stream
            .append("g")
            .attr("transform", "translate(0, " + height_stream * 0.8 + ")")
            .call(
                d3
                    .axisBottom(x)
                    .tickValues([
                        1860, 1880, 1900, 1920, 1940, 1960, 1980, 2000, 2017,
                    ])
                    .tickFormat(d3.format("d"))
            )
            .select(".domain")
            .remove();

        svg_stream.selectAll(".tick line").attr("stroke", "#b8b8b8");

        svg_stream
            .append("text")
            .attr("text-anchor", "end")
            .attr("x", width_stream)
            .attr("y", height_stream - 20)
            .text("Year");

        var y = d3
            .scaleLinear()
            .domain([
                d3.min(country_data, function (d) {
                    return (
                        -1 *
                        Math.max(
                            Math.abs(d["CO2"]),
                            Math.abs(d["CH4"]),
                            Math.abs(d["N2O"]),
                            Math.abs(d["F-Gas"])
                        )
                    );
                }),
                d3.max(country_data, function (d) {
                    return Math.max(
                        Math.abs(d["CO2"]),
                        Math.abs(d["CH4"]),
                        Math.abs(d["N2O"]),
                        Math.abs(d["F-Gas"])
                    );
                }),
            ])
            .range([height_stream - 10, 0]);
        //stack the data
        var stackData = d3.stack().offset(d3.stackOffsetSilhouette).keys(keys)(
            country_data
        );
        //data tool tip
        var Tooltip = svg_stream
            .append("text")
            .attr("x", 5)
            .attr("y", 20)
            .style("opacity", 0)
            .style("font-size", 17);

        /// vertical line
        // var vertical = d3
        //     .select(".scatter_card")
        //     .append("div")
        //     .attr("class", "remove")
        //     .style("position", "absolute")
        //     .style("z-index", "19")
        //     .style("width", "2px")
        //     .style("height", "240px")
        //     .style("top", "100px")
        //     .style("bottom", "0px")
        //     .style("left", "0px")
        //     .style("background", "#fff");

        //interactions
        const mouseover = function (d) {
            Tooltip.style("opacity", 1);
            // vertical.style("left", d3.mouse(this)[0] + 8 + "px");
            d3.selectAll(".myArea").style("opacity", 0.2);
            d3.select(this).style("stroke", "black").style("opacity", 1);
            d3.select(this).style("cursor", "crosshair");
        };

        const mousemove = function (d, i) {
            grp = keys[i];
            mouse = d3.mouse(this);
            mousex = mouse[0];
            var invertedx = x.invert(mousex);
            var xDate = Math.round(invertedx);
            Tooltip.text(
                grp +
                    " levels in " +
                    xDate +
                    " were " +
                    d3.format(".1f")(country_data[2018 - xDate][keys[i]]) +
                    " MtCO2e"
            );
            // vertical.style("left", d3.mouse(this)[0] + 8 + "px");
            d3.select(this).style("cursor", "crosshair");
        };

        const mouseleave = function (d) {
            Tooltip.style("opacity", 0);
            d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none");
        };

        // area generator
        const area = d3
            .area()
            .x(function (d) {
                return x(d.data.Year);
            })
            .y0(function (d) {
                return y(d[0]);
            })
            .y1(function (d) {
                return y(d[1]);
            });

        //show the area
        svg_stream
            .selectAll("mylayers")
            .data(stackData)
            .enter()
            .append("path")
            .attr("class", "myArea")
            .style("fill", function (d) {
                var range = [
                    "#cccccc",
                    "#FF7A75",
                    "#983a37",
                    "#82322f",
                    "#572120",
                    "#2b1110",
                    "#000000",
                ];
                if (d.key == "CO2") {
                    return "#2b1110";
                } else if (d.key == "CH4") {
                    return "#82322f";
                } else if (d.key == "N2O") {
                    return "#983a37";
                } else {
                    return "#FF7A75";
                }
            })
            .attr("d", area)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
    });
}

// ------- sunburst js code  -------

groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

var dataCsv = d3.csv("historical_emissions.csv");

function update_sunburst(y_select, c_select) {
    let box = document.querySelector(".sunburst_card");
    var width_sb = 964;
    var height_sb = 636;
    var radius = Math.min(width_sb, height_sb) / 2 + 80;

    var range = [
        "#cccccc",
        "#FF7A75",
        "#983a37",
        "#82322f",
        "#572120",
        "#2b1110",
        "#000000",
    ];
    var domain = [0, 500, 3000, 6000, 7000, 10000];

    var color = d3.scaleThreshold().domain(domain).range(range);

    dataCsv.then(function (data) {
        d3.select("#sunburst g").remove();
        var g = d3
            .select("#sunburst")
            .attr("width", width_sb)
            .attr("height", height_sb)
            .append("g")
            .attr(
                "transform",
                "translate(" + width_sb / 2 + "," + height_sb / 2 + ")"
            );

        var partition = d3.partition().size([2 * Math.PI, radius]);
        json = data.map(function (value, key) {
            return {
                Country: value.Country,
                Sector: value.Sector,
                data_source: data[key]["Data source"],
                Gas: data[key]["Gas"],
                Unit: data[key]["Unit"],
                raw_data: data[key],
            };
        });
        data_gr = groupBy(json, "Country");
        country_data = data_gr[c_select];

        json_country = { name: "Sector", children: [] };
        for (var k = 0; k < country_data.length; k++) {
            var objSec = country_data[k]["Sector"];
            var objGas = country_data[k]["Gas"];
            var objUnit = country_data[k]["Unit"];
            var objValue = country_data[k]["raw_data"][y_select];
            const found = json_country["children"].find(
                (e) => e.name == objSec
            );
            if (
                objValue != "N/A" &&
                country_data[k]["data_source"] == "CAIT" &&
                !objSec.includes("Total") &&
                !objGas.includes("All")
            ) {
                if (found) {
                    found.children.push({
                        name: objGas,
                        unit: objUnit,
                        size: objValue,
                    });
                } else {
                    json_country["children"].push({
                        name: objSec,
                        children: [
                            {
                                name: objGas,
                                unit: objUnit,
                                size: objValue,
                            },
                        ],
                    });
                }
            }
        }
        var root = d3.hierarchy(json_country).sum(function (d) {
            return d.size;
        });

        sun_root = partition(root);
        root.each((d) => (d.current = d));

        no_data = json_country.children.length == 0;
        if (!no_data) {
            var arc = d3
                .arc()
                .startAngle(function (d) {
                    return d.x0;
                })
                .endAngle(function (d) {
                    return d.x1;
                })
                .innerRadius(function (d) {
                    return d.y0 - 80;
                })
                .outerRadius(function (d) {
                    return d.y1 - 80;
                });

            g.selectAll("g")
                .data(root.descendants())
                .enter()
                .append("g")
                .attr("class", "node")
                .append("path")
                .attr("display", function (d) {
                    return d.depth ? null : "none";
                })
                .attr("d", arc)
                .on("mouseover", function (d) {
                    if (this.id != "selected") {
                        color_d = color(d.value);
                        if (d.depth == 2) {
                            color_d = shadeColor(color_d, 20);
                        }
                        d3.select(this)
                            .attr("r", 5.5)
                            .style("fill", shadeColor(color_d, 10))
                            .style("cursor", "pointer");

                        if (d.depth != 1) {
                            d3.select(".infobox .title").text(
                                d.data.name + ":  "
                            );
                            d3.select(".infobox .words").text(
                                d.value + " " + d.data.unit
                            );
                            d3.select(".infobox").style(
                                "visibility",
                                "visible"
                            );
                        } else {
                            d3.select(".infobox").style(
                                "visibility",
                                "visible"
                            );
                            d3.select(".infobox .title").text(d.data.name);
                            d3.select(".infobox .words").text(
                                Math.round((d.value / d.parent.value) * 100) +
                                    "%"
                            );
                        }
                    }
                })
                .on("mouseout", function (d) {
                    if (this.id != "selected") {
                        color_d = color(d.value);
                        if (d.depth == 2) {
                            color_d = shadeColor(color_d, 20);
                        }
                        d3.select(this)
                            .attr("r", 5.5)
                            .style("fill", color_d)
                            .style("cursor", "default");

                        d3.select(".infobox").style("visibility", "hidden");
                    }
                })
                .style("stroke", "#fff")
                .style("fill", function (d) {
                    color_d = color(d.value);
                    if (d.depth == 2) {
                        return shadeColor(color_d, 20);
                    } else {
                        return color_d;
                    }
                });

            g.selectAll(".node")
                .append("text")
                .text(function (d) {
                    return d.parent ? d.data.name : "";
                })
                .attr("transform", function (d) {
                    return (
                        "translate(" +
                        arc.centroid(d) +
                        ")rotate(" +
                        computeTextRotation(d) +
                        ")"
                    );
                })
                .attr("dx", function (d) {
                    if (d.depth == 2) {
                        return "-10";
                    } else if (d.depth == 1) {
                        return "-50";
                    }
                })
                .attr("dy", ".5em")
                .on("mouseover", function (d) {
                    if (d.depth == 1) {
                        length = this.getComputedTextLength();
                        console.log(length);
                    }
                    if (this.id != "selected") {
                        d3.select(this).style("cursor", "pointer");
                        color_d = color(d.value);
                        if (d.depth == 2) {
                            color_d = shadeColor(color_d, 20);
                        }
                        d3.select(this.parentNode)
                            .selectAll("path")
                            .style("fill", shadeColor(color_d, 10));

                        if (d.depth != 1) {
                            d3.select(".infobox .title").text(
                                d.data.name + ":  "
                            );
                            d3.select(".infobox .words").text(
                                d.value + " " + d.data.unit
                            );
                            d3.select(".infobox").style(
                                "visibility",
                                "visible"
                            );
                        } else {
                            d3.select(".infobox").style(
                                "visibility",
                                "visible"
                            );
                            d3.select(".infobox .title").text(d.data.name);
                            d3.select(".infobox .words").text(
                                Math.round((d.value / d.parent.value) * 100) +
                                    "%"
                            );
                        }
                    }
                })
                .on("mouseout", function (d) {
                    d3.select(this).attr("r", 5.5).style("fill", "black");
                })
                .style("font-size", "14px")
                .style("visibility", function (d) {
                    length = this.getComputedTextLength();
                    box = this.parentNode.getBBox();
                    if (d.depth == 1) {
                        percent = d.value / d.parent.value;
                        return length > 110 || percent < 0.02
                            ? "hidden"
                            : "visible";
                    } else if (d.depth == 2) {
                        percent = d.value / d.parent.parent.value;
                        return percent < 0.02 ? "hidden" : "visible";
                    }
                });
        } else {
            d3.select("#sunburst").attr("height", "20px");
            d3.select(".infobox").style("visibility", "visible");
            d3.select(".infobox .title").text(
                "Not enough data to display for " +
                    c_select +
                    " for the year " +
                    y_select
            );
        }
    });
}

function computeTextRotation(d) {
    var angle = ((d.x0 + d.x1) / Math.PI) * 90;
    return angle < 180 ? angle - 90 : angle + 90;
}
function shadeColor(color, percent) {
    var R = parseInt(color.substring(1, 3), 16);
    var G = parseInt(color.substring(3, 5), 16);
    var B = parseInt(color.substring(5, 7), 16);

    R = parseInt((R * (100 + percent)) / 100);
    G = parseInt((G * (100 + percent)) / 100);
    B = parseInt((B * (100 + percent)) / 100);

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    var RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16);
    var GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16);
    var BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16);

    return "#" + RR + GG + BB;
}

// create a tooltip
var tooltip = d3
    .select("#tooltip")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position", "absolute");

// Data and color scale
var data = d3.map();

var labels = [
    "No Data",
    "0.0-2.0",
    "2.0-5.0",
    "5.0-10.0",
    "10.0-15.0",
    "10.0-15.0",
    "> 20.0",
];
var range = [
    "#cccccc",
    "#FF7A75",
    "#983a37",
    "#82322f",
    "#572120",
    "#2b1110",
    "#000000",
];
var domain = [0.00000001, 2, 5, 10, 15, 20];

var colorScale = d3.scaleThreshold().domain(domain).range(range);
var promises = [];
promises.push(
    d3.json(
        "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
    )
);
function update_map(year, country) {
    //map
    // set the dimensions and margins of the graph
    let box = document.querySelector(".sunburst_card");
    var margin = { top: 10, right: 10, bottom: 10, left: 10 };
    width = 968;
    height = 480;

    // Map and projection
    var projection = d3.geoMercator().scale(100).center([30, 50]);

    // The svg
    d3.select("#map g").remove();
    var svg = d3
        .select("#map")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    promises.push(
        d3.csv("co-emissions.csv", function (d) {
            if (d.year == year) {
                data.set(d.code, +d.emissions);
            }
        })
    );
    dataPromises = Promise.all(promises).then(function (world) {
        let mouseOn = function (d) {
            d3.selectAll(".world")
                .transition()
                .duration(50)
                .style("opacity", 0.95);

            d3.select(this)
                .transition()
                .duration(50)
                .style("opacity", 1)
                .style("stroke", "black");

            function check(number) {
                if (number > 0) {
                    return d3.format(",.2r")(number);
                } else {
                    return "No Data";
                }
            }
            tooltip
                .html(d)
                .style("opacity", 0.8)
                .html(d.properties.name + ": " + check(d.totalEmissions))
                .style("left", d3.mouse(this)[0] + 10 + "px")
                .style("top", d3.mouse(this)[1] + "px");
        };

        let mouseOff = function (d) {
            d3.selectAll(".world")
                .transition()
                .duration(50)
                .style("opacity", 1);

            d3.selectAll(".world")
                .transition()
                .duration(50)
                .style("stroke", "transparent");

            d3.select("#annotation").style("opacity", 1);

            tooltip.style("opacity", 0);
        };
        let mouseClick = function (d) {
            if (this.id == "not_selected") {
                update_country(d.properties.name);
                d3.selectAll("#c_selected")
                    .attr("id", function (d) {
                        return "not_selected";
                    })
                    .style("fill", function (d) {
                        d.totalEmissions = data.get(d.id) || 0;
                        return colorScale(d.totalEmissions);
                    });
                d3.select(this).attr("id", "c_selected");
                d3.select(this).style("fill", "lightgreen");
            }
        };
        var world = world[0];
        // Draw the map
        svg.append("g")
            .selectAll("path")
            .data(world.features)
            .enter()
            .append("path")
            .attr("class", "world")
            // .attr("id", "not_selected")
            .attr("id", function (d) {
                if (d.properties.name == country) {
                    return "c_selected";
                } else {
                    return "not_selected";
                }
            })
            .attr("country", function (d) {
                return d.properties.name;
            })
            // draw each country
            .attr("d", d3.geoPath().projection(projection))
            // set the color of each country
            .attr("fill", function (d) {
                if (this.id == "c_selected") {
                    return "lightgreen";
                } else {
                    d.totalEmissions = data.get(d.id) || 0;
                    return colorScale(d.totalEmissions);
                }
            })
            .style("opacity", 1)
            .on("mouseover", mouseOn)
            .on("mouseleave", mouseOff)
            .on("click", mouseClick);
    });
    // legend
    var legend_x = margin.left;
    var legend_y = height - 180;
    svg.append("g")
        .attr("class", "legendByNumbers")
        .attr("transform", "translate(" + legend_x + "," + legend_y + ")");

    var legend = d3
        .legendColor()
        .labels(labels)
        .title("Top CO2/Capita per year:")
        .scale(colorScale);

    svg.select(".legendByNumbers").call(legend);
}

function update_year(year) {
    slider.property("value", year);
    d3.select(".year").text(year);
}
function update_country(country) {
    d3.selectAll(".selected_country").text(country);
    updateStream(country);
    update_sunburst(d3.select(".slider").attr("year"), country);
}
//Slider
var slider = d3
    .select(".slider")
    .append("input")
    .attr("type", "range")
    .attr("min", 1900)
    .attr("max", 2016)
    .attr("step", 1)
    .on("input", function () {
        var year = this.value;
        var country = d3.select("#c_selected").attr("country");
        update_year(year);
        update_map(year, country);
        update_sunburst(year, country);
        updateStream(country);
        d3.select(".slider").attr("year", year);
    });

update_year(1900);
update_country("USA");
update_map(1900, "USA");
update_sunburst(1900, "USA");
updateStream("USA");
