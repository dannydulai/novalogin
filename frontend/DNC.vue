<widget>
{
    name: "DNC",
    tags: [ 'web', 'custom' ],
    description: "DNC manager",
    dataPullers: {
        "info": {
            name: "Roon DNC",
            description: "Retrieve Roon account DNC info.",
            params: {
                "userid": {
                    required: true,
                },
            },
            async get(params, options) {
                const qs = new URLSearchParams();
                qs.append('userid', params.userid);

                const response = await fetch(`https://accounts5.roonlabs.com/accounts/3/usergetdnc`, { method: 'POST', body: qs });
                    const { dncs, email } = await response.json();

                return {
                    userid: params.userid,
                    dncs,
                    email
                };
            }
        }
    },
    properties: [],
    strings: {
        saved: { value: "Communication settings saved!" },
        oops: { value: "Oops something went wrong :(" },
        interested: { value: "Interested?" },
        updatebutton: { value: "Update my preferences" },
        label_company_news: { value: "Company News" },
        description_company_news: { value: "General news and information from Roon Labs about the company." },
        label_roon_software_news: { value: "Roon Software News" },
        description_roon_software_news: { value: "News and announcements about Roon, including important information about updates." },
        label_roon_software_promos: { value: "Roon Software Promotions" },
        description_roon_software_promos: { value: "Occasional Roon license promotions, giveaways, and holiday deals." },
        label_roon_store_promos: { value: "Roon Store Promotions" },
        description_roon_store_promos: { value: "Promotional messages about new audio products, giveaways, and deals in the Roon Store." },
        label_roon_mastery: { value: "Roon Mastery Series" },
        description_roon_mastery: { value: "100 days of Roon tips, tricks, and real-world use cases to help you get the most of our Roon." },

    }
}
</widget>

<template>
    <div style="min-height: 400px; height: 100%; width: 100%; display: flex; justify-content: center; align-items: center; font-size: 2rem;" v-if='saved'>
        <pr-text path='t.saved'/>
    </div>
    <div style="min-height: 400px; height: 100%; width: 100%; display: flex; justify-content: center; align-items: center; font-size: 2rem;" v-else-if='error'>
        <pr-text path='t.oops'/>
    </div>
    <div v-else class="dnc guttered">
        <div class="top" >
            <div style="margin-left: var(--margin);">{{email}}</div>
            <div style="text-align: right; margin-bottom: 5px; margin-right: var(--margin);"><pr-text path='t.interested'/></div>
        </div>
        <div class="content">
            <label 
                style="padding: 30px 0px; border-bottom: 1px solid rgba(var(--color-1-fg2), 0.1); display: flex; width: 100%; justify-content: space-between; align-items: center;"
                v-for="dnc in dncTypes">
                <div style='margin-left: var(--margin);'>
                    <div style="font-size: 1.2em; margin-bottom: 0.5em;" >{{dnc.label}}</div>
                    <div>{{dnc.description}}</div>
                </div>
                <div style="padding-left: var(--margin); padding-right: var(--margin);">
                    <Toggle v-model="dnc.checked" :falseValue='false' :trueValue='true' />
                </div>
            </label>
        </div>
        <div class="bottom">
            <button @click.prevent="saveDNCs">
                <pr-text path='t.updatebutton'/>
                <span v-if='saving' class="spinner"></span>
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "../media.scss";

@include media-sm-only {
    .bottom {
        display: flex;
        justify-content: center;
        button {
            justify-content: center;
        }
    }
}

.dnc {
    display:        flex;
    flex-direction: column;

    padding-bottom: 40px;

    --toggle-bg-on: rgb(var(--color-3-bg));
    --toggle-border-on: rgb(var(--color-3-bg));
    --toggle-ring-color: rgba(var(--color-3-bg), 0.5);

    .top {
        border-bottom: 1px solid rgba(var(--color-1-fg2), 0.2);
        display: flex;
        justify-content: space-between;
    }
    .bottom {
        margin-top: 2rem;
        margin-left: var(--margin);
        margin-right: var(--margin);
        button {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
    }

    label {
        position: relative;
        font-size: 1em;
        padding: 0 0.25em 0;
        user-select: none;
    }

}

.spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgb(var(--color-3-fg1));
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: spinnerrotation 1s linear infinite;
}

@keyframes spinnerrotation {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
} 
</style>

<style lang='scss' src="@vueform/toggle/themes/default.scss">
</style>

<script>
import 'cross-fetch/polyfill';
import Toggle from '@vueform/toggle'

export default {
    name: "DNC",
    props: { s: { required: true, type: Object } },
    inject: [ 'data', 'tstrings' ],
    components: {
        Toggle
    },
    created() {
        const data = this.data['DNC-info'];
        if (data) {
            this.userid = data.userid;
            this.email = data.email;
            if (!this.userid || !this.email) {
                this.error = true;
                return;
            }
            for ( let dnc of data.dncs ) {
                (this.dncTypes.find(d => d.id === dnc) || {}).checked = false;
            }
        } else {
            this.error = true;
            return;
        }
    },
    data() {
        return {
            userid:  null,
            email:   null,
            error:   false,
            saving:  false,
            saved:   false,
            dncTypes: [
                {
                    id: "company_news",
                    label: this.tstrings[this.id].label_company_news.value,
                    description: this.tstrings[this.id].description_company_news.value,
                    checked: true
                },
                {
                    id: "roon_software_news",
                    label: this.tstrings[this.id].label_roon_software_news.value,
                    description: this.tstrings[this.id].description_roon_software_news.value,
                    checked: true
                },
                {
                    id: "roon_software_promos",
                    label: this.tstrings[this.id].label_roon_software_promos.value,
                    description: this.tstrings[this.id].description_roon_software_promos.value,
                    checked: true
                },
                {
                    id: "roon_store_promos",
                    label: this.tstrings[this.id].label_roon_store_promos.value,
                    description: this.tstrings[this.id].description_roon_store_promos.value,
                    checked: true
                },
                {
                    id: "roon_mastery",
                    label: this.tstrings[this.id].label_roon_mastery.value,
                    description: this.tstrings[this.id].description_roon_mastery.value,
                    checked: true
                },
            ],
        }
    },
    methods: {
        async saveDNCs() {
            try {
                this.saving = true;

                let tm = new Date();

                const adddncs    = [];
                const removedncs = []; 
                for ( let dnc of this.dncTypes ) {
                    if ( dnc.checked ) removedncs.push(dnc.id)
                    else adddncs.push(dnc.id)
                }

                const url = `https://accounts5.roonlabs.com/accounts/3/usersetdnc?userid=${this.userid}&adddncs=${adddncs.join(',')}&removedncs=${removedncs.join(',')}`
                const res = await (await fetch(url)).json();
                if ( res.status !== 'Success' ) throw res;

                // wait at least 750ms so the UX feels better
                tm = 750 - (new Date() - tm);
                if (tm > 0) await new Promise(r => setTimeout(r, tm));

                this.saved = true;

            } catch (e) {
                console.log(e);
                this.error = true;
            } finally {
                this.saving = false;
            }
        }
    }
}
</script>
