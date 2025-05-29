<widget>
{
    "name": "Roon Email Reset2",
    "description": "The email reset component for https://roonlabs.com/reset-email2",
    "tags": [ 'custom', 'web' ],
    "strings": {
        "label_new_email":        { "value": "New Email" },
        "label_confirm_email":    { "value": "Confirm Email" },
        "submit_button":           { "value": "Reset" },
        "success_login":          { "value": "Your email has been reset. You may now <a href='/account'>sign in</a>." },
        "fail_unexpected":        { "value": "There was an unexpected error resetting your email. Please wait a while and try again." },
        "fail_network":           { "value": "There was a network error communicating. Please check your network and try again." },
        "fail_enter_new_email":   { "value": "Please enter a new email address." },
        "fail_no_match":          { "value": "Emails don't match. Please enter your email again." },
        "fail_not_found":         { "value": "The reset link you followed has expired. Please <a href='/reset-email'>request a new link</a>." },
        "fail_invalid_email":     { "value": "The email address you entered is invalid. Please type a valid email address." },
        "fail_email_exists":      { "value": "Email already in use by another account. Please enter a different email address." },
    },
    "properties": [ ]
}
</widget>

<template>
    <div class="guttered">
        <div class="top">
            <form @submit.prevent="submit" v-if="status != 'Success'">
                <div class="group">
                    <label><pr-text path="t.label_new_email"/></label>
                    <input v-model="email1" ref="email1" type="email">
                </div>
                <div class="group">
                    <label><pr-text path="t.label_confirm_email"/></label>
                    <input v-model="email2" ref="email2" type="email">
                </div>

                <div class="buttons">
                    <button data-ok-editor='1' type="submit"><pr-text path="t.submit_button"/></button>
                </div>
            </form>
            <div v-if='status' class='status' :class='{ bad: status != "Success" }'>
                <pr-text path='t.success_login'                 v-if='status == "Success"'       />
                <pr-text path='t.fail_unexpected'          v-else-if='status == "UnexpectedError"'   />
                <pr-text path='t.fail_network'             v-else-if='status == "NetworkFailure"'    />
                <pr-text path='t.fail_enter_new_email'     v-else-if='status == "NoEmail"'           />
                <pr-text path='t.fail_no_match'            v-else-if='status == "BadConfirm"'        />
                <pr-text path='t.fail_not_found'           v-else-if='status == "NotFound"'          />
                <pr-text path='t.fail_invalid_email'       v-else-if='status == "InvalidEmail"'      />
                <pr-text path='t.fail_email_exists'        v-else-if='status == "EmailExists"'       />
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
    name: "RoonEmailReset2",
    inject: [ 'editor' ],
    data() {
        return {
            email1:    '',
            email2:    '',
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
                window.location.href = "/reset-email";
                return;
            }
        });
        this.code = this.qs.code;
        this.$refs.email1.focus();
    },
    methods: {
        onlyReal(desc, cb) {
            if (!this.editor) cb();
            else console.log(desc);
        },
        async submit() {
            try {
                if (!this.email1) {
                    this.status = "NoEmail";
                    return;
                }
                if (this.email1 !== this.email2) {
                    this.status = "BadConfirm";
                    return;
                }

                const formData = new FormData();
                formData.append('code', this.code);
                formData.append('email', this.email1);

                const res = await fetch("/api/6/reset-email", { method: 'post', body: formData });
                const j = await res.json();

                if (j.status === "Success") {
                    this.status = j.status;

                } else if (j.status === "NotFound") {
                    this.status = j.status;

                } else if (j.status === "InvalidEmail") {
                    this.status = j.status;

                } else if (j.status === "EmailExists") {
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
