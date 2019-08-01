// @flow
import { RGBAImage } from '../util/image';

import { register } from '../util/web_worker_transfer';

/*
    rawData is a data structure for passing raster data directly to a shader.
    Adapted from dem_data.js.
*/

export default class rawData {
    uid: string;
    data: Int32Array;
    stride: number;
    dim: number;

    constructor(uid: string, data: RGBAImage) {
        this.uid = uid;
        if (data.height !== data.width) throw new RangeError('DEM tiles must be square');
        const dim = this.dim = data.height;
        this.stride = this.dim + 2;
        this.data = new Int32Array(this.stride * this.stride);

        const pixels = data.data;
        for (let y = 0; y < dim; y++) {
            for (let x = 0; x < dim; x++) {
                const i = y * dim + x;
                const j = i * 4;
                // a straight copy from the data
                this.set(x, y, this.unpack(pixels[j], pixels[j + 1], pixels[j + 2]));
            }
        }

        // in order to avoid flashing seams between tiles, here we are initially populating a 1px border of pixels around the image
        // with the data of the nearest pixel from the image. this data is eventually replaced when the tile's neighboring
        // tiles are loaded and the accurate data can be backfilled using DEMData#backfillBorder
        for (let x = 0; x < dim; x++) {
            // left vertical border
            this.set(-1, x, this.get(0, x));
            // right vertical border
            this.set(dim, x, this.get(dim - 1, x));
            // left horizontal border
            this.set(x, -1, this.get(x, 0));
            // right horizontal border
            this.set(x, dim, this.get(x, dim - 1));
        }
        // corners
        this.set(-1, -1, this.get(0, 0));
        this.set(dim, -1, this.get(dim - 1, 0));
        this.set(-1, dim, this.get(0, dim - 1));
        this.set(dim, dim, this.get(dim - 1, dim - 1));
    }

    set(x: number, y: number, value: number) {
        this.data[this._idx(x, y)] = value;
    }

    get(x: number, y: number) {
        return this.data[this._idx(x, y)];
    }

    _idx(x: number, y: number) {
        if (x < -1 || x >= this.dim + 1 ||  y < -1 || y >= this.dim + 1) throw new RangeError('out of range source coordinates for DEM data');
        return (y + 1) * this.stride + (x + 1);
    }

    // assume 8-bit rgb encoding
    unpack(r: number, g: number, b: number) {
        return ((r + g * 256.0 + b * 256 * 256));
    }

    getPixels() {
        return new RGBAImage({width: this.stride, height: this.stride}, new Uint8Array(this.data.buffer));
    }

    backfillBorder(borderTile: DEMData, dx: number, dy: number) {
        if (this.dim !== borderTile.dim) throw new Error('dem dimension mismatch');

        let xMin = dx * this.dim,
            xMax = dx * this.dim + this.dim,
            yMin = dy * this.dim,
            yMax = dy * this.dim + this.dim;

        switch (dx) {
        case -1:
            xMin = xMax - 1;
            break;
        case 1:
            xMax = xMin + 1;
            break;
        }

        switch (dy) {
        case -1:
            yMin = yMax - 1;
            break;
        case 1:
            yMax = yMin + 1;
            break;
        }

        const ox = -dx * this.dim;
        const oy = -dy * this.dim;
        for (let y = yMin; y < yMax; y++) {
            for (let x = xMin; x < xMax; x++) {
                this.set(x, y, borderTile.get(x + ox, y + oy));
            }
        }
    }
}

register('rawData', rawData);
