<template>
<div id="app">
  <div class="container" v-if="!noIndexDB">
    <br>
    <div class="has-text-centered">
      <h2 class="title is-2">Soundboard v{{$options.VERSION}}</h2>
      <div class="buttons has-text-centered">
        <b-button @click="addNewFile">Click to add a new audio clip</b-button>
        <b-button type="is-secondary" @click="listFiles">View Clips</b-button>
      </div>
    </div>
    <br>
    <div class="columns is-multiline">
      <b-loading :is-full-page="false" :active="loading" />
      <div class="column is-3" v-for="group in groups" :key="group.name">
        <a @click="play(group.name)" class="box has-background-info has-text-white ">
          <br>
          <h1 class="title is-1 has-text-white has-text-centered">{{group.name}}</h1>
          <a class="button is-small is-pulled-right is-warning is-outlined " @click="edit(group)"><b-icon icon="pencil" class="is-pulled-right"  /></a>
          <p v-if="group.description" class="subtitle is-6 has-text-white">{{group.description}}</p>
          <br v-else>
          <br>
        </a>
      </div>
      <div class="column is-3">
        <div class="box has-background-success has-text-white ">
          <input type="text" v-model="groupAdder.name" placeholder="My new group" class="transparent  has-text-white title is-4" style="margin-bottom: 0" />
          <!-- <textarea type="textarea" cols="10" style="padding-bottom: 0" rows=2 v-model="groupAdder.description" class="transparent has-text-white subtitle is-inline" placeholder="Click to enter a description" /> -->
          <hr>
          <b-field>
            <ClipSearcher v-model="groupAdder.files" :clips="audioClips" />
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

import AddFileModal from '@/components/AddFileModal.vue'
import ListClipModal from '@/components/ListClipModal.vue'
import EditGroupModal from '@/components/EditGroupModal.vue'
import ClipSearcher from '@/components/ClipSearcher.vue'

export default {
  name: 'App',
  VERSION,
  data() {
    return {
      loading: true,
      noIndexDB: false,
      db: null,
      groupAdder: {
        name: null,
        description: null,
        files: []
      },
      groups: [],
      prevAudio: null,
      audioClips: []
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
            const clip = this.audioClips.find(clip => clip.name === name || clip.alias === name)
            if(clip) group.clips[name] = clip.data
            else console.warn(`Could not find a clip for ${name}`)
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
    edit(group) {
      justEdited = true;
      group = Object.assign({}, group)
      group.clips = [];
      group.files.forEach(name => {
        //get file from indexDB
        const clip = this.audioClips.find(clip => clip.name === name || clip.alias === name)
        if(clip) group.clips.push(clip)
        else console.warn(`Could not find a clip for ${name}`)
      })
      this.$buefy.modal.open({
        parent: this,
        component: EditGroupModal,
        props: {
          group,
          clips: this.audioClips
        },
        events: {
          save: (group) => {
            const index = this.groups.indexOf(group.name);
            if(index > -1) {
              this.groups[index] = group;
            }else{
              console.warn('Could not find cached group to update', group.name)
            }
          },
          delete: (groupName) => {
            this.db.transaction("groups", "readwrite").objectStore("groups").delete(groupName).onsuccess = () => {
              const index = this.groups.indexOf(groupName);
              if(index > -1) {
                this.groups.splice(index, 1)
                console.log(`Created group ${this.groupAdder.name} successfully`)
              }else{
                console.warn('Could not find cached group to delete', groupName)
              }
            }
          }
        }
      })
    },
    addNewFile() {
      this.$buefy.modal.open({
        parent: this,
        component: AddFileModal,
        events: {
          upload: ({file, alias, files}) =>  {
            if(files) {
              files.forEach(file => {
                this.addFile(file)
              })
            }else if(file) {
              this.addFile(file)
            }else{
              alert('Invalid')
            }
          }
        }
      })
    },
    addFile(file) {
      const reader = new FileReader();
      reader.readAsDataURL(file)
      reader.addEventListener("load", () => {
        const obj = {
          name: file.name,
          size: file.size,
          data: reader.result
        }
        const transaction = this.db.transaction("audio", "readwrite").objectStore("audio").add(obj)
        transaction.onsuccess = () => {
          this.audioClips.push(obj)
          console.log(`Uploaded file ${file.name} successfully`)
        }
        transaction.onerror = () => {
          alert('File already exists with that name or alias.')
        }
      }, false);
    },
    listFiles() {
      this.$buefy.modal.open({
        parent: this,
        component: ListClipModal,
        props: {
          clips: this.audioClips
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
        this.audioClips = clips
        this.loading = false;
      }
      this.db.transaction("groups").objectStore("groups").getAll().onsuccess = (event) => {
        this.groups = event.target.result
      }
    }

    //Finally, access the audio clips:
    
  },
  components: {
    ClipSearcher
  }
}
</script>

<style>
a.box:hover {
  border-radius: 8px;
}
.transparent {
  background: transparent;
  border: none;
}
</style>