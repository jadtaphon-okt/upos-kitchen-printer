<template>
    <ion-page>
        <ion-header>
            <div class="appbar">
                <div class="appbar-title">UPOS Kitchen Printer</div>
                <div class="action-left">
                    <div class="box" @click="goToSettings">
                        <ion-icon :icon="settings" color="primary" size="small"></ion-icon>
                    </div>
                </div>
            </div>
        </ion-header>
        <ion-content :fullscreen="true" class="ion-padding bg-style">
            <div class="login-form">
                <div class="input-container">
                    <label for="api">Username</label>
                    <input type="text" placeholder="Enter Username" v-model="form.username" />
                </div>
                <br />
                <div class="input-container">
                    <label for="api">Password</label>
                    <div class="password-field">
                        <input
                            :type="showPassword ? 'text' : 'password'"
                            placeholder="Enter Password"
                            v-model="form.password"
                        />
                        <div class="password-toggle" @click="showPassword = !showPassword">
                            <ion-icon :icon="showPassword ? eyeOff : eye" size="small"></ion-icon>
                            <span class="visually-hidden">
                                {{ showPassword ? 'Hide Password' : 'Show Password' }}
                            </span>
                        </div>
                    </div>
                </div>
                <br />
                <ion-button class="login-btn" @click="onLogin" :disabled="loading">
                    <ion-spinner v-if="loading" name="dots" color="light"></ion-spinner>
                    <span v-else>Login</span>
                </ion-button>
            </div>
        </ion-content>
    </ion-page>
</template>
<script>
import { defineComponent } from 'vue'
import { settings, eye, eyeOff } from 'ionicons/icons'
import axios from 'axios'
export default defineComponent({
    name: 'LoginPage',

    data() {
        return {
            settings,
            loading: false,
            form: {
                username: '',
                password: ''
            },
            showPassword: false,
            eye,
            eyeOff
        }
    },

    mounted() {
        localStorage.removeItem('token')
    },

    methods: {
        goToSettings() {
            this.$router.push({ name: 'ConfigPage' })
        },

        async onLogin() {
            this.loading = true
            if (!this.form.username || !this.form.password) {
                this.$toast.error('Please enter username and password')
                this.loading = false
                return
            }
            const api = localStorage.getItem('apiUrl')
            if (!api) {
                this.$toast.error('Please set API URL in settings')
                this.loading = false
                return
            }
            const url = `https://${api}/api/auth/sign-in`

            try {
                const res = await axios.post(url, this.form)
                this.loading = false
                localStorage.setItem('token', res.data.accessToken)
                this.$router.push({ name: 'OrderPage' })
            } catch (error) {
                this.$toast.error(error.response.data.message)
                this.loading = false
                return
            }
        }
    }
})
</script>
<style lang="scss" scoped>
.appbar-title {
    font-size: 20px !important;
    font-weight: 600;
    color: #fff;
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
.login-form {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 20px;
}
.login-btn {
    width: 50%;
    min-height: 40px;
    max-height: 40px;
    --border-radius: 5px;
    --background: #2196f3;
    --background-activated: #0d6ea8;
    --box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.1);
}
.password-toggle {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 5px;
    margin-top: 8px;
    cursor: pointer;
    color: #888;
    span {
        margin-top: -2px;
    }
}
</style>
