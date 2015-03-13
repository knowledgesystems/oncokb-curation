
var d3 = window.d3;
var $ = window.$;
var Tree = (function() {
    'use strict';

    var m = [20, 120, 20, 50],
        w = 500 - m[1] - m[3],
        h = 500 - m[0] - m[2],
        i = 0,
        radius = 4.5,
        fontSize = '12px',
        root,
        treeInfo = [],
        description = {};

    var tree, diagonal, vis, numOfTumorTypes = 0, numOfTissues = 0;

    var searchResult = [];

    function initDataAndTree(_treeInfo, _description) {
        var rootName = 'Genes',
            treeData = {};

        treeData[rootName] = {};
        treeInfo = _treeInfo;
        description.Genes = _description;
        description.description = [{ evidenceType: '', description: ''}];

        tree = d3.layout.tree()
        .nodeSize([20, null]);

        diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.y, d.x]; });

        vis = d3.select('#tree').append('svg:svg')
            .attr('width', w + m[1] + m[3])
            .attr('height', h + m[0] + m[2])
          .append('svg:g')
            .attr('transform', 'translate(' + m[3] + ',' + 300 + ')');

        for(var i = 0, treeInfoL = treeInfo.length; i < treeInfoL; i++) {
            var node = treeData[rootName],
                treeInfoDatum = treeInfo[i];
            for (var col in treeInfoDatum) {
                var type = treeInfoDatum[col];
                if (!type) {
                    break;
                }
                if (!(type in node)) {
                        node[type] = {};
                }
                node = node[type];
            }
        }
        var json = formatTree(rootName, treeData, description);
        build(json);
    }

    function formatTree(name, tree, description) {
        var ret = {
            name: name, 
            description: description[name].description || []
        };
        var root = tree[name];
        var children = [];
        for (var child in root) {
            children.push(formatTree(child, root,description[name]));
        }
        if (children.length===0) {
            ret.size = 4000;
        } else {
            ret.children = children;
        }
        return ret;
    }

    function build(json) {
        root = json;
        root.x0 = h / 2;
        root.y0 = 0;
        // Initialize the display to show a few nodes.
        root.children.forEach(toggleAll);
        // toggle(root.children[1]);
        // toggle(root.children[2]);
        // toggle(root.children[5]);
        // toggle(root.children[5].children[0]);
        // toggle(root.children[8]);
        // toggle(root.children[8].children[0]);
        // toggle(root.children[15]);
        update(root);
        numOfTissues = root.children.length;
        root.children.forEach(searchLeaf);
    }

    function update(source) {
        var duration = d3.event && d3.event.altKey ? 5000 : 500;
        var translateY = Number(vis.attr('transform').split(',')[1].split(')')[0]);
        var nodes = tree.nodes(root).reverse();
        var minX = 0;
        var aftetTranslateY = 50;

        nodes.forEach(function(d) {
        if( minX > d.x) {
            minX = d.x;
          }
        });

        minX = Math.abs(minX);
        aftetTranslateY += minX;

        if( minX > (translateY-50)) {
          vis.transition()
            .duration(duration)
            .attr('transform', 'translate('+ m[3] +','+aftetTranslateY+')');
          nodes = tree.nodes(root).reverse();
        } else if(minX + 50 < translateY){
          vis.transition()
            .duration(duration)
            .attr('transform', 'translate('+ m[3] +','+aftetTranslateY+')');
          nodes = tree.nodes(root).reverse();
        }

        //Indicate the left side depth for specific level (circal point as center)
        var leftDepth = {0: 0};
        //Indicate the right side depth for specific level (circal point as center)
        var rightDepth = {0: 0};

        //Calculate maximum length of selected nodes in different levels
        nodes.forEach(function(d) {
          var _upperL = d.name.replace(/[^A-Z]/g, '').length,
              _lowerL = d.name.replace(/[^a-z]/g, '').length,
              _numberL = d.name.replace(/[^0-9]/g, '').length;

          var _nameLength = _lowerL * 6 + _upperL * 9 + _numberL * 7 + 50;

          if(d.depth !== 0) {
            if (!leftDepth.hasOwnProperty(d.depth)) {
              leftDepth[d.depth] = 0;
              rightDepth[d.depth] = 0;
            }

            //Only calculate the point without child and without showed child
            if( !d.children &&  !d._children && rightDepth[d.depth] < _nameLength) {
              rightDepth[d.depth] = _nameLength;
            }

            //Only calculate the point with child(ren) or with showed child(ren)
            if( (d.children || d._children) && leftDepth[d.depth] < _nameLength) {
              leftDepth[d.depth] = _nameLength;
            }
          }
        });

        //Calculate the transform information for each node.
        nodes.forEach(function(d) { 
          if(d.depth === 0){
            d.y = 0; 
          }else{
            var _y = 0,
                _length = d.depth;

            for (var i = 1; i <= _length; i++) {
              if(leftDepth[i] === 0) {
                _y += (rightDepth[i-1] !== 0 ? rightDepth[i-1] : 50); //Give constant depth if no point has child or has showed child
              }else {
                if(i>1) {
                  _y += leftDepth[i] + rightDepth[i-1];
                  _y -= (leftDepth[i] > 0 && rightDepth[i-1] > 0) ? 50: 0;
                }else {
                  _y += leftDepth[i];
                }
              }
            }
            d.y = _y; 
          }
        });

        // Update the nodes…
        var   node = vis.selectAll('g.node')
              .data(nodes, function(d) { return d.id || (d.id = ++i); });

        // Enter any new nodes at the parent's previous position.
        var   nodeEnter = node.enter().append('svg:g')
              .attr('class', 'node')
              .attr('transform', function() { return 'translate(' + source.y0 + ',' + source.x0 + ')'; })
              .on('click', function(d) { toggle(d); update(d); });

        nodeEnter.append('svg:circle')
            .attr('r', 1e-6)
            .style('fill', function(d) { return d._children ? 'lightsteelblue' : '#fff'; });

        nodeEnter.append('svg:text')
            .attr('x', function(d) { return d.children || d._children ? -10 : 10; })
            .attr('dy', '.35em')
            .attr('font-size', fontSize)
            .attr('text-anchor', function(d) { return d.children || d._children ? 'end' : 'start'; })
            .text(function(d) {
              if(d.description.length > 0) {
                  var qtipText = '';
                  var _position = {};
                  for(var i = 0, desL = d.description.length; i < desL; i++) {
                      if(d.description[i].hasOwnProperty('Evidence Type')){
                          
                            switch(d.description[i]['Evidence Type']) {
                                case 'MUTATION_EFFECT':
                                    qtipText += '<b>Mutation Effect: ' + d.description[i]['Known Effect'] + '</b><br>' + d.description[i].Description + '<br>';
                                    break;
                                default:
                                    qtipText += '<b>' + upperFirstLetter(d.description[i]['Evidence Type']) + '</b><br>' + d.description[i].Description + '<br>';
                                    break;
                        }
                      }
                      
                      if(i+1 !== desL){
                        qtipText += '<hr/>';
                      }
                  }

                  if((d.children || d._children) && d.depth > 1){
                      _position = {my:'bottom right',at:'top left', viewport: $(window)};
                  }else {
                      _position = {my:'bottom left',at:'top right', viewport: $(window)};
                  }
                  $(this).qtip({
                      content:{text: qtipText},
                      style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-grey'},
                      hide: {fixed:true, delay: 100},
                      position: _position
                  });
              } 
              return d.name; })

            .style('fill-opacity', 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr('transform', function(d) { return 'translate(' + d.y + ',' + d.x + ')'; });

        nodeUpdate.select('circle')
            .attr('r', radius)
            .style('fill', function(d) { return d._children ? 'lightsteelblue' : '#fff'; });

        nodeUpdate.select('text')
            .style('fill-opacity', 1)
            .style('font-size', fontSize);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr('transform', function() { return 'translate(' + source.y + ',' + source.x + ')'; })
            .remove();

        nodeExit.select('circle')
            .attr('r', 1e-6);

        nodeExit.select('text')
            .style('fill-opacity', 1e-6);

        // Update the links…
        var link = vis.selectAll('path.link')
            .data(tree.links(nodes), function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert('svg:path', 'g')
            .attr('class', 'link')
            .attr('d', function() {
              var o = {x: source.x0, y: source.y0};
              return diagonal({source: o, target: o});
            })
          .transition()
            .duration(duration)
            .attr('d', diagonal);

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr('d', diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr('d', function() {
              var o = {x: source.x, y: source.y};
              return diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
          d.x0 = d.x;
          d.y0 = d.y;
        });

        resizeSVG(rightDepth);
    }

    function upperFirstLetter(str){
        var a = str.split(/[_\s]/).map(function(datum){
            return datum.charAt(0).toUpperCase() + datum.substr(1).toLowerCase();
        });
        return a.join(' ');
    }
    
    // Toggle children.
    function toggle(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
    }

    function toggleAll(d) {
        if (d.children) {
                d.children.forEach(toggleAll);
                toggle(d);
        }
    }

    function stretchAll(d) {
        if (d._children) {
                d._children.forEach(stretchAll);
                toggle(d);
        }
    }

    function expandWithArray(nodesArray) {
            for (var i = 0, nodesLength = nodesArray.length; i <nodesLength; i++) {
                    toggle(root.children[nodesArray[i]]);
            }
            update(root);
    }

    function expandAll() {
            root.children.forEach(stretchAll);
            update(root);
    }

    function collapseAll() {
            root.children.forEach(toggleAll);
            update(root);
    }

    function resizeSVG(rightDepth) {
        var nodes = tree.nodes(root).reverse(),
            maxHeight = 0,
            maxWidth = 0,
            lastDepth = 0;

        nodes.forEach(function(d) {
            if(d.x0 > maxHeight) {
                    maxHeight = d.x0;
            }

            if(d.y0 > maxWidth) {
                    maxWidth = d.y0;
            }
        });

        maxHeight *= 2;
        maxHeight += 450;

        lastDepth = rightDepth[Math.max.apply(Math, (Object.keys(rightDepth)).map(function(item) {return Number(item);}))];
        maxWidth = maxWidth + 100 + lastDepth;

        if(500 < maxWidth) {
                d3.select('body').select('svg').attr('width', maxWidth);
        }else {
                d3.select('body').select('svg').attr('width', 500);
        }

        if(500 < maxHeight) {
                d3.select('body').select('svg').attr('height', maxHeight);
        }else {
                d3.select('body').select('svg').attr('height', 500);
        }
    }

    function searchByNodeName(searchKey) {
        searchResult.length = 0;
        root.children.forEach(toggleAll);
        update(root);
        searchKey = searchKey.toLowerCase();

        if(searchKey !== '') {
            for(var i = 0, numOfChild = root.children.length; i< numOfChild; i++) {
                findChildContain(i, searchKey, root.children[i]);
            }

            searchResult.forEach(function(content) {
                var _indexes = content.split('-'),
                        _indexesLength = _indexes.length,
                        _node = root.children[_indexes[0]];

                for (var i = 1; i < _indexesLength; i++) {
                        if(!_node.children) {
                                toggle(_node);
                        }
                        _node = _node.children[_indexes[i]];
                }
            });
            update(root);
        }

        highlightSearchKey(searchKey);

        return searchResult;
    }

    function highlightSearchKey(searchKey) {
        d3.select('body svg').selectAll('text').each(function(d) {
            if(searchKey === '') {
                    d3.select(this).style('fill','black');
            }else {
                    if(d.name.toLowerCase().indexOf(searchKey) !== -1) {
                            d3.select(this).style('fill','red');
                    }else {
                            d3.select(this).style('fill','black');
                    }
            }
        });
    }

    function findChildContain(parentId, searchKey, node) {
        parentId = String(parentId);
        if(node._children) {
            if(node.name.toLowerCase().indexOf(searchKey) !== -1) {
                    searchResult.push(parentId);
            }
            for(var i = 0, numOfChild = node._children.length; i< numOfChild; i++) {
                    findChildContain(parentId + '-' + i, searchKey, node._children[i]);
            }
        }else {
            if(node.name.toLowerCase().indexOf(searchKey) !== -1) {
                    searchResult.push(parentId);
            }
        }
    }

    function searchLeaf(node) {
        if(node._children || node.children) {
          var i, _length = 0;

          if(node.children) {
              for (i = 0, _length = node.children.length; i < _length; i++) {
                      searchLeaf(node.children[i]);
              }
          }
          if(node._children) {
              for (i = 0, _length = node._children.length; i < _length; i++) {
                      searchLeaf(node._children[i]);
              }
          }
        }else {
            numOfTumorTypes++;
        }
    }

    return {
            init: initDataAndTree,
            expand: expandWithArray,
            search: searchByNodeName,
            expandAll: expandAll,
            collapseAll: collapseAll,
            getNumOfTissues: function() {
                    return numOfTissues;
            },
            getNumOfTumorTypes: function() {
                    return numOfTumorTypes;
            }
    };
})();