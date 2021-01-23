<template>
    <b-taginput
        v-model="selected"
        :data="clipSearchResults"
        autocomplete
        :allow-new="false"
        placeholder="Add a clip"
        field="name"
        @typing="searchClips"
        @input="$emit('input', selected)"
        ref="taginput"
        >
        <template v-slot="props">
        <p v-if="props.option.alias"><b>{{props.option.alias}}</b> {{props.option.name}}</p>
        <p v-else>{{props.option.name}}</p>
        </template>
        <template #selected="props">
            <b-tag
                v-for="(tag, index) in props.tags"
                :key="index"
                rounded
                :tabstop="false"
                ellipsis
                closable
                @close="$refs.taginput.removeTag(index, $event)">
                {{tag.alias || tag.name}}
            </b-tag>
        </template>
    </b-taginput>
</template>

<script>
export default {
    props: ['clips', 'value'],
    data() {
        return {
            clipSearchResults: [],
            selected: [],
        }
    },
    created() {
        this.selected = this.value || []
    },
    computed: {
        selectedNames() {
            return this.selected.map(clip => clip.name)
        }
    },
    methods: {
        searchClips(text) {
            const query = text.toLowerCase()
            this.clipSearchResults = this.clips.filter((clip) => {
                return !this.selectedNames.includes(clip.name)
                    && (clip.name.toLowerCase().indexOf(query) >= 0)
                    || (clip.alias && clip.alias.toLowerCase().indexOf(query) >= 0)
                    
            })
            this.$emit('input', this.selected)
        },
    }
}
</script>