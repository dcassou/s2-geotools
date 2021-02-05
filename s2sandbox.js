const s2 = require(".");
var turf = require("@turf/turf");

var pois = [
    {
        label: 'espagne - face 0/nw',
        ll: [40.60022560268913, -1.6317072680484586]
    }, {
        label: 'afrique du sud - face 0/se',
        ll: [-28.103438640980098, 24.353480780402048]
    },
    {
        label: 'ethiopie - face 1/w',
        ll: [10.020291580011339, 50.01754272270447]
    },
    {
        label: 'france - face 2/s',
        ll: [49.644543831783594, 0.7987947773798845]
    },
    {
        label: 'kamchatka - face 2/ne',
        ll: [65.0941357154688, 169.19722700126695]
    },
    {
        label: 'nord canada - face 2/nw',
        ll: [69.63432502361071, -128.39537114181763]
    }
]

function main() {
    var line = turf.lineString([pois[0]['ll'],pois[2]['ll'],pois[3]['ll']]);
    s2.boundingCellsKeys(...turf.bbox(line),3);
    pois.forEach(poi => {
        let lat = poi.ll[0]
        let long = poi.ll[1]
        let key1 = s2.latLngToKey(poi.ll[0], poi.ll[1], 1)
        let key2 = s2.latLngToKey(poi.ll[0], poi.ll[1], 2)
        let key3 = s2.latLngToKey(poi.ll[0], poi.ll[1], 3)
        // console.log(poi.label)
        // console.log(`\tkey/L1: ` + key1 + `\tid/L1: ` + s2.keyToId(key1))
        // console.log('\t\tvoisins L1:\t' + s2.latLngToNeighborKeys(lat, long, 1))
        // console.log(`\tkey/L2: ` + key2 + `\tid/L2: ` + s2.keyToId(key2))
        // console.log('\t\tvoisins L2:\t' + s2.latLngToNeighborKeys(lat, long, 2))
        // console.log(`\tkey/L3: ` + key3 + `\tid/L3: ` + s2.keyToId(key3))
        // console.log('\t\tvoisins L3:\t' + s2.latLngToNeighborKeys(lat, long, 3))
    });
}

main();