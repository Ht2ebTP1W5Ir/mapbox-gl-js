// @flow

import Texture from './texture';
import StencilMode from '../gl/stencil_mode';
import DepthMode from '../gl/depth_mode';
import CullFaceMode from '../gl/cull_face_mode';
import {
    rawUniformValues
} from './program/raw_program';

import type Painter from './painter';
import type SourceCache from '../source/source_cache';
import type HillshadeStyleLayer from '../style/style_layer/hillshade_style_layer';
import type {OverscaledTileID} from '../source/tile_id';

export default drawRaw;

/*
    Adapted from draw_hillshade.js – the major difference is that this uses a single pass
*/
function drawRaw(painter: Painter, sourceCache: SourceCache, layer: HillshadeStyleLayer, tileIDs: Array<OverscaledTileID>) {
    if (painter.renderPass !== 'offscreen' && painter.renderPass !== 'translucent') return;

    const context = painter.context;

    const depthMode = painter.depthModeForSublayer(0, DepthMode.ReadOnly);
    const stencilMode = StencilMode.disabled;
    const colorMode = painter.colorModeForRenderPass();

    for (const tileID of tileIDs) {
        const tile = sourceCache.getTile(tileID);
        if (painter.renderPass === 'translucent') {
            renderRaw(painter, tile, layer, depthMode, stencilMode, colorMode);
        }
    }

    context.viewport.set([0, 0, painter.width, painter.height]);
}

function renderRaw(painter, tile, layer, depthMode, stencilMode, colorMode) {
    const context = painter.context;
    const gl = context.gl;

    if (tile.dem && tile.dem.data) {
        const tileSize = tile.dem.dim;
        const textureStride = tile.dem.stride;

        const pixelData = tile.dem.getPixels();

        // if UNPACK_PREMULTIPLY_ALPHA_WEBGL is set to true prior to drawHillshade being called
        // tiles will appear blank, because as you can see above the alpha value for these textures
        // is always 0
        context.pixelStoreUnpackPremultiplyAlpha.set(false);
        tile.rawTexture = tile.rawTexture || painter.getTileTexture(textureStride);

        context.activeTexture.set(gl.TEXTURE0);

        const renderTexture = new Texture(context, {width: tileSize, height: tileSize, data: null}, gl.RGBA);
        renderTexture.update(pixelData, { premultiply: false });
        renderTexture.bind(gl.LINEAR, gl.CLAMP_TO_EDGE);

        painter.useProgram('raw').draw(context, gl.TRIANGLES,
            depthMode, stencilMode, colorMode, CullFaceMode.disabled,
            rawUniformValues(painter, tile),
            layer.id, tile.maskedBoundsBuffer,
            tile.maskedIndexBuffer, tile.segments);
    }
}
