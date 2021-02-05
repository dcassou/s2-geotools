var s2geotools = require("s2-geometry").S2;
var turf = require("@turf/turf");

/*** 
****   S2 cube faces mapping expressed as long,lat pairs for turf input
***/
var s2 = {
    f_ws: [-45,-45],
    f_en: [45,45],
    f_es: [45,-45],
    f_wn: [-45,45],
    b_ws: [135,-45],
    b_en: [-135,45],
    b_es: [-135,-45],
    b_wn: [135,45]
}

s2geotools.faces = [
    turf.polygon([[s2.f_ws,s2.f_wn,s2.f_en,s2.f_es,s2.f_ws]],{name: 'face 0'})
]

s2geotools.LatLngToFaceUV = function (LatLng) {
    if (Math.abs(LatLng.lat)>45) {
        return (LatLng.lat)>0?2:5
    } else {
        return (Math.trunc((LatLng.lng+45)/90)+(LatLng.lng>135?1:0))
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