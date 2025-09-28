import { toastController, loadingController } from '@ionic/vue'
import { checkmarkCircle, closeCircle, informationCircle, alertCircle, hammer } from 'ionicons/icons'

export default class Toast {
  async success(message: string, duration: number = 2000) {
    const toast = await toastController.create({
      icon: checkmarkCircle,
      message: message,
      duration: duration,
      color: 'success',
      position: 'top',
      cssClass: 'toast-success',
      mode: 'ios'
    })
    await toast.present()
  }

  async error(message: string, duration: number = 2000) {
    const toast = await toastController.create({
      icon: closeCircle,
      message: message,
      duration: duration,
      color: 'danger',
      position: 'top',
      cssClass: 'toast-error',
      mode: 'ios'
    })
    await toast.present()
  }

  async info(message: string, duration: number = 2000) {
    const toast = await toastController.create({
      icon: informationCircle,
      message: message,
      duration: duration,
      color: 'secondary',
      position: 'top',
      cssClass: 'toast-info',
      mode: 'ios'
    })
    await toast.present()
  }

  async warning(message: string, duration: number = 2000) {
    const toast = await toastController.create({
      icon: alertCircle,
      message: message,
      duration: duration,
      color: 'warning',
      position: 'top',
      cssClass: 'toast-warning',
      mode: 'ios'
    })
    await toast.present()
  }

  async plain(message: string, duration: number = 2000, position: 'top' | 'bottom' = 'top') {
    const toast = await toastController.create({
      icon: hammer,
      color: 'light',
      message: message,
      duration: duration,
      position: position,
      cssClass: 'toast-plain',
      mode: 'ios'
    })
    await toast.present()
  }

  async loading(message: string) {
    const loading = await loadingController.create({
      message: message,
      spinner: 'crescent',
      cssClass: 'loading-spinner',
      mode: 'ios'
    })
    await loading.present()
    return loading
  }
}
