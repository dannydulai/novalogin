<widget>
{
    name: "EditAccount",
    tags: [ 'web', 'custom' ],
    description: "Edit account information",
    properties: [
    ],
    strings: {
        back_to_account: { value: "Back to account" },
        change_your_info: { value: "Change your account information" },
        first_name: { value: "First name" },
        last_name: { value: "Last name" },
        phone_number: { value: "Phone number" },
        error_getting_info: { value: "There was an error getting your information. Please refresh the page and try again." },
        error: { value: "There was an error updating your information. Please refresh the page and try again." },
        save: { value: "Save" },
    }
}
</widget>
<style scoped>
.loading-spinner-white {
    border: 4px solid transparent;
    border-top: 4px solid #fff;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
<template>
    <div v-if="loading" class="mainbody">
        <div style="display: flex; flex-direction: column; margin-bottom: 3rem; margin-left: 0;">
            <h1 class="skeleton" style="width: 200px;"></h1>
            <p class="skeleton" style="width: 300px;"></p>
        </div>
        <div class="">
            <h2 class="skeleton" style="width: 50%;"></h2>
            <p class="skeleton"></p>
        </div>
    </div>
    <div v-else class="mainbody" :style="[ userid ? 'background-color: #ebffde;' : '']">
        <a class="text" :href="href('/account')"><span>&larr;&nbsp;</span><pr-text path="t.back_to_account"></pr-text></a>
        <h1 style="margin-bottom: 3rem;">
            <pr-text path="t.change_your_info"></pr-text>
        </h1>
        <div class="" style="margin-top: 0;">
            <div style="padding-bottom: 0.5rem;">
                <label><pr-text path="t.first_name"></pr-text></label>
                <input required style="width: 100%;" type="text" v-model="firstname" autocomplete="given-name">
            </div>
            <div style="padding-bottom: 0.5rem;">
                <label><pr-text path="t.last_name"></pr-text></label>
                <input required style="width: 100%;" type="text" v-model="lastname" autocomplete="family-name">
            </div>
            <div style="padding-bottom: 0.5rem;">
                <label><pr-text path="t.phone_number"></pr-text></label>
                <input style="width: 100%;" type="tel" v-model="phone" autocomplete="tel">
            </div>
        </div>
        <section v-if="error == 'ErrorGettingInfo'" class="error-message">
            <pr-text path="t.error_getting_info"></pr-text>
        </section>
        <section v-else-if="error" class="error-message">
            <pr-text path="t.error"></pr-text>
        </section>
        <div class="box no-border save-btn">
            <button class="unstyled" :disabled="canSave" @click="updateAccountInfo" >
                <span v-if="!updateloading"><pr-text path="t.save"></pr-text></span>
                <div v-else class="loading-spinner-white"></div>
            </button>
        </div>
    </div>
</template>
<style scoped lang="scss">
@import "./account.scss";
@import "../media.scss";

.save-btn {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    button {
        width: 300px;
    }
}
@media (max-width: 768px) {
    .save-btn {
        button {
            width: 100%;
        }
    }
} 
.save-btn:disabled {
    opacity: 0.75;
    cursor: not-allowed;
}

.error-message {
    margin-top: 2em;
    border-color: #f14668;
    color: #cc0f35;
    border-radius: 4px;
    border-style: solid;
    border-width: 0 0 0 4px;
    padding: 1.25em 1.5em;
    display: block;
    background-color: #feecf0;
}
</style>
<script>
export default {
    name: "EditAccount",
    inject: ['editor', 'tstrings', 'lang'],
    data() {
        return {
            loading:          true,
            updateloading:    false,
            origfirstname:    '',
            origlastname:     '',
            origphone:        '',

            firstname:        '',
            lastname:         '',
            phone:            '',
            error:            null,
            userid: null,
        }
    },
    created() {
        if (typeof window !== undefined) {
            const qs = new URLSearchParams(window.location.search);
            if (qs.has('userid')) {
                this.userid = qs.get('userid');
            }
            this.getAccountInfo();
        }
    },
    computed: {
        canSave() {
            if (this.loading) return true;
            if (this.firstname === '' || this.lastname === '') return true;
            if (this.firstname === this.origfirstname && this.lastname === this.origlastname && this.phone === this.origphone) return true;
        },
    },
    methods: {
        href(path) {
            if (this.userid) {
                // Handle case where there are already query params
                if (path.indexOf('?') > -1) {
                    return path + '&userid=' + this.userid;
                }
                return path + '?userid=' + this.userid;
            } else {
                return path
            }
        },
        goToAccount() {
            window.location.href = this.href('/account');
        },
        async updateAccountInfo() {
            this.updateloading = true;
            try {
                const res = await fetch(this.href('/api/6/webuserinfo'), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        firstname:   this.firstname,
                        lastname:    this.lastname,
                        phone:       this.phone,
                    }),
                });
                if (res.status === 401) {
                    this.goToAccount();
                } else if (res.status === 200) {
                    this.goToAccount();
                } else {
                    const data = await res.json();
                    this.error = data.status;
                    this.updateloading = false;
                }
            } catch (e) {
                console.log(e);
                this.error = 'ServerError';
                this.updateloading = false;
            }
        },
        async getAccountInfo() {
            this.loading = true;
            try {
                const res = await fetch(this.href('/api/6/webuserinfo'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (res.status === 401) {
                    this.goToAccount();
                } else if (res.status === 200) {
                    const data = await res.json();
                    if (data.status === 'Unauthorized') {
                        this.goToAccount();
                        return;
                    }
                    this.firstname   = this.origfirstname = data.user.firstname;
                    this.lastname    = this.origlastname  = data.user.lastname;
                    this.phone       = this.origphone     = data.user.phone;
                    this.loading = false;
                } else {
                    const data = await res.json();
                    this.error = data.status;
                    this.loading = false;
                }
            } catch (e) {
                console.log(e);
                this.error = 'ErrorGettingInfo';
                this.loading = false;
            } finally {
            }
        },
    }
}
</script>
