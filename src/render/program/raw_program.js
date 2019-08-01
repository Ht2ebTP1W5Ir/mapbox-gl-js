// @flow

/*
    Adapted from hillshade_program.js - combines the hillshade preparation and
    render steps into a single step
*/

import {
    Uniform1i,
    Uniform1f,
    UniformMatrix4f
} from '../uniform_binding';

const rawUniforms = (context, locations) => ({
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix),
    'u_image': new Uniform1i(context, locations.u_image),
    'u_time': new Uniform1f(context, locations.u_time),
});

const startTime = Date.now();
const rawUniformValues = (painter, tile,) => {
    return {
        'u_matrix': painter.transform.calculatePosMatrix(tile.tileID.toUnwrapped(), false),
        'u_image': 0,
        // add a u_time uniform
        'u_time': (Date.now() - startTime) / 1000,
    };
};

export {
    rawUniforms,
    rawUniformValues,
};
