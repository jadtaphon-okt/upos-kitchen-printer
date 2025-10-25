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
                    <IonDatepicker v-model="form.date" />
                    <button class="no-input status-button" @click="openStatusActionSheet">
                        {{ getStatusLabel(form.status) }}
                    </button>
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
            <div v-if="isLoadingOrders" class="loading-container">
                <ion-spinner name="crescent"></ion-spinner>
                <span>Loading orders...</span>
            </div>
            <div v-else-if="orderList.length === 0" class="empty-state">
                <ion-icon :icon="layersOutline"></ion-icon>
                <span>No orders available</span>
            </div>
            <div
                v-else
                class="order-item"
                :class="[getCardStyle(order.isPrint), { 'new-item-animation': order.isNewItem }]"
                v-for="(order, index) in orderList"
                :key="order.id || index"
                @click="openOrderDetail(order)"
            >
                <div class="order-header">
                    <div>
                        Order No: <strong>{{ order.orderNo }}</strong>
                    </div>
                    <div>
                        Order Date:
                        <strong>{{ dayjs(order.orderDate).format('DD/MM/YYYY') }}</strong>
                    </div>
                    <ion-icon
                        :icon="printOutline"
                        size="large"
                        @click="printOrder(order)"
                    ></ion-icon>
                </div>
                <div class="order-menu">
                    <div class="text-ellipsis" style="width: 90%">
                        เลขโต๊ะ/ห้อง: <strong>{{ order.roomNo }}</strong> | ลูกค้า:
                        <strong>{{ order.customerName }}</strong>
                    </div>
                    <div>
                        เวลาสั่ง: <strong>{{ dayjs(order.orderDate).format('HH:mm') }}</strong>
                    </div>
                    <div class="text-ellipsis">
                        เมนู: {{ order.orderItems.map(menu => menu.name).join(', ') }}
                    </div>
                </div>
                <div class="order-status">
                    <div>
                        Print Status: <br />
                        <strong>{{ order.isPrint === 'PRINT' ? 'Not Printed' : 'Printed' }}</strong>
                    </div>
                </div>
                <div class="order-status-detail">
                    <div>สถานะปัจจุบัน</div>
                    <div class="badge" :class="getBadgeClass(order.receivedStatus)">
                        {{ formatStatusToPascalCase(order.receivedStatus) }}
                    </div>
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

        <!-- Printer Status Indicator -->
        <div class="printer-status" v-if="!showDetail">
            <div class="status-dot" :class="printerStatusClass"></div>
            <span class="status-text">{{ printerStatusText }}</span>
        </div>
    </ion-page>
</template>
<script>
import dayjs from 'dayjs'
import { loadingController, actionSheetController } from '@ionic/vue'
import {
    arrowForwardCircleOutline,
    printOutline,
    arrowBackOutline,
    caretBackOutline,
    layersOutline
} from 'ionicons/icons'
import { defineComponent } from 'vue'
import axios from 'axios'
import Printer from '../services/imin-printer.esm.browser'
import { getStatusOrderDisplay } from '@/plugins/utils'
import IonDatepicker from '@/components/IonDatepicker.vue'

export default defineComponent({
    name: 'HistoryPage',
    components: {
        IonDatepicker
    },

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
            layersOutline,
            selectedOrder: null,
            orderList: [],
            printerStatus: 'disconnected',
            isLoadingOrders: false
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
        // this.initializePrinter()
        await this.getOrderList()
    },

    methods: {
        getStatusOrder(status) {
            return getStatusOrderDisplay(status)
        },
        getStatusLabel(status) {
            switch (status) {
                case 'ALL':
                    return 'ทั้งหมด'
                case 'PRINTED':
                    return 'พิมพ์แล้ว'
                case 'PRINT':
                    return 'ยังไม่พิมพ์'
                case 'cooking':
                    return 'กำลังทำอาหาร'
                case 'sending':
                    return 'รอจัดส่ง'
                case 'complete':
                    return 'เสร็จสมบูรณ์'
                default:
                    return 'ทั้งหมด'
            }
        },
        async openStatusActionSheet() {
            const actionSheet = await actionSheetController.create({
                mode: 'ios',
                header: 'เลือกสถานะ',
                buttons: [
                    {
                        text: 'ทั้งหมด',
                        handler: () => {
                            this.form.status = 'ALL'
                            this.form.receivedStatus = ''
                        }
                    },
                    {
                        text: 'พิมพ์แล้ว',
                        handler: () => {
                            this.form.status = 'PRINTED'
                            this.form.receivedStatus = ''
                        }
                    },
                    {
                        text: 'ยังไม่พิมพ์',
                        handler: () => {
                            this.form.status = 'PRINT'
                            this.form.receivedStatus = ''
                        }
                    },
                    {
                        text: 'กำลังทำอาหาร',
                        handler: () => {
                            this.form.status = 'cooking'
                            this.form.receivedStatus = 'cooking'
                        }
                    },
                    {
                        text: 'รอจัดส่ง',
                        handler: () => {
                            this.form.status = 'sending'
                            this.form.receivedStatus = 'sending'
                        }
                    },
                    {
                        text: 'เสร็จสมบูรณ์',
                        handler: () => {
                            this.form.status = 'complete'
                            this.form.receivedStatus = 'complete'
                        }
                    },
                    {
                        text: 'ยกเลิก',
                        role: 'cancel'
                    }
                ]
            })
            await actionSheet.present()
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
            this.isLoadingOrders = true
            try {
                const value = localStorage.getItem('apiUrl')
                const params = {
                    cooking_id: localStorage.getItem('kitchenId'),
                    date: dayjs(this.form.date).format('YYYY-MM-DD')
                }

                if (this.form.orderNo) {
                    params.orderNo = this.form.orderNo
                }
                if (this.form.receivedStatus) {
                    params.receivedStatus = this.form.receivedStatus
                } else {
                    if (this.form.status !== 'ALL') {
                        params.isPrint = this.form.status
                    }
                }
                const headers = {
                    Authorization: 'Bearer ' + localStorage.getItem('token')
                }
                const res = await axios.get(`https://${value}/api/order/history`, {
                    params: params,
                    headers: headers
                })
                this.orderList = res.data
            } catch (error) {
                console.error('[HISTORY] Error loading orders:', error)
            } finally {
                this.isLoadingOrders = false
            }
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
        },

        getCardStyle(isPrint) {
            if (isPrint === 'PRINT') {
                return 'card-not-printed'
            } else if (isPrint === 'PRINTED') {
                return 'card-printed'
            } else {
                return ''
            }
        },

        formatStatusToPascalCase(status) {
            if (!status) return ''
            // Convert to Pascal case (first letter uppercase, rest lowercase)
            return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
        },

        getBadgeClass(status) {
            if (!status) return ''
            const normalizedStatus = status.toLowerCase()
            switch (normalizedStatus) {
                case 'cooking':
                    return 'badge-cooking'
                case 'sending':
                    return 'badge-sending'
                case 'complete':
                    return 'badge-complete'
                default:
                    return ''
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
.status-button {
    width: 22% !important;
    text-align: center;
    cursor: pointer;
    background-color: white;
    font-size: 14px;
}
.status-button:active {
    background-color: #f0f0f0;
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

.card-printed {
    border: 3px solid #03ba81;
    background-color: #f1fdf4;
    padding-left: 10px;
    ion-icon {
        color: #03ba81;
    }
}
.card-not-printed {
    border: 3px solid #e54644;
    background-color: #fdf2f2;
    padding-left: 10px;

    ion-icon {
        color: #e54644;
    }
}
</style>
