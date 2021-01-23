<template>
<div class="modal-card" style="width: auto; height: 600px">
    <form @submit.prevent="save">
    <header class="modal-card-head">
        <p class="modal-card-title">Editing group "<b>{{group.name}}</b>"</p>
        <button
            type="button"
            class="delete"
            @click="$emit('close')"/>
    </header>
    <section class="modal-card-body">
        <b-field label="Description (optional)">
            <b-input v-model="editedGroup.description" />
        </b-field>
        <b-field label="Clips">
            <ClipSearcher v-model="editedGroup.clips" :clips="clips" />
        </b-field>
        <br><br><br>
    </section>
    <footer class="modal-card-foot">
        
        <b-button
            label="Save"
            type="is-success"
            size="is-medium"
            @click="save"
        />
        <b-button
            label="Delete"
            type="is-danger" 
            @click="deleteGroup" 
            icon-left="delete"
        />
        <b-button
            label="Cancel"
            type="is-secondary" 
            @click="$emit('close')" 
        />
    </footer>
    </form>
</div>
</template>

<script>
import ClipSearcher from '@/components/ClipSearcher.vue'
export default {
    props: ['group', 'clips'],
    data() {
        return {
            editedGroup: {
                description: null,
                clips: []
            }
        }
    },
    methods: {
        save() {
            this.editedGroup.files = this.editedGroup.clips.map(clip => clip.name)
            this.$emit('save', this.editedGroup)
            this.$emit('close')
        },
        deleteGroup() {
            this.$emit('delete', this.group.name)
            this.$emit('close')
        }
    },
    components: {
        ClipSearcher
    },
    created() {
        this.editedGroup = this.group
    }
}
</script>