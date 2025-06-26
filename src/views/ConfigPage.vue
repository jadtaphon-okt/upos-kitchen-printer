<template>
    <ion-page>
        <ion-content class="ion-padding" :fullscreen="true">
            <div class="body-container">
                <div class="api-form">
                    <div class="input-container">
                        <label for="api">API Endpoint</label>
                        <input type="text" placeholder="Enter an API Endpoint" v-model="url" />
                    </div>
                    <div class="btn-check" @click="testConnection">Connect</div>
                </div>
                <div class="kitchen-form">
                    <label for="kitchen">Select Kitchen</label>
                    <ion-select
                        class="select-kitchen"
                        interface="action-sheet"
                        mode="ios"
                        v-model="kitchen"
                        placeholder="Select Kitchen"
                    >
                        <ion-select-option
                            v-for="(item, index) in kitchens"
                            :index="index"
                            :value="item"
                            >{{ item.name }}</ion-select-option
                        >
                    </ion-select>
                </div>
            </div>
            <div class="action-container">
                <div class="btn-cancel" @click="goBack">Cancel</div>
                <div class="btn-confirm" @click="onConfirm">Confirm</div>
            </div>
        </ion-content>
    </ion-page>
</template>
<script>
import { defineComponent } from 'vue'
import { IonPage, IonContent, IonSelect, IonSelectOption, toastController } from '@ionic/vue'
import axios from 'axios'
export default defineComponent({
    components: {
        IonPage,
        IonContent,
        IonSelect,
        IonSelectOption
    },

    data() {
        return {
            url: '',
            kitchen: '',
            kitchens: []
        }
    },

    mounted() {
        this.url = localStorage.getItem('apiUrl') || ''
        this.kitchen = localStorage.getItem('kitchenId') || ''
    },

    methods: {
        goBack() {
            this.$router.back()
        },

        async onConfirm() {
            if (!this.url) {
                this.errorToast('Please enter an API Endpoint')
                return
            }
            if (!this.kitchen) {
                this.errorToast('Please select a kitchen')
                return
            }

            localStorage.setItem('apiUrl', this.url)
            localStorage.setItem('kitchenId', this.kitchen.id)
            localStorage.setItem('kitchenName', this.kitchen.name)
            localStorage.setItem('kitchenCode', this.kitchen.code)
            try {
                await axios.get('https://' + this.url)
            } catch (error) {
                this.errorToast('Invalid API Endpoint')
                return
            }

            location.href = '/'
        },

        async getKitchenList() {
            try {
                const res = await axios.get('https://' + this.url + '/api/cooking')
                this.kitchens = res.data
            } catch (error) {
                this.errorToast('Failed to fetch kitchen list')
            }
        },

        successToast() {
            toastController
                .create({
                    message: 'Connection Successful',
                    duration: 2000,
                    color: 'success',
                    position: 'top'
                })
                .then(toast => toast.present())
        },

        errorToast(msg) {
            toastController
                .create({
                    message: msg,
                    duration: 2000,
                    color: 'danger',
                    position: 'top'
                })
                .then(toast => toast.present())
        },

        async testConnection() {
            try {
                const { data } = await axios.get('https://' + this.url)
                if (data.status && data.status === 'ok') {
                    this.successToast()
                    this.getKitchenList()
                } else {
                    this.errorToast('Connection Failed')
                }
            } catch (error) {
                this.errorToast(error.message)
            }
        }
    }
})
</script>
<style lang="scss" scoped>
.body-container {
    padding: 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: calc(100vh - 80px);
}
.action-container {
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
}
.btn-cancel,
.btn-confirm,
.btn-check {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20%;
    height: 40px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
}
.btn-cancel {
    background-color: #ff4081;
}
.btn-confirm {
    background-color: #00bfa5;
}
.btn-check {
    margin-top: 24px;
    background-color: #2196f3;
}
.btn-cancel:active {
    background-color: #d23469;
}
.btn-confirm:active {
    background-color: #009c86;
}
.btn-check:active {
    background-color: #0d6ea8;
}
.kitchen-form {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
    width: 100%;
    label {
        width: 72.5%;
        margin-bottom: 5px;
    }
}
.api-form {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 20px;
    width: 100%;
}
.select-kitchen {
    width: 72.5%;
    border-radius: 5px;
    border: 1px solid #ccc;
    padding: 0 10px;
    .select-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 40px;
    }
}
.input-container {
    width: 50%;
    label {
        display: block;
        margin-bottom: 5px;
    }
    input {
        width: 100%;
        height: 40px;
        border-radius: 5px;
        border: 1px solid #ccc;
        padding: 0 10px;
        outline: none;
    }
}
</style>
