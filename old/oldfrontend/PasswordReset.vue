<widget>
{
    "name": "Roon Password Reset1",
    "description": "The password reset component for https://roonlabs.com/reset-password",
    "tags": [ 'custom', 'web' ],
    "strings": {
        "label_email":            { "value": "Email" },
        "submit_button":          { "value": "Reset" },
        "success_check_email":    { "value": "A password reset link has been sent. Please check the email you entered for a link to reset it." },
        "fail_enter_email":       { "value": "Please enter an email address." },
        "fail_invalid_email":     { "value": "Please check your email address for mistakes." },
        "fail_email_not_found":   { "value": "This email is not associated with an account. Please enter an email associated with a Roon account." },
        "fail_unexpected":        { "value": "There was an unexpected error resetting your password. Please wait a while and try again." },
        "fail_network":           { "value": "There was a network error communicating. Please check your network and try again." },
    },
    "properties": [ ]
}
</widget>

<template>
    <div class="guttered">
        <div class="top">
            <form @submit.prevent="submit" v-if="status != 'Success'">
                <div class="group">
                    <label><pr-text path="t.label_email"/></label>
                    <input v-model.trim="email" ref="email" type="email" autocomplete="email">
                </div>

                <div class="buttons">
                    <button data-ok-editor='1' type="submit"><pr-text path="t.submit_button"/></button>
                </div>
            </form>
            <div v-if="status" class="status" :class="{ bad: status != 'Success' }">
                <pr-text path="t.success_check_email"       v-if='status == "Success"'  />
                <pr-text path="t.fail_enter_email"     v-else-if='status == "EmptyEmail"'        />
                <pr-text path="t.fail_invalid_email"   v-else-if='status == "InvalidEmail"'      />
                <pr-text path="t.fail_email_not_found" v-else-if='status == "EmailNotFound"'     />
                <pr-text path="t.fail_unexpected"      v-else-if='status == "UnexpectedError"'   />
                <pr-text path="t.fail_network"         v-else-if='status == "NetworkFailure"'    />
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
    name: "RoonPasswordReset1",
    inject: ['editor'],
    data() {
        return {
            email:     "",
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

        this.email = this.qs.email || "";

        if (this.qs.code) {
            window.location.href = "/reset-password2?code=" +  encodeURIComponent(this.qs.code);
            return;
        }

        this.$refs.email.focus();

        if (!!this.qs.auto)
            this.submit();
    },
    methods: {
        onlyReal(desc, cb) {
            if (!this.editor) cb();
            else console.log(desc);
        },
        async submit() {
            try {
                this.status = null;

                if (!this.email) { this.status = 'EmptyEmail'; this.$refs.email.focus(); return; }
                if (!(/.@.*\..*$/.test(this.email))) { this.status = 'InvalidEmail'; this.$refs.email.focus(); return; }

                const formData = new FormData();
                formData.append('email', this.email);

                try {
                    const res = await fetch("/api/6/reset-password", { method: 'POST', body: formData });
                    const j = await res.json();

                    if (j.status === "Success") {
                        this.status = "Success";

                    } else if (j.status === "NotFound") {
                        this.status = "EmailNotFound";
                        this.$refs.email.focus();

                    } else {
                        console.log(j);
                        this.status = "UnexpectedError";
                    }
                } catch (e) {
                    cosole.log(e);
                    this.status = "NetworkFailure";
                }

            } catch (e) {
                console.log(e);
                this.status = "UnexpectedError";
            }
        }
    }
}
</script>
