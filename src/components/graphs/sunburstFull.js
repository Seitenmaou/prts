import React from 'react';
import Plot from 'react-plotly.js';

export default function SunbrustFull ({operatorsList}) {

var listID = [];
var listLabel = [];
var listParent = [];
var title = "Rhodes Island"
var keys = ["operatorRecords_class","operatorRecords_job","name_code"];
var keyLength = keys.length;
var sunBurstDepth = keyLength + 1;

operatorsList.forEach(row => {
  var idString = keys.map(key => row[key] || null).join('>')
  listID.push(idString);
  listLabel.push(idString.substring(idString.lastIndexOf('>') + 1, idString.length));
  listParent.push(idString.substring(0, idString.lastIndexOf('>')));
});
keyLength--;
var subListID = [...new Set(listParent)]
var currentIndex = listID.length;
while(keyLength > 1){
  currentIndex = listID.length;
  subListID.forEach(row => {
    listID.push(row);
    listLabel.push(row.substring(row.lastIndexOf('>') + 1, row.length));
    listParent.push(row.substring(0, row.lastIndexOf('>')));
  })
  subListID = [... new Set (listParent.slice(currentIndex, listID.length))]
  keyLength--;
};

subListID.forEach(row => {
  listID.push(row);
  listLabel.push(row);
  listParent.push(title);

})



    var data = [{
        type: "sunburst",
        maxdepth: sunBurstDepth,
        ids: listID,
        labels: listLabel,
        parents: listParent,
        textposition: 'inside',
        insidetextorientation: 'radial'
      }];
      
      var layout = {
        margin: {l: 0, r: 0, b: 0, t: 0},
        width: 750,
        height: 750
      };
    return (
      <Plot
        data={data}
        layout={layout}
      />
    );
}
