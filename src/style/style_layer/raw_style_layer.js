// @flow

import StyleLayer from '../style_layer';

import properties from './hillshade_style_layer_properties';

/* adapted from hillshade_style_layer.js */

class RawStyleLayer extends StyleLayer {
    /* skipping layer spec typing */
    // constructor(layer: LayerSpecification) {
    constructor(layer) {
        super(layer, properties);
    }
}

export default RawStyleLayer;
