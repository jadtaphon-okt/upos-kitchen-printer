<template>
    <ion-app>
        <ion-router-outlet mode="ios" />
    </ion-app>
</template>

<script setup lang="ts">
import { StatusBar } from '@capacitor/status-bar'
import { AndroidFullScreen } from '@awesome-cordova-plugins/android-full-screen'
import { onMounted } from 'vue'

onMounted(async () => {
    try {
        await StatusBar.hide()
        const full = await AndroidFullScreen.isImmersiveModeSupported()
        if (full) {
            AndroidFullScreen.immersiveMode()
        }
    } catch (error) {
        console.error('Error setting immersive mode:', error)
    }
})
</script>
