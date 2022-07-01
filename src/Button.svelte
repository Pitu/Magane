<!-- Allow App.svelte to interface with exported "element" prop -->
<svelte:options accessors={ true }/>

<script>
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	export let element;

	const dispatch = createEventDispatcher();

	const log = message =>
		console.log('%c[MaganeButton]%c', 'color: #3a71c1; font-weight: 700', '', message);

	onMount(() => log('Mounted.'));

	onDestroy(() => log('Destroyed.'));
</script>

<div bind:this={ element } id="maganeButton" class="channel-textarea-emoji channel-textarea-stickers"
	on:click={ e => dispatch('click', e) }
	on:contextmenu|stopPropagation|preventDefault={ e => dispatch('grabPacks', e) }>
	<img class="channel-textarea-stickers-content" src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20width%3D%2224%22%20height%3D%2224%22%20preserveAspectRatio%3D%22xMidYMid%20meet%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M18.5%2011c-4.136%200-7.5%203.364-7.5%207.5c0%20.871.157%201.704.432%202.482l9.551-9.551A7.462%207.462%200%200%200%2018.5%2011z%22%20fill%3D%22%23b9bbbe%22%2F%3E%3Cpath%20d%3D%22M12%202C6.486%202%202%206.486%202%2012c0%204.583%203.158%208.585%207.563%209.69A9.431%209.431%200%200%201%209%2018.5C9%2013.262%2013.262%209%2018.5%209c1.12%200%202.191.205%203.19.563C20.585%205.158%2016.583%202%2012%202z%22%20fill%3D%22%23b9bbbe%22%2F%3E%3C%2Fsvg%3E" alt="Magane menu button">
</div>
