<template>
<div id="app">
  <div class="container" v-if="!noIndexDB">
    <br>
    <div class="has-text-centered">
      <h2 class="title is-2">Soundboard v{{$options.VERSION}}</h2>
      <b-button class="has-text-centered" @click="addNewFile">New File</b-button>
    </div>
    <br>
    <div class="columns is-multiline">
      <b-loading :is-full-page="false" :active="loading" />
      <div class="column is-3" v-for="group in groups" :key="group.name">
        <a @click="play(group.name)" class="box has-background-info has-text-white ">
          <h4 class="title is-inline is-4 has-text-white">{{group.name}}</h4>
          <a class="button is-small is-pulled-right is-warning is-outlined " @click="edit(group.name)"><b-icon icon="pencil" class="is-pulled-right"  /></a>
          <p class="subtitle is-6 has-text-white">{{group.description}}</p>
          <hr>
          <ul>
            <li v-for="file in group.files" :key="file">{{file}}</li>
          </ul>
        </a>
      </div>
      <div class="column is-3">
        <div class="box has-background-success has-text-white ">
          <input type="text" v-model="groupAdder.name" placeholder="My new group" class="transparent is-inline has-text-white title is-4" />
          <textarea type="textarea" cols="10" style="padding-bottom: 0" rows=2 v-model="groupAdder.description" class="transparent has-text-white subtitle is-inline" placeholder="Click to enter a description" />
          <hr>
          <b-field label="Add Files">
            <b-taginput
                v-model="groupAdder.files"
                :data="clipSearchResults"
                autocomplete
                :allow-new="false"
                placeholder="Add a clip"
                field="name"
                @typing="searchClips"
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
          </b-field>
          <div><b-button type="is-info" @click="createGroup">Create Group</b-button></div>
        </div>
      </div>
    </div>
  </div>
  <p v-else class="has-text-centered">Your browser does not support IndexDB that is required for this app to use.</p>
</div>
</template>

<script>
const DB_VERSION = 1;
const VERSION = "0.1.0-beta";
let justEdited = false;

let audioClips = [];

import AddFileModal from '@/components/AddFileModal.vue'

export default {
  name: 'App',
  VERSION,
  data() {
    return {
      loading: true,
      noIndexDB: false,
      db: null,
      table: null,
      groupAdder: {
        name: null,
        description: null,
        files: []
      },
      groups: [],
      clipSearchResults: [],
      prevAudio: null
    }
  },
  computed: {
    createGroupItemsList() {
      const names = [];
      this.groupAdder.files.forEach(file => {
        names.push(file.name)
      })
      return names;
    }
  },
  methods: {
    play(groupName) {
      if(!justEdited) {
        const group = this.groups.find(v => v.name === groupName)
        if(!group) return alert('Cannot find group')
        if(!group.loaded) {
          group.clips = {}
          group.files.forEach(name => {
            //get file from indexDB
            const clip = audioClips.find(clip => clip.name === name || clip.alias === name)
            if(!clip) console.warn(`Could not find a clip for ${name}`)
            else group.clips[name] = clip.data
          })
          group.loaded = true;
        }
        const selectedClip = group.files[Math.floor(Math.random() * group.files.length)];

        //TODO: replace audio with html
        if(this.prevAudio) this.prevAudio.pause()

        const audio = new Audio(group.clips[selectedClip])
        this.prevAudio = audio;
        audio.play()
      }
      justEdited = false;
    },
    searchClips(text) {
      this.clipSearchResults = audioClips.filter((clip) => {
          return clip.name
              .toLowerCase()
              .indexOf(text.toLowerCase()) >= 0
            || clip.alias
              .toLowerCase()
              .indexOf(text.toLowerCase()) >= 0
      })
    },
    edit(group) {
      justEdited = true;
      return alert('edit not implemented', group);
    },
    addNewFile() {
      this.$buefy.modal.open({
        parent: this,
        component: AddFileModal,
        events: {
          upload: ({file, alias, files}) =>  {
            if(files) {
              files.forEach(file => {
                const reader = new FileReader();
                reader.readAsDataURL(file)
                reader.addEventListener("load", () => {
                  const transaction = this.db.transaction("audio", "readwrite").objectStore("audio").add({
                    name: file.name,
                    size: file.size,
                    data: reader.result
                  })
                  transaction.onsuccess = () => {
                    console.log(`Uploaded file ${file.name} successfully`)
                  }
                  transaction.onerror = () => {
                    alert('File already exists with that name or alias.')
                  }
                }, false);
              })
            }else if(file) {
              
            }else{
              alert('Invalid')
            }
          }
        }
      })
    },
    createGroup() {
      const object = {
        name: this.groupAdder.name,
        description: this.groupAdder.description,
        files: this.createGroupItemsList
      }

      this.db.transaction("groups", "readwrite").objectStore("groups").add(object).onsuccess = () => {
        this.groups.push(object)
        console.log(`Created group ${this.groupAdder.name} successfully`)
      }
    }
  },
  created() {
    const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    if(!indexedDB ) {
      this.noIndexDB = true;
      alert('Sorry, but your browser does not support IndexDB. This app cannot work without it.');
      return;
    }
    //Open the IndexDB Database
    const request = indexedDB.open("soundboard", DB_VERSION);
    
    request.onerror = function (event) {
      console.error('IndexDB access failure')
      alert("Error accessing IndexedDB database");
    };
    request.onupgradeneeded = function(event) {
      console.log(event.target)
      const oldVersion = event.oldVersion;
      const db = event.target.result
      console.debug('upgrade', oldVersion);
      switch(oldVersion) {
        case 0: {
          const clips = db.createObjectStore("audio", {keyPath: 'name'});
          clips.createIndex('alias', 'alias', {unique: true})
          db.createObjectStore("groups", {keyPath: 'name'});
        }
      }
    }
    request.onsuccess = (event) => {
      console.log('DB Success. V', DB_VERSION)
      this.db = request.result;

      this.db.transaction("audio").objectStore("audio").getAll().onsuccess = (event) => {
        const clips = event.target.result;
        audioClips = clips
        this.loading = false;
      }
      this.db.transaction("groups").objectStore("groups").getAll().onsuccess = (event) => {
        this.groups = event.target.result
      }
    }

    //Finally, access the audio clips:
    
  },
}
</script>

<style>
a.box:hover {
  border-radius: 12px;
}
.transparent {
  background: transparent;
  border: none;
}
</style>