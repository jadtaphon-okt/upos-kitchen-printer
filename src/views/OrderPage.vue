<template>
    <ion-page>
        <ion-header>
            <div class="appbar">
                <div class="appbar-title" @click="goToConfig">{{ kitchanName }}</div>

                <div class="toggle">
                    <ion-toggle color="success" mode="md" v-model="isAutoPrint"
                        >Auto Print</ion-toggle
                    >
                </div>
                <div class="action-left">
                    <div class="box" @click="openHistory">
                        <ion-icon :icon="timeOutline" size="small"></ion-icon>
                        ประวัติ
                    </div>
                    <!-- <div class="box" @click="openTestMenu" style="background-color: ghostwhite">
                        <ion-icon :icon="printOutline" size="small"></ion-icon>
                        ทดสอบ
                    </div> -->
                </div>
            </div>
        </ion-header>

        <ion-content v-if="!showDetail" :fullscreen="true" class="ion-padding bg-style">
            <div class="order-item" v-for="item in orderStore">
                <div class="order-header">
                    <div>Order No: {{ item.orderNo }}</div>
                    <div>Order Date: {{ dayjs(item.orderDate).format('DD/MM/YYYY') }}</div>
                    <ion-icon
                        :icon="printOutline"
                        size="large"
                        @click="printOrder(item)"
                    ></ion-icon>
                </div>
                <div class="order-status">
                    <div>Print Status: {{ item.isPrint === 'PRINT'? 'Not Printed' : 'Printed' }}</div>
                    <div>Order Status: {{ getStatusOrder(item.orderStatus) }}</div>
                </div>
                <div class="order-go-detail" @click="openOrderDetail(item)">
                    <ion-icon :icon="arrowForwardCircleOutline" size="large"></ion-icon>
                </div>
            </div>
        </ion-content>
        <ion-content v-else :fullscreen="true" class="ion-padding bg-style">
            <div class="order-detail-box">
                <div class="header">
                    <div>Order No: {{ selectedOrder.orderNo }}</div>
                    <div>Order Date: {{ dayjs(selectedOrder.orderDate).format('DD/MM/YYYY') }}</div>
                </div>
                <div class="menu-list">
                    <div>Menu:</div>
                    <ul>
                        <li v-for="(item, index) in selectedOrder.orderItems" :key="index">
                            {{ item.name }} X {{ item.amount }}
                        </li>
                    </ul>
                </div>
            </div>
            <div class="order-detail-action">
                <div class="btn-back" @click="showDetail = false">
                    <ion-icon :icon="caretBackOutline" style="font-size: 20px"></ion-icon>
                    Go Back
                </div>
                <div class="btn-print" @click="printOrder(selectedOrder)">Print Order</div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script>
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
    IonSpinner,
    IonToggle,
    IonIcon,
    IonFooter,
    IonButtons,
    IonProgressBar,
    actionSheetController,
    loadingController,
    alertController
} from '@ionic/vue'
import {
    printOutline,
    print,
    barcode,
    qrCode,
    text,
    iceCream,
    timeOutline,
    settings,
    arrowForwardCircleOutline,
    caretBackOutline
} from 'ionicons/icons'
import { io } from 'socket.io-client'
import { defineComponent } from 'vue'
import Printer from '../services/imin-printer.esm.browser'
import dayjs from 'dayjs'
import axios from 'axios'
import { getStatusOrderDisplay } from '@/plugins/utils'
export default defineComponent({
    name: 'OrderPage',
    components: {
        IonContent,
        IonHeader,
        IonPage,
        IonTitle,
        IonToolbar,
        IonButton,
        IonSpinner,
        IonFooter,
        IonButtons,
        IonProgressBar,
        IonIcon,
        IonToggle
    },
    setup() {
        return {
            printOutline,
            settings,
            arrowForwardCircleOutline,
            caretBackOutline,
            print,
            timeOutline,
            dayjs
        }
    },
    data() {
        return {
            printer: null,
            isConnect: false,
            isBackendConnect: false,
            notConfigured: false,
            loading: true,
            loadingText: 'Connecting to printer...',
            ws: null,
            kitchanName: 'The Kitchen',
            showDetail: false,
            isAutoPrint: false,
            selectedOrder: null,
            kitchen: {},
            orderStore: []
        }
    },

    async mounted() {
        this.printer = new Printer()
        await this.initializePrinter()
        this.kitchanName = localStorage.getItem('kitchenName') || 'UPOS Kitchan'
        this.isAutoPrint = localStorage.getItem('autoPrint') === 'true'
        this.kitchen = {
            cooking_id: Number(localStorage.getItem('kitchenId')),
            cooking_code: localStorage.getItem('kitchenCode'),
            cooking_name: localStorage.getItem('kitchenName')
        }
        if (this.ws) {
            this.ws.disconnect()
        }

        const url = localStorage.getItem('apiUrl')
        this.ws = io(`wss://${url}/ws-orders`)

        this.ws.on('connect', () => {
            console.log('[WEBSOCKET] connected:', this.ws.id)
            this.ws.emit('join_cooking', this.kitchen)
            this.ws.on('test', msg => {
                console.log('[WEBSOCKET] Test message:', msg)
            })
            this.ws.on('new-order', msg => {
                if (msg.orderList) {
                    this.orderStore = msg.orderList
                }
                if (this.isAutoPrint && msg.newOrder) {
                    this.printOrder(msg.newOrder)
                } else if (msg.newOrder) {
                    this.orderStore.push(msg.newOrder)
                }
            })
        })
    },

    watch: {
        isAutoPrint(val) {
            localStorage.setItem('autoPrint', val)
        }
    },

    methods: {
        getStatusOrder (status) {
            return getStatusOrderDisplay(status)
        },

        async handshakeWebShocket() {},

        reJoinKitchen() {
            this.ws.emit('join_cooking', this.kitchen)
        },

        printOrder(item) {
            this.printer.setTextSize(38)
            this.printer.setAlignment(2)
            this.printer.printText(this.kitchanName)
            this.printer.setTextSize(28)
            this.printer.printText('Order No: ' + item.orderNo)
            this.printer.printText('Order Date: ' + dayjs(item.orderDate).format('DD/MM/YYYY'))
            this.printer.setTextSize(26)
            this.printer.printText('Menu:')
            for (let i = 0; i < item.orderItems.length; i++) {
                this.printer.printText(`${i + 1}. ${item.orderItems[i].name} : จำนวน ${item.orderItems[i].amount}`)
            }
            this.printer.printText('=========================')
            this.printer.setTextSize(24)
            this.printer.printText(`Note: ${item.orderNote}`)
            this.printer.partialCut()
            this.printer.printAndFeedPaper(50)
            this.updateStatusPrint(item.id)
            this.orderStore = this.orderStore.filter(order => order.id !== item.id)
        },

        async updateStatusPrint(id) {
            const value = localStorage.getItem('apiUrl')
            const headers = {
                Authorization: 'Bearer ' + localStorage.getItem('token')
            }
            const res = await axios.put(
                `https://${value}/api/order/print/${id}`,
                {},
                { headers: headers }
            )
            if (res) {
                this.showDetail = false
            }
        },

        goToConfig() {
            this.$router.push('/config')
        },

        openOrderDetail(item) {
            this.selectedOrder = item
            this.showDetail = true
        },

        async initializePrinter() {
            console.log('[PRINTER] Initializing...')
            const loading = await loadingController.create({
                message: 'Connecting to printer...',
                spinner: 'crescent',
                mode: 'ios'
            })
            loading.present()
            try {
                this.isConnect = await this.printer.connect()
                console.log('[PRINTER] Connected:', this.isConnect)
                if (this.isConnect) {
                    this.printer.initPrinter()
                    console.log('[PRINTER] Initialized')
                    this.getPrinterStatus(1)
                    console.log('[PRINTER] Status checked')
                }
            } catch (error) {
                console.error('[PRINTER] Error initializing:', error)
                loading.dismiss()
            } finally {
                setTimeout(() => {
                    loading.dismiss()
                }, 2000)
            }
        },

        async getPrinterStatus(type) {
            const _this = this
            let reconnectNum = 0
            if (type) {
                const checkStatus = setInterval(async () => {
                    const status = await this.printer.getPrinterStatus()
                    if (status.value === 0) {
                        this.loadingText = 'Printing status is normal.'
                        setTimeout(function () {
                            _this.loading = false
                        }, 2000)
                        clearInterval(checkStatus)
                    } else if (status.value < 0) {
                        reconnectNum++
                        if (reconnectNum > 3) {
                            reconnectNum = 0
                            this.printer.initPrinter()
                        }
                    } else {
                        this.loadingText =
                            'Error, printing status is abnormal, status value:' +
                            JSON.stringify(status.value) +
                            ' trying to reconnect'
                    }
                }, 2000)
            } else {
                const status = await this.printer.getPrinterStatus()
                console.log('status', status)
            }
        },

        async openTestMenu() {
            const actionSheet = await actionSheetController.create({
                mode: 'ios',
                buttons: [
                    {
                        text: 'Print Text',
                        icon: text,
                        handler: () => {
                            this.testPrintText()
                        }
                    },
                    {
                        text: 'Print QR Code',
                        icon: qrCode,
                        handler: () => {
                            this.testPrintQR()
                        }
                    },
                    {
                        text: 'Print Barcode',
                        icon: barcode,
                        handler: () => {
                            this.testPrintBarcode()
                        }
                    },
                    {
                        text: 'Print Order',
                        icon: iceCream,
                        handler: () => {
                            this.testPrintOrder()
                        }
                    },
                    {
                        text: 'Cancel',
                        role: 'cancel'
                    }
                ]
            })

            await actionSheet.present()
        },

        testPrintText() {
            this.printer.printText('test print centent')
            this.printer.printAndFeedPaper(50)
        },

        testPrintBarcode() {
            this.printer.printBarCode('123456789012', 2, 70, 3, 1)
            this.printer.printAndFeedPaper(50)
        },

        async testPrintOrder() {
            const menuList = [
                { name: 'Menu Item 1' },
                { name: 'Menu Item 2' },
                { name: 'Menu Item 3' }
            ]
            setTimeout(() => {
                this.printer.setTextSize(28)
                this.printer.setAlignment(2)
                this.printer.printText(this.kitchanName)
                this.printer.printText('Order No: 123456')
                this.printer.printText('Order Date: 2023-10-01')
                this.printer.setTextSize(26)
                this.printer.printText('Menu:')
                for (let i = 0; i < menuList.length; i++) {
                    this.printer.printText(menuList[i].name)
                }
                this.printer.printText('=========================')
                this.printer.setTextSize(24)
                this.printer.printText('Note: Please serve the order as soon as possible.')
                this.printer.partialCut()
                this.printer.printAndFeedPaper(50)
            }, 1000)
        },

        testPrintQR() {
            this.printer.printQrCode('https://www.google.com')
            this.printer.printAndFeedPaper(50)
        },

        openHistory() {
            this.$router.push('/history')
        }
    }
})
</script>
<style scoped>
.action-left {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-left: 10px;
}
</style>
