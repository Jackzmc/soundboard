<template>
    <div class="box">
        <h4 class="title is-4">Clips</h4>
        <ul>
            <li v-for="clip in clips" :key="clip.name">
                <p v-if="clip.alias"><b>{{clip.alias}}</b> ({{clip.name}})</p>
                <p v-else>{{clip.name}}</p>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    props: ['clips']
}
</script>