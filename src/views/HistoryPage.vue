<template>
    <ion-page>
        <ion-header>
            <div class="appbar">
                <div style="display: flex; align-items: center; gap: 5px" @click="$router.back()">
                    <ion-icon
                        style="margin-top: 4px"
                        size="large"
                        :icon="arrowBackOutline"
                    ></ion-icon>
                    <span class="appbar-title">{{ kitchanName }}</span>
                </div>
                <div class="right-side">
                    <ion-datetime-button class="datepicker" datetime="datetime">
                    </ion-datetime-button>
                    <select v-model="form.status" class="no-input" style="color: black">
                        <option value="ALL">ทั้งหมด</option>
                        <option value="PRINTED">พิมพ์</option>
                        <option value="PRINT">ยังไม่พิมพ์</option>
                    </select>
                    <input
                        class="no-input"
                        type="text"
                        v-model="form.orderNo"
                        placeholder="เลขที่ทำรายการ"
                    />
                    <button class="btn-search" @click="getOrderList">ค้นหา</button>
                </div>
            </div>
        </ion-header>

        <ion-content v-if="!showDetail" :fullscreen="true" class="ion-padding bg-style">
            <div
                class="order-item"
                :style="{ backgroundColor: order.isPrint === 'PRINT' ? '#FFCDD2' : '#B9F6CA' }"
                v-for="(order, index) in orderList"
                :key="index"
            >
                <div class="order-header">
                    <div>Order No: {{ order.orderNo }}</div>
                    <div>Order Date: {{ dayjs(order.orderDate).format('DD/MM/YYYY') }}</div>
                    <ion-icon
                        :icon="printOutline"
                        size="large"
                        @click="printOrder(order)"
                    ></ion-icon>
                </div>
                <div class="order-status">
                    <div>Status Food: {{ getStatusOrder(order.orderStatus) }}</div>
                    <div>
                        Print Status: {{ order.isPrint === 'PRINT' ? 'Not Printed' : 'Printed' }}
                    </div>
                </div>
                <div class="order-go-detail" @click="openOrderDetail(order)">
                    <ion-icon :icon="arrowForwardCircleOutline" size="large"></ion-icon>
                </div>
            </div>
        </ion-content>
        <ion-content v-else :fullscreen="true" class="ion-padding bg-style">
            <div class="order-detail-box">
                <div class="header">
                    <div>Order No: {{ orderNo }}</div>
                    <div>Order Date: {{ dayjs(orderDate).format('DD/MM/YYYY') }}</div>
                </div>
                <div class="menu-list">
                    <div>Menu:</div>
                    <ul>
                        <li v-for="(item, index) in menuList" :key="index">
                            {{ index + 1 }}. {{ item }}
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
        <ion-modal :keep-contents-mounted="true">
            <ion-datetime id="datetime" v-model="form.date"></ion-datetime>
        </ion-modal>

        <!-- Printer Status Indicator -->
        <div class="printer-status">
            <div class="status-dot" :class="printerStatusClass"></div>
            <span class="status-text">{{ printerStatusText }}</span>
        </div>
    </ion-page>
</template>
<script>
import dayjs from 'dayjs'
import { loadingController } from '@ionic/vue'
import {
    arrowForwardCircleOutline,
    printOutline,
    arrowBackOutline,
    caretBackOutline
} from 'ionicons/icons'
import { defineComponent } from 'vue'
import axios from 'axios'
import Printer from '../services/imin-printer.esm.browser'
import { getStatusOrderDisplay } from '@/plugins/utils'

export default defineComponent({
    name: 'HistoryPage',

    data() {
        return {
            form: {
                orderNo: '',
                status: 'PRINT',
                date: new Date().toISOString()
            },
            printer: null,
            kitchanName: 'Kitchan Name',
            isAutoPrint: false,
            showDetail: false,
            orderNo: 'xxxx',
            orderDate: 'xxxx',
            orderStatus: 'xxx',
            printStatus: 'xxx',
            menuList: ['Menu 1', 'Menu 2', 'Menu 3'],
            arrowForwardCircleOutline,
            printOutline,
            arrowBackOutline,
            caretBackOutline,
            selectedOrder: null,
            orderList: [],
            printerStatus: 'disconnected'
        }
    },

    setup() {
        return {
            dayjs
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
        setTimeout(() => {
            const el = document.querySelector('.datepicker')
            if (el) {
                el.shadowRoot.children[1].style.display = 'none'
            }
        }, 100)

        this.kitchanName = localStorage.getItem('kitchenName') || 'UPOS Kitchan'
        this.printer = new Printer()
        this.initializePrinter()
        await this.getOrderList()
    },

    methods: {
        getStatusOrder(status) {
            return getStatusOrderDisplay(status)
        },
        async initializePrinter() {
            this.printerStatus = 'connecting'
            console.log('[PRINTER] Initializing printer...')
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
                    this.printerStatus = 'connected'
                    console.log('[PRINTER] Initialized')
                    this.getPrinterStatus(1)
                    console.log('[PRINTER] Status checked')
                } else {
                    this.printerStatus = 'disconnected'
                }
            } catch (error) {
                console.error('[PRINTER] Error initializing:', error)
                this.printerStatus = 'error'
                loading.dismiss()
            } finally {
                setTimeout(() => {
                    loading.dismiss()
                }, 2000)
            }
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
            this.printer.setTextSize(28)
            this.printer.printText(`Note: ${item.orderNote || '-'}`)
            this.printer.printAndFeedPaper(50)
            this.updateStatusPrint(item.id)
        },

        openOrderDetail(order) {
            this.showDetail = true
            this.orderNo = order.orderNo
            this.orderDate = order.orderDate
            this.orderStatus = order.orderStatus
            this.printStatus = order.isPrint
            this.menuList = order.orderItems.map(item => item.name)
            this.selectedOrder = order
        },

        async getOrderList() {
            const value = localStorage.getItem('apiUrl')
            const params = {
                cooking_id: localStorage.getItem('kitchenId'),
                date: dayjs(this.form.date).format('YYYY-MM-DD')
            }
            if (this.form.status !== 'ALL') {
                params.isPrint = this.form.status
            }
            if (this.form.orderNo) {
                params.orderNo = this.form.orderNo
            }
            const headers = {
                Authorization: 'Bearer ' + localStorage.getItem('token')
            }
            const res = await axios.get(`https://${value}/api/order/history`, {
                params: params,
                headers: headers
            })
            this.orderList = res.data
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
                this.getOrderList()
            }
        },

        async getPrinterStatus(type) {
            const _this = this
            let reconnectNum = 0
            if (type) {
                const checkStatus = setInterval(async () => {
                    const status = await this.printer.getPrinterStatus()
                    if (status.value === 0) {
                        this.printerStatus = 'connected'
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
.right-side {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}
.no-input {
    width: 25%;
    height: 33.2px;
    border-radius: 8px;
    color: black;
    border: 1px solid #ccc;
    padding: 0 10px;
    margin-left: 10px;
    outline: none;
}
.btn-search {
    background-color: #ffbb00;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0 10px;
    margin-left: 10px;
    cursor: pointer;
    height: 33.2px;
}
.btn-search:active {
    background-color: #e86800;
}

.printer-status {
    position: fixed;
    bottom: 5px;
    left: 30px;
    display: flex;
    align-items: center;
    border-radius: 20px;
    z-index: 1000;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;
    margin-top: 1.5px;
}

.status-text {
    font-size: 12px;
    font-weight: 500;
    color: #333;
}

.status-connected {
    background-color: #22c55e;
    animation: pulse-green 2s infinite;
}

.status-error {
    background-color: #ef4444;
    animation: pulse-red 2s infinite;
}

.status-disconnected {
    background-color: #6b7280;
}

.status-connecting {
    background-color: #f59e0b;
    animation: pulse-yellow 1s infinite;
}

@keyframes pulse-green {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

@keyframes pulse-red {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

@keyframes pulse-yellow {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}
</style>
