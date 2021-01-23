<template>
    <div class="box">
      <h4 class="title is-4">Single Upload</h4>
      <form @submit.prevent="uploadFile()">
        <div class="columns">
          <div class="column">
            <b-field label="Choose a file">
              <b-upload v-model="file" class="file-label" required>
                <span class="file-cta">
                    <b-icon class="file-icon" icon="upload" />
                    <span class="file-label">Click to upload</span>
                </span>
                <span class="file-name" v-if="file">
                  {{ file.name }}
                </span>
              </b-upload>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Alias (optional)">
              <b-input v-model="alias" />
            </b-field>
          </div>
          <div class="column">
            <b-field label="Button">
              <b-button native-type="submit" type="is-link" expanded>Upload File</b-button>
            </b-field>
          </div>
        </div>
      </form>
      <hr>
      <h4 class="title is-4">Multi Upload</h4>
      <b-upload v-model="files"
          multiple
          drag-drop>
          <section class="section">
              <div class="content has-text-centered">
                  <p>
                      <b-icon
                          icon="upload"
                          size="is-large">
                      </b-icon>
                  </p>
                  <p>Drop your files here or click to upload</p>
              </div>
          </section>
      </b-upload>
      <br><br>
      <div class="tags">
        <span v-for="(file, index) in files"
            :key="index"
            class="tag is-primary" >
            {{file.name}}
            <button class="delete is-small"
                type="button"
                @click="deleteDropFile(index)">
            </button>
        </span>
      </div>
      <b-button native-type="submit" type="is-link" is-large @click="submitMultiple">Upload Files</b-button>
    </div>
</template>

<script>
export default {
  data() {
    return {
        file: null,
        files: [],
        alias: null
    }
  },
  methods: {
    uploadFile() {
      this.$emit('upload', {
        file: this.file,
        alias: this.alias
      })
      this.$parent.close()
    },
    submitMultiple() {
      this.$emit('upload', {
        files: this.files,
        alias: this.alias
      })
      this.$parent.close()
    },
    deleteDropFile(index) {
        this.dropFiles.splice(index, 1)
    },
    OnFileChosen(event) {
        this.file = event.target.files[0]
    }
  }
}
</script>