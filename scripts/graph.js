const minimum = function (array) {
    return Math.min(...array);
}
const maximum = function (array) {
    return Math.max(...array);
}
function Force(canvas, data, props) {
  
    let graph = {

      dispatch: d3.dispatch('nodeClicked'),
      data: data,
      canvas: canvas,
      props: props,

      draw: function(options) {
        let self = this;
        const newGraph = options.newGraph;
        let nodeInFocus = null;
        let friendInFocus = null;
        if (!newGraph) {
          if (
            options.focusedNode.x == undefined ||
            options.focusedNode.y == undefined
          ) {
            nodeInFocus = options.focusedNode;
          } else {
            nodeInFocus = options.focusedNode.y;
            friendInFocus = options.focusedNode.x;
          }
        }
        const { width, height, flags } = this.props;
        const margin = { bottom: 10, top: 10, right: 10, left: 10 };
        const w = width - margin.right - margin.left;
        const h = height - margin.bottom - margin.top;
        let svg = d3
          .select(canvas)
          .attr('width', width)
          .attr('height', height)
          .append('g')
          .attr('class', 'graph');
        let simulation = d3.forceSimulation();
        let nodes = data.nodes;
        console.log(nodes)
        let links = data.links;

        console.log(links)
        // make r at least 2, but make sure all circles fit in the canvas. (n * pi * r^2 < w * h)
        const r = Math.max(2, 0.5 * Math.sqrt((w * h) / (Math.PI * nodes.length)));
        const v = links.map(link => link.value);
        const color = d3.scaleOrdinal(d3.schemeCategory20);

        simulation
          .nodes(nodes)
          .force('links', d3.forceLink(links).distance(100))
          .force('charge', d3.forceManyBody().strength(-300))
          .force('center', d3.forceCenter(w / 2, h / 2))
          .force('x', d3.forceX(w / 2))
          .force('y', d3.forceY(h / 2))
          .on('tick', ticked);

        let link = svg
          .append('g')
          .attr('class', 'links')
          .selectAll('line')
          .data(links)
          .enter()
          .append('line')
          .style('stroke', d => color(d.value))
          .attr('stroke-width', linkStrokeWidth)
          .attr('opacity', linkOpacity);

        let node = svg
          .append('g')
          .attr('class', 'nodes')
          .selectAll('g')
          .data(nodes)
          .enter()
          .append('g');

        let circles = node
          .append("circle")
          .attr('class', 'circle')
          .attr("r", dynamicRadius)
          .attr("fill", d => color(d.index))
          .attr("stroke", nodeStroke)
          .attr("stroke-width", nodeStrokeWidth)
          .attr("opacity", nodeOpacity)
          .on("mouseover", d => mouseoverCell(self, d))
          .on('mouseout', d => mouseoutCell(self, d))

        node
          .append('text')
          .attr('class', 'txt-label')
          .attr('x', -5)
          .attr('y', 3)
          .style('color', 'black')
          .style('opacity', nodeOpacity)
          .text(d => d.category);

        function dynamicRadius(d) {
          return r;
        }
        function nodeStroke(d) {
          return 'tomato'
        }
        function nodeStrokeWidth(d) {
          return 1;
        }
        function nodeOpacity(d) {
          return 1
        }

        function linkOpacity(d) {
          if (newGraph) return 1;
          return d.source.index == nodeInFocus ||
            d.target.index == friendInFocus ||
            (d.source.index == friendInFocus ||
              d.target.index == nodeInFocus)
            ? 1
            : 0.1;
        }

        function linkStrokeWidth(d) {
          if (newGraph) return 1;
          return (
              d.source.index == nodeInFocus && d.target.index == friendInFocus) || 
              (d.source.index == friendInFocus && d.target.index == nodeInFocus) ? 5 : 1;
        }

      function mouseoverCell(obj, d) {
          obj.dispatch.call('nodeClicked', obj, d);
      }

      function mouseoutCell(obj, d) {
        obj.dispatch.call("nodeClicked", obj, null);
      }
        circles.call(
          d3
            .drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
        );

        function ticked() {

          node.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');

          link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        }

        function dragstarted(d) {
          if (!d3.event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }

        function dragged(d) {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        }

        function dragended(d) {
          if (!d3.event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }

        function friendsOf(k) {
          let friends = [];
          links.forEach(link => {
            if (k == link.source.index) friends.push(link.target.index);
            if (k == link.target.index) friends.push(link.source.index);
          });
          return friends;
        }

        function selfOrFriends(i, y) {
          return i == y || friendsOf(y).includes(i);
        }
      }
    };
    return graph;
}