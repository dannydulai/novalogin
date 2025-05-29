<widget>
{
    name: "LoginAdmin",
    tags: [ 'web', 'custom' ],
    description: "Admin Login Management Widget",
    properties: []
}
</widget>
<template>
<div v-if="initialized" class="guttered content">
    <div style="width: 100%; padding: 2rem;">
        <button @click="logout">Logout</button>
    </div>
    <section v-if="error" class="error-message">
        <span v-if="error == 'Unauthorized'">Invalid Password. Please check your password and try again.</span>
        <span v-if="error == 'NotFound'">There is no account associated with this Email address. Check the Email address and try again.</span>
        <span v-if="error == 'TryAgain'">Unexpected state when signing in. Please try again.</span>
        <span v-else>There was an error: {{error}}.</span>
    </section>
    <div class='table'>
        <form v-for="app of apps" class='cell'>
            <div v-if="app.login_callback" class='addapp-title'>Mobile / Desktop App</div>
            <div v-else class='addapp-title'>Web App</div>
            <div class='addapp-title' style='margin-bottom: 5px;'>
                <label>App ID</label>
                <div>{{ app.id }}</div>
            </div>
            <div v-if="!app.login_callback" class='addapp-title'>
                <label>App Secret</label>
                <div>{{app.secret}}</div>
            </div>

            <div class='addapp-name'>
                <label>App Name</label>
                <input type='text' name='name' v-model="app.name" required autocomplete="off" />
            </div>

            <div v-if="app.login_callback" class='addapp-callback'>
                <label>Login Callback</label>
                <input type='text' name='login_callback' v-model='app.login_callback' required autocomplete="off" v-if="app.login_callback" />
            </div>
            <br>
            <div class='addapp-groups'>
                <label>Groups</label>
                <RoonVueTags placeholder="Add groups..." v-model="app.groups"/>
            </div>
            <div class='addapp-profile'>
                <input type='checkbox' name='login_profile' v-model='app.login_profile'/> Profile Support
            </div>

            <div style='flex-grow: 1;'></div>

            <div class='buttons'>
                <button class='delete' @click.prevent="submitForm('del', app)" style='background-color: #faa; color: #a00;' type="submit">Delete</button>
                <button class='save' @click.prevent="submitForm('save', app)" type="submit">Save</button>
            </div>
        </form>

        <form class='cell' @submit.prevent="submitForm('add', newApp)">
            <div class='addapp-title'>
                New App
            </div>
            <div class='addapp-name'>
                <label>App Name</label>
                <input type='text' name='name' v-model="newApp.name" required autocomplete="off" />
            </div>
            <div class='addapp-name'>
                <label>App Type</label>
                <select name='type' v-model="newApp.type" @change="handleTypeChange">
                    <option value='web' selected>Web App</option>
                    <option value='app'>Mobile or Desktop App</option>
                </select>
            </div>
            <div class='addapp-callback' v-if="newApp.type === 'app'" id='licb'>
                <label>Login Callback</label>
                <input type='text' name='login_callback' v-model="newApp.login_callback" autocomplete="off">
            </div>
            <br>
            <div class='addapp-groups'>
                <label>Groups</label>
                <RoonVueTags placeholder="Add groups..." v-model="newApp.groups"/>
            </div>
            <div class='addapp-profile'>
                <input type='checkbox' name='login_profile' v-model='newApp.login_profile'/> Profile Support
            </div>
            <div style='flex-grow: 1;'></div>
            <div class='buttons'><button type='submit' name='add' value='new'>Create New App</button></div>
        </form>
    </div>
</div>
<div v-else style="display: flex; justify-content: center;">
    <div class="loader"></div>
</div>
</template>
<style scoped>
.loader {
    border: 16px solid #f3f3f3;
    border-radius: 50%;
    border-top: 16px solid #3498db;
    width: 120px;
    height: 120px;
    -webkit-animation: spin 2s linear infinite;
    animation: spin 2s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
<script>
import RoonVueTags from './RoonVueTags.vue';
export default {
  name: 'LoginAdmin',
  components: {
      RoonVueTags,
  },
  data() {
    return {
      initialized: false,
      apps: [],
      newApp: {
        name: '',
        type: 'web',
        login_callback: '',
        login_profile: '',
        groups: [],
      },
      error: '',
    };
  },
  created() {
      if (typeof window !== undefined) {
          this.getData();
      }
  },
  methods: {
      async logout() {
          try {
              const res = await fetch('/api/admin/logout', {method: 'POST'});
              if (res.status === 200) {
                window.location.href = '/login?id=87A883F5-E413-4B0A-B619-ED866E975D2E';
              } else {
                  this.error = 'An error occured logging out';
              }
          } catch (e) {
              console.log(e);
          }
      },
    async getData() {
        try {
            this.initialized = false;
            const response = await fetch('/api/admin/data', {method: 'POST'});
            if (response.status === 401) {
                window.location.href = '/login?id=87A883F5-E413-4B0A-B619-ED866E975D2E';
            }
            if (response.status === 403) {
                window.location.href = '/account';
            }

            if (!response.ok) {
                const errorData = await response.json();
                this.error = 'ServerError';
                return;
            } else {
                this.initialized = true;
            }
            this.apps = (await response.json()).map(x => ({ login_profile: '', ...x }));
        } catch (e) {
            console.log(e);
            this.error = 'An error occurred.'
        }
    },
    async submitForm(action, appData) {
      try {
          const b = {
              [action]:       action === 'add' ? 'new' : appData.id,
              id:             appData?.id,
              name:           appData?.name,
              type:           appData?.type,
              login_callback: appData?.login_callback,
              login_profile:  appData?.login_profile,
              groups:         appData?.groups,
          };

          if (action === 'del') {
              if (!confirm('Are you sure you want to delete ' + appData.name + '? This action cannot be undone.')) {
                  return;
              }
          }

          const response = await fetch('/api/admin/submit', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(b)
          });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'TryAgain');
        }

        if (action === 'add') {
          this.newApp.name = '';
          this.newApp.login_callback = '';
          this.newApp.login_profile = '';
          this.newApp.groups = [];
        }

        this.getData();

      } catch (error) {
        this.error = error.message;
      }
    },
    handleTypeChange() {
      if (this.newApp.type === 'web') {
        this.newApp.login_callback = '';
      }
    },
  },
};
</script>
<style scoped>
tr {
border: 1px solid red;
}
td {
border: 1px solid blue;
}
form {
}

label {
    font-size: 80%;
    color: #666;
    font-weight: 700;
    margin-bottom: 0.25em;
    display: block;
}
input[type=text], select {
    box-shadow: inset 0 0.0625em 0.125em rgb(10 10 10 / 5%);
    max-width: 100%;
    width: 100%;
    background-color: #fff;
    border: 1px solid;
    border-color: #dbdbdb;
    border-radius: 4px;
    color: #363636;
    -webkit-appearance: none;
    align-items: center;
    border-radius: 4px;
    display: inline-flex;
    font-size: 1rem;
    height: 2.5em;
    justify-content: flex-start;
    line-height: 1.5;
    padding-bottom: calc(0.5em - 1px);
    padding-left: calc(0.75em - 1px);
    padding-right: calc(0.75em - 1px);
    padding-top: calc(0.5em - 1px);
    position: relative;
    vertical-align: top;
}

button {
    display: flex;
    justify-content: center;
    align-items: center;
}

.button:hover, input[type=submit]:hover, button:hover, input:hover {
    border-color: #b5b5b5;
}

input[type=submit], button, .button {
    color: white;
    border-color: #dbdbdb;
    border-width: 1px;
    border: 1px solid transparent;
    cursor: pointer;
    justify-content: center;
    padding-bottom: calc(0.5em - 1px);
    padding-left: 2em;
    padding-right: 2em;
    padding-top: calc(0.5em - 1px);
    text-align: center;
    white-space: nowrap;
    height: 2.5em;
    line-height: 1.5;
    border-radius: 4px;
    background-color: #6059ef;
    font-size: 1rem;
    text-decoration: none;
}

button[disabled] {
    cursor: not-allowed;
    background-color: #888 !important;
    color: #bbb;
}

a {
    color: #6059ef;
}

.error-message {
    border-color: #f14668;
    color: #cc0f35;
    border-radius: 4px;
    border-style: solid;
    border-width: 0 0 0 4px;
    padding: 1.25em 1.5em;
    display: block;
    display: flex;
    align-items: flex-start;
    background-color: #feecf0;
}

.table {
    padding: 5px;
    display: flex;
    flex-wrap: wrap;
}

.cell {
    margin: 10px;
    width: 370px;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #444;
    display: flex;
    flex-direction: column;
}

.buttons {
    margin-top: 1em;
    display: flex;
    justify-content: space-between;
}

.addapp-title {
    font-weight: bold;
    margin-bottom: 1em;
}
.addapp-name {
    margin-top: 1em;
}
.addapp-callback {
    margin-top: 1em;
}
.addapp-profile {
    margin-top: 1em;
}

.top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: black;
    color: white;
    padding: 0.75rem 1rem; 
}

.logout a {
    text-decoration: none;
    color: white;
}

.logout a:hover {
    text-decoration: underline;
}

</style>
