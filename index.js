var s2geotools = require("s2-geometry").S2;
var turf = require("@turf/turf");

/*** 
****   S2 cube faces mapping expressed as long,lat pairs for turf input
***/

s2geotools.s2 = {};

var s2 = s2geotools.s2;

s2.borders = {
    north: 45,
    south: -45,
    west: -45,
    east: 45,
    b_west: -135,
    b_east: 135
};

var borders = s2.borders;
s2.q = { lat: '90', lng: '90' };

s2.corners = {
    ws: [borders.west, borders.south],
    en: [borders.east, borders.north],
    es: [borders.east, borders.south],
    wn: [borders.west, borders.north],
    b_ws: [borders.b_east, borders.south],
    b_en: [borders.b_west, borders.north],
    b_es: [borders.b_west, borders.south],
    b_wn: [borders.b_east, borders.north]
};
var corners = s2.corners

var createS2Face = function (corner, n) {
    let polygon = [];
    let order = [];

    switch (n % 5) {
        case 0:
            order = [[0, 90], [90, 0], [0, -90], [-90, 0]];
            break;
        case 1:
            order = [[90, 0], [0, 90], [-90, 0], [0, -90]];
            break;
        case 2:
        case 5:
            order = [[-90, 0], [-90, 0], [-90, 0], [-90, 0]];
            break;
        case 3:
            order = [[0, -90], [90, 0], [0, 90], [-90, 0]];
            break;
        case 4:
            order = [[90, 0], [0, -90], [-90, 0], [0, 90]];
            break;
    }
    polygon = order.reduce((p, c) => {
        newCorner = [p[p.length - 1][0] + c[0], p[p.length - 1][1] + c[1]]
        p.push(newCorner)
        return p
    }, [corner])

    return [polygon]
}

s2.faces = [
    turf.polygon(createS2Face(corners.ws, 0), { name: 'face 0' }),
    turf.polygon(createS2Face(corners.es, 1), { name: 'face 1' }),
    turf.polygon(createS2Face(corners.en, 2), { name: 'face 2' }),
    turf.polygon(createS2Face(corners.b_wn, 3), { name: 'face 3' }),
    turf.polygon(createS2Face(corners.b_en, 4), { name: 'face 4' }),
    turf.polygon(createS2Face(corners.b_es, 5), { name: 'face 5' }),
    // turf.polygon([[s2.corners.ws, s2.corners.wn, s2.corners.en, s2.corners.es, s2.corners.ws]], { name: 'face 0' }),
    // turf.polygon([[s2.corners.es, s2.corners.b_ws, s2.corners.b_wn, s2.corners.en, s2.corners.es]], { name: 'face 1' }),
    // turf.polygon([[s2.corners.en, s2.corners.wn, s2.corners.b_wn, s2.corners.b_wn, s2.corners.en]], { name: 'face 2' }),
    // turf.polygon([[s2.corners.b_wn, s2.corners.b_ws, s2.corners.b_es, s2.corners.b_en, s2.corners.b_wn]], { name: 'face 3' }),
    // turf.polygon([[s2.corners.b_en, s2.corners.en, s2.corners.ws, s2.corners.b_es, s2.corners.b_en]], { name: 'face 4' }),
    // turf.polygon([[s2.corners.b_es, s2.corners.b_ws, s2.corners.b_es, s2.corners.ws, s2.corners.b_es]], { name: 'face 5' }),
];

s2geotools.LatLngToFaceUV = function (LatLng) {
    if (Math.abs(LatLng.lat) > 45) {
        return (LatLng.lat) > 0 ? 2 : 5
    } else {
        return (Math.trunc((LatLng.lng + 45) / 90) + (LatLng.lng > 135 ? 1 : 0))
    }
};

s2geotools.latLngToAllNeighborKeys = s2geotools.S2Cell.latLngToNeighborKeys = function (lat, lng, level) {
    return s2geotools.S2Cell.FromLatLng({ lat: lat, lng: lng }, level).getAllNeighbors().map(function (cell) {
        return cell.toHilbertQuadkey();
    });
};

s2geotools.S2Cell.prototype.getAllNeighbors = function (grid = 8) {

    var fromFaceIJWrap = function (face, ij, level) {
        var maxSize = (1 << level);
        if (ij[0] >= 0 && ij[1] >= 0 && ij[0] < maxSize && ij[1] < maxSize) {
            // no wrapping out of bounds
            return s2geotools.S2Cell.FromFaceIJ(face, ij, level);
        } else {
            // the new i,j are out of range.
            // with the assumption that they're only a little past the borders we can just take the points as
            // just beyond the cube face, project to XYZ, then re-create FaceUV from the XYZ vector
            var st = s2geotools.IJToST(ij, level, [0.5, 0.5]);
            var uv = s2geotools.STToUV(st);
            var xyz = s2geotools.FaceUVToXYZ(face, uv);
            var faceuv = s2geotools.XYZToFaceUV(xyz);
            face = faceuv[0];
            uv = faceuv[1];
            st = s2geotools.UVToST(uv);
            ij = s2geotools.STToIJ(st, level);
            return s2geotools.S2Cell.FromFaceIJ(face, ij, level);
        }
    };

    var face = this.face;
    var i = this.ij[0];
    var j = this.ij[1];
    var level = this.level;

    return ([
        fromFaceIJWrap(face, [i - 1, j], level),
        fromFaceIJWrap(face, [i, j - 1], level),
        fromFaceIJWrap(face, [i + 1, j], level),
        fromFaceIJWrap(face, [i, j + 1], level),].push(
            (grid == 8) ? [
                fromFaceIJWrap(face, [i + 1, j + 1], level),
                fromFaceIJWrap(face, [i + 1, j - 1], level),
                fromFaceIJWrap(face, [i - 1, j - 1], level),
                fromFaceIJWrap(face, [i - 1, j + 1], level)]
                : [])
    )
};

s2geotools.boundingCellsKeys = function (minlat, minlon, maxlat, maxlon, level) {
    if ((minlat > maxlat) || (minlon > maxlon)) {
        throw 'box shall be minlat,minlon,maxlat,maxlon';
    }

    var gridSize = (1 << level)
    var corners = [
        [minlat, minlon],
        [maxlat, minlon],
        [maxlat, maxlon],
        [minlat, maxlon]
    ]

    //  Find s2IJ for each corner of the bbox
    var cornersIJ = corners.map(latLng => {
        let xyz = s2geotools.LatLngToXYZ({ lat: latLng[0], lng: latLng[1] });
        let faceuv = s2geotools.XYZToFaceUV(xyz);
        // console.log('faceuv: ' + faceuv)
        let st = s2geotools.UVToST(faceuv[1]);
        // console.log('st: ' + st)
        let ij = s2geotools.STToIJ(st, level);
        // console.log('ij: ' + JSON.stringify(ij,null,2))
        return ([faceuv[0], ij])
    })

    //  Calculate s2Cells coverage on each face of the cube

    //  Get s2 ref for each selected tiles

    console.log(corners);
    console.log(cornersIJ)

}

module.exports = s2geotools;