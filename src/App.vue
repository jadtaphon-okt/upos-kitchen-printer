<template>
    <ion-app>
        <ion-router-outlet mode="ios" />
    </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { StatusBar } from '@capacitor/status-bar'
import { AndroidFullScreen } from '@awesome-cordova-plugins/android-full-screen'
import { onMounted } from 'vue'

onMounted(async () => {
    // Set the status bar to be hidden
    await StatusBar.hide()
    // Hide the status bar and navigation bar on Android
    try {
        const full = await AndroidFullScreen.isImmersiveModeSupported()
        if (full) {
            AndroidFullScreen.immersiveMode()
        }
    } catch (error) {
        console.error('Error setting immersive mode:', error)
    }
})
</script>
