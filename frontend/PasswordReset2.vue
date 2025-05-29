<widget>
{
    "name": "Roon Password Reset2",
    "description": "The password reset component for https://roonlabs.com/reset-password2",
    "tags": [ 'custom', 'web' ],
    "strings": {
        "label_password":          { "value": "New Password" },
        "label_confirm_password":  { "value": "Confirm Password" },
        "submit_button":           { "value": "Reset" },
        "success_login":           { "value": "Your password has been reset. You may now <a href='/account'>sign in</a>." },
        "fail_unexpected":         { "value": "There was an unexpected error resetting your password. Please wait a while and try again." },
        "fail_network":            { "value": "There was a network error communicating. Please check your network and try again." },
        "fail_enter_new_password": { "value": "Please enter a new password." },
        "fail_no_match":           { "value": "Passwords don't match. Please enter your password again." },
        "fail_not_found":          { "value": "The reset link you followed has expired. Please <a href='/reset-password'>request a new link</a>." },
        "fail_invalid_password":   { "value": "The password you entered is invalid. Please type a valid password." },
    },
    "properties": [ ]
}
</widget>

<template>
    <div class="guttered">
        <div class="top">
            <form @submit.prevent="submit" v-if="status != 'Success'">
                <div class="group">
                    <label><pr-text path="t.label_password"/></label>
                    <input v-model="password1" ref="password1" type="password" autocomplete="new-password">
                </div>
                <div class="group">
                    <label><pr-text path="t.label_confirm_password"/></label>
                    <input v-model="password2" ref="password2" type="password" autocomplete="new-password">
                </div>

                <div class="buttons">
                    <button data-ok-editor='1' type="submit"><pr-text path="t.submit_button"/></button>
                </div>
            </form>
            <div v-if='status' class='status' :class='{ bad: status != "Success" }'>
                <pr-text path='t.success_login'                 v-if='status == "Success"'           />
                <pr-text path='t.fail_unexpected'          v-else-if='status == "UnexpectedError"'   />
                <pr-text path='t.fail_network'             v-else-if='status == "NetworkFailure"'    />
                <pr-text path='t.fail_enter_new_password'  v-else-if='status == "NoPassword"'        />
                <pr-text path='t.fail_no_match'            v-else-if='status == "BadConfirm"'        />
                <pr-text path='t.fail_not_found'           v-else-if='status == "NotFound"'          />
                <pr-text path='t.fail_invalid_password'    v-else-if='status == "InvalidPassword"'   />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.top {
    max-width: 500px;
    margin: 0 auto;
    form {
        display:        flex;
        flex-direction: column;
        gap:            1rem;

        .group {
            input {
                width: 100%;
            }
        }

        .buttons {
            display:         flex;
            justify-content: flex-end;
        }
    }
    .status {
        color:            rgb(var(--color-3-fg1));
        background-color: rgb(var(--color-3-bg));
        padding:          1rem 2rem;
        border-radius:    4px;
        margin-top:       3rem;

        :deep(a) {
            color: rgb(var(--color-3-fg1)) !important;
            text-decoration: underline !important;
        }

        &.bad {
            background-color: #E96684;
        }
    }
}
</style>

<script>
export default {
    name: "RoonPasswordReset2",
    inject: [ 'editor' ],
    data() {
        return {
            password1: '',
            password2: '',
            code:      null,
            status:    null,
            qs:        {},
        }
    },
    mounted() {
        this.onlyReal("qs+replace", () => {
            // build qs
            const querystring = window.location.search;
            const pairs = (querystring[0] === "?" ? querystring.substr(1) : querystring).split("&");
            pairs.filter(p => p !== '').forEach((pair) => {
                const [key, value] = pair.split("=");
                this.qs[decodeURIComponent(key)] = decodeURIComponent(value) || "";
            });
        });

        this.onlyReal("redirect if no code", () => {
            if (!this.qs.code) {
                window.location.href = "/reset-password";
                return;
            }
        });
        this.code = this.qs.code;
        this.$refs.password1.focus();
    },
    methods: {
        onlyReal(desc, cb) {
            if (!this.editor) cb();
            else console.log(desc);
        },
        async submit() {
            try {
                if (!this.password1) {
                    this.status = "NoPassword";
                    return;
                }
                if (this.password1 !== this.password2) {
                    this.status = "BadConfirm";
                    return;
                }

                const formData = new FormData();
                formData.append('code', this.code);
                formData.append('password', this.password1);

                const res = await fetch("/api/6/reset-password", { method: 'post', body: formData });
                const j = await res.json();

                if (j.status === "Success") {
                    this.status = j.status;

                } else if (j.status === "NotFound") {
                    this.status = j.status;

                } else if (j.status === "InvalidPassword") {
                    this.status = j.status;

                } else {
                    console.log(j);
                    this.status = "UnexpectedError";
                }
            } catch (e) {
                cosole.log(e);
                this.status = "UnexpectedError";
            }
        },
    }
}
</script>
