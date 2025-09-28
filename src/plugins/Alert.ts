import { alertController } from '@ionic/vue'
import type { TextFieldTypes } from '@ionic/core'

export default class Alert {
  async askYesNo(
    header: string = 'Confirm',
    message: string,
    yesText: string = 'Yes',
    noText: string = 'No'
  ): Promise<boolean> {
    const alert = await alertController.create({
      header: header,
      message: message,
      buttons: [
        {
          text: noText,
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: yesText,
          role: 'confirm',
          cssClass: 'alert-button-confirm'
        }
      ],
      mode: 'ios'
    })
    await alert.present()
    const { role } = await alert.onDidDismiss()
    return role === 'confirm'
  }

  async askEnforce(
    header: string = 'Enforce Action',
    message: string,
    enforceText: string = 'Enforce'
  ): Promise<boolean> {
    const alert = await alertController.create({
      header: header,
      message: message,
      buttons: [
        {
          text: enforceText,
          role: 'confirm',
          cssClass: 'alert-button-confirm'
        }
      ],
      mode: 'ios'
    })
    await alert.present()
    const { role } = await alert.onDidDismiss()
    return role === 'confirm'
  }

  async askInput(
    header: string = 'Input Required',
    message: string,
    placeholder: string = 'Enter value',
    inputType: TextFieldTypes = 'text',
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): Promise<string | null> {
    const alert = await alertController.create({
      header: header,
      message: message,
      inputs: [
        {
          name: 'inputValue',
          type: inputType,
          placeholder: placeholder
        }
      ],
      buttons: [
        {
          text: cancelText,
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: confirmText,
          role: 'confirm',
          cssClass: 'alert-button-confirm',
          handler: (data) => data.inputValue
        }
      ],
      mode: 'ios'
    })
    await alert.present()
    const { role, data } = await alert.onDidDismiss()
    return (role === 'confirm' && data.values) ? data.values.inputValue : null
  }
}
