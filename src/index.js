/**
 * WordPress dependencies
 */
const { registerBlockType } = wp.blocks;

import './editor.css';

/**
 * Internal dependencies
 */
import Edit from './edit';
import save from './save';


registerBlockType( 'mamaduka/create-block-esbuild', {
	edit: Edit,
	save,
} );
