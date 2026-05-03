<script lang="ts">
	import { page } from '$app/state';
	import BoardApp from '$lib/components/BoardApp.svelte';
</script>

<BoardApp boardId={page.params.boardId!} setId={page.params.setId!} editMode={false} />
