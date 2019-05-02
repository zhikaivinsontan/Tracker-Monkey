const dims = { height:300, width:300, radius:150 };
const cent = { x:(dims.width / 2 + 5), y: (dims.height / 2 + 5) };

const svg = d3.select('.canvas')
    .append('svg')
    .attr('width',dims.width + 150)
    .attr('height',dims.height + 150)

const graph = svg.append('g')
    .attr('transform',`translate(${cent.x},${cent.y})`);


// fnction returns angles
const pie = d3.pie()
    .sort(null) //don't sort according to data because it does it by default
    .value(d=>d.cost);

const arcPath = d3.arc()
    .outerRadius(dims.radius)
    .innerRadius(dims.radius/2);

// schemeSet3 returns an array of colors
const color = d3.scaleOrdinal(d3['schemeSet3'])

//legend setup
const legendGroup = svg.append('g')
    .attr('transform',`translate(${dims.width + 40},10)`)

const legend = d3.legendColor()
    .shape('circle')
    .shapePadding(10)
    .scale(color);

const update = (data) => {
    
    //update color scale domain
    color.domain(data.map(d => d.name));

    //update and call legend
    legendGroup.call(legend);
    legendGroup.selectAll('text').attr('fill','brown');


    // join enhanced (pie) data to path elements
    const paths = graph.selectAll('path')
        .data(pie(data));

    // console.log(paths)

    //exit selection
    paths.exit()
        .transition().duration(1500)
            .attrTween('d',arcTweenExit)
    .remove();

    //current DOM path updates
    paths.attr('d',arcPath)
        .transition().duration(750)
        .attrTween('d',arcTweenUpdate);
    
    // console.log(pie(data));
    paths.enter()
        .append('path')
         .attr('class','arc')
         .attr('d',arcPath)
         .attr('stroke','#fff')
         .attr('stroke-width',3)
         .attr('fill',d => color(d.data.name))
         .each(function(d) {
             this._current = d;
         })
         .transition().duration(1500)
            .attrTween("d",arcTweenEnter);
    // add events
    graph.selectAll('path')
         .on('mouseover',handleMouseOver)
         .on('mouseout',handleMouseOut);
};

// data array and firestore
var data = []

db.collection('expenses').onSnapshot(res=>{
    res.docChanges().forEach(change=>{
        const doc = {...change.doc.data(), id:change.doc.id };
        switch (change.type) {
            case 'added':
                data.push(doc)
                break;
            case 'modified':
                const index = data.findIndex(item => item.id == doc.id);
                data[index] = doc;
                break;
            case 'removed':
                data = data.filter(item => item.id !== doc.id);
                break;
            default:
                break;
        }
    });

    update(data);
});

const arcTweenEnter = (d) => {
    var i = d3.interpolate(d.endAngle,d.startAngle);

    return function(t) {
        d.startAngle = i(t);
        return arcPath(d);
    }
}

const arcTweenExit = (d) => {
    var i = d3.interpolate(d.startAngle,d.endAngle);

    return function(t) {
        d.startAngle = i(t);
        return arcPath(d);
    }
}

//use function keyword to allow use of 'this'
function arcTweenUpdate(d) {
    // console.log("->" + this._current,d);
    // whats interpolate?!?!?!?!?!??!
    var i = d3.interpolate(this._current,d);
    //update the current prop with the new updated data
    this._current = i(1);
    return function(t) {
        return arcPath(i(t));
    }
}

// event handlers
const handleMouseOver = (d,i,n) => {
    // console.log(n[i]);
    d3.select(n[i])
        .transition('changeSliceFull').duration(300)
            .attr('fill','#fff');
};

const handleMouseOut = (d,i,n) => {
    d3.select(n[i])
        .transition('changeSliceFull').duration(300)
            .attr('fill',color(d.data.name))
}