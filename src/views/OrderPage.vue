<template>
    <ion-page>
        <ion-header>
            <div class="appbar">
                <RouterLink class="appbar-title" to="/config">{{ kitchanName }}</RouterLink>

                <div class="toggle">
                    <ion-toggle color="success" mode="md" v-model="isAutoPrint"
                        >Auto Print</ion-toggle
                    >
                </div>
                <div class="action-left">
                    <RouterLink class="box" to="/change-status"> อัพเดทสถานะอาหาร </RouterLink>
                    <RouterLink class="box" to="/history">
                        <ion-icon :icon="timeOutline" size="small"></ion-icon>
                        ประวัติ
                    </RouterLink>
                    <div class="box" @click="reConnectWs" style="background-color: ghostwhite">
                        <ion-icon :icon="syncOutline" size="small"></ion-icon>
                        Refrash
                    </div>
                    <div class="box" @click="onLogout" style="background-color: ghostwhite">
                        <ion-icon :icon="logOut" size="small"></ion-icon>
                    </div>
                </div>
            </div>
        </ion-header>

        <ion-content v-if="!showDetail" :fullscreen="true" class="ion-padding bg-style">
            <div v-if="isLoadingOrders" class="loading-container">
                <ion-spinner name="crescent"></ion-spinner>
                <span>Loading orders...</span>
            </div>
            <div v-else-if="orderStore.length === 0" class="empty-state">
                <ion-icon :icon="layersOutline"></ion-icon>
                <span>No orders available</span>
            </div>
            <div
                v-else
                class="order-item"
                :class="{ 'new-item-animation': item.isNewItem }"
                v-for="(item, index) in orderStore"
                :key="item.id || index"
            >
                <div class="order-header">
                    <div>
                        Order No: <strong>{{ item.orderNo }}</strong>
                    </div>
                    <div>
                        Order Date:
                        <strong>{{ dayjs(item.orderDate).format('DD/MM/YYYY') }}</strong>
                    </div>
                    <ion-icon
                        :icon="printOutline"
                        size="large"
                        @click="printOrder(item)"
                    ></ion-icon>
                </div>
                <div class="order-menu">
                    <div>
                        เลขโต๊ะ/ห้อง: <strong>{{ item.roomNo }}</strong> | ลูกค้า:
                        <strong>{{ item.customerName }}</strong>
                    </div>
                    <div>
                        เวลาสั่ง: <strong>{{ dayjs(item.orderDate).format('HH:mm') }}</strong>
                    </div>
                    <div class="text-ellipsis">
                        เมนู: {{ item.orderItems.map(menu => menu.name).join(', ') }}
                    </div>
                </div>
                <div class="order-status">
                    <div>
                        Print Status: <br />
                        <strong>{{ item.isPrint === 'PRINT' ? 'Not Printed' : 'Printed' }}</strong>
                    </div>
                    <div>
                        Order Status: <br />
                        <strong>{{ getStatusOrder(item.orderStatus) }}</strong>
                    </div>
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

        <!-- Printer Status Indicator -->
        <div class="printer-status" v-if="!showDetail">
            <div class="status-dot" :class="printerStatusClass"></div>
            <span class="status-text">{{ printerStatusText }}</span>
        </div>
    </ion-page>
</template>

<script>
import {
    printOutline,
    syncOutline,
    logOut,
    print,
    timeOutline,
    settings,
    arrowForwardCircleOutline,
    caretBackOutline,
    layersOutline
} from 'ionicons/icons'
import { io } from 'socket.io-client'
import { defineComponent } from 'vue'
import Printer from '../services/imin-printer.esm.browser'
import dayjs from 'dayjs'
import axios from 'axios'
import { getStatusOrderDisplay } from '@/plugins/utils'
export default defineComponent({
    name: 'OrderPage',

    setup() {
        return {
            printOutline,
            settings,
            arrowForwardCircleOutline,
            caretBackOutline,
            print,
            timeOutline,
            syncOutline,
            layersOutline,
            dayjs,
            logOut
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
            orderStore: [],
            printerStatus: 'disconnected',
            isLoadingOrders: true
        }
    },

    computed: {
        printerStatusText() {
            switch (this.printerStatus) {
                case 'connected':
                    return 'Printer Ready'
                case 'error':
                    return 'Printer Error'
                case 'disconnected':
                    return 'Printer Offline'
                case 'connecting':
                    return 'Connecting...'
                default:
                    return 'Unknown Status'
            }
        },
        printerStatusClass() {
            switch (this.printerStatus) {
                case 'connected':
                    return 'status-connected'
                case 'error':
                    return 'status-error'
                case 'disconnected':
                    return 'status-disconnected'
                case 'connecting':
                    return 'status-connecting'
                default:
                    return 'status-disconnected'
            }
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

        await this.handshakeWebShocket()
    },

    watch: {
        isAutoPrint(val) {
            localStorage.setItem('autoPrint', val)
        },
        $route(to, from) {
            if (from.name === 'OrderPage') {
                this.ws.disconnect()
            } else {
                this.handshakeWebShocket()
            }
        }
    },

    methods: {
        async initializePrinter() {
            this.printerStatus = 'connecting'
            const loading = await this.$toast.loading('Connecting to printer...')
            try {
                this.isConnect = await this.printer.connect()
                if (this.isConnect) {
                    this.printer.initPrinter()
                    this.printerStatus = 'connected'
                    this.getPrinterStatus(1)
                } else {
                    this.printerStatus = 'disconnected'
                }
            } catch (error) {
                console.error('[PRINTER] Error initializing:', error)
                this.printerStatus = 'error'
                loading.dismiss()
            } finally {
                loading.dismiss()
            }
        },

        async handshakeWebShocket() {
            const url = localStorage.getItem('apiUrl')
            this.isLoadingOrders = true
            this.ws = io(`wss://${url}/ws-orders`)

            this.ws.on('connect', () => {
                console.log('[WEBSOCKET] connected:', this.ws.id)
                this.ws.emit('join_cooking', this.kitchen)
                this.ws.on('new-order', msg => {
                    if (msg.orderList) {
                        this.orderStore = msg.orderList
                        this.isLoadingOrders = false
                    }
                    if (this.isAutoPrint && msg.newOrder) {
                        // console.log('[WEBSOCKET] New order received:', msg.newOrder)
                        this.printOrder(msg.newOrder)
                    } else if (msg.newOrder) {
                        // Mark as new item for animation
                        msg.newOrder.isNewItem = true
                        this.orderStore.unshift(msg.newOrder)

                        // Remove animation class after animation completes
                        setTimeout(() => {
                            const index = this.orderStore.findIndex(
                                order => order.id === msg.newOrder.id
                            )
                            if (index !== -1) {
                                this.orderStore[index].isNewItem = false
                            }
                        }, 1000)
                    }
                })
            })

            this.ws.on('disconnect', () => {
                console.log('[WEBSOCKET] disconnected')
                this.isLoadingOrders = false
            })
        },

        printOrder(item) {
            this.printer.setAlignment(1)
            this.printer.setTextWidth(576)
            this.printer.setTextSize(38)
            this.printer.printText(this.kitchanName)
            this.printer.printText('Order No: ' + item.orderNo.slice(-3))
            this.printer.setTextSize(28)
            this.printer.printText(
                'Order Date: ' + dayjs(item.orderDate).format('DD/MM/YYYY HH:mm')
            )
            this.printer.printText('Receipt No: ' + item.orderNo)
            this.printer.setAlignment(0)
            this.printer.printColumnsText(['Menu', 'Qty'], [2, 1], [0, 2], [28, 28])
            for (let i = 0; i < item.orderItems.length; i++) {
                this.printer.printColumnsText(
                    [item.orderItems[i].name, item.orderItems[i].amount.toString()],
                    [2, 1],
                    [0, 2],
                    [28, 28]
                )
                if (item.orderItems[i].note) {
                    this.printer.printText(item.orderItems[i].note)
                }
            }
            this.printer.setTextSize(26)
            this.printer.printText('==========================')
            this.printer.setTextSize(38)
            this.printer.printText(`Note: ${item.orderNote || '-'}`)
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

        getStatusOrder(status) {
            return getStatusOrderDisplay(status)
        },

        openOrderDetail(item) {
            this.selectedOrder = item
            this.showDetail = true
        },

        async reConnectWs() {
            const loading = await this.$toast.loading('Reconnecting...')
            this.isLoadingOrders = true
            if (this.ws) {
                this.ws.disconnect()
            }
            await this.handshakeWebShocket()
            await loading.dismiss()
        },

        onLogout() {
            localStorage.clear()
            this.$router.push({ name: 'LoginPage' })
            this.ws.disconnect()
        },

        async getPrinterStatus(type) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const self = this
            let reconnectNum = 0
            if (type) {
                const checkStatus = setInterval(async () => {
                    const status = await this.printer.getPrinterStatus()
                    if (status.value === 0) {
                        this.loadingText = 'Printing status is normal.'
                        this.printerStatus = 'connected'
                        setTimeout(function () {
                            self.loading = false
                        }, 2000)
                        clearInterval(checkStatus)
                    } else if (status.value < 0) {
                        this.printerStatus = 'error'
                        reconnectNum++
                        if (reconnectNum > 3) {
                            reconnectNum = 0
                            this.printer.initPrinter()
                        }
                    } else {
                        this.printerStatus = 'error'
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
